import { describe, expect, it } from "vitest";
import { buildDestinationInsights, isWeekendFlightDate } from "./destinationInsights";
import { Deal } from "../data/deals";

const deal = (overrides: Partial<Deal>): Deal => ({
  id: "a", from: "Hà Nội", fromCode: "HAN", to: "Bangkok", toCode: "BKK", country: "Thái Lan", region: "asia",
  price: 2_000_000, normalPrice: 3_000_000, discount: 33, currency: "VND", airline: "Air", airlineCode: "A",
  departDate: "2026-10-03", duration: "2h 30m", stops: 0, stopCity: null, seatsLeft: 0, expiresIn: "soon", image: "", flightNumber: "A1",
  aiInsight: { reason: "data", tags: [], risk: "low", riskDetails: "", recommendation: "wait", recommendationNote: "", savingScore: 70 },
  hiddenCosts: [], advertisedTotal: 2_000_000, realTotal: 2_000_000, tripType: "international", ...overrides,
});

describe("destination insights", () => {
  it("aggregates only supplied deals and marks weekend availability", () => {
    const insights = buildDestinationInsights([
      deal({ id: "a", price: 2_000_000, realTotal: 2_100_000 }),
      deal({ id: "b", price: 1_500_000, realTotal: 1_600_000, discount: 50, dealScore: 90 }),
      deal({ id: "c", to: "Seoul", toCode: "ICN", country: "Hàn Quốc", departDate: "2026-10-05", dealScore: 80 }),
    ]);
    expect(insights).toHaveLength(2);
    expect(insights[0]).toMatchObject({ destinationCode: "BKK", dealCount: 2, cheapestPrice: 1_600_000, bestDealScore: 90, hasWeekendDeal: true, topDealId: "b" });
  });

  it("accurately classifies weekend flight dates in UTC without timezone shifting", () => {
    // 2026-10-03 is Saturday
    expect(isWeekendFlightDate("2026-10-03")).toBe(true);
    // 2026-10-04 is Sunday
    expect(isWeekendFlightDate("2026-10-04")).toBe(true);
    // 2026-10-05 is Monday
    expect(isWeekendFlightDate("2026-10-05")).toBe(false);
    // 2026-10-06 is Tuesday
    expect(isWeekendFlightDate("2026-10-06")).toBe(false);
    // Empty or invalid
    expect(isWeekendFlightDate("")).toBe(false);
  });
});

