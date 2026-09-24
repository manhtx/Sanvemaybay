import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildGoogleFlightsSourceUrl, normalizeProviderOptions } from "./flight-normalization.ts";
import { normalizeAmadeusOffers } from "./amadeus-provider.ts";

const context = {
  route_id: "route", scan_run_id: "run", origin: "Hà Nội", origin_code: "HAN", destination: "Bangkok", destination_code: "BKK", country: "Thailand", region: "asia", outbound_date: "2026-08-01", return_date: "2026-08-05", observed_at: "2026-07-31T00:00:00Z",
};

Deno.test("normalizes valid options and deduplicates itinerary keys", () => {
  const rows = normalizeProviderOptions([
    { price: 2_000_000, total_duration: 150, flights: [{ flight_number: "FA 1", airline: "Fixture Air" }], layovers: [] },
    { price: 1_900_000, total_duration: 150, flights: [{ flight_number: "FA 1", airline: "Fixture Air" }], layovers: [] },
  ], context);
  assertEquals(rows.length, 1);
  assertEquals(rows[0].price, 1_900_000);
  assertEquals(rows[0].duration, "2h 30m");
  assertEquals(rows[0].link_kind, "indicative");
  assertEquals(rows[0].booking_url, "https://www.google.com/travel/flights?q=Flights+to+BKK+from+HAN+on+2026-08-01+through+2026-08-05&hl=vi&curr=VND");
});

Deno.test("builds a source URL from the observed route and date", () => {
  const url = buildGoogleFlightsSourceUrl({ originCode: "HAN", destinationCode: "NRT", outboundDate: "2026-09-01" });
  assert(url.startsWith("https://www.google.com/travel/flights?"));
  assert(url.includes("HAN") && url.includes("NRT") && url.includes("2026-09-01"));
});

Deno.test("rejects incomplete, non-positive and non-finite provider options", () => {
  const rows = normalizeProviderOptions([
    { price: 0, total_duration: 100, flights: [{ flight_number: "A", airline: "Air" }] },
    { price: 100, total_duration: 0, flights: [{ flight_number: "B", airline: "Air" }] },
    { price: 100, total_duration: 100, flights: [] },
    { price: 100, total_duration: 100, flights: [{ flight_number: "C" }] },
  ], context);
  assertEquals(rows, []);
});

Deno.test("normalizes Amadeus offers into the shared provider contract", () => {
  const rows = normalizeAmadeusOffers([{
    price: { grandTotal: "1250000" },
    itineraries: [{ duration: "PT3H20M", segments: [
      { carrierCode: "VJ", number: "123" },
      { carrierCode: "VJ", number: "456" },
    ] }],
  }]);
  assertEquals(rows[0].price, 1250000);
  assertEquals(rows[0].total_duration, 200);
  assertEquals(rows[0].layovers?.length, 1);
});
