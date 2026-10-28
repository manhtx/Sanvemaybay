import { describe, it, expect } from "vitest";
import {
  evaluateBuyWaitGuidance,
  evaluateRollingHorizonBacktest,
  computeCohortVolatility,
  MAX_BUY_WAIT_HISTORY_POINTS,
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

  describe("Temporal & Volatility Defenses", () => {
    it("fails closed when departureDate is in the past", () => {
      const history = generateSyntheticHistory(20, 20, 2_000_000);
      const result = evaluateBuyWaitGuidance({
        currentPrice: 2_000_000,
        priceHistory: history,
        departureDate: "2026-09-01", // Past relative to evaluationDate
        evaluationDate: "2026-09-25",
      });

      expect(result.recommendation).toBe("INSUFFICIENT_DATA");
      expect(result.rationaleVi).toContain("Chuyến bay đã khởi hành");
    });

    it("advises WAIT_AND_WATCH with neutral confidence when historical prices are flat/stagnant", () => {
      // 20 points all exactly 2,000,000 VND (zero dispersion)
      const flatHistory: PricePoint[] = [];
      const baseDate = new Date("2026-09-01T00:00:00Z").getTime();
      for (let i = 0; i < 20; i++) {
        const d = new Date(baseDate + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        flatHistory.push({ date: d, price: 2_000_000 });
      }

      const result = evaluateBuyWaitGuidance({
        currentPrice: 2_000_000,
        priceHistory: flatHistory,
        departureDate: "2026-11-01",
        evaluationDate: "2026-09-25",
      });

      expect(result.recommendation).toBe("WAIT_AND_WATCH");
      expect(result.confidence).toBe(0.5);
      expect(result.rationaleVi).toContain("duy trì cố định không biến động");
    });

    it("calibrates cohort volatility and dampens BUY confidence on high dispersion (SOL-CONFIDENCE-01)", () => {
      const vol = computeCohortVolatility([1_000_000, 2_000_000, 3_000_000]);
      expect(vol.mean).toBe(2_000_000);
      expect(vol.stdDev).toBe(1_000_000);
      expect(vol.cv).toBe(0.5);

      // Low dispersion returns cv 0
      const flatVol = computeCohortVolatility([1_500_000, 1_500_000]);
      expect(flatVol.cv).toBe(0);

      // High volatility series should dampen BUY confidence below 0.90
      const volatileHistory: PricePoint[] = [];
      const baseDate = new Date("2026-09-01T00:00:00Z").getTime();
      for (let i = 0; i < 20; i++) {
        const d = new Date(baseDate + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        // Swings between 1M and 4M (high CV)
        volatileHistory.push({ date: d, price: i % 2 === 0 ? 1_000_000 : 4_000_000 });
      }

      const evalResult = evaluateBuyWaitGuidance({
        currentPrice: 1_000_000, // Lowest price (percentile <= 5)
        priceHistory: volatileHistory,
        departureDate: "2026-11-01",
        evaluationDate: "2026-09-25",
        scopeType: "COHORT",
      });

      expect(evalResult.recommendation).toBe("BUY_NOW");
      expect(evalResult.confidence).toBeLessThan(0.9); // Dampened due to high volatility
      expect(evalResult.confidence).toBeGreaterThanOrEqual(0.6);
    });

    it("SOL-BUYWAIT-01: caps history to MAX_BUY_WAIT_HISTORY_POINTS and enforces close-in purchase escalation", () => {
      const largeHistory: PricePoint[] = [];
      const baseDate = new Date("2026-01-01").getTime();
      for (let i = 0; i < 450; i++) {
        const d = new Date(baseDate + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        largeHistory.push({ date: d, price: 1_500_000 + (i % 10) * 10_000 });
      }

      const res = evaluateBuyWaitGuidance({
        currentPrice: 1_800_000,
        priceHistory: largeHistory,
        departureDate: "2027-04-03", // 2 days from eval
        evaluationDate: "2027-04-01",
        scopeType: "ROUTE_LEVEL",
      });

      expect(res.sampleCount).toBe(MAX_BUY_WAIT_HISTORY_POINTS);
      expect(res.sampleCount).toBeLessThanOrEqual(300);
      expect(res.recommendation).toBe("BUY_NOW");
      expect(res.rationaleVi).toContain("khởi hành trong 2 ngày tới");
    });

    it("WP01: sanitizes dirty price inputs and guards Bessel sample variance in computeCohortVolatility", () => {
      const dirtyPrices = [1_000_000, NaN, null as any, undefined as any, -500_000, 2_000_000];
      const vol = computeCohortVolatility(dirtyPrices);
      expect(vol.mean).toBe(1_500_000);
      expect(vol.stdDev).toBeGreaterThan(0);
      expect(Number.isFinite(vol.cv)).toBe(true);

      const singleValid = computeCohortVolatility([NaN, -1, 1_500_000]);
      expect(singleValid.mean).toBe(1_500_000);
      expect(singleValid.stdDev).toBe(0);
      expect(singleValid.cv).toBe(0);

      const emptyDirty = computeCohortVolatility([NaN, null as any, -100]);
      expect(emptyDirty.mean).toBe(0);
      expect(emptyDirty.stdDev).toBe(0);
      expect(emptyDirty.cv).toBe(0);
    });

    it("WP01: safely handles delimiter normalization and clamps rolling backtest parameters", () => {
      const history = generateSyntheticHistory(20, 20, 2_000_000);
      const res = evaluateBuyWaitGuidance({
        currentPrice: 2_200_000, // Median price (neither all-time low nor spike)
        priceHistory: history,
        departureDate: "2026/11/01", // Slash delimited
        evaluationDate: "2026-09-25",
      });
      expect(res.recommendation).toBe("WAIT_AND_WATCH");

      // Clamps horizonDays <= 0 to 1
      const backtest = evaluateRollingHorizonBacktest(history, 0, 0);
      expect(backtest.backtestWindowDays).toBe(1);
    });
  });
});

