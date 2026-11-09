import { describe, expect, it } from "vitest";
import { buildPriceAnalytics } from "./priceAnalytics";

describe("buildPriceAnalytics", () => {
  it("calculates distribution, percentile, volatility and cheapest weekday", () => {
    const result = buildPriceAnalytics(
      [
        { date: "2026-08-03", price: 100 },
        { date: "2026-08-04", price: 200 },
        { date: "2026-08-10", price: 120 },
      ],
      120,
    );
    expect(result?.lowest).toBe(100);
    expect(result?.median).toBe(120);
    expect(result?.highest).toBe(200);
    expect(result?.average).toBeCloseTo(140, 1);
    expect(result?.currentPercentile).toBe(67);
    // Negative Control C: 3 observations must NOT imply Monday is the cheapest departure day
    expect(result?.cheapestWeekday).toBeUndefined();
    expect(result?.volatilityPercent).toBeGreaterThan(0);
  });

  describe("distribution axioms & median calculation", () => {
    it("preserves axiomatic ordering lowest <= median <= highest", () => {
      const points = [
        { date: "2026-08-01", price: 500 },
        { date: "2026-08-02", price: 100 },
        { date: "2026-08-03", price: 300 },
        { date: "2026-08-04", price: 200 },
        { date: "2026-08-05", price: 400 },
      ];
      const analytics = buildPriceAnalytics(points);
      expect(analytics).toBeDefined();
      expect(analytics!.lowest).toBe(100);
      expect(analytics!.median).toBe(300);
      expect(analytics!.highest).toBe(500);
      expect(analytics!.lowest).toBeLessThanOrEqual(analytics!.median);
      expect(analytics!.median).toBeLessThanOrEqual(analytics!.highest);
    });

    it("correctly derives median for even-length observation sets", () => {
      const evenPoints = [
        { date: "2026-08-01", price: 100 },
        { date: "2026-08-02", price: 120 },
        { date: "2026-08-03", price: 160 },
        { date: "2026-08-04", price: 200 },
      ];
      const analytics = buildPriceAnalytics(evenPoints);
      // (120 + 160) / 2 = 140
      expect(analytics?.median).toBe(140);
    });

    it("reports 0% volatility when all observation prices are identical", () => {
      const uniform = [
        { date: "2026-08-01", price: 150 },
        { date: "2026-08-02", price: 150 },
        { date: "2026-08-03", price: 150 },
      ];
      const analytics = buildPriceAnalytics(uniform);
      expect(analytics?.volatilityPercent).toBe(0);
    });
  });

  describe("currentPercentile ranking", () => {
    const points = [
      { date: "2026-08-01", price: 100 },
      { date: "2026-08-02", price: 200 },
      { date: "2026-08-03", price: 300 },
      { date: "2026-08-04", price: 400 },
    ];

    it("computes bounded percentile ranks [0, 100]", () => {
      expect(buildPriceAnalytics(points, 50)?.currentPercentile).toBe(0); // 0/4
      expect(buildPriceAnalytics(points, 200)?.currentPercentile).toBe(50); // 2/4
      expect(buildPriceAnalytics(points, 350)?.currentPercentile).toBe(75); // 3/4
      expect(buildPriceAnalytics(points, 500)?.currentPercentile).toBe(100); // 4/4
    });

    it("returns undefined percentile when currentPrice is null, undefined, or NaN", () => {
      expect(buildPriceAnalytics(points, undefined)?.currentPercentile).toBeUndefined();
      expect(buildPriceAnalytics(points, null as any)?.currentPercentile).toBeUndefined();
      expect(buildPriceAnalytics(points, NaN)?.currentPercentile).toBeUndefined();
    });
  });

  describe("Negative Control C (Defensible sample gate for cheapestWeekday)", () => {
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

    it("fails closed when observation count is 13 (< 14 minimum)", () => {
      // 13 points across 4 weekdays
      const points = [
        { date: "2026-08-03", price: 100 }, // Mon
        { date: "2026-08-10", price: 100 },
        { date: "2026-08-17", price: 100 },
        { date: "2026-08-24", price: 100 },
        { date: "2026-08-04", price: 200 }, // Tue
        { date: "2026-08-11", price: 200 },
        { date: "2026-08-18", price: 200 },
        { date: "2026-08-05", price: 300 }, // Wed
        { date: "2026-08-12", price: 300 },
        { date: "2026-08-19", price: 300 },
        { date: "2026-08-06", price: 400 }, // Thu
        { date: "2026-08-13", price: 400 },
        { date: "2026-08-20", price: 400 },
      ];
      expect(points.length).toBe(13);
      const result = buildPriceAnalytics(points);
      expect(result?.cheapestWeekday).toBeUndefined();
    });

    it("fails closed when observations span only 3 distinct weekdays (< 4 minimum)", () => {
      // 15 points across only Mon, Tue, Wed
      const points = [
        { date: "2026-08-03", price: 100 }, // Mon
        { date: "2026-08-10", price: 100 },
        { date: "2026-08-17", price: 100 },
        { date: "2026-08-24", price: 100 },
        { date: "2026-08-31", price: 100 },
        { date: "2026-08-04", price: 200 }, // Tue
        { date: "2026-08-11", price: 200 },
        { date: "2026-08-18", price: 200 },
        { date: "2026-08-25", price: 200 },
        { date: "2026-09-01", price: 200 },
        { date: "2026-08-05", price: 300 }, // Wed
        { date: "2026-08-12", price: 300 },
        { date: "2026-08-19", price: 300 },
        { date: "2026-08-26", price: 300 },
        { date: "2026-09-02", price: 300 },
      ];
      expect(points.length).toBe(15);
      const result = buildPriceAnalytics(points);
      expect(result?.cheapestWeekday).toBeUndefined();
    });

    it("fails closed when fewer than 4 weekdays have at least 2 observations", () => {
      // 14 points, but Thursday has only 1 observation
      const points = [
        { date: "2026-08-03", price: 100 }, // Mon (5)
        { date: "2026-08-10", price: 100 },
        { date: "2026-08-17", price: 100 },
        { date: "2026-08-24", price: 100 },
        { date: "2026-08-31", price: 100 },
        { date: "2026-08-04", price: 200 }, // Tue (4)
        { date: "2026-08-11", price: 200 },
        { date: "2026-08-18", price: 200 },
        { date: "2026-08-25", price: 200 },
        { date: "2026-08-05", price: 300 }, // Wed (4)
        { date: "2026-08-12", price: 300 },
        { date: "2026-08-19", price: 300 },
        { date: "2026-08-26", price: 300 },
        { date: "2026-08-06", price: 50 },  // Thu (1 point - outlier)
      ];
      expect(points.length).toBe(14);
      const result = buildPriceAnalytics(points);
      expect(result?.cheapestWeekday).toBeUndefined();
    });
  });

  describe("cleansing & edge cases", () => {
    it("returns undefined when all observations are invalid", () => {
      expect(buildPriceAnalytics([{ date: "invalid", price: 0 }])).toBeUndefined();
      expect(buildPriceAnalytics([])).toBeUndefined();
    });

    it("cleanses corrupt and negative price points while retaining valid ones", () => {
      const mixed = [
        { date: "2026-08-01", price: 150 },
        { date: "2026-08-02", price: 0 },
        { date: "2026-08-03", price: -100 },
        { date: "2026-08-04", price: NaN },
        { date: "2026-08-05", price: 250 },
        { date: "invalid-date", price: 180 },
      ];
      const analytics = buildPriceAnalytics(mixed);
      expect(analytics).toBeDefined();
      expect(analytics?.lowest).toBe(150);
      expect(analytics?.highest).toBe(250);
      expect(analytics?.average).toBe(200);
      expect(analytics?.median).toBe(200);
    });
  });
});
