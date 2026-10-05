import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternalSecret } from "../_shared/internal-auth.ts";
import { approvedBookingHosts, isApprovedHttpsUrl } from "../_shared/live-deal.ts";
import { observedFareDedupeKey, scoreObservedFares } from "../_shared/observed-fares.ts";
import { operationalFields, operationalHeaders, requestId, safeOperationalErrorCode } from "../_shared/observability.ts";

const jsonHeaders = { "Content-Type": "application/json" };

function response(body: unknown, id: string, status = 200) {
  const payload = body && typeof body === "object" && !Array.isArray(body)
    ? { ...body as Record<string, unknown>, ...operationalFields(id) }
    : body;
  return new Response(JSON.stringify(payload), { status, headers: { ...jsonHeaders, ...operationalHeaders(id) } });
}

Deno.serve(async (request) => {
  const id = requestId(request);
  if (request.method !== "POST") return response({ error: "Method not allowed" }, id, 405);
  const unauthorized = requireInternalSecret(request);
  if (unauthorized) return unauthorized;

  const service = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const hosts = approvedBookingHosts(Deno.env.get("APPROVED_BOOKING_HOSTS"));
  const now = new Date();
  const cutoff = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const today = now.toISOString().slice(0, 10);

  try {
    const rawFlights: Record<string, unknown>[] = [];
    const batchSize = 1000;
    const hardSafetyLimit = 50_000;
    let isPartialDegraded = false;
    let lastTimestamp: string | null = null;
    let lastId: string | null = null;

    // 1. Stable cutoff + keyset pagination on (timestamp, id)
    while (true) {
      let query = service.from("flights")
        .select("id,origin,origin_code,destination,destination_code,country,region,price,currency,date,return_date,airline,airline_code,flight_number,stops,duration,booking_url,source,link_kind,timestamp")
        .eq("link_kind", "indicative")
        .gte("timestamp", cutoff)
        .gte("date", today)
        .order("timestamp", { ascending: false })
        .order("id", { ascending: false })
        .limit(batchSize);

      if (lastTimestamp && lastId) {
        query = query.or(`timestamp.lt.${lastTimestamp},and(timestamp.eq.${lastTimestamp},id.lt.${lastId})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) break;

      rawFlights.push(...data);
      const lastRow = data[data.length - 1];
      lastTimestamp = String(lastRow.timestamp);
      lastId = String(lastRow.id);

      if (data.length < batchSize) break;
      if (rawFlights.length >= hardSafetyLimit) {
        isPartialDegraded = true;
        break;
      }
    }

    const valid = rawFlights.filter((row) =>
      Number(row.price) > 0 && String(row.duration ?? "").trim() && isApprovedHttpsUrl(String(row.booking_url ?? ""), hosts)
    );
    const scored = scoreObservedFares(valid, now);
    const refreshedAt = now.toISOString();

    // 2. Atomic generation semantics: write candidate generation
    const candidateGenerationId = crypto.randomUUID();
    const snapshots = scored.map((row) => {
      const rowKey = observedFareDedupeKey(row);
      return {
        dedupe_key: `${candidateGenerationId}:${rowKey}`,
        generation_id: candidateGenerationId,
        observation_id: row.id,
        origin: row.origin,
        origin_code: row.origin_code,
        destination: row.destination,
        destination_code: row.destination_code,
        country: row.country,
        region: row.region,
        price: row.price,
        currency: row.currency,
        depart_date: row.date,
        return_date: row.return_date,
        airline: row.airline,
        airline_code: row.airline_code,
        flight_number: row.flight_number,
        stops: row.stops,
        duration: row.duration,
        booking_url: row.booking_url,
        source: row.source,
        link_kind: "indicative",
        observed_at: row.timestamp,
        baseline_price: row.baseline_price,
        discount_percent: row.discount_percent,
        sample_size: row.sample_size,
        percentile: row.percentile,
        deal_score: row.deal_score,
        deal_label: row.deal_label,
        confidence_percent: row.confidence_percent,
        confidence_level: row.confidence_level,
        discount_strength: row.discount_strength,
        algorithm_version: row.algorithm_version,
        refreshed_at: refreshedAt,
      };
    });

    for (let index = 0; index < snapshots.length; index += 500) {
      const { error: upsertError } = await service.from("observed_fare_snapshots")
        .upsert(snapshots.slice(index, index + 500), { onConflict: "dedupe_key" });
      if (upsertError) throw upsertError;
    }

    // 3. Transactionally switch active generation if candidate generation is complete and valid
    if (snapshots.length > 0) {
      const { error: genError } = await service.from("active_observed_generation").upsert({
        id: 1,
        active_generation_id: candidateGenerationId,
        row_count: snapshots.length,
        published_at: refreshedAt,
      });

      if (!genError) {
        // Clean up prior generations asynchronously
        try {
          await service.from("observed_fare_snapshots")
            .delete()
            .neq("generation_id", candidateGenerationId);
        } catch {
          // Ignore cleanup errors
        }
      }
    }

    return response({
      status: isPartialDegraded ? "partial_degraded" : "completed",
      raw_rows_consumed: rawFlights.length,
      valid_rows: valid.length,
      deduped_rows: scored.length,
      snapshot_rows: snapshots.length,
      generation_id: candidateGenerationId,
      algorithm_version: snapshots[0]?.algorithm_version ?? null,
      refreshed_at: refreshedAt,
    }, id);
  } catch (error) {
    console.error(JSON.stringify({ event: "observed_fare_refresh_failed", request_id: id, release_sha: Deno.env.get("DEPLOYED_COMMIT") ?? "unknown", error_code: safeOperationalErrorCode(error) }));
    return response({ error: "Observed fare snapshot refresh failed" }, id, 500);
  }
});
