import { describe, expect, it } from "vitest";
import { filterPriceHistoryByDays } from "./priceHistoryWindows";

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
});
