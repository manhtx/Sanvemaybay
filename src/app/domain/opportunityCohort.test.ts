import { describe, expect, it } from "vitest";
import {
  evaluateCohortComparison,
  extractCohortCriteria,
  buildCohortKey,
  computeDurationDays,
  ObservationData
} from "./opportunityCohort";

describe("Farely Pure Domain — Comparable Cohort Intelligence (REQ-DOM-004, NC-014)", () => {
  const currentObs: ObservationData = {
    id: "obs-1",
    originCode: "HAN",
    destinationCode: "BKK",
    departDate: "2026-10-19",
    returnDate: "2026-10-23",
    price: 4_500_000,
    stops: 0,
    airlineCode: "VJ",
    observedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    scanRunId: "scan-3",
  };

  it("extracts correct cohort criteria and builds structured cohort key", () => {
    const criteria = extractCohortCriteria(currentObs);
    expect(criteria).toEqual({
      originCode: "HAN",
      destinationCode: "BKK",
      tripType: "roundtrip",
      departMonth: "2026-10",
      stopsClass: "direct",
      durationDaysBucket: "short"
    });

    const key = buildCohortKey(criteria);
    expect(key).toBe("HAN:BKK:roundtrip:2026-10:direct:short");
  });

  it("computes duration and buckets round-trip lengths (short <=4d, medium 5-8d, long >8d)", () => {
    expect(computeDurationDays("2026-10-01", "2026-10-05")).toBe(4);
    expect(computeDurationDays("2026-10-01", "2026-10-08")).toBe(7);
    expect(computeDurationDays("2026-10-01", "2026-10-15")).toBe(14);
    expect(computeDurationDays("2026-10-01", null)).toBeUndefined();
    expect(computeDurationDays("2026-10-05", "2026-10-01")).toBeUndefined(); // backwards date

    const shortCriteria = extractCohortCriteria({ ...currentObs, departDate: "2026-10-01", returnDate: "2026-10-05" });
    expect(shortCriteria.durationDaysBucket).toBe("short");

    const medCriteria = extractCohortCriteria({ ...currentObs, departDate: "2026-10-01", returnDate: "2026-10-08" });
    expect(medCriteria.durationDaysBucket).toBe("medium");

    const longCriteria = extractCohortCriteria({ ...currentObs, departDate: "2026-10-01", returnDate: "2026-10-15" });
    expect(longCriteria.durationDaysBucket).toBe("long");
  });

  it("isolates one-way flights with undefined duration bucket and oneway tripType", () => {
    const onewayObs: ObservationData = {
      ...currentObs,
      returnDate: null
    };

    const criteria = extractCohortCriteria(onewayObs);
    expect(criteria.tripType).toBe("oneway");
    expect(criteria.durationDaysBucket).toBeUndefined();

    const key = buildCohortKey(criteria);
    expect(key).toBe("HAN:BKK:oneway:2026-10:direct");
  });

  it("NC-014 Negative Control: refuses comparison claims when sample size < 5", () => {
    const sparseCohort: ObservationData[] = [
      currentObs,
      { ...currentObs, id: "c1", price: 5_000_000 },
      { ...currentObs, id: "c2", price: 5_200_000 },
      { ...currentObs, id: "c3", price: 4_800_000 }
    ]; // 4 observations

    const result = evaluateCohortComparison(currentObs, sparseCohort);
    expect(result.sampleSize).toBe(4);
    expect(result.cohortMedian).toBeNull();
    expect(result.deltaPercent).toBeNull();
    expect(result.isSufficient).toBe(false);
    expect(result.isDiscounted).toBe(false);
    expect(result.comparisonExplanation).toContain("Chưa đủ dữ liệu đối sánh");
    expect(result.evidence.tier).toBe("ACCUMULATING");
    expect(result.evidence.label).toBe("ĐANG TÍCH LŨY BẰNG CHỨNG");
  });

  it("calculates accurate median across odd and even sample sizes", () => {
    // 5 observations (odd): [5M, 5.2M, 5.5M, 5.8M, 6.0M] -> median is 5.5M
    const oddCohort: ObservationData[] = [
      { ...currentObs, id: "c1", price: 5_000_000, scanRunId: "s1" },
      { ...currentObs, id: "c2", price: 5_200_000, scanRunId: "s1" },
      { ...currentObs, id: "c3", price: 5_500_000, scanRunId: "s2" },
      { ...currentObs, id: "c4", price: 5_800_000, scanRunId: "s2" },
      { ...currentObs, id: "c5", price: 6_000_000, scanRunId: "s3" }
    ];

    const oddResult = evaluateCohortComparison(currentObs, oddCohort);
    expect(oddResult.cohortMedian).toBe(5_500_000);

    // 6 observations (even): [5M, 5.2M, 5.4M, 5.6M, 5.8M, 6.0M] -> median is (5.4M + 5.6M)/2 = 5.5M
    const evenCohort: ObservationData[] = [
      { ...currentObs, id: "c1", price: 5_000_000, scanRunId: "s1" },
      { ...currentObs, id: "c2", price: 5_200_000, scanRunId: "s1" },
      { ...currentObs, id: "c3", price: 5_400_000, scanRunId: "s2" },
      { ...currentObs, id: "c4", price: 5_600_000, scanRunId: "s2" },
      { ...currentObs, id: "c5", price: 5_800_000, scanRunId: "s3" },
      { ...currentObs, id: "c6", price: 6_000_000, scanRunId: "s3" }
    ];

    const evenResult = evaluateCohortComparison(currentObs, evenCohort);
    expect(evenResult.cohortMedian).toBe(5_500_000);
  });

  it("qualifies isDiscounted: true only when price drop is at least 15%", () => {
    // Median: 6,000,000
    const cohort: ObservationData[] = Array.from({ length: 5 }, (_, i) => ({
      ...currentObs,
      id: `c_${i}`,
      price: 6_000_000,
      scanRunId: `s_${i % 2}`
    }));

    // Current price 5,160,000 -> (6M - 5.16M) / 6M = 14% -> isDiscounted: false
    const res14 = evaluateCohortComparison({ ...currentObs, price: 5_160_000 }, cohort);
    expect(res14.deltaPercent).toBe(14);
    expect(res14.isDiscounted).toBe(false);

    // Current price 5,100,000 -> (6M - 5.1M) / 6M = 15% -> isDiscounted: true
    const res15 = evaluateCohortComparison({ ...currentObs, price: 5_100_000 }, cohort);
    expect(res15.deltaPercent).toBe(15);
    expect(res15.isDiscounted).toBe(true);
  });

  it("evaluates STRONG evidence tier (sample >= 12, epochs >= 3, freshness <= 180m)", () => {
    const fixedNow = new Date("2026-10-19T12:00:00Z").getTime();
    const cohort: ObservationData[] = Array.from({ length: 14 }, (_, i) => ({
      ...currentObs,
      id: `c_${i}`,
      price: 5_500_000 + i * 50_000,
      scanRunId: `scan-${(i % 4) + 1}`,
      observedAt: new Date(fixedNow - (i * 10 + 20) * 60 * 1000).toISOString()
    }));

    const result = evaluateCohortComparison(
      { ...currentObs, observedAt: new Date(fixedNow - 30 * 60 * 1000).toISOString() },
      cohort,
      fixedNow
    );

    expect(result.evidence.tier).toBe("STRONG");
    expect(result.evidence.label).toBe("BẰNG CHỨNG MẠNH");
    expect(result.evidence.scanEpochCount).toBe(4);
    expect(result.evidence.freshnessMinutes).toBe(30);
  });

  it("evaluates MODERATE evidence tier (sample >= 5, epochs >= 2)", () => {
    const fixedNow = new Date("2026-10-19T12:00:00Z").getTime();
    const cohort: ObservationData[] = Array.from({ length: 6 }, (_, i) => ({
      ...currentObs,
      id: `c_${i}`,
      price: 5_500_000,
      scanRunId: `scan-${(i % 2) + 1}`, // 2 epochs
      observedAt: new Date(fixedNow - 60 * 60 * 1000).toISOString()
    }));

    const result = evaluateCohortComparison(currentObs, cohort, fixedNow);
    expect(result.evidence.tier).toBe("MODERATE");
    expect(result.evidence.label).toBe("BẰNG CHỨNG VỪA");
  });

  it("generates truthful Vietnamese copy for discount, equal, and premium price deltas", () => {
    const cohort: ObservationData[] = Array.from({ length: 5 }, (_, i) => ({
      ...currentObs,
      id: `c_${i}`,
      price: 5_000_000,
      scanRunId: `s_${i % 2}`
    }));

    // Cheaper than median (4M vs 5M -> 20% cheaper)
    const cheaper = evaluateCohortComparison({ ...currentObs, price: 4_000_000 }, cohort);
    expect(cheaper.comparisonExplanation).toBe("20% thấp hơn median của 5 mức giá tương đương Farely đã quan sát.");

    // Equal to median (5M vs 5M -> 0%)
    const equal = evaluateCohortComparison({ ...currentObs, price: 5_000_000 }, cohort);
    expect(equal.comparisonExplanation).toBe("Bằng mức giá median của 5 mức giá tương đương Farely đã quan sát.");

    // Higher than median (6M vs 5M -> 20% higher)
    const higher = evaluateCohortComparison({ ...currentObs, price: 6_000_000 }, cohort);
    expect(higher.comparisonExplanation).toBe("20% cao hơn median của 5 mức giá tương đương (5 quan sát).");
  });

  it("calculates exact median across odd and even observation sample counts", () => {
    // Odd count: 5 observations [3M, 4M, 5M, 6M, 7M] -> median is 5M
    const oddCohort: ObservationData[] = [3, 4, 5, 6, 7].map((p, i) => ({
      ...currentObs,
      id: `odd_${i}`,
      price: p * 1_000_000
    }));
    const oddResult = evaluateCohortComparison(currentObs, oddCohort);
    expect(oddResult.cohortMedian).toBe(5_000_000);

    // Even count: 6 observations [3M, 4M, 5M, 6M, 7M, 8M] (sample >= 5) -> median is (5M + 6M) / 2 = 5.5M
    const evenCohort: ObservationData[] = [3, 4, 5, 6, 7, 8].map((p, i) => ({
      ...currentObs,
      id: `even_${i}`,
      price: p * 1_000_000
    }));
    const evenResult = evaluateCohortComparison(currentObs, evenCohort);
    expect(evenResult.cohortMedian).toBe(5_500_000);
  });

  it("evaluates large observation cohorts (500+ items) efficiently in sub-50ms", () => {
    const largeCohort: ObservationData[] = Array.from({ length: 500 }, (_, i) => ({
      ...currentObs,
      id: `cohort_perf_${i}`,
      price: 3_000_000 + (i % 50) * 50_000,
      scanRunId: `scan_${i % 10}`
    }));

    const start = performance.now();
    const result = evaluateCohortComparison(currentObs, largeCohort);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50);
    expect(result.isSufficient).toBe(true);
    expect(result.sampleSize).toBe(500);
    expect(result.cohortMedian).toBeGreaterThan(0);
  });

  it("preserves pure immutability on Object.freeze protected observation inputs", () => {
    const frozenCurrent = Object.freeze({ ...currentObs });
    const frozenCohort = Object.freeze(
      Array.from({ length: 5 }, (_, i) => Object.freeze({ ...currentObs, id: `f_${i}`, price: 4_000_000 + i * 100_000 }))
    );

    expect(() => evaluateCohortComparison(frozenCurrent, frozenCohort as any)).not.toThrow();
    expect(frozenCurrent.price).toBe(4_500_000);
  });

  it("handles duration computation boundary edge cases and invalid date strings", () => {
    expect(computeDurationDays("invalid-date", "2026-10-10")).toBeUndefined();
    expect(computeDurationDays("2026-10-10", "invalid-date")).toBeUndefined();
    expect(computeDurationDays("2026-10-10", "")).toBeUndefined();
    expect(computeDurationDays("2026-10-10", "2026-10-10")).toBe(0);

    const sameDayCriteria = extractCohortCriteria({ ...currentObs, departDate: "2026-10-10", returnDate: "2026-10-10" });
    expect(sameDayCriteria.durationDaysBucket).toBe("short");

    const fiveDayCriteria = extractCohortCriteria({ ...currentObs, departDate: "2026-10-01", returnDate: "2026-10-06" });
    expect(fiveDayCriteria.durationDaysBucket).toBe("medium");

    const eightDayCriteria = extractCohortCriteria({ ...currentObs, departDate: "2026-10-01", returnDate: "2026-10-09" });
    expect(eightDayCriteria.durationDaysBucket).toBe("medium");

    const nineDayCriteria = extractCohortCriteria({ ...currentObs, departDate: "2026-10-01", returnDate: "2026-10-10" });
    expect(nineDayCriteria.durationDaysBucket).toBe("long");
  });

  it("stopsClass cohort isolation: direct vs connecting flights never contaminate each other", () => {
    const directCriteria = extractCohortCriteria({ ...currentObs, stops: 0 });
    expect(directCriteria.stopsClass).toBe("direct");

    const connectingCriteria = extractCohortCriteria({ ...currentObs, stops: 1 });
    expect(connectingCriteria.stopsClass).toBe("connecting");

    // Cohort consisting solely of connecting flights evaluated against a direct flight
    const connectingCohort: ObservationData[] = Array.from({ length: 6 }, (_, i) => ({
      ...currentObs,
      id: `conn_${i}`,
      stops: 1,
      price: 2_000_000 // cheap connecting flight should not dilute direct flight cohort
    }));

    const result = evaluateCohortComparison(currentObs, connectingCohort);
    expect(result.sampleSize).toBe(0);
    expect(result.isSufficient).toBe(false);
    expect(result.cohortMedian).toBeNull();
  });

  it("strict cohort filtering: rejects observations with mismatched route, month, or trip type", () => {
    const mixedCohort: ObservationData[] = [
      { ...currentObs, id: "diff_origin", originCode: "SGN" },
      { ...currentObs, id: "diff_dest", destinationCode: "SIN" },
      { ...currentObs, id: "diff_month", departDate: "2026-11-19" },
      { ...currentObs, id: "diff_trip", returnDate: null } // oneway vs roundtrip
    ];

    const result = evaluateCohortComparison(currentObs, mixedCohort);
    expect(result.sampleSize).toBe(0);
    expect(result.isSufficient).toBe(false);
  });

  it("cleanses invalid prices: non-positive, NaN, and Infinity are excluded from cohort", () => {
    const dirtyCohort: ObservationData[] = [
      ...Array.from({ length: 4 }, (_, i) => ({ ...currentObs, id: `valid_${i}`, price: 5_000_000, scanRunId: `s_${i}` })),
      { ...currentObs, id: "bad_zero", price: 0 },
      { ...currentObs, id: "bad_neg", price: -100_000 },
      { ...currentObs, id: "bad_nan", price: NaN },
      { ...currentObs, id: "bad_inf", price: Infinity }
    ];

    // Only 4 valid observations remain, which is < 5 -> insufficient
    const result = evaluateCohortComparison(currentObs, dirtyCohort);
    expect(result.sampleSize).toBe(4);
    expect(result.isSufficient).toBe(false);
    expect(result.cohortMedian).toBeNull();
  });

  it("scan epoch fallback: calculates distinct epochs from observedAt date when scanRunId is absent", () => {
    const fixedNow = new Date("2026-10-19T12:00:00Z").getTime();
    const cohortWithoutRunId: ObservationData[] = [
      { ...currentObs, id: "e1", scanRunId: undefined, observedAt: "2026-10-17T08:00:00Z" },
      { ...currentObs, id: "e2", scanRunId: undefined, observedAt: "2026-10-17T12:00:00Z" },
      { ...currentObs, id: "e3", scanRunId: undefined, observedAt: "2026-10-18T09:00:00Z" },
      { ...currentObs, id: "e4", scanRunId: undefined, observedAt: "2026-10-18T18:00:00Z" },
      { ...currentObs, id: "e5", scanRunId: undefined, observedAt: "2026-10-19T06:00:00Z" }
    ];

    const result = evaluateCohortComparison(currentObs, cohortWithoutRunId, fixedNow);
    expect(result.sampleSize).toBe(5);
    expect(result.evidence.scanEpochCount).toBe(3); // 2026-10-17, 2026-10-18, 2026-10-19
    expect(result.evidence.tier).toBe("MODERATE");
  });

  it("evidence tier boundaries: degrades to MODERATE when freshness > 180m or sample < 12", () => {
    const fixedNow = new Date("2026-10-19T12:00:00Z").getTime();
    // 14 samples, 4 epochs, but 181 minutes old -> exceeds 180m freshness threshold
    const cohortStale: ObservationData[] = Array.from({ length: 14 }, (_, i) => ({
      ...currentObs,
      id: `s_${i}`,
      scanRunId: `scan_${i % 4}`,
      observedAt: new Date(fixedNow - 181 * 60 * 1000).toISOString()
    }));

    const resultStale = evaluateCohortComparison(
      { ...currentObs, observedAt: new Date(fixedNow - 181 * 60 * 1000).toISOString() },
      cohortStale,
      fixedNow
    );
    expect(resultStale.evidence.freshnessMinutes).toBe(181);
    expect(resultStale.evidence.tier).toBe("MODERATE"); // Degraded from STRONG due to freshness > 180m

    // 11 samples (less than 12) with fresh observations (30m) and 3 epochs
    const cohortSmall: ObservationData[] = Array.from({ length: 11 }, (_, i) => ({
      ...currentObs,
      id: `sm_${i}`,
      scanRunId: `scan_${i % 3}`,
      observedAt: new Date(fixedNow - 30 * 60 * 1000).toISOString()
    }));

    const resultSmall = evaluateCohortComparison(
      { ...currentObs, observedAt: new Date(fixedNow - 30 * 60 * 1000).toISOString() },
      cohortSmall,
      fixedNow
    );
    expect(resultSmall.evidence.tier).toBe("MODERATE"); // Degraded from STRONG due to sample < 12
  });

  it("formats freshness strings across sub-minute, minute, and multi-hour intervals", () => {
    const fixedNow = new Date("2026-10-19T12:00:00Z").getTime();
    const cohort: ObservationData[] = Array.from({ length: 5 }, (_, i) => ({
      ...currentObs,
      id: `c_${i}`,
      scanRunId: `s_${i % 2}`
    }));

    // Freshness < 1 min -> "vừa xong"
    const fresh0 = evaluateCohortComparison(
      { ...currentObs, observedAt: new Date(fixedNow - 20 * 1000).toISOString() },
      cohort,
      fixedNow
    );
    expect(fresh0.evidence.summaryText).toContain("vừa xong");

    // Freshness 45 min -> "45 phút trước"
    const fresh45 = evaluateCohortComparison(
      { ...currentObs, observedAt: new Date(fixedNow - 45 * 60 * 1000).toISOString() },
      cohort,
      fixedNow
    );
    expect(fresh45.evidence.summaryText).toContain("45 phút trước");

    // Freshness 120 min -> "2 giờ trước"
    const fresh120 = evaluateCohortComparison(
      { ...currentObs, observedAt: new Date(fixedNow - 120 * 60 * 1000).toISOString() },
      cohort,
      fixedNow
    );
    expect(fresh120.evidence.summaryText).toContain("2 giờ trước");
  });

  it("benchmark: 2,500 cohort evaluations execute in sub-50ms", () => {
    const cohort: ObservationData[] = Array.from({ length: 6 }, (_, i) => ({
      ...currentObs,
      id: `c_${i}`,
      price: 5_000_000 + i * 50_000,
      scanRunId: `s_${i % 2}`
    }));

    const start = performance.now();
    for (let i = 0; i < 2_500; i++) {
      evaluateCohortComparison(currentObs, cohort);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
