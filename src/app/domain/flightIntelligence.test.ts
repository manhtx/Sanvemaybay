import { describe, expect, it } from "vitest";
import {
  assessDeal,
  buildFlexibleFareMatrix,
  calculateTotalCost,
  classifyDiscount,
  compareMetroAirports,
  decideBuyAction,
  median,
  verifyOfferPrice,
} from "./flightIntelligence";

describe("flight intelligence", () => {
  it("calculates the median without mutating input", () => {
    const values = [900, 100, 500, 300];
    expect(median(values)).toBe(400);
    expect(values).toEqual([900, 100, 500, 300]);
  });

  it("classifies configurable roadmap discount bands", () => {
    expect(classifyDiscount(9.99)).toBe("NORMAL");
    expect(classifyDiscount(20)).toBe("GOOD_DEAL");
    expect(classifyDiscount(30)).toBe("STRONG_DEAL");
    expect(classifyDiscount(40)).toBe("EXTREME_DEAL");
  });

  it("marks extreme outliers suspicious instead of publishing them as deals", () => {
    const result = assessDeal({
      currentPrice: 100,
      baselinePrice: 1000,
      comparableSamples: 10,
      historicalSamples: 10,
    });
    expect(result.level).toBe("SUSPICIOUS");
    expect(result.suspicious).toBe(true);
  });

  it("calculates total cost and rejects invalid components", () => {
    expect(calculateTotalCost([2_000_000, 500_000, 250_000])).toBe(2_750_000);
    expect(() => calculateTotalCost([100, -1])).toThrow();
  });

  it("returns insufficient data before making a buy recommendation", () => {
    expect(decideBuyAction({
      discountPercent: 50,
      confidence: 0.9,
      daysToDeparture: 10,
      historicalSamples: 2,
    })).toBe("INSUFFICIENT_DATA");
  });

  it("uses rules for the action and reserves AI for explanation", () => {
    expect(decideBuyAction({
      discountPercent: 35,
      confidence: 0.8,
      daysToDeparture: 20,
      historicalSamples: 10,
      riskLevel: "low",
    })).toBe("BUY_NOW");
    expect(decideBuyAction({
      discountPercent: 35,
      confidence: 0.8,
      daysToDeparture: 20,
      historicalSamples: 10,
      riskLevel: "high",
    })).toBe("AVOID");
  });

  describe("GATE-25 differentiation: Flexible Fare Matrix", () => {
    const now = "2026-10-06T12:00:00.000Z";

    it("marks freshness truthfully and enforces isGuaranteedLive = false", () => {
      const matrix = buildFlexibleFareMatrix(
        ["2026-11-01", "2026-11-02"],
        ["2026-11-05", undefined],
        [
          {
            departDate: "2026-11-01",
            returnDate: "2026-11-05",
            price: 2_150_000,
            observedAt: "2026-10-06T11:40:00.000Z", // 20m ago -> fresh_observed
          },
          {
            departDate: "2026-11-02",
            returnDate: undefined,
            price: 1_200_000,
            observedAt: "2026-10-05T10:00:00.000Z", // > 24h ago -> stale
          },
        ],
        now,
      );

      // Total cells: 2 dep x 2 ret = 4
      expect(matrix).toHaveLength(4);

      const cell1 = matrix.find((c) => c.departDate === "2026-11-01" && c.returnDate === "2026-11-05");
      expect(cell1?.freshness).toBe("fresh_observed");
      expect(cell1?.price).toBe(2_150_000);
      expect(cell1?.isGuaranteedLive).toBe(false);

      const cell2 = matrix.find((c) => c.departDate === "2026-11-02" && c.returnDate === undefined);
      expect(cell2?.freshness).toBe("stale");
      expect(cell2?.isGuaranteedLive).toBe(false);

      const cellEmpty = matrix.find((c) => c.departDate === "2026-11-01" && c.returnDate === undefined);
      expect(cellEmpty?.freshness).toBe("unavailable");
      expect(cellEmpty?.price).toBeUndefined();
    });
  });

  describe("GATE-25 differentiation: Verification Layer", () => {
    it("tracks exact discrepancy delta and accuracy status", () => {
      const match = verifyOfferPrice(2_000_000, {
        status: "SUCCESS",
        livePrice: 2_000_000,
        provider: "vietjet_live",
        timestamp: "2026-10-06T12:00:00.000Z",
      });
      expect(match.accuracyStatus).toBe("EXACT_MATCH");
      expect(match.absoluteDelta).toBe(0);
      expect(match.percentageDelta).toBe(0);
      expect(match.success).toBe(true);

      const increased = verifyOfferPrice(2_000_000, {
        status: "SUCCESS",
        livePrice: 2_200_000,
        provider: "vietjet_live",
      });
      expect(increased.accuracyStatus).toBe("PRICE_INCREASED");
      expect(increased.absoluteDelta).toBe(200_000);
      expect(increased.percentageDelta).toBe(10);

      const unavail = verifyOfferPrice(2_000_000, {
        status: "UNAVAILABLE",
        provider: "vietjet_live",
      });
      expect(unavail.accuracyStatus).toBe("PROVIDER_UNAVAILABLE");
      expect(unavail.success).toBe(false);
    });
  });

  describe("GATE-25 differentiation: Metro Airport Comparison", () => {
    it("compares airport options within same metro and surfaces price difference", () => {
      const result = compareMetroAirports(
        { origin: "HAN", destination: "BKK_METRO" },
        [
          { originAirport: "HAN", destinationAirport: "BKK", price: 2_450_000, groundTransferNote: "Suvarnabhumi Airport Link 45 THB" },
          { originAirport: "HAN", destinationAirport: "DMK", price: 2_150_000, groundTransferNote: "SRT Red Line 33 THB" },
        ],
      );

      expect(result).not.toBeNull();
      expect(result?.cheaperOptionAirport).toBe("HAN → DMK");
      expect(result?.priceDifference).toBe(300_000);
      expect(result?.options).toHaveLength(2);
    });
  });
});

