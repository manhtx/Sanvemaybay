import { describe, it, expect } from "vitest";
import {
  detectPriceAnomaly,
  calculateSampleStandardDeviation,
  hasZeroDispersion,
  MAX_COHORT_ANALYSIS_SIZE,
} from "./priceAnomaly";

describe("Price Anomaly Detection (F37)", () => {
  describe("Sparse data abstention", () => {
    it("abstains from making strong claims when sample size < 10", () => {
      const smallCohort = [2_000_000, 2_100_000, 2_050_000, 1_950_000, 2_200_000]; // 5 samples
      const result = detectPriceAnomaly({
        currentPrice: 1_200_000, // Large drop, but sample is sparse
        historicalCohortPrices: smallCohort,
      });

      expect(result.classification).toBe("SPARSE_DATA_ABSTENTION");
      expect(result.isActionableDeal).toBe(false);
      expect(result.explanationVi).toContain("chưa đủ để kết luận");
    });
  });

  describe("Data glitch detection", () => {
    const normalCohort = Array(15).fill(2_000_000).map((p, idx) => p + (idx - 7) * 50_000);

    it("flags price <= 0 as SUSPECTED_DATA_GLITCH", () => {
      const result = detectPriceAnomaly({
        currentPrice: 0,
        historicalCohortPrices: normalCohort,
      });
      expect(result.classification).toBe("SUSPECTED_DATA_GLITCH");
    });

    it("flags extreme 10x spike or <50k VND as SUSPECTED_DATA_GLITCH", () => {
      const result = detectPriceAnomaly({
        currentPrice: 25_000_000, // > 10x median of 2M
        historicalCohortPrices: normalCohort,
      });
      expect(result.classification).toBe("SUSPECTED_DATA_GLITCH");
    });
  });

  describe("Genuine statistical anomaly classification", () => {
    // 20 historical prices around 2,000,000
    const cohort = [
      1_900_000, 1_950_000, 1_980_000, 2_000_000, 2_010_000,
      2_020_000, 2_050_000, 2_080_000, 2_100_000, 2_120_000,
      1_920_000, 1_970_000, 2_000_000, 2_030_000, 2_060_000,
      2_090_000, 2_110_000, 2_150_000, 2_180_000, 2_200_000,
    ];

    it("identifies STRONG_DROP_ANOMALY when price drops significantly below MAD bounds", () => {
      const result = detectPriceAnomaly({
        currentPrice: 1_300_000, // 35% drop vs median ~2.04M
        historicalCohortPrices: cohort,
      });

      expect(result.classification).toBe("STRONG_DROP_ANOMALY");
      expect(result.isActionableDeal).toBe(true);
      expect(result.discountVsMedianPercent).toBeGreaterThanOrEqual(20);
      expect(result.modifiedZScore).toBeLessThanOrEqual(-2.5);
    });

    it("identifies NORMAL_FLUCTUATION for mild everyday price changes", () => {
      const result = detectPriceAnomaly({
        currentPrice: 2_020_000,
        historicalCohortPrices: cohort,
      });

      expect(result.classification).toBe("NORMAL_FLUCTUATION");
      expect(result.isActionableDeal).toBe(false);
    });
  });

  describe("AUD-12: Currency Independence & Zero-MAD Handling", () => {
    it("handles non-VND currencies (e.g. USD) without currency-specific 50k threshold", () => {
      // Median $100 USD
      const usdCohort = [95, 98, 100, 100, 102, 105, 98, 101, 99, 103, 97, 102];
      
      // $2 is < 5% of $100 -> SUSPECTED_DATA_GLITCH
      const glitchResult = detectPriceAnomaly({
        currentPrice: 2,
        historicalCohortPrices: usdCohort,
      });
      expect(glitchResult.classification).toBe("SUSPECTED_DATA_GLITCH");

      // $70 is 30% drop -> genuine drop anomaly in USD without tripping a 50k threshold!
      const validDropResult = detectPriceAnomaly({
        currentPrice: 70,
        historicalCohortPrices: usdCohort,
      });
      expect(validDropResult.classification).toBe("STRONG_DROP_ANOMALY");
      expect(validDropResult.isActionableDeal).toBe(true);
    });

    it("abstains from synthetic MAD dispersion when cohort has zero variance (rawMad === 0)", () => {
      // 12 identical prices of 2,000,000 VND -> MAD is 0
      const homogeneousCohort = Array(12).fill(2_000_000);

      const result = detectPriceAnomaly({
        currentPrice: 1_800_000,
        historicalCohortPrices: homogeneousCohort,
      });

      expect(result.classification).toBe("NORMAL_FLUCTUATION");
      expect(result.mad).toBe(0);
      expect(result.modifiedZScore).toBe(0);
      expect(result.isActionableDeal).toBe(false);
      expect(result.explanationVi).toContain("độ phân tán MAD = 0");
    });

    it("differentiates IDENTICAL_OFFER cohort scope from ROUTE_LEVEL baseline (AUD-04)", () => {
      const cohort = [2_000_000, 2_100_000, 1_900_000, 2_050_000, 1_950_000, 2_200_000, 2_150_000, 2_000_000, 2_050_000, 2_100_000];
      const routeResult = detectPriceAnomaly({
        currentPrice: 1_200_000,
        historicalCohortPrices: cohort,
        cohortScope: "ROUTE_LEVEL",
      });
      expect(routeResult.classification).toBe("STRONG_DROP_ANOMALY");
      expect(routeResult.cohortScope).toBe("ROUTE_LEVEL");
      expect(routeResult.explanationVi).toContain("toàn chặng");

      const offerResult = detectPriceAnomaly({
        currentPrice: 1_200_000,
        historicalCohortPrices: cohort,
        cohortScope: "IDENTICAL_OFFER",
      });
      expect(offerResult.classification).toBe("STRONG_DROP_ANOMALY");
      expect(offerResult.cohortScope).toBe("IDENTICAL_OFFER");
      expect(offerResult.explanationVi).toContain("chính chuyến bay này");
    });
  });

  describe("SOL-01: Bessel's Correction Sample Variance", () => {
    it("calculates unbiased Bessel-corrected sample standard deviation for N >= 2", () => {
      const prices = [1_000_000, 1_200_000, 1_100_000, 1_300_000, 1_400_000];
      const { mean, sampleVariance, sampleStdDev } = calculateSampleStandardDeviation(prices);
      expect(mean).toBe(1_200_000);
      expect(sampleVariance).toBe(25_000_000_000); // 100e9 / 4 = 25e9
      expect(sampleStdDev).toBeCloseTo(158113.88, 1);
    });

    it("safely handles single sample without zero division error", () => {
      const { mean, sampleVariance, sampleStdDev } = calculateSampleStandardDeviation([1_500_000]);
      expect(mean).toBe(1_500_000);
      expect(sampleVariance).toBe(0);
      expect(sampleStdDev).toBe(0);
    });

    it("sanitizes dirty cohort price arrays and guards Bessel variance", () => {
      const dirtyPrices = [1_000_000, NaN, null as any, "bad" as any, -100, 2_000_000];
      const { mean, sampleVariance, sampleStdDev } = calculateSampleStandardDeviation(dirtyPrices);
      expect(mean).toBe(1_500_000);
      expect(sampleVariance).toBe(500000000000);
      expect(sampleStdDev).toBeGreaterThan(0);

      const emptyResult = calculateSampleStandardDeviation([NaN, -1, 0]);
      expect(emptyResult.sampleVariance).toBe(0);
      expect(emptyResult.sampleStdDev).toBe(0);
    });

    it("evaluates hasZeroDispersion helper accurately for identical prices", () => {
      expect(hasZeroDispersion([1_200_000, 1_200_000, 1_200_000])).toBe(true);
      expect(hasZeroDispersion([1_200_000, 1_250_000])).toBe(false);
      expect(hasZeroDispersion([1_200_000])).toBe(true);
      expect(hasZeroDispersion([])).toBe(true);
    });

    it("caps oversized cohorts to MAX_COHORT_ANALYSIS_SIZE (250) to preserve memory and latency", () => {
      expect(MAX_COHORT_ANALYSIS_SIZE).toBe(250);
      const largeCohort = Array.from({ length: 400 }, (_, i) => 2_000_000 + (i % 50) * 10_000);
      const result = detectPriceAnomaly({
        currentPrice: 1_400_000,
        historicalCohortPrices: largeCohort,
      });
      expect(result.sampleSize).toBe(250);
      expect(result.classification).toBe("STRONG_DROP_ANOMALY");
    });
  });
});
