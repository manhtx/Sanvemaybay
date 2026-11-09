import { describe, expect, it } from "vitest";
import { forecastPrice } from "./priceForecast";

const makeSeries = (values: number[], startDate = "2026-08-01") => {
  const start = new Date(startDate).getTime();
  return values.map((price, index) => {
    const d = new Date(start + index * 24 * 60 * 60 * 1000);
    return {
      date: d.toISOString().split("T")[0],
      price
    };
  });
};

describe("Farely Pure Domain — Conservative Price Forecasting (REQ-SCORE-001, NC-014)", () => {
  it("refuses sparse history with fewer than 14 points", () => {
    expect(forecastPrice(makeSeries([100, 105, 110]))).toBeUndefined();
    expect(forecastPrice(makeSeries(Array(13).fill(200)))).toBeUndefined();
  });

  it("filters malformed and non-positive prices and refuses if remaining valid points < 14", () => {
    const pointsWithBad = [
      ...makeSeries(Array(13).fill(200)),
      { date: "not-a-date", price: 200 },
      { date: "2026-08-15", price: 0 },
      { date: "2026-08-16", price: -50 },
      { date: "2026-08-17", price: NaN }
    ];

    expect(forecastPrice(pointsWithBad)).toBeUndefined();
  });

  it("classifies downward price trend when normalized slope < -0.03", () => {
    // Steadily decreasing price series (300 down to 235)
    const series = makeSeries(Array.from({ length: 14 }, (_, i) => 300 - i * 5));
    const result = forecastPrice(series, 7);

    expect(result).toBeDefined();
    expect(result?.direction).toBe("down");
    expect(result?.sampleCount).toBe(14);
    expect(result?.horizonDays).toBe(7);
    expect(result?.probability).toBeGreaterThanOrEqual(0.5);
    expect(result?.probability).toBeLessThanOrEqual(0.9);
    expect(result?.confidence).toBe(0.5); // (14 - 14) / 40 -> 0.5
  });

  it("classifies upward price trend when normalized slope > 0.03", () => {
    // Steadily increasing price series (200 up to 265)
    const series = makeSeries(Array.from({ length: 14 }, (_, i) => 200 + i * 5));
    const result = forecastPrice(series, 14);

    expect(result).toBeDefined();
    expect(result?.direction).toBe("up");
    expect(result?.horizonDays).toBe(14);
    expect(result?.probability).toBeGreaterThan(0.5);
  });

  it("classifies stable price trend within deadband [-0.03, 0.03]", () => {
    // Identical prices (slope = 0)
    const flatSeries = makeSeries(Array(14).fill(250));
    const resultFlat = forecastPrice(flatSeries);

    expect(resultFlat).toBeDefined();
    expect(resultFlat?.direction).toBe("stable");
    expect(resultFlat?.probability).toBe(0.5);
  });

  it("scales confidence monotonically with increasing sample count up to 0.85 cap", () => {
    const series14 = makeSeries(Array.from({ length: 14 }, (_, i) => 100 + i));
    const series20 = makeSeries(Array.from({ length: 20 }, (_, i) => 100 + i));
    const series24 = makeSeries(Array.from({ length: 24 }, (_, i) => 100 + i));
    const series28 = makeSeries(Array.from({ length: 28 }, (_, i) => 100 + i));
    const series50 = makeSeries(Array.from({ length: 50 }, (_, i) => 100 + i));

    const res14 = forecastPrice(series14);
    const res20 = forecastPrice(series20);
    const res24 = forecastPrice(series24);
    const res28 = forecastPrice(series28);
    const res50 = forecastPrice(series50);

    expect(res14?.confidence).toBe(0.5);
    expect(res20?.confidence).toBe(0.65); // 0.5 + (6 / 40) = 0.65
    expect(res24?.confidence).toBe(0.75); // 0.5 + (10 / 40) = 0.75
    expect(res28?.confidence).toBe(0.85); // 0.5 + (14 / 40) = 0.85
    expect(res50?.confidence).toBe(0.85); // capped at 0.85
  });

  it("clamps and rounds horizonDays to integer >= 1", () => {
    const series = makeSeries(Array.from({ length: 14 }, (_, i) => 100 + i));

    const resNegative = forecastPrice(series, -5);
    expect(resNegative?.horizonDays).toBe(1);

    const resZero = forecastPrice(series, 0);
    expect(resZero?.horizonDays).toBe(1);

    const resFloat = forecastPrice(series, 6.7);
    expect(resFloat?.horizonDays).toBe(7);
  });

  it("includes truthful Vietnamese epistemic limitation disclosure", () => {
    const series = makeSeries(Array.from({ length: 14 }, (_, i) => 100 + i));
    const result = forecastPrice(series);

    expect(result?.limitation).toBe(
      "Ước tính theo xu hướng lịch sử gần đây; không đảm bảo giá tương lai và không thay thế kiểm tra giá trực tiếp."
    );
  });

  it("metamorphic chronological invariance: input order shuffles yield identical forecast", () => {
    const forward = makeSeries(Array.from({ length: 16 }, (_, i) => 150 + (i % 3) * 10 - i * 2));
    const reversed = [...forward].reverse();
    const shuffled = [...forward].sort(() => Math.sin(1) - 0.5);

    const resForward = forecastPrice(forward);
    const resReversed = forecastPrice(reversed);
    const resShuffled = forecastPrice(shuffled);

    expect(resForward).toEqual(resReversed);
    expect(resForward).toEqual(resShuffled);
  });

  it("probability bounds [0.5, 0.9] and reaches theoretical linear maximum for sample length", () => {
    // Monotonic linear ramp
    const linearSeries = makeSeries(Array.from({ length: 14 }, (_, i) => 100 + i * 10));
    const result = forecastPrice(linearSeries);

    expect(result).toBeDefined();
    expect(result?.direction).toBe("up");
    expect(result?.probability).toBeGreaterThanOrEqual(0.5);
    expect(result?.probability).toBeLessThanOrEqual(0.9);
    expect(result?.probability).toBe(0.7);
  });

  it("defaults horizonDays to 7 when omitted", () => {
    const series = makeSeries(Array.from({ length: 14 }, (_, i) => 100 + i));
    const result = forecastPrice(series);

    expect(result).toBeDefined();
    expect(result?.horizonDays).toBe(7);
  });

  it("preserves pure immutability on Object.freeze protected price series", () => {
    const frozenPoints = Object.freeze(
      Array.from({ length: 14 }, (_, i) =>
        Object.freeze({
          date: `2026-09-${String(i + 1).padStart(2, "0")}`,
          price: 1_000_000 + i * 10_000
        })
      )
    );

    expect(() => forecastPrice(frozenPoints as any)).not.toThrow();
  });
});
