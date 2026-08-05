import { describe, expect, it } from "vitest";
import { forecastPrice } from "./priceForecast";

const series = (values: number[]) => values.map((price, index) => ({ date: `2026-08-${String(index + 1).padStart(2, "0")}`, price }));

describe("forecastPrice", () => {
  it("refuses sparse or malformed history", () => {
    expect(forecastPrice(series([100, 99]))).toBeUndefined();
    expect(forecastPrice([...series(Array(13).fill(100)), { date: "bad", price: 100 }])).toBeUndefined();
  });

  it("returns a bounded down direction with evidence metadata", () => {
    const result = forecastPrice(series(Array.from({ length: 14 }, (_, index) => 300 - index * 5)));
    expect(result).toMatchObject({ direction: "down", sampleCount: 14, horizonDays: 7 });
    expect(result?.probability).toBeGreaterThanOrEqual(0.5);
    expect(result?.confidence).toBeGreaterThanOrEqual(0.5);
    expect(result?.limitation).toContain("không đảm bảo");
  });
});
