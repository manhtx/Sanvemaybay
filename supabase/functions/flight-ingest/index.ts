import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternalSecret } from "../_shared/internal-auth.ts";

type Observation = {
  origin: string;
  origin_code: string;
  destination: string;
  destination_code: string;
  country: string;
  region: string;
  price: number;
  currency: string;
  date: string;
  return_date?: string;
  airline: string;
  airline_code: string;
  flight_number?: string | null;
  stops: number;
  duration: string;
  booking_url: string;
  source: string;
  link_kind?: string;
  itinerary_key: string;
  timestamp: string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function validObservation(value: unknown): value is Observation {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<Observation>;
  return typeof row.origin === "string" && typeof row.origin_code === "string" &&
    typeof row.destination === "string" && typeof row.destination_code === "string" &&
    typeof row.country === "string" && typeof row.region === "string" &&
    Number.isFinite(row.price) && Number(row.price) > 0 && typeof row.currency === "string" &&
    typeof row.date === "string" && typeof row.airline === "string" &&
    typeof row.airline_code === "string" && Number.isInteger(row.stops) && Number(row.stops) >= 0 &&
    typeof row.duration === "string" && typeof row.booking_url === "string" &&
    row.booking_url.startsWith("https://") && typeof row.source === "string" &&
    typeof row.itinerary_key === "string" && typeof row.timestamp === "string";
}

Deno.serve(async (request) => {
  const unauthorized = requireInternalSecret(request);
  if (unauthorized) return unauthorized;
  const service = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  try {
    const body = await request.json();
    const observations = Array.isArray(body?.observations) ? body.observations.filter(validObservation) : [];
    if (!observations.length) return json({ error: "No valid observations supplied." }, 422);
    const { data: routes, error: routeError } = await service.from("tracked_routes").select("*").eq("enabled", true);
    if (routeError) throw routeError;
    const routeMap = new Map((routes ?? []).map((route) => [`${route.origin_code}:${route.destination_code}`, route]));
    const grouped = new Map<string, Observation[]>();
    for (const observation of observations) {
      const key = `${observation.origin_code}:${observation.destination_code}`;
      const rows = grouped.get(key) ?? [];
      rows.push(observation);
      grouped.set(key, rows);
    }
    let saved = 0;
    const failures: Array<{ route: string; reason: string }> = [];
    for (const [key, rows] of grouped) {
      const route = routeMap.get(key);
      if (!route) { failures.push({ route: key, reason: "Route is not enabled" }); continue; }
      const observedAt = rows.reduce((latest, row) => row.timestamp > latest ? row.timestamp : latest, rows[0].timestamp);
      const { data: scanRun, error: scanError } = await service.from("scan_runs").insert({
        route_id: route.id,
        provider: "fast_flights_google",
        status: "completed",
        observations_saved: rows.length,
        started_at: observedAt,
        completed_at: observedAt,
        response_payload: { worker: "fast-flights", source: "github-actions" },
      }).select("id").single();
      if (scanError) { failures.push({ route: key, reason: scanError.message }); continue; }
      const flightRows = rows.map((row) => ({
        origin: row.origin,
        origin_code: row.origin_code,
        destination: row.destination,
        destination_code: row.destination_code,
        country: row.country,
        region: row.region,
        price: row.price,
        currency: row.currency,
        date: row.date,
        return_date: row.return_date ?? null,
        airline: row.airline,
        airline_code: row.airline_code,
        flight_number: row.flight_number ?? null,
        stops: row.stops,
        duration: row.duration,
        source: row.source,
        booking_url: row.booking_url,
        itinerary_key: row.itinerary_key,
        timestamp: row.timestamp,
        route_id: route.id,
        scan_run_id: scanRun.id,
      }));
      const { error: flightError } = await service.from("flights").upsert(flightRows, { onConflict: "itinerary_key,timestamp" });
      if (flightError) { failures.push({ route: key, reason: flightError.message }); continue; }
      saved += rows.length;
    }
    return json({ success: true, observations_received: observations.length, observations_saved: saved, failures });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown ingest error" }, 500);
  }
});
