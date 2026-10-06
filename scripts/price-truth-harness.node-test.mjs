import test from "node:test";
import assert from "node:assert/strict";

/**
 * Normalized Offer Variant for price-truth computations.
 * @typedef {Object} NormalizedCandidate
 * @property {string} origin
 * @property {string} destination
 * @property {string} outboundDate
 * @property {string} returnDate
 * @property {number} stops
 * @property {string} airline
 * @property {string} airlineCode
 * @property {number} price
 * @property {string} currency
 * @property {string} timestamp
 */

/**
 * Compute the Route-Best Minimum for a given TravelIntent scope.
 * @param {NormalizedCandidate[]} candidates
 * @param {Object} scope
 * @param {string} scope.origin
 * @param {string} scope.destination
 * @param {string} scope.outboundDate
 * @param {string} [scope.returnDate]
 * @param {boolean} [scope.directOnly]
 * @param {number} [scope.maxStops]
 * @param {string} [scope.currency]
 * @param {number} [nowEpoch]
 * @returns {NormalizedCandidate | null}
 */
export function computeRouteBest(candidates, scope, nowEpoch = Date.now()) {
  const maxAgeMs = 7 * 86_400_000; // 7 days freshness boundary

  const eligible = candidates.filter((c) => {
    // 1. Mandatory scope fingerprint matching
    if (c.origin.toUpperCase() !== scope.origin.toUpperCase()) return false;
    if (c.destination.toUpperCase() !== scope.destination.toUpperCase()) return false;
    if (c.outboundDate !== scope.outboundDate) return false;
    if (scope.returnDate && c.returnDate !== scope.returnDate) return false;

    // 2. Stops constraint
    if (scope.directOnly && c.stops !== 0) return false;
    if (typeof scope.maxStops === "number" && c.stops > scope.maxStops) return false;

    // 3. Price validity (positive finite number)
    if (!Number.isFinite(c.price) || c.price <= 0) return false;

    // 4. Currency matching
    if (scope.currency && c.currency !== scope.currency) return false;

    // 5. Freshness
    const observedMs = Date.parse(c.timestamp);
    if (Number.isFinite(observedMs) && nowEpoch - observedMs > maxAgeMs) return false;

    return true;
  });

  if (eligible.length === 0) return null;

  // Pure mathematical minimum normalized price
  return eligible.reduce((min, curr) => (curr.price < min.price ? curr : min), eligible[0]);
}

/**
 * Shuffle array randomly.
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

test("Hard fixture (HAN -> KUL): 5.21M vs 4.26M vs 4.67M vs 5.30M resolves to 4.26M", () => {
  const now = new Date("2026-10-06T10:00:00Z").getTime();
  const candidates = [
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "Sun PhuQuoc Airways", airlineCode: "9G", price: 5_213_362, currency: "VND", timestamp: "2026-10-06T09:00:00Z" },
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "AirAsia", airlineCode: "AK", price: 4_265_502, currency: "VND", timestamp: "2026-10-06T09:15:00Z" },
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "AirAsia", airlineCode: "AK", price: 4_676_262, currency: "VND", timestamp: "2026-10-06T09:15:00Z" },
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "AirAsia", airlineCode: "AK", price: 5_306_262, currency: "VND", timestamp: "2026-10-06T09:15:00Z" },
  ];

  const scope = { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", directOnly: true, currency: "VND" };
  const best = computeRouteBest(candidates, scope, now);

  assert.ok(best, "Route best must not be null");
  assert.equal(best.price, 4_265_502, "Route-best minimum must strictly be 4,265,502 VND");
  assert.equal(best.airline, "AirAsia", "Cheapest carrier must be AirAsia");
});

test("Input order randomization invariant: 50 shuffles must all yield identical minimum", () => {
  const now = new Date("2026-10-06T10:00:00Z").getTime();
  const candidates = [
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "Sun PhuQuoc Airways", airlineCode: "9G", price: 5_213_362, currency: "VND", timestamp: "2026-10-06T09:00:00Z" },
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "AirAsia", airlineCode: "AK", price: 4_265_502, currency: "VND", timestamp: "2026-10-06T09:15:00Z" },
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "AirAsia", airlineCode: "AK", price: 4_676_262, currency: "VND", timestamp: "2026-10-06T09:15:00Z" },
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "AirAsia", airlineCode: "AK", price: 5_306_262, currency: "VND", timestamp: "2026-10-06T09:15:00Z" },
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "Vietnam Airlines", airlineCode: "VN", price: 13_876_000, currency: "VND", timestamp: "2026-10-06T09:15:00Z" },
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "Malaysia Airlines", airlineCode: "MH", price: 21_910_000, currency: "VND", timestamp: "2026-10-06T09:15:00Z" },
  ];
  const scope = { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", directOnly: true, currency: "VND" };

  for (let i = 0; i < 50; i++) {
    const shuffled = shuffle(candidates);
    const best = computeRouteBest(shuffled, scope, now);
    assert.equal(best?.price, 4_265_502, `Iteration ${i} failed to select minimum from shuffled input`);
  }
});

test("Direct-only scope isolation: Cheaper 1-stop offer cannot beat direct minimum", () => {
  const now = new Date("2026-10-06T10:00:00Z").getTime();
  const candidates = [
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 1, airline: "Scoot", airlineCode: "TR", price: 3_200_000, currency: "VND", timestamp: "2026-10-06T09:00:00Z" },
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "AirAsia", airlineCode: "AK", price: 4_265_502, currency: "VND", timestamp: "2026-10-06T09:00:00Z" },
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "Sun PhuQuoc Airways", airlineCode: "9G", price: 5_213_362, currency: "VND", timestamp: "2026-10-06T09:00:00Z" },
  ];

  // Direct-only query
  const directScope = { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", directOnly: true };
  const directBest = computeRouteBest(candidates, directScope, now);
  assert.equal(directBest?.price, 4_265_502, "Direct query must return AirAsia 4.26M, NOT Scoot 1-stop 3.2M");

  // Any-stops query
  const anyStopsScope = { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", directOnly: false };
  const anyStopsBest = computeRouteBest(candidates, anyStopsScope, now);
  assert.equal(anyStopsBest?.price, 3_200_000, "Any-stops query legitimately picks Scoot 1-stop 3.2M");
});

test("Mixed airport scope isolation: DMK offer cannot satisfy BKK-specific intent", () => {
  const now = new Date("2026-10-06T10:00:00Z").getTime();
  const candidates = [
    { origin: "HAN", destination: "DMK", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "Thai AirAsia", airlineCode: "FD", price: 2_800_000, currency: "VND", timestamp: "2026-10-06T09:00:00Z" },
    { origin: "HAN", destination: "BKK", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "Vietjet", airlineCode: "VJ", price: 3_500_000, currency: "VND", timestamp: "2026-10-06T09:00:00Z" },
  ];

  const bkkScope = { origin: "HAN", destination: "BKK", outboundDate: "2026-10-16", returnDate: "2026-10-20" };
  const bkkBest = computeRouteBest(candidates, bkkScope, now);
  assert.equal(bkkBest?.price, 3_500_000, "BKK intent must not silently match DMK 2.8M");
  assert.equal(bkkBest?.destination, "BKK");
});

test("Edge cases: Invalid prices, NaN, and stale offers quarantined", () => {
  const now = new Date("2026-10-06T10:00:00Z").getTime();
  const candidates = [
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "Corrupt1", airlineCode: "C1", price: 0, currency: "VND", timestamp: "2026-10-06T09:00:00Z" },
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "Corrupt2", airlineCode: "C2", price: -500_000, currency: "VND", timestamp: "2026-10-06T09:00:00Z" },
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "Corrupt3", airlineCode: "C3", price: Number.NaN, currency: "VND", timestamp: "2026-10-06T09:00:00Z" },
    // 30 days old stale candidate
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "StaleAir", airlineCode: "SA", price: 1_000_000, currency: "VND", timestamp: "2026-09-01T09:00:00Z" },
    // Valid fresh candidate
    { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20", stops: 0, airline: "ValidAir", airlineCode: "VA", price: 4_500_000, currency: "VND", timestamp: "2026-10-06T08:00:00Z" },
  ];

  const scope = { origin: "HAN", destination: "KUL", outboundDate: "2026-10-16", returnDate: "2026-10-20" };
  const best = computeRouteBest(candidates, scope, now);

  assert.ok(best);
  assert.equal(best.price, 4_500_000, "Must skip non-positive, NaN, and stale offers to select valid fresh minimum");
  assert.equal(best.airline, "ValidAir");
});
