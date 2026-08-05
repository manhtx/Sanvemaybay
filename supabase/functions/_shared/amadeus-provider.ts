import type { ProviderFlightOption } from "./flight-normalization.ts";

type AmadeusOffer = {
  price?: { grandTotal?: string };
  itineraries?: Array<{
    duration?: string;
    segments?: Array<{
      carrierCode?: string;
      number?: string;
    }>;
  }>;
};

function durationMinutes(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?$/.exec(value);
  if (!match) return undefined;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const total = hours * 60 + minutes;
  return total > 0 ? total : undefined;
}

export function normalizeAmadeusOffers(offers: AmadeusOffer[], _currency = "VND"): ProviderFlightOption[] {
  return offers.flatMap((offer) => {
    const itinerary = offer.itineraries?.[0];
    const firstSegment = itinerary?.segments?.[0];
    const price = Number(offer.price?.grandTotal);
    const totalDuration = durationMinutes(itinerary?.duration);
    if (!firstSegment?.carrierCode || !firstSegment.number || !Number.isFinite(price) || !totalDuration) return [];
    return [{
      price,
      total_duration: totalDuration,
      flights: [{ flight_number: `${firstSegment.carrierCode} ${firstSegment.number}`, airline: firstSegment.carrierCode }],
      layovers: Array(Math.max(0, (itinerary?.segments?.length ?? 1) - 1)).fill(null),
    }];
  });
}

export async function getAmadeusAccessToken(clientId: string, clientSecret: string, baseUrl: string): Promise<string> {
  const response = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
  });
  if (!response.ok) throw new Error(`Amadeus token HTTP ${response.status}`);
  const body = await response.json();
  if (typeof body.access_token !== "string" || !body.access_token) throw new Error("Amadeus token response was invalid");
  return body.access_token;
}

export async function searchAmadeusFlights(input: {
  accessToken: string;
  baseUrl: string;
  originCode: string;
  destinationCode: string;
  outboundDate: string;
  returnDate: string;
  currency?: string;
}): Promise<ProviderFlightOption[]> {
  const query = new URLSearchParams({
    originLocationCode: input.originCode,
    destinationLocationCode: input.destinationCode,
    departureDate: input.outboundDate,
    returnDate: input.returnDate,
    adults: "1",
    currencyCode: input.currency ?? "VND",
    max: "50",
  });
  const response = await fetch(`${input.baseUrl}/v2/shopping/flight-offers?${query}`, {
    headers: { Authorization: `Bearer ${input.accessToken}` },
  });
  if (!response.ok) throw new Error(`Amadeus flight search HTTP ${response.status}`);
  const body = await response.json();
  return normalizeAmadeusOffers(Array.isArray(body.data) ? body.data : [], input.currency ?? "VND");
}
