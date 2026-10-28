import { describe, expect, it } from "vitest";
import {
  detectPriceAnomaly,
  calculateSampleStandardDeviation,
  hasZeroDispersion,
  isTetDeparture,
  MIN_ANOMALY_SAMPLE_SIZE,
  MAX_COHORT_ANALYSIS_SIZE,
} from "./priceAnomaly";

describe("Price Anomaly Detection (F37 & NEG-08 / NEG-09)", () => {
  describe("F37: Never make strong anomaly claims on insufficient sample", () => {
    it("abtains with SPARSE_DATA_ABSTENTION when historical cohort has < 10 samples", () => {
      const sparseCohort = [2_000_000, 2_100_000, 1_900_000, 2_050_000, 1_950_000]; // 5 samples
      const result = detectPriceAnomaly({
        currentPrice: 1_200_000,
        historicalCohortPrices: sparseCohort,
      });

      expect(result.classification).toBe("SPARSE_DATA_ABSTENTION");
      expect(result.sampleSize).toBe(5);
      expect(result.isActionableDeal).toBe(false);
      expect(result.explanationVi).toContain("chưa đủ để kết luận bất thường giá");
    });

    it("abtains when cohort has 0 valid samples", () => {
      const result = detectPriceAnomaly({
        currentPrice: 1_500_000,
        historicalCohortPrices: [],
      });
      expect(result.classification).toBe("SPARSE_DATA_ABSTENTION");
      expect(result.sampleSize).toBe(0);
      expect(result.isActionableDeal).toBe(false);
    });

    it("treats negative, zero, and non-finite current price as SUSPECTED_DATA_GLITCH", () => {
      expect(
        detectPriceAnomaly({ currentPrice: 0, historicalCohortPrices: [1_000_000] })
          .classification
      ).toBe("SUSPECTED_DATA_GLITCH");
      expect(
        detectPriceAnomaly({ currentPrice: -500_000, historicalCohortPrices: [1_000_000] })
          .classification
      ).toBe("SUSPECTED_DATA_GLITCH");
      expect(
        detectPriceAnomaly({ currentPrice: NaN, historicalCohortPrices: [1_000_000] })
          .classification
      ).toBe("SUSPECTED_DATA_GLITCH");
    });
  });

  describe("Glitch Detection: Extreme deviations vs Median", () => {
    const valid10Cohort = [
      2_000_000, 2_100_000, 1_900_000, 2_050_000, 1_950_000,
      2_200_000, 2_150_000, 2_000_000, 2_050_000, 2_100_000,
    ]; // Median = 2,050,000

    it("flags suspiciously low price (< 5% of median) as SUSPECTED_DATA_GLITCH", () => {
      // 50,000 is < 5% of 2,050,000 (~102,500)
      const result = detectPriceAnomaly({
        currentPrice: 50_000,
        historicalCohortPrices: valid10Cohort,
      });
      expect(result.classification).toBe("SUSPECTED_DATA_GLITCH");
      expect(result.isActionableDeal).toBe(false);
      expect(result.explanationVi).toContain("lỗi dữ liệu");
    });

    it("flags suspiciously high price (> 10x median) as SUSPECTED_DATA_GLITCH", () => {
      // 25,000,000 is > 10x 2,050,000 (20.5M)
      const result = detectPriceAnomaly({
        currentPrice: 25_000_000,
        historicalCohortPrices: valid10Cohort,
      });
      expect(result.classification).toBe("SUSPECTED_DATA_GLITCH");
      expect(result.isActionableDeal).toBe(false);
    });
  });

  describe("AUD-12: Zero-Dispersion Cohort Handling", () => {
    const zeroDispersionCohort = [
      1_500_000, 1_500_000, 1_500_000, 1_500_000, 1_500_000,
      1_500_000, 1_500_000, 1_500_000, 1_500_000, 1_500_000,
    ]; // 10 samples, all identical -> MAD = 0

    it("abstains from synthetic anomaly when price drop occurs on zero-dispersion data (EV-22)", () => {
      // Price is 1,000,000 (33% drop), but MAD is 0 -> INSUFFICIENT_DISPERSION_ABSTENTION
      const result = detectPriceAnomaly({
        currentPrice: 1_000_000,
        historicalCohortPrices: zeroDispersionCohort,
      });
      expect(result.classification).toBe("INSUFFICIENT_DISPERSION_ABSTENTION");
      expect(result.isActionableDeal).toBe(false);
      expect(result.mad).toBe(0);
      expect(result.modifiedZScore).toBe(0);
      expect(result.explanationVi).toContain("MAD = 0");
    });

    it("classifies mild deviation on zero-dispersion data as NORMAL_FLUCTUATION", () => {
      // Price is 1,400,000 (6.7% difference, < 25%)
      const result = detectPriceAnomaly({
        currentPrice: 1_400_000,
        historicalCohortPrices: zeroDispersionCohort,
      });
      expect(result.classification).toBe("NORMAL_FLUCTUATION");
      expect(result.isActionableDeal).toBe(false);
      expect(result.mad).toBe(0);
    });
  });

  describe("Genuine Drop Anomaly Detection (MAD Statistics)", () => {
    // Median = 2,050,000, MAD = 50,000
    const diverseCohort = [
      2_000_000, 2_100_000, 1_900_000, 2_050_000, 1_950_000,
      2_200_000, 2_150_000, 2_000_000, 2_050_000, 2_100_000,
    ];

    it("detects STRONG_DROP_ANOMALY when price drops significantly with z-score <= -2.5 and discount >= 20%", () => {
      // 1,200,000: diff = -850,000. Modified Z = 0.6745 * -850k / 50k = -11.46. Discount = 41%
      const result = detectPriceAnomaly({
        currentPrice: 1_200_000,
        historicalCohortPrices: diverseCohort,
      });
      expect(result.classification).toBe("STRONG_DROP_ANOMALY");
      expect(result.isActionableDeal).toBe(true);
      expect(result.discountVsMedianPercent).toBeGreaterThanOrEqual(20);
      expect(result.modifiedZScore).toBeLessThanOrEqual(-2.5);
      expect(result.explanationVi).toContain("đột biến mạnh");
    });

    it("detects MODERATE_DROP_ANOMALY when price drops moderately (z-score <= -1.5, discount >= 10%)", () => {
      // 1,750,000: diff = -300,000. Modified Z = 0.6745 * -300k / 50k = -4.05. Discount = 15%
      const result = detectPriceAnomaly({
        currentPrice: 1_750_000,
        historicalCohortPrices: diverseCohort,
      });
      expect(result.classification).toBe("MODERATE_DROP_ANOMALY");
      expect(result.isActionableDeal).toBe(true);
      expect(result.discountVsMedianPercent).toBeGreaterThanOrEqual(10);
      expect(result.explanationVi).toContain("thấp hơn mức thông thường");
    });

    it("classifies standard market fare as NORMAL_FLUCTUATION", () => {
      // 2,000,000: close to median (2,050,000)
      const result = detectPriceAnomaly({
        currentPrice: 2_000_000,
        historicalCohortPrices: diverseCohort,
      });
      expect(result.classification).toBe("NORMAL_FLUCTUATION");
      expect(result.isActionableDeal).toBe(false);
    });

    it("respects cohortScope differentiation (AUD-04)", () => {
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

  describe("SOL-PRICEANOMALY-01: NEG-08 Baseline Independence Defense", () => {
    it("excludes candidate currentPrice from historical baseline when requested (NEG-08)", () => {
      const cohortWithCurrent = [
        1_200_000, // current candidate fare was mistakenly appended
        2_000_000, 2_100_000, 1_900_000, 2_050_000, 1_950_000,
        2_200_000, 2_150_000, 2_000_000, 2_050_000, 2_100_000,
      ]; // 11 items

      const result = detectPriceAnomaly({
        currentPrice: 1_200_000,
        historicalCohortPrices: cohortWithCurrent,
        excludeCurrentPriceFromBaseline: true,
      });

      expect(result.sampleSize).toBe(10); // 11 - 1 = 10
      expect(result.classification).toBe("STRONG_DROP_ANOMALY");
    });

    it("abstains with SPARSE_DATA_ABSTENTION if excluding candidate drops sample below 10 (NEG-08/NEG-09)", () => {
      const cohort10WithCurrent = [
        1_200_000, // candidate
        2_000_000, 2_100_000, 1_900_000, 2_050_000, 1_950_000,
        2_200_000, 2_150_000, 2_000_000, 2_050_000,
      ]; // Exactly 10 items

      const result = detectPriceAnomaly({
        currentPrice: 1_200_000,
        historicalCohortPrices: cohort10WithCurrent,
        excludeCurrentPriceFromBaseline: true,
      });

      // Post-exclusion count is 9 < 10 -> MUST abstain!
      expect(result.sampleSize).toBe(9);
      expect(result.classification).toBe("SPARSE_DATA_ABSTENTION");
      expect(result.isActionableDeal).toBe(false);
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

  describe("WP02: isTetDeparture date normalization & separator robustness", () => {
    it("recognizes standard ISO Tet date", () => {
      expect(isTetDeparture("2026-02-15")).toBe(true);
      expect(isTetDeparture("2026-07-20")).toBe(false);
    });

    it("normalizes slash and dot separators", () => {
      expect(isTetDeparture("2026/02/15")).toBe(true);
      expect(isTetDeparture("2026.02.15")).toBe(true);
      expect(isTetDeparture("2026 / 02 / 15")).toBe(true);
    });

    it("handles inverted DD-MM-YYYY formats", () => {
      expect(isTetDeparture("15-02-2026")).toBe(true);
      expect(isTetDeparture("15/02/2026")).toBe(true);
    });

    it("safely handles non-string and undefined inputs", () => {
      expect(isTetDeparture(undefined)).toBe(false);
      expect(isTetDeparture("" as any)).toBe(false);
      expect(isTetDeparture(null as any)).toBe(false);
      expect(isTetDeparture(12345 as any)).toBe(false);
    });

    it("enriches explanationVi with Tet high-demand caveat when drop occurs during Tet (L04/L06)", () => {
      const cohort = [
        2_000_000, 2_100_000, 1_900_000, 2_050_000, 1_950_000,
        2_200_000, 2_150_000, 2_000_000, 2_050_000, 2_100_000,
      ];
      const result = detectPriceAnomaly({
        currentPrice: 1_200_000,
        historicalCohortPrices: cohort,
        departureDate: "2026-02-15", // Peak Tet window
      });

      expect(result.classification).toBe("STRONG_DROP_ANOMALY");
      expect(result.explanationVi).toContain("Cao điểm Tết");
    });
  });
});
