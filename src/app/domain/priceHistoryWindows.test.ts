import { describe, expect, it } from "vitest";
import {
  PRICE_HISTORY_WINDOWS,
  filterPriceHistoryByDays,
} from "./priceHistoryWindows";

describe("PRICE_HISTORY_WINDOWS constant (REQ-HIST-001)", () => {
  it("defines strictly [7, 30, 90, 180] as supported observation windows", () => {
    expect(PRICE_HISTORY_WINDOWS).toEqual([7, 30, 90, 180]);
  });
});

describe("filterPriceHistoryByDays (REQ-HIST-001, GATE-DATA-TRUTH)", () => {
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

  it("handles multi-year and leap-year transitions accurately", () => {
    // 2024 was a leap year (February has 29 days)
    const leapYearPoints = [
      { date: "2024-02-28", price: 150 },
      { date: "2024-02-29", price: 140 },
      { date: "2024-03-01", price: 130 },
      { date: "2024-03-05", price: 120 },
    ];
    const filtered = filterPriceHistoryByDays(leapYearPoints, 7);
    expect(filtered.map((p) => p.date)).toEqual([
      "2024-02-28",
      "2024-02-29",
      "2024-03-01",
      "2024-03-05",
    ]);
  });

  it("handles multiple intra-day observations on the same calendar day", () => {
    const intraDayPoints = [
      { date: "2026-04-10T08:00:00Z", price: 2100000 },
      { date: "2026-04-10T14:30:00Z", price: 1950000 },
      { date: "2026-04-10T22:00:00Z", price: 2050000 },
    ];
    const filtered = filterPriceHistoryByDays(intraDayPoints, 7);
    expect(filtered.length).toBe(3);
    expect(filtered[0].price).toBe(2100000);
    expect(filtered[1].price).toBe(1950000);
    expect(filtered[2].price).toBe(2050000);
  });

  it("handles 180-day extended historical windows with dense point coverage", () => {
    const densePoints = [];
    for (let day = 1; day <= 200; day++) {
      const dateStr = new Date(Date.UTC(2026, 0, day)).toISOString().slice(0, 10);
      densePoints.push({ date: dateStr, price: 1000 + (day % 50) });
    }
    const filtered = filterPriceHistoryByDays(densePoints, 180);
    expect(filtered.length).toBe(180);
    expect(filtered[0].date).toBe("2026-01-21");
    expect(filtered[filtered.length - 1].date).toBe("2026-07-19");
  });

  it("handles unsorted input points with arbitrary timestamp gaps", () => {
    const scatteredPoints = [
      { date: "2026-06-15", price: 300 },
      { date: "2026-01-10", price: 100 },
      { date: "2026-04-20", price: 200 },
      { date: "2026-06-01", price: 250 },
    ];
    const filtered = filterPriceHistoryByDays(scatteredPoints, 30);
    expect(filtered.map((p) => p.date)).toEqual(["2026-06-01", "2026-06-15"]);
  });

  it("handles single observation dataset across all 4 window sizes consistently", () => {
    const single = [{ date: "2026-05-15", price: 500 }];
    for (const w of PRICE_HISTORY_WINDOWS) {
      const res = filterPriceHistoryByDays(single, w);
      expect(res).toEqual([{ date: "2026-05-15", price: 500 }]);
    }
  });

  it("filters points with non-finite prices (NaN, Infinity, -Infinity) while preserving valid points", () => {
    const mixedPoints = [
      { date: "2026-05-01", price: 100 },
      { date: "2026-05-02", price: Number.NaN },
      { date: "2026-05-03", price: Number.POSITIVE_INFINITY },
      { date: "2026-05-04", price: Number.NEGATIVE_INFINITY },
      { date: "2026-05-05", price: 150 },
    ];
    const filtered = filterPriceHistoryByDays(mixedPoints, 7);
    expect(filtered.map((p) => p.date)).toEqual(["2026-05-01", "2026-05-05"]);
  });

  it("performance benchmark: 10,000 price point operations execute in < 50ms", () => {
    const testPoints = [];
    for (let i = 0; i < 1000; i++) {
      testPoints.push({
        date: `2026-01-${String((i % 28) + 1).padStart(2, "0")}`,
        price: 1000000 + i,
      });
    }

    const start = performance.now();
    for (let i = 0; i < 10; i++) {
      filterPriceHistoryByDays(testPoints, 30);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });

  it("boundary precision: includes point at exact millisecond threshold and excludes threshold - 1ms", () => {
    const anchorIso = "2026-06-10T12:00:00.000Z";
    const anchorMs = Date.parse(anchorIso);
    // For 7-day window, threshold is anchor - (7 - 1) * 86,400,000 ms
    const thresholdMs = anchorMs - 6 * 86400 * 1000;
    const exactThresholdIso = new Date(thresholdMs).toISOString();
    const subThresholdIso = new Date(thresholdMs - 1).toISOString();

    const points = [
      { date: subThresholdIso, price: 900000 },
      { date: exactThresholdIso, price: 950000 },
      { date: anchorIso, price: 1100000 },
    ];

    const result = filterPriceHistoryByDays(points, 7);
    expect(result.map((p) => p.date)).toEqual([exactThresholdIso, anchorIso]);
  });

  it("handles duplicate timestamps with stable chronological ordering", () => {
    const timestamp = "2026-08-15T09:00:00.000Z";
    const points = [
      { date: timestamp, price: 1500000 },
      { date: timestamp, price: 1400000 },
      { date: "2026-08-16T10:00:00.000Z", price: 1600000 },
    ];

    const result = filterPriceHistoryByDays(points, 7);
    expect(result.length).toBe(3);
    expect(result.filter((p) => p.date === timestamp).length).toBe(2);
    expect(result[result.length - 1].date).toBe("2026-08-16T10:00:00.000Z");
  });

  it("maintains sorting determinism across multi-decade dates without truncation", () => {
    const multiDecade = [
      { date: "2035-01-01T00:00:00.000Z", price: 5000000 },
      { date: "2034-12-25T00:00:00.000Z", price: 4800000 },
      { date: "2034-11-01T00:00:00.000Z", price: 4500000 },
      { date: "2010-01-01T00:00:00.000Z", price: 1000000 },
    ];

    const result30 = filterPriceHistoryByDays(multiDecade, 30);
    // Anchor is 2035-01-01; 30 days covers back to 2034-12-03
    expect(result30.map((p) => p.date)).toEqual([
      "2034-12-25T00:00:00.000Z",
      "2035-01-01T00:00:00.000Z",
    ]);
  });

  it("high-load scale: processes 50,000 price point operations in < 50ms", () => {
    const testPoints = [];
    for (let i = 0; i < 5000; i++) {
      testPoints.push({
        date: `2026-05-${String((i % 28) + 1).padStart(2, "0")}`,
        price: 2000000 + (i % 1000),
      });
    }

    const start = performance.now();
    for (let i = 0; i < 10; i++) {
      filterPriceHistoryByDays(testPoints, 7);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
