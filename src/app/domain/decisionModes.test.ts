import { describe, it, expect } from "vitest";
import { rankDealsByDecisionMode, DECISION_MODES } from "./decisionModes";
import { Deal } from "../data/deals";

function createMockDeal(overrides: Partial<Deal>): Deal {
  return {
    id: "mock-deal",
    from: "Hà Nội",
    fromCode: "HAN",
    to: "Bangkok",
    toCode: "BKK",
    country: "Thái Lan",
    region: "asia",
    price: 2000000,
    normalPrice: 3000000,
    discount: 10,
    currency: "VND",
    airline: "Vietnam Airlines",
    airlineCode: "VN",
    departDate: "2026-11-01",
    duration: "2h 00m",
    stops: 0,
    stopCity: null,
    seatsLeft: 5,
    expiresIn: "3 ngày",
    image: "",
    flightNumber: "VN123",
    aiInsight: {
      reason: "Giá tốt",
      tags: [],
      risk: "low",
      riskDetails: "",
      recommendation: "buy_now",
      recommendationNote: "",
      savingScore: 80,
    },
    hiddenCosts: [],
    advertisedTotal: 2000000,
    realTotal: 2000000,
    tripType: "international",
    ...overrides,
  };
}

describe("Decision Modes Contracts (F31)", () => {
  const sampleDeals: Deal[] = [
    createMockDeal({
      id: "deal-1",
      from: "Hà Nội",
      to: "Bangkok",
      fromCode: "HAN",
      toCode: "BKK",
      price: 2500000,
      airline: "AirAsia",
      airlineCode: "FD",
      stops: 1,
      duration: "4h 30m",
      departDate: "2026-11-01",
      discount: 10,
      observedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hr ago (fresh)
    }),
    createMockDeal({
      id: "deal-2",
      from: "Hà Nội",
      to: "Bangkok",
      fromCode: "HAN",
      toCode: "BKK",
      price: 2800000,
      airline: "Vietnam Airlines",
      airlineCode: "VN",
      stops: 0,
      duration: "1h 55m",
      departDate: "2026-11-01",
      discount: 25,
      observedAt: new Date(Date.now() - 7200000).toISOString(), // 2 hrs ago (fresh)
    }),
    createMockDeal({
      id: "deal-3",
      from: "Hà Nội",
      to: "Bangkok",
      fromCode: "HAN",
      toCode: "BKK",
      price: 1800000,
      airline: "Vietjet Air",
      airlineCode: "VJ",
      stops: 0,
      duration: "2h 00m",
      departDate: "2026-11-01",
      discount: 35,
      observedAt: new Date(Date.now() - 86400000 * 3).toISOString(), // 3 days ago (stale)
    }),
  ];

  it("exposes all 4 canonical decision modes with metadata", () => {
    expect(DECISION_MODES.CHEAPEST).toBeDefined();
    expect(DECISION_MODES.CONVENIENT).toBeDefined();
    expect(DECISION_MODES.BUDGET_FIT).toBeDefined();
    expect(DECISION_MODES.LOWER_RISK).toBeDefined();
    expect(DECISION_MODES.CHEAPEST.label).toContain("Rẻ nhất");
  });

  it("CHEAPEST provides objective price sort with inspectable ranking reasons", () => {
    const ranked = rankDealsByDecisionMode(sampleDeals, "CHEAPEST");
    expect(ranked).toHaveLength(3);
    expect(ranked[0].deal.id).toBe("deal-3"); // 1.8M
    expect(ranked[1].deal.id).toBe("deal-1"); // 2.5M
    expect(ranked[2].deal.id).toBe("deal-2"); // 2.8M

    // Ranking reasons are inspectable
    expect(ranked[0].rankingReason).toContain("1.800.000₫");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].rank).toBe(3);
  });

  it("CONVENIENT prioritizes 0 stops and shortest duration", () => {
    const ranked = rankDealsByDecisionMode(sampleDeals, "CONVENIENT");
    expect(ranked).toHaveLength(3);
    // deal-2 (0 stops, 1h 55m) should beat deal-3 (0 stops, 2h 00m) and deal-1 (1 stop)
    expect(ranked[0].deal.id).toBe("deal-2");
    expect(ranked[0].rankingReason).toContain("Bay thẳng");
    expect(ranked[0].rankingReason).toContain("1h 55m");

    expect(ranked[1].deal.id).toBe("deal-3"); // 0 stops, 2h 00m
    expect(ranked[2].deal.id).toBe("deal-1"); // 1 stop
    expect(ranked[2].rankingReason).toContain("1 điểm dừng transit");
  });

  it("BUDGET_FIT optimizes surplus within budget ceiling and explains headrooms", () => {
    const budget = 5000000;
    const ranked = rankDealsByDecisionMode(sampleDeals, "BUDGET_FIT", budget);
    // deal-3 gives largest surplus (5M - 1.8M = 3.2M)
    expect(ranked[0].deal.id).toBe("deal-3");
    expect(ranked[0].rankingReason).toContain("Tiết kiệm 3.200.000₫");

    // deal-1 gives surplus 2.5M
    expect(ranked[1].deal.id).toBe("deal-1");
    expect(ranked[1].rankingReason).toContain("Tiết kiệm 2.500.000₫");

    // deal-2 gives surplus 2.2M
    expect(ranked[2].deal.id).toBe("deal-2");
    expect(ranked[2].rankingReason).toContain("Tiết kiệm 2.200.000₫");
  });

  it("LOWER_RISK prioritizes direct flights and fresh observations to avoid transit risk", () => {
    const ranked = rankDealsByDecisionMode(sampleDeals, "LOWER_RISK");
    // deal-2 is direct (0 stops) AND fresh (2h ago vs deal-3 which is 3 days stale)
    expect(ranked[0].deal.id).toBe("deal-2");
    expect(ranked[0].rankingReason).toContain("loại trừ hoàn toàn rủi ro");

    // deal-3 is direct but older
    expect(ranked[1].deal.id).toBe("deal-3");

    // deal-1 has 1 stop (misconnect risk)
    expect(ranked[2].deal.id).toBe("deal-1");
    expect(ranked[2].rankingReason).toContain("khuyến nghị dự trù thời gian transit");
  });

  it("guarantees user can always return to objective price sort", () => {
    // 1. Start in CONVENIENT
    const convenient = rankDealsByDecisionMode(sampleDeals, "CONVENIENT");
    expect(convenient[0].deal.id).toBe("deal-2"); // Not lowest price

    // 2. Switch back to CHEAPEST
    const objective = rankDealsByDecisionMode(sampleDeals, "CHEAPEST");
    expect(objective[0].deal.id).toBe("deal-3"); // Lowest price guaranteed
    expect(objective[0].deal.price).toBeLessThanOrEqual(objective[1].deal.price);
    expect(objective[1].deal.price).toBeLessThanOrEqual(objective[2].deal.price);
  });
});
