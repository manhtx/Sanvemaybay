import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { clientAddress, consumeRequestBudget, hashRateLimitKey } from "../_shared/abuse-protection.ts";
import { boundedProviderRows, mapTravelpayoutsRow, validateFlightSearchInput } from "../_shared/flight-search.ts";
import { operationalFields, operationalHeaders, requestId } from "../_shared/observability.ts";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Cache-Control": "no-store",
};

function json(body: Record<string, unknown>, id: string, status = 200): Response {
  return new Response(JSON.stringify({ ...body, ...operationalFields(id) }), {
    status,
    headers: { ...headers, ...operationalHeaders(id) },
  });
}

Deno.serve(async (request) => {
  const id = requestId(request);
  if (request.method === "OPTIONS") return new Response("ok", { headers: { ...headers, ...operationalHeaders(id) } });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, id, 405);
  const token = Deno.env.get("TRAVELPAYOUTS_TOKEN") ?? "";
  if (!token) return json({ error: "Search data provider is not configured." }, id, 503);

  const body = await request.json().catch(() => null);
  const input = validateFlightSearchInput(body);
  if (!input) return json({ error: "A valid bounded future round trip is required" }, id, 400);

  const salt = Deno.env.get("RATE_LIMIT_SALT") ?? "";
  const address = clientAddress(request);
  if (salt.length < 16 || !address) return json({ error: "Search is temporarily unavailable" }, id, 503);
  const service = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  try {
    const bucket = await hashRateLimitKey("flight-search-ip", address, salt);
    const allowed = await consumeRequestBudget(service, "flight-search", bucket, 30, 3_600);
    if (!allowed) return json({ error: "Rate limit exceeded" }, id, 429);
  } catch {
    return json({ error: "Search is temporarily unavailable" }, id, 503);
  }

  const query = new URLSearchParams({
    origin: input.origin,
    destination: input.destination,
    depart_date: input.outboundDate,
    return_date: input.returnDate,
    currency: "vnd",
    show_to_affiliates: "true",
    token,
  });
  let response: Response;
  try {
    response = await fetch(`https://api.travelpayouts.com/v2/prices/week-matrix?${query}`, {
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    return json({ error: "Search data provider timed out" }, id, 502);
  }
  if (!response.ok) return json({ error: "Search data provider failed" }, id, 502);
  const payload = await response.json().catch(() => null);
  const rows = boundedProviderRows(payload);
  const fetchTime = new Date().toISOString();
  const results = rows.flatMap((row: Record<string, unknown>) => {
    const mapped = mapTravelpayoutsRow(row, input, fetchTime);
    return mapped ? [mapped] : [];
  });
  return json({ results, source: "travelpayouts_week_matrix", indicative: true }, id);
});
