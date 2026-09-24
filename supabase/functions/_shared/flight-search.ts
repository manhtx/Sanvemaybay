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
