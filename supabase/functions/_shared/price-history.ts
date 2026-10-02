export type FlightObservation = {
  origin_code?: string | null;
  destination_code?: string | null;
  date?: string | null;
  price?: number | string | null;
  timestamp?: string | null;
  observed_at?: string | null;
};

export type PriceHistoryRow = {
  from_code: string;
  to_code: string;
  date: string;
  price: number;
};

export function toPriceHistoryRow(flight: FlightObservation): PriceHistoryRow | undefined {
  const price = Number(flight.price);
  const observedTimestamp = typeof flight.timestamp === "string" && flight.timestamp
    ? flight.timestamp
    : typeof flight.observed_at === "string" && flight.observed_at
      ? flight.observed_at
      : null;

  let rowDate: string | undefined;
  if (observedTimestamp) {
    const parsed = new Date(observedTimestamp);
    if (!Number.isNaN(parsed.getTime())) {
      rowDate = parsed.toISOString().slice(0, 10);
    }
  }
  if (!rowDate) {
    const flightDate = typeof flight.date === "string" ? new Date(`${flight.date}T00:00:00Z`) : null;
    if (
      typeof flight.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(flight.date) &&
      flightDate &&
      flightDate.toISOString().slice(0, 10) === flight.date
    ) {
      rowDate = flight.date;
    }
  }

  if (
    typeof flight.origin_code !== "string" || !flight.origin_code ||
    typeof flight.destination_code !== "string" || !flight.destination_code ||
    !rowDate ||
    !Number.isFinite(price) || price <= 0
  ) return undefined;
  return { from_code: flight.origin_code, to_code: flight.destination_code, date: rowDate, price };
}
