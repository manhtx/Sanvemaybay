import { describe, expect, it } from "vitest";
import { buildPriceAnalytics } from "./priceAnalytics";

describe("buildPriceAnalytics", () => {
  it("calculates distribution, percentile, volatility and cheapest weekday", () => {
    const result = buildPriceAnalytics([
      { date: "2026-08-03", price: 100 },
      { date: "2026-08-04", price: 200 },
      { date: "2026-08-10", price: 120 },
    ], 120);
    expect(result?.lowest).toBe(100);
    expect(result?.median).toBe(120);
    expect(result?.currentPercentile).toBe(67);
    expect(result?.cheapestWeekday).toBe(1);
    expect(result?.volatilityPercent).toBeGreaterThan(0);
  });

  it("returns undefined when all observations are invalid", () => {
    expect(buildPriceAnalytics([{ date: "invalid", price: 0 }])).toBeUndefined();
  });
});
