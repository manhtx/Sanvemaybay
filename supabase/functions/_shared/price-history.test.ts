import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { toPriceHistoryRow, toFareObservationRow, sha256Hex } from "./price-history.ts";

Deno.test("sha256Hex generates deterministic 64-char hex hash", () => {
  const hash1 = sha256Hex("test-payload");
  const hash2 = sha256Hex("test-payload");
  assertEquals(hash1.length, 64);
  assertEquals(hash1, hash2);
});

Deno.test("builds a valid price history observation", () => {
  assertEquals(toPriceHistoryRow({
    origin_code: "HAN", destination_code: "BKK", date: "2026-08-01", price: "2200000",
  }), { from_code: "HAN", to_code: "BKK", date: "2026-08-01", price: 2200000 });
});

Deno.test("rejects malformed or non-positive observations", () => {
  assertEquals(toPriceHistoryRow({ origin_code: "HAN", destination_code: "BKK", date: "2026-02-30", price: 1 }), undefined);
  assertEquals(toPriceHistoryRow({ origin_code: "HAN", destination_code: "BKK", date: "2026-08-01", price: 0 }), undefined);
  assertEquals(toFareObservationRow({ origin_code: "HAN", destination_code: "BKK", date: "2026-08-01", price: 0 }), undefined);
});

Deno.test("uses observation timestamp date over departure date when available in legacy row", () => {
  assertEquals(toPriceHistoryRow({
    origin_code: "HAN",
    destination_code: "BKK",
    date: "2026-12-25",
    timestamp: "2026-10-02T07:00:00Z",
    price: "1500000",
  }), { from_code: "HAN", to_code: "BKK", date: "2026-10-02", price: 1500000 });
});

Deno.test("toFareObservationRow generates canonical idempotent observation with OfferVariant excluding price (REQ-ID-002, REQ-HIST-005)", () => {
  const flightA = {
    origin_code: "HAN",
    destination_code: "SGN",
    date: "2026-11-15",
    return_date: "2026-11-20",
    price: 3200000,
    timestamp: "2026-10-07T10:00:00Z",
    scan_run_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    airline_code: "VN",
    flight_number: "VN221",
    stops: 0,
    source: "google_flights",
  };

  const obsA = toFareObservationRow(flightA);
  assertEquals(Boolean(obsA), true);
  assertEquals(obsA?.origin_airport, "HAN");
  assertEquals(obsA?.destination_airport, "SGN");
  assertEquals(obsA?.depart_local_date, "2026-11-15");
  assertEquals(obsA?.return_local_date, "2026-11-20");
  assertEquals(obsA?.journey_type, "ROUND_TRIP");
  assertEquals(obsA?.price, 3200000);

  // Reprocessing the EXACT SAME flight returns identical fingerprint (Idempotency REQ-HIST-005)
  const obsA_replay = toFareObservationRow(flightA);
  assertEquals(obsA?.observation_fingerprint, obsA_replay?.observation_fingerprint);

  // Same flight itinerary at lower price tomorrow has the SAME OfferVariantId (REQ-ID-002, REQ-ID-003)
  const flightTomorrow = {
    ...flightA,
    price: 2800000,
    timestamp: "2026-10-08T10:00:00Z",
    scan_run_id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  };
  const obsTomorrow = toFareObservationRow(flightTomorrow);
  assertEquals(obsA?.offer_variant_id, obsTomorrow?.offer_variant_id);

  // But two different scan runs/epochs have distinct observation fingerprints (REQ-HIST-006)
  assertNotEquals(obsA?.observation_fingerprint, obsTomorrow?.observation_fingerprint);
});
