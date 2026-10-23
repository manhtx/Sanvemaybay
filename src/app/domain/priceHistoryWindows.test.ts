import { describe, expect, it } from "vitest";
import { filterPriceHistoryByDays, detectPriceHistoryGaps } from "./priceHistoryWindows";

describe("filterPriceHistoryByDays", () => {
  const points = [
    { date: "2026-01-01", price: 100 },
    { date: "2026-01-07", price: 90 },
    { date: "2026-01-08", price: 80 },
    { date: "2026-02-01", price: 75 },
    { date: "2026-02-06", price: 70 },
  ];

  it("uses the newest observation as the anchor and includes both boundaries", () => {
    expect(filterPriceHistoryByDays(points, 30).map((point) => point.date)).toEqual(["2026-01-08", "2026-02-01", "2026-02-06"]);
  });

  it("filters malformed and non-positive observations without fabricating values", () => {
    expect(filterPriceHistoryByDays([{ date: "bad", price: 10 }, { date: "2026-02-01", price: 0 }], 7)).toEqual([]);
  });

  it("keeps the selected 7-day range sorted chronologically", () => {
    expect(filterPriceHistoryByDays([...points].reverse(), 7).map((point) => point.date)).toEqual(["2026-02-01", "2026-02-06"]);
  });

  describe("Fare Movement Timeline Contract (F29)", () => {
    const sparseObservations = [
      { date: "2026-10-01", price: 2100000 },
      { date: "2026-10-12", price: 1850000 }, // 11-day unmonitored gap
      { date: "2026-10-14", price: 1900000 },
    ];

    it("STRICT ACCEPTANCE (F29): Never synthesizes intermediate daily points across an unmonitored gap", () => {
      const windowed = filterPriceHistoryByDays(sparseObservations, 30);
      // Must contain strictly the 3 real points; no synthetic dates (2026-10-02 .. 2026-10-11)
      expect(windowed).toHaveLength(3);
      expect(windowed.map((p) => p.date)).toEqual(["2026-10-01", "2026-10-12", "2026-10-14"]);
      expect(windowed.map((p) => p.price)).toEqual([2100000, 1850000, 1900000]);
    });

    it("detects and discloses unmonitored scan gaps truthfully", () => {
      const gaps = detectPriceHistoryGaps(sparseObservations, 3);
      expect(gaps).toHaveLength(1);
      expect(gaps[0].fromDate).toBe("2026-10-01");
      expect(gaps[0].toDate).toBe("2026-10-12");
      expect(gaps[0].gapDays).toBe(11);
      expect(gaps[0].explanation).toContain("Khoảng trống không quét 11 ngày");
      expect(gaps[0].explanation).toContain("không nội suy điểm dữ liệu giả mạo");
    });
  });
});
