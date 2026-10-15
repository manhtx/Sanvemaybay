import { describe, expect, it } from "vitest";
import {
  compareDeals,
  compareSavedOpportunities,
  checkOpportunitiesCompatibility,
  explainTradeoff,
  identifyDominatedOptions,
} from "./dealComparison";

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

  it("identifies Pareto-dominated options where an alternative is cheaper, faster, and fewer stops", () => {
    const superior = {
      id: "opt-superior",
      route: "HAN → SIN",
      ticketPrice: 2_000_000,
      totalCost: 2_000_000,
      durationMinutes: 180,
      stops: 0,
      refundPolicy: undefined,
      risk: "low" as const,
    };
    const dominated = {
      id: "opt-dominated",
      route: "HAN → SIN",
      ticketPrice: 2_500_000, // more expensive
      totalCost: 2_500_000,
      durationMinutes: 360, // slower
      stops: 1, // more stops
      refundPolicy: undefined,
      risk: "medium" as const,
    };
    const tradeOff = {
      id: "opt-cheapest-slow",
      route: "HAN → SIN",
      ticketPrice: 1_200_000, // cheaper
      totalCost: 1_200_000,
      durationMinutes: 480, // but slower
      stops: 1,
      refundPolicy: undefined,
      risk: "medium" as const,
    };

    const dominatedSet = identifyDominatedOptions([superior, dominated, tradeOff]);
    expect(dominatedSet.has("opt-dominated")).toBe(true);
    expect(dominatedSet.has("opt-superior")).toBe(false);
    expect(dominatedSet.has("opt-cheapest-slow")).toBe(false);
  });

  it("compares saved opportunities without promoting unknown information to known (F28)", () => {
    const savedItems = [
      {
        opportunityId: "opp-1",
        fromCode: "HAN",
        toCode: "SGN",
        savedPrice: 1_200_000,
        currentPrice: 1_350_000,
        airline: "Vietnam Airlines",
        stops: 0,
        departDate: "2026-11-10",
        snapshotData: { duration: "2h 10m" },
      },
      {
        opportunityId: "opp-2",
        fromCode: "HAN",
        toCode: "SGN",
        savedPrice: 900_000,
        currentPrice: null,
        airline: "Vietjet Air",
        stops: null, // unknown
        departDate: "2026-11-10",
        snapshotData: null, // no duration
      },
    ];

    const rows = compareSavedOpportunities(savedItems);
    expect(rows).toHaveLength(2);

    // First item
    expect(rows[0].id).toBe("opp-1");
    expect(rows[0].ticketPrice).toBe(1_350_000);
    expect(rows[0].durationMinutes).toBe(130);
    expect(rows[0].stops).toBe(0);

    // Second item has unknown stops and duration
    expect(rows[1].id).toBe("opp-2");
    expect(rows[1].ticketPrice).toBe(900_000);
    expect(rows[1].durationMinutes).toBeUndefined();
    expect(rows[1].stops).toBeNull();
    expect(rows[1].refundPolicy).toBeUndefined();
    expect(rows[1].risk).toBe("unknown");
    expect(rows[1].unverifiedFields).toContain("Thời gian bay");
    expect(rows[1].unverifiedFields).toContain("Số điểm dừng");
    expect(rows[1].unverifiedFields).toContain("Chính sách hoàn/đổi vé");
  });

  it("checks compatibility between saved opportunities and detects route/date divergences", () => {
    const sameRouteRows = [
      {
        id: "1",
        route: "HAN → SGN",
        departDate: "2026-11-10",
        ticketPrice: 1_000_000,
        totalCost: 1_000_000,
        durationMinutes: 130,
        stops: 0,
        refundPolicy: undefined,
        risk: "low" as const,
      },
      {
        id: "2",
        route: "HAN → SGN",
        departDate: "2026-11-12",
        ticketPrice: 1_200_000,
        totalCost: 1_200_000,
        durationMinutes: 130,
        stops: 0,
        refundPolicy: undefined,
        risk: "low" as const,
      },
    ];

    const compat1 = checkOpportunitiesCompatibility(sameRouteRows);
    expect(compat1.isCompatible).toBe(true);
    expect(compat1.sameRoute).toBe(true);
    expect(compat1.dateWarning).toBeUndefined();

    const diffRouteRows = [
      ...sameRouteRows,
      {
        id: "3",
        route: "HAN → DAD",
        departDate: "2026-12-01",
        ticketPrice: 800_000,
        totalCost: 800_000,
        durationMinutes: 80,
        stops: 0,
        refundPolicy: undefined,
        risk: "low" as const,
      },
    ];

    const compat2 = checkOpportunitiesCompatibility(diffRouteRows);
    expect(compat2.isCompatible).toBe(false);
    expect(compat2.sameRoute).toBe(false);
    expect(compat2.notes.some((n) => n.includes("chặng bay khác nhau"))).toBe(true);
    expect(compat2.dateWarning).toBeDefined();
  });

  describe("AUD-06 & AUD-15: Truthful totalCost & Pareto Dominance Integrity", () => {
    it("does not substitute ticket price for realTotal when unknown (AUD-06)", () => {
      const rows = compareDeals([{
        id: "deal-no-realtotal",
        from: "Hà Nội", fromCode: "HAN", to: "Bangkok", toCode: "BKK", country: "Thái Lan", region: "asia",
        price: 1_500_000, normalPrice: 2_000_000, discount: 25, currency: "VND", airline: "Air", airlineCode: "A",
        departDate: "2026-10-01", duration: "2h", stops: 0, stopCity: null, seatsLeft: 5, expiresIn: "soon", image: "",
        flightNumber: "A1", aiInsight: { reason: "data", tags: [], risk: "low", riskDetails: "", recommendation: "wait", recommendationNote: "", savingScore: 70 },
        hiddenCosts: [], advertisedTotal: 1_500_000,
        realTotal: undefined as any, // Unknown real total
        tripType: "international",
      }]);

      expect(rows[0].ticketPrice).toBe(1_500_000);
      expect(rows[0].totalCost).toBeUndefined();
      expect(rows[0].unverifiedFields).toContain("Tổng chi phí thực tế (chưa có dữ liệu phụ phí)");
    });

    it("does not falsely mark option with unrecorded duration as Pareto-dominated (AUD-15)", () => {
      const flightWithKnownStats = {
        id: "flight-known",
        route: "HAN → SGN",
        ticketPrice: 1_500_000,
        totalCost: 1_500_000,
        durationMinutes: 120,
        stops: 0,
        refundPolicy: undefined,
        risk: "low" as const,
      };

      const flightWithUnknownDuration = {
        id: "flight-unknown-dur",
        route: "HAN → SGN",
        ticketPrice: 1_800_000,
        totalCost: 1_800_000,
        durationMinutes: undefined, // Missing duration! Must not be treated as Infinity!
        stops: 0,
        refundPolicy: undefined,
        risk: "low" as const,
      };

      const dominatedSet = identifyDominatedOptions([flightWithKnownStats, flightWithUnknownDuration]);
      // Flight with unknown duration cannot be definitively declared dominated
      expect(dominatedSet.has("flight-unknown-dur")).toBe(false);
      expect(dominatedSet.has("flight-known")).toBe(false);
    });
  });
});

