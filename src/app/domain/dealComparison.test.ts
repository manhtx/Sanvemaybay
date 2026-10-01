import { describe, expect, it } from "vitest";
import { compareDeals, explainTradeoff } from "./dealComparison";

describe("deal comparison", () => {
  it("compares total cost and parses duration without inventing missing values", () => {
    const rows = compareDeals([{
      id: "a", from: "Hà Nội", fromCode: "HAN", to: "Bangkok", toCode: "BKK", country: "Thái Lan", region: "asia",
      price: 2_000_000, normalPrice: 3_000_000, discount: 33, currency: "VND", airline: "Air", airlineCode: "A",
      departDate: "2026-10-01", duration: "2h 30m", stops: 1, stopCity: null, seatsLeft: 0, expiresIn: "soon", image: "",
      flightNumber: "A1", aiInsight: { reason: "data", tags: [], risk: "low", riskDetails: "", recommendation: "wait", recommendationNote: "", savingScore: 70 },
      hiddenCosts: [{ label: "Tax", amount: 200_000, note: "" }], advertisedTotal: 2_000_000, realTotal: 2_200_000, tripType: "international",
    }]);
    expect(rows[0]).toMatchObject({ route: "HAN → BKK", ticketPrice: 2_000_000, totalCost: 2_200_000, durationMinutes: 150, stops: 1, risk: "low" });
    expect(rows[0].refundPolicy).toBeUndefined();
  });

  it("explains trade-offs between cheaper option with stops/longer time and direct faster option", () => {
    const cheaper = {
      id: "cheap",
      route: "HAN → BKK",
      ticketPrice: 1_500_000,
      totalCost: 1_500_000,
      durationMinutes: 480, // 8h
      stops: 1,
      refundPolicy: undefined,
      risk: "medium" as const,
    };
    const direct = {
      id: "direct",
      route: "HAN → BKK",
      ticketPrice: 2_400_000,
      totalCost: 2_400_000,
      durationMinutes: 120, // 2h
      stops: 0,
      refundPolicy: undefined,
      risk: "low" as const,
    };

    const explanation = explainTradeoff(cheaper, direct);
    expect(explanation).toContain("Rẻ hơn khoảng 900k");
    expect(explanation).toContain("mất thêm 6 giờ");
    expect(explanation).toContain("thêm 1 điểm dừng");
  });
});

