import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { operationalFields, operationalHeaders, requestId, safeOperationalErrorCode } from "../_shared/observability.ts";
import { applyObservedScope } from "../_shared/observed-scope.ts";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=240",
};

function json(body: unknown, id: string, status = 200) {
  const payload = body && typeof body === "object" && !Array.isArray(body)
    ? { ...body as Record<string, unknown>, ...operationalFields(id) }
    : body;
  return new Response(JSON.stringify(payload), { status, headers: { ...headers, ...operationalHeaders(id) } });
}

export function observedStatus(latestObservedAt: unknown, total: number, isMonitoredRoute = true, now = Date.now()) {
  if (total === 0) {
    if (!isMonitoredRoute) return { status: "unmonitored", latestObservedAt: null, ageMinutes: null };
    return { status: "valid_zero", latestObservedAt: null, ageMinutes: null };
  }
  const latest = Date.parse(String(latestObservedAt ?? ""));
  if (!Number.isFinite(latest)) return { status: "provider_unavailable", latestObservedAt: null, ageMinutes: null };
  const ageMinutes = Math.max(0, Math.round((now - latest) / 60_000));
  return {
    status: ageMinutes <= 120 ? "healthy" : ageMinutes <= 360 ? "degraded_freshness" : "stale_only",
    latestObservedAt: new Date(latest).toISOString(),
    ageMinutes,
  };
}

Deno.serve(async (request) => {
  const id = requestId(request);
  if (request.method === "OPTIONS") return new Response("ok", { headers: { ...headers, ...operationalHeaders(id) } });
  const service = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  try {
    const body = await request.json().catch(() => ({}));
    const page = Math.max(1, Math.floor(Number(body.page) || 1));
    const pageSize = Math.min(120, Math.max(1, Math.floor(Number(body.page_size) || 60)));
    const start = (page - 1) * pageSize;
    const { data: activeGen } = await service
      .from("active_observed_generation")
      .select("active_generation_id")
      .eq("id", 1)
      .maybeSingle();

    if (!activeGen?.active_generation_id) {
      return json({
        status: "degraded_schema",
        fares: [],
        total: 0,
        page,
        page_size: pageSize,
        next_page: null,
        active_generation_id: null,
        generated_at: new Date().toISOString(),
        latest_observed_at: null,
        feed_age_minutes: null,
        retryable: true,
        source: "fast_flights_google",
      }, id);
    }

    let query = applyObservedScope(service.from("observed_fare_snapshots")
      .select("dedupe_key,observation_id,generation_id,origin,origin_code,destination,destination_code,country,region,price,currency,depart_date,return_date,airline,airline_code,flight_number,stops,duration,booking_url,source,link_kind,observed_at,baseline_price,discount_percent,sample_size,percentile,deal_score,deal_label,confidence_percent,confidence_level,discount_strength,algorithm_version,refreshed_at,segments", { count: "exact" })
      .gte("depart_date", new Date().toISOString().slice(0, 10))
      .eq("generation_id", activeGen.active_generation_id), body);

    const sort = typeof body.sort === "string" ? body.sort : "discount";
    if (sort === "price_asc") {
      query = query
        .order("price", { ascending: true })
        .order("discount_percent", { ascending: false, nullsFirst: false })
        .order("dedupe_key", { ascending: true });
    } else if (sort === "price_desc") {
      query = query
        .order("price", { ascending: false })
        .order("discount_percent", { ascending: false, nullsFirst: false })
        .order("dedupe_key", { ascending: true });
    } else if (sort === "score") {
      query = query
        .order("deal_score", { ascending: false })
        .order("discount_percent", { ascending: false, nullsFirst: false })
        .order("dedupe_key", { ascending: true });
    } else if (sort === "date_near") {
      query = query
        .order("depart_date", { ascending: true })
        .order("price", { ascending: true })
        .order("dedupe_key", { ascending: true });
    } else if (sort === "date_far") {
      query = query
        .order("depart_date", { ascending: false })
        .order("price", { ascending: true })
        .order("dedupe_key", { ascending: true });
    } else {
      query = query
        .order("discount_percent", { ascending: false, nullsFirst: false })
        .order("deal_score", { ascending: false })
        .order("observed_at", { ascending: false })
        .order("price", { ascending: true })
        .order("dedupe_key", { ascending: true });
    }

    // Compare only a single explicit currency within the same observed-generation scope.
    // This is an observed *base fare*, never a verified all-in/bookable comparison.
    if (body.route_best === true) {
      const currency = typeof body.currency === "string" ? body.currency.toUpperCase() : "";
      if (!/^[A-Z]{3}$/.test(currency)) {
        return json({
          status: "cost_incomparable", route_best: null, eligible_candidate_count: null,
          total_candidate_count: null, comparison_basis: "OBSERVED_BASE_FARE_ONLY",
          comparable_total_proven: false, active_generation_id: activeGen.active_generation_id,
        }, id);
      }
      const bestQuery = applyObservedScope(service.from("observed_fare_snapshots")
        .select("dedupe_key,observation_id,generation_id,origin,origin_code,destination,destination_code,country,region,price,currency,depart_date,return_date,airline,airline_code,flight_number,stops,duration,booking_url,source,link_kind,observed_at,baseline_price,discount_percent,sample_size,percentile,deal_score,deal_label,confidence_percent,confidence_level,discount_strength,algorithm_version,refreshed_at,segments", { count: "exact" })
        .gte("depart_date", new Date().toISOString().slice(0, 10))
        .eq("generation_id", activeGen.active_generation_id), body)
        .eq("currency", currency)
        .gt("price", 0);

      const { data: bestRows, error: bestError, count: eligibleCount } = await bestQuery
        .order("price", { ascending: true })
        .order("dedupe_key", { ascending: true })
        .range(0, 0);
      if (bestError) throw bestError;
      const bestRow = bestRows?.[0] ?? null;
      const bestOffer = bestRow ? {
        ...bestRow,
        id: bestRow.observation_id,
        opportunity_id: [bestRow.origin_code, bestRow.destination_code, bestRow.depart_date,
          bestRow.return_date ?? "", bestRow.airline_code, bestRow.flight_number ?? "",
          bestRow.stops == null ? "UNKNOWN" : String(bestRow.stops)].join(":"),
        date: bestRow.depart_date,
        timestamp: bestRow.observed_at,
        freshness_minutes: Math.max(0, Math.round((Date.now() - Date.parse(bestRow.observed_at)) / 60_000)),
      } : null;
      const bestHealth = observedStatus(bestRow?.observed_at, eligibleCount ?? 0, true);
      return json({
        status: bestHealth.status,
        route_best: bestOffer,
        eligible_candidate_count: eligibleCount ?? 0,
        total_candidate_count: eligibleCount ?? 0,
        active_generation_id: activeGen.active_generation_id,
        latest_observed_at: bestHealth.latestObservedAt,
        feed_age_minutes: bestHealth.ageMinutes,
        comparison_basis: "OBSERVED_BASE_FARE_ONLY",
        comparable_total_proven: false,
        generated_at: new Date().toISOString(),
      }, id);
    }

    // The freshness oracle MUST apply exactly the same route/date/price/filter scope
    // as the paginated result. A fresh unrelated route cannot make stale rows healthy.
    const latestQuery = applyObservedScope(service
      .from("observed_fare_snapshots")
      .select("observed_at")
      .gte("depart_date", new Date().toISOString().slice(0, 10))
      .eq("generation_id", activeGen.active_generation_id), body)
      .order("observed_at", { ascending: false })
      .limit(1);
    const paginatedQuery = query.range(start, start + pageSize - 1);
    const [{ data, error, count }, latestResult] = await Promise.all([
      paginatedQuery,
      latestQuery.maybeSingle(),
    ]);
    if (error) throw error;
    if (latestResult.error) throw latestResult.error;
    const total = count ?? 0;

    let isMonitoredScope = true;
    if (total === 0 && body.origin && body.destination) {
      const orig = String(body.origin).trim().toUpperCase();
      const dest = String(body.destination).trim().toUpperCase();
      const requestedDate = typeof body.depart_date_from === "string" ? body.depart_date_from : (typeof body.depart_date === "string" ? body.depart_date : null);

      // Check overall route snapshots in active generation
      const { count: routeSnapshotCount } = await service
        .from("observed_fare_snapshots")
        .select("observation_id", { count: "exact", head: true })
        .eq("generation_id", activeGen.active_generation_id)
        .eq("origin_code", orig)
        .eq("destination_code", dest);

      if (!routeSnapshotCount || routeSnapshotCount === 0) {
        isMonitoredScope = false;
      } else if (requestedDate) {
        // Query-scoped check (D16): A route may have snapshots on other dates, but this specific date has never been observed
        const { count: dateScopeCount } = await service
          .from("observed_fare_snapshots")
          .select("observation_id", { count: "exact", head: true })
          .eq("generation_id", activeGen.active_generation_id)
          .eq("origin_code", orig)
          .eq("destination_code", dest)
          .gte("depart_date", requestedDate)
          .lte("depart_date", typeof body.depart_date_to === "string" ? body.depart_date_to : requestedDate);

        if (!dateScopeCount || dateScopeCount === 0) {
          isMonitoredScope = false;
        }
      }
    }
    const health = observedStatus(latestResult.data?.observed_at, total, isMonitoredScope);
    const fares = (data ?? []).map((row) => ({
      ...row,
      id: row.observation_id,
      opportunity_id: [row.origin_code, row.destination_code, row.depart_date, row.return_date ?? "", row.airline_code, row.flight_number ?? "", row.stops == null ? "UNKNOWN" : String(row.stops)].join(":"),
      date: row.depart_date,
      timestamp: row.observed_at,
      freshness_minutes: Math.max(0, Math.round((Date.now() - Date.parse(row.observed_at)) / 60_000)),
    }));
    return json({
      status: health.status,
      fares,
      total,
      page,
      page_size: pageSize,
      next_page: start + pageSize < total ? page + 1 : null,
      active_generation_id: activeGen?.active_generation_id ?? null,
      generated_at: new Date().toISOString(),
      latest_observed_at: health.latestObservedAt,
      feed_age_minutes: health.ageMinutes,
      retryable: health.status === "provider_unavailable" || health.status === "stale_only",
      source: "fast_flights_google",
    }, id);
  } catch (error) {
    console.error(JSON.stringify({ event: "observed_fares_unavailable", request_id: id, release_sha: Deno.env.get("DEPLOYED_COMMIT") ?? "unknown", error_code: safeOperationalErrorCode(error) }));
    return json({ status: "provider_unavailable", fares: [], total: 0, next_page: null, generated_at: new Date().toISOString() }, id, 503);
  }
});
