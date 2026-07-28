import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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

Deno.serve(async () => {
  if (!SERPAPI_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Scanner secrets are not configured." }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const observedAt = new Date().toISOString();
  let observationsSaved = 0;
  const failures: Array<{ route: string; reason: string }> = [];
  const { data: routes, error: routeError } = await supabase
    .from("tracked_routes")
    .select("*")
    .eq("enabled", true);
  if (routeError) return json({ error: routeError.message }, 500);
  if (!routes?.length) return json({ error: "No tracked routes are enabled." }, 409);

  for (const route of routes) {
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
      const offsets = (
        Array.isArray(route.departure_offsets_days)
          ? route.departure_offsets_days
          : [route.departure_offset_days]
      ).filter((offset: unknown) =>
        Number.isInteger(offset) && Number(offset) >= 1 && Number(offset) <= 365
      );
      if (offsets.length === 0) throw new Error("Route has no valid departure offsets");

      for (const offset of offsets) {
        const outboundDate = dateAfter(offset);
        const returnDate = dateAfter(offset + route.trip_length_days);
        try {
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
          if (!response.ok) throw new Error(`Provider returned HTTP ${response.status}`);

          const payload = await response.json();
          providerResponses.push({
            outbound_date: outboundDate,
            return_date: returnDate,
            payload,
          });
          const options = [...(payload.best_flights ?? []), ...(payload.other_flights ?? [])];

          for (const option of options) {
            const firstLeg = option.flights?.[0];
            if (
              !firstLeg?.flight_number ||
              !firstLeg.airline ||
              !Number.isFinite(option.price) ||
              !Number.isFinite(option.total_duration)
            ) continue;

            const stops = option.layovers?.length ?? 0;
            const itineraryKey = [
              route.origin_code,
              route.destination_code,
              outboundDate,
              returnDate,
              firstLeg.flight_number,
              stops,
            ].join(":");

            routeObservations.set(itineraryKey, {
              route_id: route.id,
              scan_run_id: scanRun.id,
              origin: route.origin_name,
              origin_code: route.origin_code,
              destination: route.destination_name,
              destination_code: route.destination_code,
              country: route.country,
              region: route.region,
              price: option.price,
              currency: "VND",
              date: outboundDate,
              return_date: returnDate,
              airline: firstLeg.airline,
              airline_code: firstLeg.flight_number.trim().split(/\s+/)[0],
              flight_number: firstLeg.flight_number,
              stops,
              duration: `${Math.floor(option.total_duration / 60)}h ${option.total_duration % 60}m`,
              source: "serpapi_google_flights",
              itinerary_key: itineraryKey,
              timestamp: observedAt,
            });
          }
        } catch (error) {
          windowFailures.push({
            departure_offset_days: offset,
            reason: error instanceof Error ? error.message : "Unknown provider error",
          });
        }
      }

      const uniqueObservations = [...routeObservations.values()];
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
          },
          observations_saved: uniqueObservations.length,
          completed_at: new Date().toISOString(),
        })
        .eq("id", scanRun.id);
      if (completionError) throw completionError;
      observationsSaved += uniqueObservations.length;
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

  if (observationsSaved === 0) {
    return json({ error: "No valid observations returned.", failures }, 502);
  }

  return json({
    success: true,
    observations_saved: observationsSaved,
    failures,
    observed_at: observedAt,
  });
});
