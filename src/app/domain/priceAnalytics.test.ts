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
    // Negative Control C: 3 observations must NOT imply Monday is the cheapest departure day
    expect(result?.cheapestWeekday).toBeUndefined();
    expect(result?.volatilityPercent).toBeGreaterThan(0);
  });

  it("evaluates cheapestWeekday only with defensible sample (>=14 points across >=4 weekdays)", () => {
    // 16 points across 4 weekdays (Mon, Tue, Wed, Thu)
    const points = [
      { date: "2026-08-03", price: 150 }, // Mon
      { date: "2026-08-10", price: 140 }, // Mon
      { date: "2026-08-17", price: 130 }, // Mon
      { date: "2026-08-24", price: 120 }, // Mon
      { date: "2026-08-04", price: 200 }, // Tue
      { date: "2026-08-11", price: 210 }, // Tue
      { date: "2026-08-18", price: 220 }, // Tue
      { date: "2026-08-25", price: 230 }, // Tue
      { date: "2026-08-05", price: 180 }, // Wed
      { date: "2026-08-12", price: 190 }, // Wed
      { date: "2026-08-19", price: 185 }, // Wed
      { date: "2026-08-26", price: 175 }, // Wed
      { date: "2026-08-06", price: 160 }, // Thu
      { date: "2026-08-13", price: 165 }, // Thu
      { date: "2026-08-20", price: 170 }, // Thu
      { date: "2026-08-27", price: 155 }, // Thu
    ];
    const result = buildPriceAnalytics(points, 120);
    expect(result?.cheapestWeekday).toBe(1); // Monday is lowest average
  });

  it("returns undefined when all observations are invalid", () => {
    expect(buildPriceAnalytics([{ date: "invalid", price: 0 }])).toBeUndefined();
  });
});
