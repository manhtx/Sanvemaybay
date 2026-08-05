import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternalSecret } from "../_shared/internal-auth.ts";
import { normalizeProviderOptions, type ProviderFlightOption } from "../_shared/flight-normalization.ts";
import { getAmadeusAccessToken, searchAmadeusFlights } from "../_shared/amadeus-provider.ts";

const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
// Observations are published with a short-lived validity window. Keep the
// default refresh window below that window so an expired deal cannot remain
// the only result merely because its observation is still considered fresh.
const CACHE_TTL_HOURS = Math.max(1, Number(Deno.env.get("SCAN_CACHE_TTL_HOURS") ?? 4));
const HOT_ROUTE_CACHE_TTL_HOURS = Math.max(1, Number(Deno.env.get("SCAN_HOT_ROUTE_CACHE_TTL_HOURS") ?? 3));
const FLIGHT_PROVIDER = Deno.env.get("FLIGHT_PROVIDER") ?? "serpapi";
const AMADEUS_CLIENT_ID = Deno.env.get("AMADEUS_CLIENT_ID") ?? "";
const AMADEUS_CLIENT_SECRET = Deno.env.get("AMADEUS_CLIENT_SECRET") ?? "";
const AMADEUS_BASE_URL = Deno.env.get("AMADEUS_BASE_URL") ?? "https://test.api.amadeus.com";
const AMADEUS_CURRENCY = Deno.env.get("AMADEUS_CURRENCY") ?? "VND";
const SERPAPI_REQUEST_DELAY_MS = Math.max(0, Number(Deno.env.get("SERPAPI_REQUEST_DELAY_MS") ?? 1500));

function dateAfter(days: number): string {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

Deno.serve(async (request) => {
  const unauthorized = requireInternalSecret(request);
  if (unauthorized) return unauthorized;

  let batch = { routeIndex: 0, routeCount: 1, offsetIndex: 0, offsetCount: 1 };
  let forceRefresh = false;
  try {
    const body = await request.json();
    batch = {
      routeIndex: Number.isInteger(body?.routeIndex) ? body.routeIndex : 0,
      routeCount: Number.isInteger(body?.routeCount) && body.routeCount > 0 ? body.routeCount : 1,
      offsetIndex: Number.isInteger(body?.offsetIndex) ? body.offsetIndex : 0,
      offsetCount: Number.isInteger(body?.offsetCount) && body.offsetCount > 0 ? body.offsetCount : 1,
    };
    forceRefresh = body?.forceRefresh === true;
  } catch {
    // Empty POST bodies retain the single-batch behavior for manual invocations.
  }

  const providerConfigured = FLIGHT_PROVIDER === "amadeus"
    ? Boolean(AMADEUS_CLIENT_ID && AMADEUS_CLIENT_SECRET)
    : Boolean(SERPAPI_KEY);
  if (!providerConfigured || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Scanner secrets are not configured." }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const observedAt = new Date().toISOString();
  let amadeusToken: string | undefined;
  let observationsSaved = 0;
  let cachedWindowsSkipped = 0;
  let noProviderResultWindows = 0;
  const failures: Array<{ route: string; reason: string }> = [];
  const providerWindowFailures: Array<{ route: string; departure_offset_days: number; reason: string }> = [];
  const { data: routes, error: routeError } = await supabase
    .from("tracked_routes")
    .select("*")
    .eq("enabled", true);
  if (routeError) return json({ error: routeError.message }, 500);
  if (!routes?.length) return json({ error: "No tracked routes are enabled." }, 409);
  const selectedRoutes = routes.filter((_route, index) => index % batch.routeCount === batch.routeIndex);
  if (!selectedRoutes.length) return json({ error: "Route batch is empty." }, 409);

  for (const route of selectedRoutes) {
    const { data: scanRun, error: scanRunError } = await supabase
      .from("scan_runs")
      .insert({
        route_id: route.id,
        provider: "serpapi_google_flights",
        status: "running",
      })
      .select("id")
      .single();
    if (scanRunError) {
      failures.push({
        route: `${route.origin_code}-${route.destination_code}`,
        reason: scanRunError.message,
      });
      continue;
    }

    try {
      const routeObservations = new Map<string, Record<string, unknown>>();
      const providerResponses: unknown[] = [];
      const windowFailures: Array<{ departure_offset_days: number; reason: string }> = [];
      let cachedWindowCount = 0;
      const { data: routeDeals, error: routeDealsError } = await supabase
        .from("deals")
        .select("deal_score")
        .eq("from_code", route.origin_code)
        .eq("to_code", route.destination_code)
        .order("deal_score", { ascending: false })
        .limit(10);
      if (routeDealsError) throw routeDealsError;
      const hasHotEvidence = (routeDeals ?? []).some((deal) => Number(deal.deal_score) >= 80);
      const routeCacheTtlHours = hasHotEvidence ? HOT_ROUTE_CACHE_TTL_HOURS : CACHE_TTL_HOURS;
      const cacheSince = new Date(Date.now() - routeCacheTtlHours * 60 * 60 * 1000).toISOString();
      const { data: cachedRows, error: cacheError } = await supabase
        .from("flights")
        .select("date,return_date")
        .eq("origin_code", route.origin_code)
        .eq("destination_code", route.destination_code)
        .gte("timestamp", cacheSince);
      if (cacheError) throw cacheError;
      const cachedWindowKeys = new Set(
        (cachedRows ?? []).map((row) => `${row.date}:${row.return_date}`),
      );
      const offsets = (
        Array.isArray(route.departure_offsets_days)
          ? route.departure_offsets_days
          : [route.departure_offset_days]
      ).filter((offset: unknown) =>
        Number.isInteger(offset) && Number(offset) >= 1 && Number(offset) <= 365
      ).filter((_offset: number, index: number) => index % batch.offsetCount === batch.offsetIndex);
      if (offsets.length === 0) throw new Error("Route has no valid departure offsets");

      for (const offset of offsets) {
        const outboundDate = dateAfter(offset);
        const returnDate = dateAfter(offset + route.trip_length_days);
        if (!forceRefresh && cachedWindowKeys.has(`${outboundDate}:${returnDate}`)) {
          cachedWindowCount += 1;
          continue;
        }
        try {
          let options: ProviderFlightOption[];
          let payload: Record<string, any> | undefined;
          let providerSource = "serpapi_google_flights";
          if (FLIGHT_PROVIDER === "amadeus") {
            amadeusToken ??= await getAmadeusAccessToken(AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET, AMADEUS_BASE_URL);
            options = await searchAmadeusFlights({
              accessToken: amadeusToken,
              baseUrl: AMADEUS_BASE_URL,
              originCode: route.origin_code,
              destinationCode: route.destination_code,
              outboundDate,
              returnDate,
              currency: AMADEUS_CURRENCY,
            });
            providerSource = "amadeus_flight_offers";
          } else {
            if (SERPAPI_REQUEST_DELAY_MS > 0) await sleep(SERPAPI_REQUEST_DELAY_MS);
            const query = new URLSearchParams({
              engine: "google_flights",
              departure_id: route.origin_code,
              arrival_id: route.destination_code,
              outbound_date: outboundDate,
              return_date: returnDate,
              currency: "VND",
              hl: "vi",
              api_key: SERPAPI_KEY,
            });
            const response = await fetch(`https://serpapi.com/search.json?${query}`);
            if (response.status === 429) {
              const retryAfter = response.headers.get("retry-after");
              throw new Error(`Provider rate limited HTTP 429${retryAfter ? `; retry after ${retryAfter}s` : ""}`);
            }
            if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}`);
            const serpPayload = await response.json() as Record<string, any>;
            payload = serpPayload;
            options = [...(serpPayload.best_flights ?? []), ...(serpPayload.other_flights ?? [])] as ProviderFlightOption[];
          }
          providerResponses.push({ outbound_date: outboundDate, return_date: returnDate, provider: providerSource, payload });

          for (const row of normalizeProviderOptions(options, {
            route_id: route.id,
            scan_run_id: scanRun.id,
            origin: route.origin_name,
            origin_code: route.origin_code,
            destination: route.destination_name,
            destination_code: route.destination_code,
            country: route.country,
            region: route.region,
            outbound_date: outboundDate,
            return_date: returnDate,
            observed_at: observedAt,
            provider_source: providerSource,
          })) {
            routeObservations.set(String(row.itinerary_key), row);
          }
        } catch (error) {
          const failure = {
            departure_offset_days: offset,
            reason: error instanceof Error ? error.message : "Unknown provider error",
          };
          windowFailures.push(failure);
          providerWindowFailures.push({
            route: `${route.origin_code}-${route.destination_code}`,
            ...failure,
          });
        }
      }

      const uniqueObservations = [...routeObservations.values()];
      if (uniqueObservations.length === 0 && (cachedWindowCount > 0 || windowFailures.length > 0)) {
        cachedWindowsSkipped += cachedWindowCount;
        noProviderResultWindows += windowFailures.length;
        await supabase
          .from("scan_runs")
          .update({
            status: "completed",
            response_payload: {
              cached_windows: cachedWindowCount,
              no_provider_result_windows: windowFailures.length,
              cache_ttl_hours: routeCacheTtlHours,
            },
            observations_saved: 0,
            completed_at: new Date().toISOString(),
          })
          .eq("id", scanRun.id);
        continue;
      }
      if (uniqueObservations.length === 0) {
        throw new Error("Provider returned no valid flight observations");
      }

      const { error: observationError } = await supabase
        .from("flights")
        .upsert(uniqueObservations, {
          onConflict: "itinerary_key,timestamp",
        });
      if (observationError) throw observationError;

      const { error: completionError } = await supabase
        .from("scan_runs")
        .update({
          status: "completed",
          response_payload: {
            searches: providerResponses,
            failures: windowFailures,
            cached_windows: cachedWindowCount,
            cache_ttl_hours: routeCacheTtlHours,
          },
          observations_saved: uniqueObservations.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", scanRun.id);
      if (completionError) throw completionError;
      observationsSaved += uniqueObservations.length;
      cachedWindowsSkipped += cachedWindowCount;
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown provider error";
      failures.push({
        route: `${route.origin_code}-${route.destination_code}`,
        reason,
      });
      await supabase
        .from("scan_runs")
        .update({
          status: "failed",
          error_message: reason,
          completed_at: new Date().toISOString(),
        })
        .eq("id", scanRun.id);
    }
  }

  if (observationsSaved === 0 && (cachedWindowsSkipped > 0 || noProviderResultWindows > 0)) {
    return json({ success: true, observations_saved: 0, cached_windows: cachedWindowsSkipped, no_provider_result_windows: noProviderResultWindows, failures, provider_window_failures: providerWindowFailures.slice(0, 20) });
  }
  if (observationsSaved === 0) {
    return json({ error: "No valid observations returned.", failures }, 502);
  }

  return json({
    success: true,
    observations_saved: observationsSaved,
    cached_windows: cachedWindowsSkipped,
    no_provider_result_windows: noProviderResultWindows,
    failures,
    provider_window_failures: providerWindowFailures.slice(0, 20),
    observed_at: observedAt,
  });
});
