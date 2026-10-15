import { describe, it, expect } from "vitest";
import {
  detectPriceAnomaly,
  MIN_ANOMALY_SAMPLE_SIZE,
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
});
