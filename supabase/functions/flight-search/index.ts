const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

function validDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function validCode(value: unknown): value is string {
  return typeof value === "string" && /^[A-Z]{3}$/.test(value);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  const token = Deno.env.get("TRAVELPAYOUTS_TOKEN") ?? "";
  if (!token) return json({ error: "Live search provider is not configured." }, 503);

  const body = await request.json().catch(() => null);
  const origin = typeof body?.origin === "string" ? body.origin.toUpperCase() : "";
  const destination = typeof body?.destination === "string" ? body.destination.toUpperCase() : "";
  const outbound = body?.outbound_date;
  const returned = body?.return_date;
  if (!validCode(origin) || !validCode(destination) || !validDate(outbound) || !validDate(returned)) {
    return json({ error: "origin, destination, outbound_date and return_date are required" }, 400);
  }
  if (outbound >= returned) return json({ error: "return_date must be after outbound_date" }, 400);

  const query = new URLSearchParams({
    origin,
    destination,
    depart_date: outbound,
    return_date: returned,
    currency: "vnd",
    show_to_affiliates: "true",
    token,
  });
  const response = await fetch(`https://api.travelpayouts.com/v2/prices/week-matrix?${query}`);
  if (!response.ok) return json({ error: `Live search provider HTTP ${response.status}` }, 502);
  const payload = await response.json();
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const deeplinkTemplate = Deno.env.get("TRAVELPAYOUTS_DEEPLINK_TEMPLATE") ?? "";
  const results = rows.flatMap((row: Record<string, unknown>) => {
    const price = Number(row.value);
    const departDate = typeof row.depart_date === "string" ? row.depart_date : outbound;
    const returnDate = typeof row.return_date === "string" ? row.return_date : returned;
    if (!Number.isFinite(price) || price <= 0 || !validDate(departDate) || !validDate(returnDate)) return [];
    let affiliateUrl: string | null = null;
    if (deeplinkTemplate) {
      try {
        const candidate = deeplinkTemplate
          .replaceAll("{origin}", origin)
          .replaceAll("{destination}", destination)
          .replaceAll("{outbound}", departDate)
          .replaceAll("{returned}", returnDate);
        if (new URL(candidate).protocol === "https:") affiliateUrl = candidate;
      } catch {
        affiliateUrl = null;
      }
    }
    return [{
      origin_code: origin,
      destination_code: destination,
      price,
      currency: "VND",
      depart_date: departDate,
      return_date: returnDate,
      airline_code: typeof row.airline === "string" ? row.airline : null,
      stops: Number(row.number_of_changes ?? 0),
      source: "travelpayouts_week_matrix",
      link_kind: affiliateUrl ? "live_affiliate" : "indicative",
      affiliate_url: affiliateUrl,
      booking_url: `https://www.google.com/travel/flights?${new URLSearchParams({
        q: `Flights to ${destination} from ${origin} on ${departDate} through ${returnDate}`,
        hl: "vi",
        curr: "VND",
      }).toString()}`,
      observed_at: new Date().toISOString(),
    }];
  });
  return json({ results, source: "travelpayouts", indicative: true });
});
