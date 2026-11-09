import test from "node:test";
import assert from "node:assert/strict";
import { toFareObservationRow } from "../supabase/functions/_shared/price-history.ts";

test("NODE DATA-03 & DATA-04: Canonical OfferVariant ID excludes price and captures segment identity", () => {
  const flightToday = {
    origin_code: "HAN",
    destination_code: "BKK",
    date: "2026-11-12",
    return_date: "2026-11-17",
    airline_code: "VN",
    flight_number: "VN611",
    price: 3200000,
    timestamp: "2026-10-01T08:00:00Z",
    source: "fast_flights"
  };

  const flightTomorrow = {
    ...flightToday,
    price: 2800000, // Price dropped 400k!
    timestamp: "2026-10-02T08:00:00Z"
  };

  const row1 = toFareObservationRow(flightToday);
  const row2 = toFareObservationRow(flightTomorrow);

  assert.ok(row1);
  assert.ok(row2);

  // Invariant REQ-ID-002: Same itinerary variant must have identical OfferVariant ID despite price difference
  assert.equal(row1.offer_variant_id, row2.offer_variant_id);
  assert.ok(row1.offer_variant_id.startsWith("ov:v1:"));
});

test("NODE DATA-08: Raw observation processing is 100% idempotent across 10 replays", () => {
  const rawFlight = {
    id: "raw-flight-12345",
    scan_run_id: "scan-epoch-alpha",
    origin_code: "HAN",
    destination_code: "BKK",
    date: "2026-11-12",
    return_date: "2026-11-17",
    airline_code: "AK",
    flight_number: "AK513",
    price: 2450000,
    currency: "VND",
    timestamp: "2026-10-01T10:00:00Z",
    source: "fast_flights"
  };

  // Process same immutable raw observation 10 times
  const processedFingerprints = new Set();
  for (let i = 0; i < 10; i++) {
    const row = toFareObservationRow(rawFlight);
    assert.ok(row);
    processedFingerprints.add(`${row.provider}:${row.observation_fingerprint}`);
  }

  // Exactly 1 unique observation fingerprint after 10 processing cycles!
  assert.equal(processedFingerprints.size, 1);

  // Now introduce second genuine scan epoch at same fare
  const nextEpochFlight = {
    ...rawFlight,
    scan_run_id: "scan-epoch-beta",
    timestamp: "2026-10-02T10:00:00Z" // Next day scan
  };

  const rowEpoch2 = toFareObservationRow(nextEpochFlight);
  assert.ok(rowEpoch2);
  processedFingerprints.add(`${rowEpoch2.provider}:${rowEpoch2.observation_fingerprint}`);

  // Exactly 2 unique observation fingerprints across 2 genuine scan epochs
  assert.equal(processedFingerprints.size, 2);
  // But OfferVariant ID remains strictly identical
  assert.equal(rowEpoch2.offer_variant_id, toFareObservationRow(rawFlight)?.offer_variant_id);
});

test("NODE DATA-05: Preserves provider quality lineage without false upgrades", () => {
  const rawFlight = {
    origin_code: "HAN",
    destination_code: "BKK",
    date: "2026-11-12",
    price: 2500000,
    timestamp: "2026-10-01T10:00:00Z",
    source: "fast_flights"
  };

  const row = toFareObservationRow(rawFlight);
  assert.ok(row);
  assert.equal(row.source_quality, "PROVEN_PROVIDER");
});

test("NODE DATA-06: Non-positive, NaN, and non-finite price observations fail closed (returns undefined)", () => {
  const base = {
    origin_code: "HAN",
    destination_code: "BKK",
    date: "2026-11-12",
    timestamp: "2026-10-01T10:00:00Z"
  };

  assert.equal(toFareObservationRow({ ...base, price: 0 }), undefined);
  assert.equal(toFareObservationRow({ ...base, price: -500_000 }), undefined);
  assert.equal(toFareObservationRow({ ...base, price: Number.NaN }), undefined);
  assert.equal(toFareObservationRow({ ...base, price: Number.POSITIVE_INFINITY }), undefined);
  assert.equal(toFareObservationRow({ ...base, price: 2500000, origin_code: "" }), undefined);
  assert.equal(toFareObservationRow({ ...base, price: 2500000, destination_code: "   " }), undefined);
});

test("NODE DATA-07: Pure immutability on Object.freeze protected raw flight observations", () => {
  const frozenFlight = Object.freeze({
    id: "raw-freeze-123",
    scan_run_id: "scan-frozen",
    origin_code: "HAN",
    destination_code: "SGN",
    date: "2026-12-01",
    airline_code: "VN",
    flight_number: "VN201",
    price: 1800000,
    currency: "VND",
    timestamp: "2026-10-01T10:00:00Z",
    source: "fast_flights"
  });

  assert.doesNotThrow(() => toFareObservationRow(frozenFlight));
  const row = toFareObservationRow(frozenFlight);
  assert.ok(row);
  assert.equal(row.origin_airport, "HAN");
  assert.equal(row.destination_airport, "SGN");
});

test("NODE DATA-09: High-throughput canonical fare normalization and observation fingerprinting micro-benchmark", () => {
  const flight = {
    origin_code: "HAN",
    destination_code: "BKK",
    date: "2026-11-15",
    return_date: "2026-11-20",
    airline_code: "VJ",
    flight_number: "VJ901",
    price: 2150000,
    timestamp: "2026-10-01T08:00:00Z",
    source: "fast_flights",
  };

  const start = performance.now();
  const iterations = 1000;

  for (let i = 0; i < iterations; i++) {
    const row = toFareObservationRow(flight);
    assert.ok(row);
    assert.ok(row.offer_variant_id.startsWith("ov:v1:"));
    assert.equal(row.observation_fingerprint.length, 64);
  }

  const duration = performance.now() - start;
  // 1,000 canonical rows must process within 150ms
  assert.ok(duration < 150, `Normalization benchmark took ${duration.toFixed(2)}ms, expected < 150ms`);
});
