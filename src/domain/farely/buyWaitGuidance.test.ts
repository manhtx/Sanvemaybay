import { describe, it, expect } from "vitest";
import {
  evaluateBuyWaitGuidance,
  evaluateRollingHorizonBacktest,
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
        scopeType: "COHORT",
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
        scopeType: "COHORT",
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
        scopeType: "COHORT",
      });

      expect(result.recommendation).toBe("WAIT_AND_WATCH");
      expect(result.isCalibrated).toBe(true);
      expect(result.rationaleVi).toContain("cao hơn trung vị của nhóm vé");
    });
  });

  describe("PriceScope Strictness & Boundary Separation (AUD-04)", () => {
    it("differentiates IDENTICAL_OFFER scope from ROUTE_LEVEL baseline", () => {
      const history = generateSyntheticHistory(20, 20, 2_000_000);
      const routeResult = evaluateBuyWaitGuidance({
        currentPrice: 2_000_000,
        priceHistory: history,
        departureDate: "2026-11-15",
        evaluationDate: "2026-09-25",
        scopeType: "ROUTE_LEVEL",
      });
      expect(routeResult.scopeType).toBe("ROUTE_LEVEL");
      expect(routeResult.isCalibrated).toBe(false); // EV34-23: ROUTE_LEVEL cannot claim calibrated offer-specific probability
      expect(routeResult.rationaleVi).toContain("chặng bay");

      const offerResult = evaluateBuyWaitGuidance({
        currentPrice: 2_000_000,
        priceHistory: history,
        departureDate: "2026-11-15",
        evaluationDate: "2026-09-25",
        scopeType: "IDENTICAL_OFFER",
      });
      expect(offerResult.scopeType).toBe("IDENTICAL_OFFER");
      expect(offerResult.isCalibrated).toBe(true);
      expect(offerResult.rationaleVi).toContain("chính chuyến bay này");
    });
  });

  describe("Rolling-Horizon Out-of-Sample Backtesting (AUD-07 & AUD-11)", () => {
    it("fails closed when history has insufficient samples to construct train/test split", () => {
      const sparse = generateSyntheticHistory(15, 15, 2_000_000);
      const backtest = evaluateRollingHorizonBacktest(sparse);
      expect(backtest.isSufficientForDeployment).toBe(false);
      expect(backtest.totalEvaluated).toBe(0);
      expect(backtest.epistemicNote).toContain("không đủ để backtest");
    });

    it("evaluates rolling-horizon out-of-sample accuracy on sufficient historical series", () => {
      // 30 days of data with upward trend
      const history: PricePoint[] = [];
      const baseDate = new Date("2026-08-01T00:00:00Z").getTime();
      for (let i = 0; i < 30; i++) {
        const d = new Date(baseDate + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        // Price rises from 1.5M up to 2.5M
        history.push({ date: d, price: 1_500_000 + i * 35_000 });
      }

      const backtest = evaluateRollingHorizonBacktest(history, 7, 14);
      expect(backtest.totalEvaluated).toBeGreaterThanOrEqual(10);
      expect(backtest.accuracyRate).toBeGreaterThan(0);
      expect(backtest.backtestWindowDays).toBe(7);
      expect(typeof backtest.epistemicNote).toBe("string");
    });
  });
});
