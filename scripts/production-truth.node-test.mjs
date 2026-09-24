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
