import { describe, expect, it } from "vitest";
import { buildTripAdvice } from "./tripAdvisor";
import { Deal } from "../data/deals";

const makeDeal = (overrides: Partial<Deal> = {}): Deal => ({
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
  departDate: "2026-10-03",
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

describe("Farely Pure Domain — Trip Budget Advisor (NC-005, NC-033, REQ-DOM-001)", () => {
  it("rejects non-finite, negative, or zero budgets", () => {
    const deals = [makeDeal()];
    expect(buildTripAdvice(deals, { origin: "HAN", budget: 0, days: 3 })).toEqual([]);
    expect(buildTripAdvice(deals, { origin: "HAN", budget: -1_000_000, days: 3 })).toEqual([]);
    expect(buildTripAdvice(deals, { origin: "HAN", budget: NaN, days: 3 })).toEqual([]);
    expect(buildTripAdvice(deals, { origin: "HAN", budget: Infinity, days: 3 })).toEqual([]);
  });

  it("rejects non-integer days or days < 1", () => {
    const deals = [makeDeal()];
    expect(buildTripAdvice(deals, { origin: "HAN", budget: 10_000_000, days: 0 })).toEqual([]);
    expect(buildTripAdvice(deals, { origin: "HAN", budget: 10_000_000, days: -2 })).toEqual([]);
    expect(buildTripAdvice(deals, { origin: "HAN", budget: 10_000_000, days: 2.5 })).toEqual([]);
  });

  it("strictly filters deals matching the requested origin code", () => {
    const deals = [
      makeDeal({ id: "d_han", fromCode: "HAN", to: "Bangkok" }),
      makeDeal({ id: "d_sgn", fromCode: "SGN", to: "Bangkok" }),
      makeDeal({ id: "d_dad", fromCode: "DAD", to: "Bangkok" })
    ];

    const advice = buildTripAdvice(deals, { origin: "HAN", budget: 10_000_000, days: 3 });
    expect(advice).toHaveLength(1);
    expect(advice[0].deal.id).toBe("d_han");
  });

  it("applies truthful daily living cost multipliers (700k domestic vs 1.2M international)", () => {
    const domesticDeal = makeDeal({
      id: "dom",
      fromCode: "HAN",
      to: "Đà Nẵng",
      toCode: "DAD",
      country: "Việt Nam",
      tripType: "domestic",
      realTotal: 1_500_000
    });

    const internationalDeal = makeDeal({
      id: "intl",
      fromCode: "HAN",
      to: "Bangkok",
      toCode: "BKK",
      country: "Thái Lan",
      tripType: "international",
      realTotal: 1_500_000
    });

    // 3 days:
    // domestic: 1.5M + 3 * 700k = 3.6M
    // intl: 1.5M + 3 * 1.2M = 5.1M
    const domAdvice = buildTripAdvice([domesticDeal], { origin: "HAN", budget: 10_000_000, days: 3 });
    expect(domAdvice[0].estimatedTripBudget).toBe(3_600_000);
    expect(domAdvice[0].reason).toContain("700.000 VND/ngày");

    const intlAdvice = buildTripAdvice([internationalDeal], { origin: "HAN", budget: 10_000_000, days: 3 });
    expect(intlAdvice[0].estimatedTripBudget).toBe(5_100_000);
    expect(intlAdvice[0].reason).toContain("1.200.000 VND/ngày");
  });

  it("computes accurate budget remaining and enforces hard affordability gate", () => {
    const affordableDeal = makeDeal({ id: "ok", realTotal: 2_000_000, tripType: "domestic" }); // 2M + 2*700k = 3.4M
    const unaffordableDeal = makeDeal({ id: "expensive", realTotal: 5_000_000, tripType: "international" }); // 5M + 2*1.2M = 7.4M

    const advice = buildTripAdvice([affordableDeal, unaffordableDeal], { origin: "HAN", budget: 4_000_000, days: 2 });
    expect(advice).toHaveLength(1);
    expect(advice[0].deal.id).toBe("ok");
    expect(advice[0].budgetRemaining).toBe(600_000); // 4.0M - 3.4M = 600k
  });

  it("applies budget utilization penalty to fitScore", () => {
    // base score: 90
    // deal consumes 4,500,000 of 5,000,000 budget (90% utilization)
    // penalty: (4.5 / 5.0) * 10 = 9 points
    // fitScore: 90 - 9 = 81
    const deal = makeDeal({ realTotal: 2_100_000, tripType: "international", dealScore: 90 }); // 2.1M + 2*1.2M = 4.5M
    const advice = buildTripAdvice([deal], { origin: "HAN", budget: 5_000_000, days: 2 });

    expect(advice[0].fitScore).toBe(81);
  });

  it("safely clamps fitScore to [0, 100]", () => {
    // 3.5M + 700k = 4.2M (within 5M budget, 800k remaining)
    // baseScore: 5, budgetPenalty: (4.2 / 5.0) * 10 = 8.4 -> 5 - 8.4 = -3.4 -> clamped to 0
    const lowScoreDeal = makeDeal({ realTotal: 3_500_000, tripType: "domestic", dealScore: 5 });
    const advice = buildTripAdvice([lowScoreDeal], { origin: "HAN", budget: 5_000_000, days: 1 });

    expect(advice).toHaveLength(1);
    expect(advice[0].fitScore).toBe(0);
  });

  it("breaks fitScore ties by ranking lower estimatedTripBudget first", () => {
    const cheaperTrip = makeDeal({ id: "cheaper", to: "Bangkok", realTotal: 1_000_000, dealScore: 80, tripType: "domestic" }); // 1.0M + 700k = 1.7M
    const pricierTrip = makeDeal({ id: "pricier", to: "Đà Nẵng", realTotal: 2_000_000, dealScore: 80, tripType: "domestic" }); // 2.0M + 700k = 2.7M

    const advice = buildTripAdvice([pricierTrip, cheaperTrip], { origin: "HAN", budget: 50_000_000, days: 1 });
    // With 50M budget, budget penalties are both ~0, fitScore tied at 80
    expect(advice[0].deal.id).toBe("cheaper");
    expect(advice[1].deal.id).toBe("pricier");
  });
});
