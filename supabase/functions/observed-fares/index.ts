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
    const { data: activeGen } = await service
      .from("active_observed_generation")
      .select("active_generation_id")
      .eq("id", 1)
      .maybeSingle();

    let query = service.from("observed_fare_snapshots")
      .select("dedupe_key,observation_id,generation_id,origin,origin_code,destination,destination_code,country,region,price,currency,depart_date,return_date,airline,airline_code,flight_number,stops,duration,booking_url,source,link_kind,observed_at,baseline_price,discount_percent,sample_size,percentile,deal_score,deal_label,confidence_percent,confidence_level,discount_strength,algorithm_version,refreshed_at", { count: "exact" })
      .gte("depart_date", new Date().toISOString().slice(0, 10));

    if (activeGen?.active_generation_id) {
      query = query.eq("generation_id", activeGen.active_generation_id);
    }

    const targetId = typeof body.id === "string" && body.id
      ? body.id
      : typeof body.observation_id === "string"
        ? body.observation_id
        : typeof body.opportunity_id === "string"
          ? body.opportunity_id
          : undefined;
    if (targetId) {
      const raw = targetId.replace(/^observed-/, "").trim();
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
        query = query.eq("observation_id", raw);
      } else if (raw.split(":").length >= 7) {
        query = query.eq("dedupe_key", raw);
      } else if (raw.split(":").length === 6) {
        const [orig, dest, depart, ret, airline, stops] = raw.split(":");
        query = query
          .eq("origin_code", orig.toUpperCase())
          .eq("destination_code", dest.toUpperCase())
          .eq("depart_date", depart);
        if (ret) query = query.eq("return_date", ret);
        if (airline) query = query.eq("airline_code", airline.toUpperCase());
        if (stops !== "") query = query.eq("stops", Number(stops));
      } else {
        query = query.eq("dedupe_key", raw);
      }
    }
    if (typeof body.origin === "string" && body.origin) query = query.eq("origin_code", body.origin.trim().toUpperCase());
    if (typeof body.destination === "string" && body.destination.trim()) {
      const dest = body.destination.trim();
      if (/^[A-Za-z]{3}$/.test(dest)) {
        query = query.eq("destination_code", dest.toUpperCase());
      } else {
        query = query.or(`destination_code.ilike.%${dest}%,destination.ilike.%${dest}%,country.ilike.%${dest}%`);
      }
    }
    if (typeof body.search_text === "string" && body.search_text.trim()) {
      const term = body.search_text.trim();
      query = query.or(`destination_code.ilike.%${term}%,destination.ilike.%${term}%,country.ilike.%${term}%,origin_code.ilike.%${term}%,origin.ilike.%${term}%`);
    }
    if (typeof body.region === "string" && body.region !== "all") query = query.eq("region", body.region);
    if (body.direct_only === true) query = query.eq("stops", 0);
    const maxStops = Number(body.max_stops);
    if (Number.isInteger(maxStops) && maxStops >= 0) query = query.lte("stops", maxStops);
    const maxPrice = Number(body.max_price ?? body.budget);
    if (Number.isFinite(maxPrice) && maxPrice > 0) query = query.lte("price", maxPrice);
    if (typeof body.depart_date_from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.depart_date_from)) {
      query = query.gte("depart_date", body.depart_date_from);
    }
    if (typeof body.depart_date_to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.depart_date_to)) {
      query = query.lte("depart_date", body.depart_date_to);
    }
    if (typeof body.month === "string" && body.month !== "all") {
      const slashMatch = body.month.match(/^(\d{1,2})\/(\d{4})$/);
      if (slashMatch) {
        const m = slashMatch[1].padStart(2, "0");
        const y = slashMatch[2];
        const nextM = Number(m) === 12 ? "01" : String(Number(m) + 1).padStart(2, "0");
        const nextY = Number(m) === 12 ? String(Number(y) + 1) : y;
        query = query.gte("depart_date", `${y}-${m}-01`).lt("depart_date", `${nextY}-${nextM}-01`);
      } else if (/^\d{4}-\d{2}$/.test(body.month)) {
        const [y, m] = body.month.split("-");
        const nextM = Number(m) === 12 ? "01" : String(Number(m) + 1).padStart(2, "0");
        const nextY = Number(m) === 12 ? String(Number(y) + 1) : y;
        query = query.gte("depart_date", `${y}-${m}-01`).lt("depart_date", `${nextY}-${nextM}-01`);
      }
    }

    const sort = typeof body.sort === "string" ? body.sort : "discount";
    if (sort === "price_asc") {
      query = query.order("price", { ascending: true }).order("discount_percent", { ascending: false, nullsFirst: false });
    } else if (sort === "price_desc") {
      query = query.order("price", { ascending: false }).order("discount_percent", { ascending: false, nullsFirst: false });
    } else if (sort === "score") {
      query = query.order("deal_score", { ascending: false }).order("discount_percent", { ascending: false, nullsFirst: false });
    } else if (sort === "date_near") {
      query = query.order("depart_date", { ascending: true }).order("price", { ascending: true });
    } else if (sort === "date_far") {
      query = query.order("depart_date", { ascending: false }).order("price", { ascending: true });
    } else {
      query = query
        .order("discount_percent", { ascending: false, nullsFirst: false })
        .order("deal_score", { ascending: false })
        .order("observed_at", { ascending: false })
        .order("price", { ascending: true });
    }

    query = query.range(start, start + pageSize - 1);
    let latestQuery = service.from("observed_fare_snapshots").select("observed_at").order("observed_at", { ascending: false }).limit(1);
    if (activeGen?.active_generation_id) {
      latestQuery = latestQuery.eq("generation_id", activeGen.active_generation_id);
    }
    const [{ data, error, count }, latestResult] = await Promise.all([
      query,
      latestQuery.maybeSingle(),
    ]);
    if (error) throw error;
    if (latestResult.error) throw latestResult.error;
    const total = count ?? 0;
    const health = observedStatus(latestResult.data?.observed_at, total);
    const fares = (data ?? []).map((row) => ({
      ...row,
      id: row.observation_id,
      opportunity_id: [row.origin_code, row.destination_code, row.depart_date, row.return_date ?? "", row.airline_code, row.flight_number ?? "", row.stops ?? 0].join(":"),
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
