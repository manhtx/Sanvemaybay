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

Deno.test("location scope: BKK_ALL matches BKK and DMK; exact BKK rejects DMK", () => {
  const metroAlert = { destination_code: "BKK_ALL" };
  assert(matchesAlert(metroAlert, { to_code: "BKK", price: 2000000 }));
  assert(matchesAlert(metroAlert, { to_code: "DMK", price: 2000000 }));
  assert(!matchesAlert(metroAlert, { to_code: "SIN", price: 2000000 }));

  const exactAlert = { destination_code: "BKK" };
  assert(matchesAlert(exactAlert, { to_code: "BKK", price: 2000000 }));
  assert(!matchesAlert(exactAlert, { to_code: "DMK", price: 2000000 }));
});

Deno.test("stops and trip-type constraints in alert matching", () => {
  const directAlert = { destination_code: "SIN", max_stops: 0 };
  assert(matchesAlert(directAlert, { to_code: "SIN", stops: 0 }));
  assert(!matchesAlert(directAlert, { to_code: "SIN", stops: 1 }));

  const roundtripAlert = { destination_code: "SIN", trip_type: "roundtrip" as const };
  assert(matchesAlert(roundtripAlert, { to_code: "SIN", depart_date: "2026-11-01", return_date: "2026-11-05" }));
  assert(!matchesAlert(roundtripAlert, { to_code: "SIN", depart_date: "2026-11-01", return_date: null }));

  const onewayAlert = { destination_code: "SIN", trip_type: "oneway" as const };
  assert(matchesAlert(onewayAlert, { to_code: "SIN", depart_date: "2026-11-01" }));
  assert(!matchesAlert(onewayAlert, { to_code: "SIN", depart_date: "2026-11-01", return_date: "2026-11-05" }));
});

