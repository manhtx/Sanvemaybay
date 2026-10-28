import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { evaluateWatchCondition } from "./watch-condition.ts";

Deno.test("NC-017 & NC-019: Watch condition episode transitions (ENTERED -> STILL_INSIDE -> MATERIAL_IMPROVEMENT -> EXITED -> REENTERED)", () => {
  const watchId = "w111";
  const targetPrice = 3000000;

  // 1. Initial observation below target price -> ENTERED
  const step1 = evaluateWatchCondition({
    watchId,
    targetPrice,
    observedPrice: 2800000,
    activeEpisode: null,
  });
  assertEquals(step1.nextEpisode?.state, "ENTERED");
  assertEquals(step1.shouldAlert, true);
  assertEquals(step1.nextEpisode?.entry_price, 2800000);
  assertEquals(step1.nextEpisode?.best_price, 2800000);

  // 2. Next observation at 2750000 (< 5% drop from 2800000 is ~1.7%) -> STILL_INSIDE, no spam alert
  const step2 = evaluateWatchCondition({
    watchId,
    targetPrice,
    observedPrice: 2750000,
    activeEpisode: step1.nextEpisode,
  });
  assertEquals(step2.nextEpisode?.state, "STILL_INSIDE");
  assertEquals(step2.shouldAlert, false);
  assertEquals(step2.nextEpisode?.best_price, 2750000);

  // 3. Significant drop to 2400000 (>5% drop) -> MATERIAL_IMPROVEMENT, triggers alert
  const step3 = evaluateWatchCondition({
    watchId,
    targetPrice,
    observedPrice: 2400000,
    activeEpisode: step2.nextEpisode,
  });
  assertEquals(step3.nextEpisode?.state, "MATERIAL_IMPROVEMENT");
  assertEquals(step3.shouldAlert, true);
  assertEquals(step3.nextEpisode?.best_price, 2400000);

  // 4. Price rises above target to 3200000 -> EXITED (NC-017 / NC-020)
  const step4 = evaluateWatchCondition({
    watchId,
    targetPrice,
    observedPrice: 3200000,
    activeEpisode: step3.nextEpisode,
  });
  assertEquals(step4.nextEpisode?.state, "EXITED");
  assertEquals(step4.shouldAlert, false);
  assertEquals(Boolean(step4.nextEpisode?.closed_at), true);

  // 5. Price drops back to 2500000 -> REENTERED (NC-018 / NC-021)
  const step5 = evaluateWatchCondition({
    watchId,
    targetPrice,
    observedPrice: 2500000,
    activeEpisode: step4.nextEpisode,
  });
  assertEquals(step5.nextEpisode?.state, "REENTERED");
  assertEquals(step5.shouldAlert, true);
  assertEquals(step5.nextEpisode?.best_price, 2500000);
});

Deno.test("F18 & Section 19: INSUFFICIENT_EVIDENCE preserves episode state without false EXIT", () => {
  const watchId = "w222";
  const targetPrice = 2500000;

  // 1. Initial valid match -> ENTERED
  const step1 = evaluateWatchCondition({
    watchId,
    targetPrice,
    observedPrice: 2100000,
    activeEpisode: null,
  });
  assertEquals(step1.nextEpisode?.state, "ENTERED");
  assertEquals(step1.shouldAlert, true);

  // 2. Next scan fails or route becomes unmonitored (INSUFFICIENT_EVIDENCE or null observed price)
  const step2 = evaluateWatchCondition({
    watchId,
    targetPrice,
    observedPrice: null,
    conditionInput: "INSUFFICIENT_EVIDENCE",
    activeEpisode: step1.nextEpisode,
  });
  // Must preserve valid active episode state: state unchanged, not EXITED, closed_at is null, no alert
  assertEquals(step2.stateChanged, false, "Must not change state on INSUFFICIENT_EVIDENCE");
  assertEquals(step2.shouldAlert, false, "Must not alert on INSUFFICIENT_EVIDENCE");
  assertEquals(step2.nextEpisode?.state, "ENTERED", "Active episode must remain ENTERED");
  assertEquals(step2.nextEpisode?.closed_at, null, "Episode closed_at must remain null");

  // Also test with positive infinity or missing number
  const step2b = evaluateWatchCondition({
    watchId,
    targetPrice,
    observedPrice: Number.POSITIVE_INFINITY,
    activeEpisode: step1.nextEpisode,
  });
  assertEquals(step2b.stateChanged, false);
  assertEquals(step2b.nextEpisode?.state, "ENTERED");
  assertEquals(step2b.nextEpisode?.closed_at, null);

  // 3. Subsequently, provide verified CONFIRMED_NON_MATCH with price > target
  const step3 = evaluateWatchCondition({
    watchId,
    targetPrice,
    observedPrice: 2900000,
    conditionInput: "CONFIRMED_NON_MATCH",
    activeEpisode: step1.nextEpisode,
  });
  assertEquals(step3.stateChanged, true, "Confirmed non-match above target must exit");
  assertEquals(step3.nextEpisode?.state, "EXITED");
  assertEquals(Boolean(step3.nextEpisode?.closed_at), true);
});

Deno.test("RC-15: buildConditionFingerprint captures all material criteria", async () => {
  const { buildConditionFingerprint } = await import("./watch-condition.ts");
  const fp1 = buildConditionFingerprint({
    watchId: "w1",
    targetPrice: 2000000,
    criteria: {
      origin_code: "HAN",
      destination_code: "SGN",
      date_from: "2026-11-01",
      date_to: "2026-11-05",
      return_date: "2026-11-10",
      max_stops: 0,
      criteria_version: 1,
    },
  });

  // Mutating target price changes fingerprint
  const fpPrice = buildConditionFingerprint({
    watchId: "w1",
    targetPrice: 1900000,
    criteria: {
      origin_code: "HAN",
      destination_code: "SGN",
      date_from: "2026-11-01",
      date_to: "2026-11-05",
      return_date: "2026-11-10",
      max_stops: 0,
      criteria_version: 1,
    },
  });
  assertEquals(fp1 !== fpPrice, true);

  // Mutating destination changes fingerprint
  const fpDest = buildConditionFingerprint({
    watchId: "w1",
    targetPrice: 2000000,
    criteria: {
      origin_code: "HAN",
      destination_code: "DAD",
      date_from: "2026-11-01",
      date_to: "2026-11-05",
      return_date: "2026-11-10",
      max_stops: 0,
      criteria_version: 1,
    },
  });
  assertEquals(fp1 !== fpDest, true);

  // Mutating max_stops changes fingerprint
  const fpStops = buildConditionFingerprint({
    watchId: "w1",
    targetPrice: 2000000,
    criteria: {
      origin_code: "HAN",
      destination_code: "SGN",
      date_from: "2026-11-01",
      date_to: "2026-11-05",
      return_date: "2026-11-10",
      max_stops: 1,
      criteria_version: 1,
    },
  });
  assertEquals(fp1 !== fpStops, true);

  // Mutating return_date changes fingerprint
  const fpReturn = buildConditionFingerprint({
    watchId: "w1",
    targetPrice: 2000000,
    criteria: {
      origin_code: "HAN",
      destination_code: "SGN",
      date_from: "2026-11-01",
      date_to: "2026-11-05",
      return_date: "2026-11-12",
      max_stops: 0,
      criteria_version: 1,
    },
  });
  assertEquals(fp1 !== fpReturn, true);

  // Mutating cabin changes fingerprint (D07, S06)
  const fpCabin = buildConditionFingerprint({
    watchId: "w1",
    targetPrice: 2000000,
    criteria: {
      origin_code: "HAN",
      destination_code: "SGN",
      date_from: "2026-11-01",
      date_to: "2026-11-05",
      return_date: "2026-11-10",
      max_stops: 0,
      criteria_version: 1,
      cabin: "business",
    },
  });
  assertEquals(fp1 !== fpCabin, true);

  // Mutating trip_type changes fingerprint
  const fpTripType = buildConditionFingerprint({
    watchId: "w1",
    targetPrice: 2000000,
    criteria: {
      origin_code: "HAN",
      destination_code: "SGN",
      date_from: "2026-11-01",
      date_to: "2026-11-05",
      return_date: "2026-11-10",
      max_stops: 0,
      criteria_version: 1,
      trip_type: "roundtrip",
    },
  });
  assertEquals(fp1 !== fpTripType, true);

  // Mutating passengers changes fingerprint
  const fpPassengers = buildConditionFingerprint({
    watchId: "w1",
    targetPrice: 2000000,
    criteria: {
      origin_code: "HAN",
      destination_code: "SGN",
      date_from: "2026-11-01",
      date_to: "2026-11-05",
      return_date: "2026-11-10",
      max_stops: 0,
      criteria_version: 1,
      passengers: 2,
    },
  });
  assertEquals(fp1 !== fpPassengers, true);
});

Deno.test("RC-15: Criteria mutation triggers distinct episode lifecycle", () => {
  const watchId = "w-mut-1";
  const criteria1 = {
    origin_code: "HAN",
    destination_code: "SGN",
    date_from: "2026-11-01",
    max_stops: 0,
  };

  // Step 1: Active episode entered under criteria 1
  const step1 = evaluateWatchCondition({
    watchId,
    targetPrice: 2000000,
    observedPrice: 1800000,
    activeEpisode: null,
    criteria: criteria1,
  });
  assertEquals(step1.nextEpisode?.state, "ENTERED");
  assertEquals(step1.shouldAlert, true);
  const fp1 = step1.nextEpisode?.condition_fingerprint;

  // Step 2: User mutates criteria to DAD (with same target price 2000000)
  const criteria2 = {
    origin_code: "HAN",
    destination_code: "DAD",
    date_from: "2026-11-01",
    max_stops: 0,
  };

  // Observation matches new criteria -> starts fresh ENTERED episode with distinct fingerprint
  const step2 = evaluateWatchCondition({
    watchId,
    targetPrice: 2000000,
    observedPrice: 1700000,
    activeEpisode: step1.nextEpisode,
    criteria: criteria2,
  });
  assertEquals(step2.nextEpisode?.state, "ENTERED");
  assertEquals(step2.shouldAlert, true);
  assertEquals(step2.nextEpisode?.condition_fingerprint !== fp1, true);

  // Step 3: If candidate does not match mutated criteria, old active episode is cleanly EXITED
  const criteria3 = {
    origin_code: "HAN",
    destination_code: "PQC",
    date_from: "2026-11-01",
  };
  const step3 = evaluateWatchCondition({
    watchId,
    targetPrice: 2000000,
    observedPrice: 2500000,
    conditionInput: "CONFIRMED_NON_MATCH",
    activeEpisode: step2.nextEpisode,
    criteria: criteria3,
  });
  assertEquals(step3.nextEpisode?.state, "EXITED");
  assertEquals(step3.stateChanged, true);
});

