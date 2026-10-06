import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { isValidDateOnly, matchesAlert, selectDailyDeal } from "./alert-matching.ts";

Deno.test("matches alert filters by route, price, discount and region", () => {
  const alert = {
    destination_code: "BKK",
    origin_code: "SGN",
    budget: 3000000,
    discount_threshold: 20,
    preferred_regions: ["International"],
  };
  assert(matchesAlert(alert, {
    to_code: "BKK", from_code: "SGN", price: 2500000, discount: 25, trip_type: "international",
  }));
  assert(!matchesAlert(alert, {
    to_code: "BKK", from_code: "HAN", price: 2500000, discount: 25, trip_type: "international",
  }));
  assert(!matchesAlert(alert, {
    to_code: "BKK", from_code: "SGN", price: 3500000, discount: 25, trip_type: "international",
  }));
  assert(!matchesAlert(alert, {
    to_code: "BKK", from_code: "SGN", price: 2500000, discount: 10, trip_type: "international",
  }));
});

Deno.test("matches destination name when no destination code is stored", () => {
  assert(matchesAlert({ destination: "Bangkok" }, { to: "Bangkok", discount: 0 }));
  assert(!matchesAlert({ destination: "Bangkok" }, { to: "Tokyo", discount: 0 }));
});

Deno.test("daily selection returns the highest-scoring deal only", () => {
  const selected = selectDailyDeal([
    { deal_score: 72, id: "a" },
    { deal_score: 91, id: "b" },
    { deal_score: 80, id: "c" },
  ]);
  assertEquals(selected.map((deal) => deal.id), ["b"]);
});

Deno.test("date range matching accepts only deals inside the inclusive window", () => {
  assert(isValidDateOnly("2026-08-01"));
  assert(!isValidDateOnly("2026-02-30"));
  const alert = { destination_code: "BKK", date_from: "2026-08-01", date_to: "2026-08-10" };
  assert(matchesAlert(alert, { to_code: "BKK", discount: 0, depart_date: "2026-08-10" }));
  assert(!matchesAlert(alert, { to_code: "BKK", discount: 0, depart_date: "2026-08-11" }));
});

Deno.test("explicit regression: target price <= 5,000,000 with 5% discount matches without hidden 20% suppression", () => {
  // Alert with budget 5M and null discount_threshold
  const alert = {
    destination_code: "BKK",
    origin_code: "HAN",
    budget: 5000000,
    discount_threshold: null,
  };
  assert(matchesAlert(alert, {
    to_code: "BKK",
    from_code: "HAN",
    price: 4800000,
    discount: 5,
  }));
});
