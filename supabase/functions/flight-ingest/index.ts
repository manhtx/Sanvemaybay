import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireInternalSecret } from "../_shared/internal-auth.ts";
import { approvedBookingHosts, isApprovedHttpsUrl } from "../_shared/live-deal.ts";
import { safeOperationalErrorCode } from "../_shared/observability.ts";

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
  link_kind: "live_affiliate" | "live_source" | "indicative" | "historical" | "stale";
  affiliate_network?: string | null;
  affiliate_url?: string | null;
  itinerary_key: string;
  timestamp: string;
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function validObservation(value: unknown, bookingHosts: Set<string>): value is Observation {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<Observation>;
  return typeof row.origin === "string" && typeof row.origin_code === "string" &&
    typeof row.destination === "string" && typeof row.destination_code === "string" &&
    typeof row.country === "string" && typeof row.region === "string" &&
    Number.isFinite(row.price) && Number(row.price) > 0 && typeof row.currency === "string" &&
    typeof row.date === "string" && typeof row.airline === "string" &&
    typeof row.airline_code === "string" && Number.isInteger(row.stops) && Number(row.stops) >= 0 &&
    typeof row.duration === "string" && isApprovedHttpsUrl(row.booking_url, bookingHosts) &&
    typeof row.source === "string" && typeof row.itinerary_key === "string" &&
    typeof row.timestamp === "string" &&
    ["live_affiliate", "live_source", "indicative", "historical", "stale"].includes(String(row.link_kind)) &&
    (!row.source.includes("archive") || row.link_kind === "historical") &&
    (row.link_kind !== "live_affiliate" || (
      typeof row.affiliate_network === "string" && Boolean(row.affiliate_network.trim()) &&
      isApprovedHttpsUrl(row.affiliate_url, bookingHosts)
    ));
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const unauthorized = requireInternalSecret(request);
  if (unauthorized) return unauthorized;
  const service = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const bookingHosts = approvedBookingHosts(Deno.env.get("APPROVED_BOOKING_HOSTS"));
  try {
    const body = await request.json();
    const observations = Array.isArray(body?.observations)
      ? body.observations.filter((row: unknown) => validObservation(row, bookingHosts))
      : [];
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
        link_kind: row.link_kind,
        affiliate_network: row.affiliate_network ?? null,
        affiliate_url: row.affiliate_url ?? null,
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
    return json({ error: "Ingest failed", error_code: safeOperationalErrorCode(error) }, 500);
  }
});
