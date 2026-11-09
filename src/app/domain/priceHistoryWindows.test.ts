import { describe, expect, it } from "vitest";
import {
  PRICE_HISTORY_WINDOWS,
  filterPriceHistoryByDays,
} from "./priceHistoryWindows";

describe("PRICE_HISTORY_WINDOWS constant", () => {
  it("defines strictly [7, 30, 90, 180] as supported observation windows", () => {
    expect(PRICE_HISTORY_WINDOWS).toEqual([7, 30, 90, 180]);
  });
});

describe("filterPriceHistoryByDays", () => {
  const points = [
    { date: "2026-01-01", price: 100 },
    { date: "2026-01-07", price: 90 },
    { date: "2026-01-08", price: 80 },
    { date: "2026-02-01", price: 75 },
    { date: "2026-02-06", price: 70 },
  ];

  it("uses the newest observation as the anchor and includes both boundaries", () => {
    expect(filterPriceHistoryByDays(points, 30).map((point) => point.date)).toEqual([
      "2026-01-08",
      "2026-02-01",
      "2026-02-06",
    ]);
  });

  it("filters malformed and non-positive observations without fabricating values", () => {
    expect(
      filterPriceHistoryByDays(
        [
          { date: "bad", price: 10 },
          { date: "2026-02-01", price: 0 },
          { date: "2026-02-02", price: -50 },
          { date: "2026-02-03", price: NaN },
          { date: "2026-02-04", price: Infinity },
        ],
        7,
      ),
    ).toEqual([]);
  });

  it("keeps the selected range sorted chronologically regardless of input order", () => {
    expect(filterPriceHistoryByDays([...points].reverse(), 7).map((point) => point.date)).toEqual([
      "2026-02-01",
      "2026-02-06",
    ]);
  });

  it("handles empty arrays and single points cleanly", () => {
    expect(filterPriceHistoryByDays([], 7)).toEqual([]);
    expect(filterPriceHistoryByDays([{ date: "2026-03-01", price: 150 }], 30)).toEqual([
      { date: "2026-03-01", price: 150 },
    ]);
  });

  it("anchors to the newest observation in dataset, independent of current wall-clock time", () => {
    const historicalPoints = [
      { date: "2023-01-01", price: 200 },
      { date: "2023-01-05", price: 190 },
      { date: "2023-01-07", price: 180 },
    ];
    // Anchor is 2023-01-07; 7-day window covers back to 2023-01-01
    const result = filterPriceHistoryByDays(historicalPoints, 7);
    expect(result.map((p) => p.date)).toEqual(["2023-01-01", "2023-01-05", "2023-01-07"]);
  });

  it("strictly includes points at the threshold and excludes points before it", () => {
    // 2026-01-07 to 2026-01-01 is exactly (7 - 1) * 24 hours
    const testPoints = [
      { date: "2025-12-31T23:59:59.999Z", price: 100 },
      { date: "2026-01-01T00:00:00.000Z", price: 95 },
      { date: "2026-01-07T00:00:00.000Z", price: 85 },
    ];
    const filtered = filterPriceHistoryByDays(testPoints, 7);
    expect(filtered.map((p) => p.date)).toEqual([
      "2026-01-01T00:00:00.000Z",
      "2026-01-07T00:00:00.000Z",
    ]);
  });

  it("exhibits monotonic expansion across window intervals (7 <= 30 <= 90 <= 180)", () => {
    const extendedDataset = [
      { date: "2025-08-01", price: 300 },
      { date: "2025-10-15", price: 250 },
      { date: "2025-12-01", price: 220 },
      { date: "2026-01-15", price: 210 },
      { date: "2026-01-28", price: 190 },
      { date: "2026-02-01", price: 180 },
    ];

    const w7 = filterPriceHistoryByDays(extendedDataset, 7);
    const w30 = filterPriceHistoryByDays(extendedDataset, 30);
    const w90 = filterPriceHistoryByDays(extendedDataset, 90);
    const w180 = filterPriceHistoryByDays(extendedDataset, 180);

    expect(w7.length).toBeLessThanOrEqual(w30.length);
    expect(w30.length).toBeLessThanOrEqual(w90.length);
    expect(w90.length).toBeLessThanOrEqual(w180.length);

    // Monotonic subset inclusion
    const dates7 = new Set(w7.map((p) => p.date));
    const dates30 = new Set(w30.map((p) => p.date));
    const dates90 = new Set(w90.map((p) => p.date));
    const dates180 = new Set(w180.map((p) => p.date));

    for (const d of dates7) expect(dates30.has(d)).toBe(true);
    for (const d of dates30) expect(dates90.has(d)).toBe(true);
    for (const d of dates90) expect(dates180.has(d)).toBe(true);
  });

  it("does not mutate the original input array", () => {
    const original = Object.freeze([
      Object.freeze({ date: "2026-01-05", price: 100 }),
      Object.freeze({ date: "2026-01-01", price: 120 }),
    ]);
    const filtered = filterPriceHistoryByDays(original as any, 7);
    expect(filtered[0].date).toBe("2026-01-01");
    expect(original[0].date).toBe("2026-01-05");
  });
});
