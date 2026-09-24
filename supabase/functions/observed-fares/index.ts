import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { operationalFields, operationalHeaders, requestId, safeOperationalErrorCode } from "../_shared/observability.ts";

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

export function observedStatus(latestObservedAt: unknown, total: number, now = Date.now()) {
  if (total === 0) return { status: "healthy_empty", latestObservedAt: null, ageMinutes: null };
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
    let query = service.from("observed_fare_snapshots")
      .select("dedupe_key,observation_id,origin,origin_code,destination,destination_code,country,region,price,currency,depart_date,return_date,airline,airline_code,flight_number,stops,duration,booking_url,source,link_kind,observed_at,baseline_price,discount_percent,sample_size,percentile,deal_score,deal_label,confidence_percent,confidence_level,discount_strength,algorithm_version,refreshed_at", { count: "exact" })
      .gte("depart_date", new Date().toISOString().slice(0, 10));
    if (typeof body.origin === "string" && body.origin) query = query.eq("origin_code", body.origin.toUpperCase());
    if (typeof body.destination === "string" && body.destination) query = query.eq("destination_code", body.destination.toUpperCase());
    if (typeof body.region === "string" && body.region !== "all") query = query.eq("region", body.region);
    if (body.direct_only === true) query = query.eq("stops", 0);
    query = query
      .order("discount_percent", { ascending: false, nullsFirst: false })
      .order("deal_score", { ascending: false })
      .order("observed_at", { ascending: false })
      .order("price", { ascending: true })
      .range(start, start + pageSize - 1);
    const [{ data, error, count }, latestResult] = await Promise.all([
      query,
      service.from("observed_fare_snapshots").select("observed_at").order("observed_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (error) throw error;
    if (latestResult.error) throw latestResult.error;
    const total = count ?? 0;
    const health = observedStatus(latestResult.data?.observed_at, total);
    const fares = (data ?? []).map((row) => ({
      ...row,
      id: row.observation_id,
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
