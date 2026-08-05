import { describe, expect, it } from "vitest";
import { matchPromotions, Promotion } from "./promotionMatching";

const base: Promotion = {
  id: "p1", provider: "Airline", originCodes: ["HAN"], destinationCodes: ["BKK"], airlineCodes: ["VJ"],
  validFrom: "2026-07-01T00:00:00Z", validUntil: "2026-08-31T23:59:59Z",
  departureFrom: "2026-08-01", departureUntil: "2026-12-31", kind: "percent", amount: 20,
  conditions: ["Thanh toán bằng thẻ đủ điều kiện"],
};
const deal = { fromCode: "HAN", toCode: "BKK", airlineCode: "VJ", departDate: "2026-09-10", price: 5_000_000 } as const;

describe("matchPromotions", () => {
  it("matches eligible route/date/airline and calculates capped saving", () => {
    const result = matchPromotions(deal, [{ ...base, maxDiscount: 700_000 }], new Date("2026-07-31T12:00:00Z"));
    expect(result[0].estimatedSaving).toBe(700_000);
  });

  it("rejects expired, route-mismatched, below-minimum and malformed promotions", () => {
    const result = matchPromotions(deal, [
      { ...base, id: "expired", validUntil: "2026-07-30" },
      { ...base, id: "route", destinationCodes: ["NRT"] },
      { ...base, id: "minimum", minimumFare: 6_000_000 },
      { ...base, id: "invalid", amount: 0 },
    ], new Date("2026-07-31T12:00:00Z"));
    expect(result).toEqual([]);
  });

  it("supports fixed promotions and preserves best-first ordering", () => {
    const result = matchPromotions(deal, [
      { ...base, id: "fixed", kind: "fixed", amount: 900_000 },
      { ...base, id: "percent", amount: 25 },
    ], new Date("2026-07-31T12:00:00Z"));
    expect(result.map((item) => item.promotion.id)).toEqual(["percent", "fixed"]);
  });
});
