import { describe, expect, it } from "vitest";
import { buildDestinationInsights } from "./destinationInsights";
import { Deal } from "../data/deals";

const makeDeal = (overrides: Partial<Deal>): Deal => ({
  id: "deal_1",
  from: "Hà Nội",
  fromCode: "HAN",
  to: "Bangkok",
  toCode: "BKK",
  country: "Thái Lan",
  region: "asia",
  price: 2_000_000,
  normalPrice: 3_000_000,
  discount: 33,
  currency: "VND",
  airline: "AirAsia",
  airlineCode: "FD",
  departDate: "2026-10-03", // Saturday
  duration: "2h 00m",
  stops: 0,
  stopCity: null,
  seatsLeft: 5,
  expiresIn: "3 days",
  image: "https://example.com/bkk.jpg",
  flightNumber: "FD643",
  aiInsight: {
    reason: "Historical low",
    tags: ["deal"],
    risk: "low",
    riskDetails: "",
    recommendation: "buy_now",
    recommendationNote: "Buy now",
    savingScore: 70
  },
  hiddenCosts: [],
  advertisedTotal: 2_000_000,
  realTotal: 2_000_000,
  tripType: "international",
  ...overrides
});

describe("Farely Pure Domain — Destination Insights (REQ-DOM-001, REQ-DOM-004, REQ-DOM-009)", () => {
  it("returns an empty array when given no deals", () => {
    expect(buildDestinationInsights([])).toEqual([]);
  });

  it("groups deals by destination and computes true minimum realTotal and dealCount", () => {
    const deals: Deal[] = [
      makeDeal({ id: "d1", toCode: "BKK", realTotal: 2_500_000, dealScore: 75 }),
      makeDeal({ id: "d2", toCode: "BKK", realTotal: 1_800_000, dealScore: 85 }),
      makeDeal({ id: "d3", toCode: "BKK", realTotal: 2_200_000, dealScore: 70 })
    ];

    const insights = buildDestinationInsights(deals);
    expect(insights).toHaveLength(1);
    expect(insights[0].destinationCode).toBe("BKK");
    expect(insights[0].dealCount).toBe(3);
    expect(insights[0].cheapestPrice).toBe(1_800_000);
    expect(insights[0].bestDealScore).toBe(85);
    expect(insights[0].topDealId).toBe("d2");
  });

  it("calculates exact arithmetic average discount across destination deals", () => {
    const deals: Deal[] = [
      makeDeal({ id: "d1", toCode: "NRT", discount: 20 }),
      makeDeal({ id: "d2", toCode: "NRT", discount: 40 }),
      makeDeal({ id: "d3", toCode: "NRT", discount: 30 })
    ];

    const insights = buildDestinationInsights(deals);
    expect(insights[0].averageDiscount).toBe(30); // (20 + 40 + 30) / 3 = 30
  });

  it("resolves top deal using dealScore with graceful fallback to aiInsight.savingScore", () => {
    const deals: Deal[] = [
      makeDeal({
        id: "d_fallback",
        toCode: "SIN",
        dealScore: undefined,
        aiInsight: { savingScore: 88 } as any
      }),
      makeDeal({
        id: "d_explicit",
        toCode: "SIN",
        dealScore: 80,
        aiInsight: { savingScore: 95 } as any // dealScore (80) takes precedence
      })
    ];

    const insights = buildDestinationInsights(deals);
    // d_fallback has score 88 (from savingScore), d_explicit has score 80 (from dealScore)
    expect(insights[0].bestDealScore).toBe(88);
    expect(insights[0].topDealId).toBe("d_fallback");
  });

  it("detects weekend departures on Saturday (day 6) and Sunday (day 0)", () => {
    // 2026-10-03 is Saturday
    const satDeal = makeDeal({ id: "sat", toCode: "KUL", departDate: "2026-10-03" });
    const satInsight = buildDestinationInsights([satDeal]);
    expect(satInsight[0].hasWeekendDeal).toBe(true);

    // 2026-10-04 is Sunday
    const sunDeal = makeDeal({ id: "sun", toCode: "KUL", departDate: "2026-10-04" });
    const sunInsight = buildDestinationInsights([sunDeal]);
    expect(sunInsight[0].hasWeekendDeal).toBe(true);
  });

  it("correctly flags hasWeekendDeal: false for weekday-only departure schedules", () => {
    // 2026-10-05 is Monday, 2026-10-06 is Tuesday, 2026-10-07 is Wednesday
    const weekdayDeals: Deal[] = [
      makeDeal({ id: "mon", toCode: "ICN", departDate: "2026-10-05" }),
      makeDeal({ id: "tue", toCode: "ICN", departDate: "2026-10-06" }),
      makeDeal({ id: "wed", toCode: "ICN", departDate: "2026-10-07" })
    ];

    const insights = buildDestinationInsights(weekdayDeals);
    expect(insights[0].hasWeekendDeal).toBe(false);
  });

  it("sorts multiple destinations by bestDealScore descending", () => {
    const deals: Deal[] = [
      makeDeal({ id: "d_sin", toCode: "SIN", to: "Singapore", country: "Singapore", dealScore: 72 }),
      makeDeal({ id: "d_bkk", toCode: "BKK", to: "Bangkok", country: "Thái Lan", dealScore: 92 }),
      makeDeal({ id: "d_tyo", toCode: "TYO", to: "Tokyo", country: "Nhật Bản", dealScore: 84 })
    ];

    const insights = buildDestinationInsights(deals);
    expect(insights).toHaveLength(3);
    expect(insights[0].destinationCode).toBe("BKK"); // 92
    expect(insights[1].destinationCode).toBe("TYO"); // 84
    expect(insights[2].destinationCode).toBe("SIN"); // 72
  });

  it("falls back to destination name (deal.to) when toCode is missing or falsy", () => {
    const deals: Deal[] = [
      makeDeal({ id: "d_nocode_1", to: "Phuket", toCode: "", dealScore: 80 }),
      makeDeal({ id: "d_nocode_2", to: "Phuket", toCode: "", dealScore: 70 })
    ];

    const insights = buildDestinationInsights(deals);
    expect(insights).toHaveLength(1);
    expect(insights[0].destination).toBe("Phuket");
    expect(insights[0].dealCount).toBe(2);
  });
});
