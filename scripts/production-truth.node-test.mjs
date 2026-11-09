import assert from "node:assert/strict";
import test from "node:test";
import { rejectionReasons, summarizeDeals } from "./production-truth.mjs";

const config = {
  now: new Date("2026-08-11T00:00:00Z"),
  launchRoutes: new Set(["HAN-BKK"]),
  approvedSources: new Set(["approved-provider"]),
  approvedHosts: new Set(["provider.example", "aviasales.com"]),
  minScore: 80,
  minDiscount: 20,
  minConfidence: 0.65,
};

const liveDeal = {
  id: "live-1",
  from_code: "HAN",
  to_code: "BKK",
  depart_date: "2026-09-01",
  price: 2_000_000,
  duration: "2h",
  discount: 25,
  confidence: 0.8,
  deal_score: 85,
  source: "approved-provider",
  valid_until: "2026-08-12T00:00:00Z",
  booking_url: "https://provider.example/offer/1",
  link_kind: "live_source",
};

test("accepts only a complete approved live deal in the launch cohort", () => {
  assert.deepEqual(rejectionReasons(liveDeal, config), []);
  assert.equal(summarizeDeals([liveDeal], config).qualifiedLiveDeals, 1);
});

test("rejects stale, historical and unapproved rows with explicit reasons", () => {
  const reasons = rejectionReasons({
    ...liveDeal,
    source: "archive",
    link_kind: "historical",
    valid_until: "2026-08-10T00:00:00Z",
  }, config);
  assert.deepEqual(reasons, ["unapproved_source", "not_live_kind", "expired_or_missing_validity"]);
});

test("requires affiliate metadata for affiliate-labelled deals", () => {
  const reasons = rejectionReasons({ ...liveDeal, link_kind: "live_affiliate" }, config);
  assert.deepEqual(reasons, ["missing_affiliate_network", "invalid_affiliate_url"]);
});

test("production truth: multi-failure rejection accumulation and threshold gating (score, discount, confidence)", () => {
  // Test individual threshold violations
  const lowScore = rejectionReasons({ ...liveDeal, deal_score: 79 }, config);
  assert.deepEqual(lowScore, ["below_score_threshold"]);

  const lowDiscount = rejectionReasons({ ...liveDeal, discount: 19 }, config);
  assert.deepEqual(lowDiscount, ["below_discount_threshold"]);

  const lowConfidence = rejectionReasons({ ...liveDeal, confidence: 0.64 }, config);
  assert.deepEqual(lowConfidence, ["below_confidence_threshold"]);

  // Test simultaneous multi-failure accumulation across multiple categories
  const multiCorrupt = {
    ...liveDeal,
    from_code: "SGN",
    to_code: "ICN", // outside launch cohort
    depart_date: "2026-08-01", // departure in the past (before config.now 2026-08-11)
    price: -100, // invalid price
    duration: "   ", // missing duration
    booking_url: "https://unapproved-phishing.com/offer", // unapproved host
    deal_score: 70, // below score
    discount: 10, // below discount
    confidence: 0.5, // below confidence
  };
  const multiReasons = rejectionReasons(multiCorrupt, config);
  assert.deepEqual(multiReasons, [
    "outside_launch_cohort",
    "departure_not_future",
    "invalid_price",
    "missing_duration",
    "invalid_booking_url",
    "below_score_threshold",
    "below_discount_threshold",
    "below_confidence_threshold",
  ]);
});

test("production truth: summarizeDeals aggregates source counts, launch cohort coverage, and rejection distributions", () => {
  const deal2Qualified = { ...liveDeal, id: "live-2", price: 1_800_000, discount: 30 };
  const deal3Stale = { ...liveDeal, id: "stale-3", source: "archive", link_kind: "historical", valid_until: "2026-08-10T00:00:00Z" };
  const deal4AffiliateBad = { ...liveDeal, id: "aff-4", link_kind: "live_affiliate" };
  const deal5OutsideCohort = { ...liveDeal, id: "outside-5", from_code: "DAD", to_code: "NRT" };

  const batch = [liveDeal, deal2Qualified, deal3Stale, deal4AffiliateBad, deal5OutsideCohort];
  const summary = summarizeDeals(batch, config);

  assert.equal(summary.totalRows, 5);
  assert.equal(summary.qualifiedLiveDeals, 2);
  assert.equal(summary.launchCohortRows, 4, "4 out of 5 deals are on HAN-BKK");
  assert.deepEqual(summary.qualifiedIds, ["live-1", "live-2"]);

  assert.equal(summary.sourceCounts["approved-provider"], 4);
  assert.equal(summary.sourceCounts["archive"], 1);

  assert.equal(summary.rejectionCounts["unapproved_source"], 1);
  assert.equal(summary.rejectionCounts["not_live_kind"], 1);
  assert.equal(summary.rejectionCounts["expired_or_missing_validity"], 1);
  assert.equal(summary.rejectionCounts["missing_affiliate_network"], 1);
  assert.equal(summary.rejectionCounts["invalid_affiliate_url"], 1);
  assert.equal(summary.rejectionCounts["outside_launch_cohort"], 1);
});

test("performance benchmark: 10,000 deal evaluations execute well under latency budget", () => {
  const start = performance.now();
  const iterations = 10_000;

  for (let i = 0; i < iterations; i++) {
    const d = i % 2 === 0 ? liveDeal : { ...liveDeal, deal_score: 75, price: -1 };
    rejectionReasons(d, config);
  }

  const duration = performance.now() - start;
  // 10,000 evaluations should easily finish within 100ms
  assert.ok(duration < 100, `Benchmark took ${duration.toFixed(2)}ms, expected < 100ms`);
});
