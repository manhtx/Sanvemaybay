import { describe, expect, it } from "vitest";
import {
  assessDeal,
  calculateTotalCost,
  classifyDiscount,
  decideBuyAction,
  median,
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
});
