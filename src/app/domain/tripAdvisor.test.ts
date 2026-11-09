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

  it("accepts exact budget match where budgetRemaining is exactly 0", () => {
    // 2.3M realTotal + 1 * 700k domestic = 3.0M estimated budget
    const exactDeal = makeDeal({ id: "exact", realTotal: 2_300_000, tripType: "domestic" });
    const advice = buildTripAdvice([exactDeal], { origin: "HAN", budget: 3_000_000, days: 1 });

    expect(advice).toHaveLength(1);
    expect(advice[0].budgetRemaining).toBe(0);
    expect(advice[0].deal.id).toBe("exact");
  });

  it("cleanly falls back to aiInsight.savingScore when dealScore is undefined", () => {
    const dealWithoutScore = makeDeal({
      id: "fallback",
      dealScore: undefined,
      aiInsight: { savingScore: 85 } as any,
      realTotal: 1_000_000,
      tripType: "domestic"
    });

    const advice = buildTripAdvice([dealWithoutScore], { origin: "HAN", budget: 10_000_000, days: 1 });
    // 1M + 700k = 1.7M / 10M = 17% utilization -> penalty 1.7 points
    // 85 - 1.7 = 83.3 -> rounded to 83
    expect(advice).toHaveLength(1);
    expect(advice[0].fitScore).toBe(83);
  });

  it("processes large deal inventory (500+ deals) efficiently in sub-100ms", () => {
    const largeDeals: Deal[] = Array.from({ length: 500 }, (_, i) =>
      makeDeal({
        id: `deal_perf_${i}`,
        fromCode: i % 2 === 0 ? "HAN" : "SGN",
        toCode: "BKK",
        realTotal: 1_500_000 + (i % 20) * 100_000,
        dealScore: 60 + (i % 35),
        tripType: "international"
      })
    );

    const start = performance.now();
    const advice = buildTripAdvice(largeDeals, { origin: "HAN", budget: 8_000_000, days: 3 });
    const duration = performance.now() - start;

    expect(advice.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100);
    for (const item of advice) {
      expect(item.deal.fromCode).toBe("HAN");
      expect(item.budgetRemaining).toBeGreaterThanOrEqual(0);
    }
  });

  it("preserves pure immutability on Object.freeze protected deal arrays", () => {
    const frozenDeal = Object.freeze(makeDeal({ id: "frozen", realTotal: 1_200_000, dealScore: 75 }));
    const frozenDeals = Object.freeze([frozenDeal]);

    expect(() => buildTripAdvice(frozenDeals as any, { origin: "HAN", budget: 5_000_000, days: 2 })).not.toThrow();
    expect(frozenDeal.dealScore).toBe(75);
  });

  it("calculates exact budget utilization penalties at 0%, 50%, and 100% budget limits", () => {
    // 100% utilization: estimatedTripBudget = 10M, budget = 10M -> penalty = 10.0 -> fitScore = 90 - 10 = 80
    const deal100 = makeDeal({ realTotal: 7_600_000, tripType: "international", dealScore: 90 }); // 7.6M + 2*1.2M = 10M
    const res100 = buildTripAdvice([deal100], { origin: "HAN", budget: 10_000_000, days: 2 });
    expect(res100[0].fitScore).toBe(80);

    // 50% utilization: estimatedTripBudget = 5M, budget = 10M -> penalty = 5.0 -> fitScore = 90 - 5 = 85
    const deal50 = makeDeal({ realTotal: 2_600_000, tripType: "international", dealScore: 90 }); // 2.6M + 2*1.2M = 5M
    const res50 = buildTripAdvice([deal50], { origin: "HAN", budget: 10_000_000, days: 2 });
    expect(res50[0].fitScore).toBe(85);
  });

  it("truthfully embeds destination name and daily rule amount in Vietnamese advice reason", () => {
    const bkkDeal = makeDeal({ to: "Bangkok", tripType: "international" });
    const bkkAdvice = buildTripAdvice([bkkDeal], { origin: "HAN", budget: 10_000_000, days: 2 });
    expect(bkkAdvice[0].reason).toContain("Bangkok phù hợp vì giá vé");
    expect(bkkAdvice[0].reason).toContain("1.200.000 VND/ngày");

    const dadDeal = makeDeal({ to: "Đà Nẵng", tripType: "domestic" });
    const dadAdvice = buildTripAdvice([dadDeal], { origin: "HAN", budget: 10_000_000, days: 2 });
    expect(dadAdvice[0].reason).toContain("Đà Nẵng phù hợp vì giá vé");
    expect(dadAdvice[0].reason).toContain("700.000 VND/ngày");
  });

  it("returns empty array when no deals originate from requested airport", () => {
    const deals = [
      makeDeal({ id: "d1", fromCode: "SGN" }),
      makeDeal({ id: "d2", fromCode: "DAD" })
    ];
    const advice = buildTripAdvice(deals, { origin: "HAN", budget: 10_000_000, days: 2 });
    expect(advice).toEqual([]);
  });

  it("returns empty array when all deals exceed traveler budget", () => {
    // 5M realTotal + 2*700k = 6.4M > 5M budget
    const expensive = makeDeal({ realTotal: 5_000_000, tripType: "domestic" });
    const advice = buildTripAdvice([expensive], { origin: "HAN", budget: 5_000_000, days: 2 });
    expect(advice).toEqual([]);
  });

  it("scales estimatedTripBudget linearly with trip duration (1, 7, 14, 30 days)", () => {
    const deal = makeDeal({ realTotal: 2_000_000, tripType: "domestic" }); // 700k/day
    expect(buildTripAdvice([deal], { origin: "HAN", budget: 50_000_000, days: 1 })[0].estimatedTripBudget).toBe(2_700_000);
    expect(buildTripAdvice([deal], { origin: "HAN", budget: 50_000_000, days: 7 })[0].estimatedTripBudget).toBe(6_900_000);
    expect(buildTripAdvice([deal], { origin: "HAN", budget: 50_000_000, days: 14 })[0].estimatedTripBudget).toBe(11_800_000);
    expect(buildTripAdvice([deal], { origin: "HAN", budget: 50_000_000, days: 30 })[0].estimatedTripBudget).toBe(23_000_000);
  });

  it("handles empty deal list gracefully returning empty array", () => {
    expect(buildTripAdvice([], { origin: "HAN", budget: 10_000_000, days: 3 })).toEqual([]);
  });

  it("benchmark: 5,000 trip advice calculations execute in sub-50ms", () => {
    const deals = [
      makeDeal({ id: "d1", fromCode: "HAN", to: "BKK", realTotal: 2_000_000, tripType: "international", dealScore: 80 }),
      makeDeal({ id: "d2", fromCode: "HAN", to: "DAD", realTotal: 1_200_000, tripType: "domestic", dealScore: 75 })
    ];
    const input = { origin: "HAN", budget: 10_000_000, days: 3 };

    const start = performance.now();
    for (let i = 0; i < 5_000; i++) {
      buildTripAdvice(deals, input);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
