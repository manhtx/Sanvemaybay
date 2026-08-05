import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternalSecret } from "../_shared/internal-auth.ts";
import { normalizeProviderOptions, type ProviderFlightOption } from "../_shared/flight-normalization.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function archiveTimestamp(value: string | undefined): string {
  const parsed = value ? new Date(value.replace(" UTC", "Z")) : new Date(0);
  return Number.isNaN(parsed.getTime()) ? new Date(0).toISOString() : parsed.toISOString();
}

Deno.serve(async (request) => {
  const unauthorized = requireInternalSecret(request);
  if (unauthorized) return unauthorized;

  let archives: string[];
  try {
    const body = await request.json();
    archives = Array.isArray(body?.archives) ? body.archives.filter((url: unknown): url is string => typeof url === "string") : [];
  } catch {
    return json({ error: "Request body must be JSON with an archives array." }, 400);
  }
  if (!archives.length || archives.length > 100) return json({ error: "archives must contain 1 to 100 URLs." }, 400);
  if (archives.some((url) => !url.startsWith("https://serpapi.com/searches/") || !url.endsWith(".json"))) {
    return json({ error: "Only SerpApi archive JSON URLs are accepted." }, 400);
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const { data: routes, error: routeError } = await supabase.from("tracked_routes").select("id,origin_code,destination_code,origin_name,destination_name,country,region");
  if (routeError) return json({ error: routeError.message }, 500);
  const routeByKey = new Map((routes ?? []).map((route) => [`${route.origin_code}:${route.destination_code}`, route]));
  let observationsSaved = 0;
  const failures: Array<{ url: string; reason: string }> = [];

  for (const url of archives) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!response.ok) throw new Error(`Archive returned HTTP ${response.status}`);
      const payload = await response.json();
      const params = payload.search_parameters ?? {};
      const originCode = String(params.departure_id ?? "");
      const destinationCode = String(params.arrival_id ?? "");
      const route = routeByKey.get(`${originCode}:${destinationCode}`);
      if (!route) throw new Error(`No tracked route for ${originCode}-${destinationCode}`);
      const observedAt = archiveTimestamp(payload.search_metadata?.created_at);
      const { data: scanRun, error: scanRunError } = await supabase.from("scan_runs").insert({ route_id: route.id, provider: "serpapi_google_flights_archive", status: "completed", started_at: observedAt, completed_at: observedAt, response_payload: { archive_url: url, archive_id: payload.search_metadata?.id } }).select("id").single();
      if (scanRunError) throw scanRunError;
      const rows = normalizeProviderOptions([...(payload.best_flights ?? []), ...(payload.other_flights ?? [])] as ProviderFlightOption[], {
        route_id: route.id, scan_run_id: scanRun.id, origin: route.origin_name, origin_code: originCode,
        destination: route.destination_name, destination_code: destinationCode, country: route.country, region: route.region,
        outbound_date: String(params.outbound_date), return_date: String(params.return_date ?? ""), observed_at: observedAt,
        provider_source: "serpapi_google_flights_archive",
      });
      if (!rows.length) continue;
      const { error: flightError } = await supabase.from("flights").upsert(rows, { onConflict: "itinerary_key,timestamp" });
      if (flightError) throw flightError;
      observationsSaved += rows.length;
    } catch (error) {
      failures.push({ url, reason: error instanceof Error ? error.message : "Unknown archive import error" });
    }
  }
  return json({ success: failures.length === 0, archives_processed: archives.length, observations_saved: observationsSaved, failures });
});
