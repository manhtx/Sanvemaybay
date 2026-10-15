import { describe, it, expect } from "vitest";
import {
  evaluateBuyWaitGuidance,
  PricePoint,
} from "./buyWaitGuidance";

function generateSyntheticHistory(count: number, spanDays: number, basePrice: number): PricePoint[] {
  const points: PricePoint[] = [];
  const now = new Date("2026-10-01T00:00:00Z").getTime();
  const stepMs = (spanDays * 24 * 60 * 60 * 1000) / count;

  for (let i = 0; i < count; i++) {
    const d = new Date(now + i * stepMs).toISOString().split("T")[0];
    const price = basePrice + (i % 5) * 100_000;
    points.push({ date: d, price });
  }
  return points;
}

describe("Trust-Calibrated Buy/Wait Guidance (F36)", () => {
  describe("Fail-closed on insufficient data", () => {
    it("returns INSUFFICIENT_DATA when sample points < 14", () => {
      const history = generateSyntheticHistory(10, 10, 2_000_000); // Only 10 points
      const result = evaluateBuyWaitGuidance({
        currentPrice: 2_000_000,
        priceHistory: history,
        departureDate: "2026-11-15",
      });

      expect(result.recommendation).toBe("INSUFFICIENT_DATA");
      expect(result.isCalibrated).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.rationaleVi).toContain("Chưa đủ dữ liệu");
    });

    it("returns INSUFFICIENT_DATA when timespan < 7 days even if point count is 14", () => {
      const history = generateSyntheticHistory(14, 3, 2_000_000); // 14 points over only 3 days
      const result = evaluateBuyWaitGuidance({
        currentPrice: 2_000_000,
        priceHistory: history,
        departureDate: "2026-11-15",
      });

      expect(result.recommendation).toBe("INSUFFICIENT_DATA");
      expect(result.isCalibrated).toBe(false);
    });

    it("returns INSUFFICIENT_DATA for negative or non-finite current price", () => {
      const history = generateSyntheticHistory(20, 20, 2_000_000);
      const result = evaluateBuyWaitGuidance({
        currentPrice: -100,
        priceHistory: history,
        departureDate: "2026-11-15",
      });

      expect(result.recommendation).toBe("INSUFFICIENT_DATA");
    });
  });

  describe("Calibrated Buy Now vs Wait and Watch", () => {
    it("advises BUY_NOW when price is in lowest 5th percentile of historical cohort", () => {
      // 20 points over 20 days with prices 2,000,000 to 3,000,000
      const history: PricePoint[] = [];
      const baseDate = new Date("2026-09-01T00:00:00Z").getTime();
      for (let i = 0; i < 20; i++) {
        const d = new Date(baseDate + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        history.push({ date: d, price: 2_200_000 + i * 50_000 });
      }

      const result = evaluateBuyWaitGuidance({
        currentPrice: 2_000_000, // lower than all history (0th percentile)
        priceHistory: history,
        departureDate: "2026-11-15",
        evaluationDate: "2026-09-25",
      });

      expect(result.recommendation).toBe("BUY_NOW");
      expect(result.isCalibrated).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.rationaleVi).toContain("top 5% thấp nhất");
    });

    it("advises BUY_NOW when departure is within 7 days and price is reasonable", () => {
      const history = generateSyntheticHistory(20, 20, 2_000_000);
      const result = evaluateBuyWaitGuidance({
        currentPrice: 2_100_000,
        priceHistory: history,
        departureDate: "2026-09-28", // 3 days after evaluationDate
        evaluationDate: "2026-09-25",
      });

      expect(result.recommendation).toBe("BUY_NOW");
      expect(result.isCalibrated).toBe(true);
      expect(result.rationaleVi).toContain("khởi hành trong 3 ngày tới");
    });

    it("advises WAIT_AND_WATCH when price is above median and flight is > 30 days away", () => {
      const history = generateSyntheticHistory(20, 20, 2_000_000);
      const result = evaluateBuyWaitGuidance({
        currentPrice: 2_450_000, // Higher than median (2.2M)
        priceHistory: history,
        departureDate: "2026-12-01", // ~67 days away
        evaluationDate: "2026-09-25",
      });

      expect(result.recommendation).toBe("WAIT_AND_WATCH");
      expect(result.isCalibrated).toBe(true);
      expect(result.rationaleVi).toContain("cao hơn trung vị lịch sử");
    });
  });
});
