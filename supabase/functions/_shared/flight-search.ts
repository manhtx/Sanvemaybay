export type FlightSearchInput = {
  origin: string;
  destination: string;
  outboundDate: string;
  returnDate: string;
};

function parseIsoDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : undefined;
}

export function isIsoCalendarDate(value: unknown): value is string {
  return Boolean(parseIsoDate(value));
}

export function validateFlightSearchInput(body: unknown, now = new Date()): FlightSearchInput | undefined {
  if (!body || typeof body !== "object" || Array.isArray(body)) return undefined;
  const value = body as Record<string, unknown>;
  const origin = typeof value.origin === "string" ? value.origin.trim().toUpperCase() : "";
  const destination = typeof value.destination === "string" ? value.destination.trim().toUpperCase() : "";
  const outboundDate = typeof value.outbound_date === "string" ? value.outbound_date : "";
  const returnDate = typeof value.return_date === "string" ? value.return_date : "";
  const outbound = parseIsoDate(outboundDate);
  const returned = parseIsoDate(returnDate);
  if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || origin === destination || !outbound || !returned) return undefined;
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = 86_400_000;
  const outboundOffset = (outbound.getTime() - today.getTime()) / day;
  const tripLength = (returned.getTime() - outbound.getTime()) / day;
  if (outboundOffset < 0 || outboundOffset > 365 || tripLength < 1 || tripLength > 180) return undefined;
  return { origin, destination, outboundDate, returnDate };
}

export function boundedProviderRows(payload: unknown, maximum = 100): Record<string, unknown>[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { data?: unknown }).data)) return [];
  return (payload as { data: unknown[] }).data
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row))
    .slice(0, maximum);
}

export function mapTravelpayoutsRow(
  row: Record<string, unknown>,
  input: FlightSearchInput,
  fetchTime = new Date().toISOString()
): Record<string, unknown> | null {
  const price = Number(row.value);
  // RC-10: Quarantine rows missing required provider departure date provenance
  if (typeof row.depart_date !== "string" || !isIsoCalendarDate(row.depart_date)) return null;
  const departDate = row.depart_date;
  const returnDate = typeof row.return_date === "string" && isIsoCalendarDate(row.return_date)
    ? row.return_date
    : (input.returnDate || null);
  if (!Number.isFinite(price) || price <= 0) return null;
  const isActual = row.actual === true;
  const rawChanges = row.number_of_changes;
  const stops = typeof rawChanges === "number" && Number.isFinite(rawChanges) ? rawChanges : null;
  // Prioritize documented found_at field over legacy created_at fallback (R14, NEG-11)
  const providerObservedAt = typeof row.found_at === "string"
    ? row.found_at
    : typeof row.created_at === "string"
      ? row.created_at
      : null;
  return {
    origin_code: input.origin,
    destination_code: input.destination,
    price,
    currency: "VND",
    depart_date: departDate,
    return_date: returnDate,
    airline_code: typeof row.airline === "string" ? row.airline : null,
    stops,
    source: "travelpayouts_week_matrix",
    link_kind: "indicative",
    affiliate_url: null,
    actual: isActual,
    booking_url: `https://www.google.com/travel/flights?${new URLSearchParams({
      q: `Flights to ${input.destination} from ${input.origin} on ${departDate} through ${returnDate}`,
      hl: "vi",
      curr: "VND",
    }).toString()}`,
    provider_observed_at: providerObservedAt,
    provider_fetched_at: fetchTime,
    farely_received_at: fetchTime,
    observed_at: providerObservedAt,
    source_age_status: providerObservedAt ? "KNOWN" : "UNKNOWN_SOURCE_AGE",
  };
}
