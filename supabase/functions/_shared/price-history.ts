export type FlightObservation = {
  origin_code?: string | null;
  destination_code?: string | null;
  date?: string | null;
  price?: number | string | null;
};

export type PriceHistoryRow = {
  from_code: string;
  to_code: string;
  date: string;
  price: number;
};

export function toPriceHistoryRow(flight: FlightObservation): PriceHistoryRow | undefined {
  const price = Number(flight.price);
  const date = typeof flight.date === "string" ? new Date(`${flight.date}T00:00:00Z`) : null;
  if (
    typeof flight.origin_code !== "string" || !flight.origin_code ||
    typeof flight.destination_code !== "string" || !flight.destination_code ||
    typeof flight.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(flight.date) ||
    !date || date.toISOString().slice(0, 10) !== flight.date ||
    !Number.isFinite(price) || price <= 0
  ) return undefined;
  return { from_code: flight.origin_code, to_code: flight.destination_code, date: flight.date, price };
}
