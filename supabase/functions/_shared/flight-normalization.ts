export type ProviderFlightOption = {
  price?: number;
  total_duration?: number;
  flights?: Array<{ flight_number?: string; airline?: string }>;
  layovers?: unknown[];
};

export type FlightRouteContext = {
  route_id: string;
  scan_run_id: string;
  origin: string;
  origin_code: string;
  destination: string;
  destination_code: string;
  country: string;
  region: string;
  outbound_date: string;
  return_date: string;
  observed_at: string;
  provider_source?: string;
};

export function buildGoogleFlightsSourceUrl(input: {
  originCode: string;
  destinationCode: string;
  outboundDate: string;
  returnDate?: string;
}): string {
  const query = input.returnDate
    ? `Flights to ${input.destinationCode} from ${input.originCode} on ${input.outboundDate} through ${input.returnDate}`
    : `Flights to ${input.destinationCode} from ${input.originCode} on ${input.outboundDate}`;
  return `https://www.google.com/travel/flights?${new URLSearchParams({ q: query, hl: "vi", curr: "VND" }).toString()}`;
}

export function normalizeProviderOptions(options: ProviderFlightOption[], context: FlightRouteContext): Record<string, unknown>[] {
  const unique = new Map<string, Record<string, unknown>>();
  const providerSource = context.provider_source ?? "serpapi_google_flights";
  const linkKind = providerSource.includes("archive") ? "historical" : "live_source";
  for (const option of options) {
    const firstLeg = option.flights?.[0];
    const price = option.price;
    const totalDuration = option.total_duration;
    if (!firstLeg?.flight_number || !firstLeg.airline || price == null || totalDuration == null || !Number.isFinite(price) || !Number.isFinite(totalDuration)) continue;
    if (price <= 0 || totalDuration <= 0) continue;
    const stops = option.layovers?.length ?? 0;
    const itineraryKey = [context.origin_code, context.destination_code, context.outbound_date, context.return_date, firstLeg.flight_number.trim(), stops].join(":");
    unique.set(itineraryKey, {
      route_id: context.route_id,
      scan_run_id: context.scan_run_id,
      origin: context.origin,
      origin_code: context.origin_code,
      destination: context.destination,
      destination_code: context.destination_code,
      country: context.country,
      region: context.region,
      price,
      currency: "VND",
      date: context.outbound_date,
      return_date: context.return_date,
      airline: firstLeg.airline,
      airline_code: firstLeg.flight_number.trim().split(/\s+/)[0],
      flight_number: firstLeg.flight_number.trim(),
      stops,
      duration: `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`,
      source: providerSource,
      link_kind: linkKind,
      booking_url: buildGoogleFlightsSourceUrl({
        originCode: context.origin_code,
        destinationCode: context.destination_code,
        outboundDate: context.outbound_date,
        returnDate: context.return_date,
      }),
      itinerary_key: itineraryKey,
      timestamp: context.observed_at,
    });
  }
  return [...unique.values()];
}
