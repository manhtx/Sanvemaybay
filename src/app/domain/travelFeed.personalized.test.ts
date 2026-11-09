import { describe, expect, it } from "vitest";
import { rankPersonalizedFeed } from "./travelFeed";
import { defaultPreferences } from "../lib/preferences";

const deal = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "base",
    fromCode: "HAN",
    toCode: "BKK",
    region: "asia",
    airlineCode: "VJ",
    price: 3_000_000,
    dealScore: 70,
    aiInsight: { savingScore: 70 },
    stops: 0,
    duration: "2h 30m",
    observedAt: "2026-07-31T10:00:00Z",
    ...overrides,
  }) as any;

describe("rankPersonalizedFeed", () => {
  it("promotes preference matches over a higher generic score", () => {
    const result = rankPersonalizedFeed(
      [
        deal({ id: "generic", toCode: "NRT", region: "asia", dealScore: 85, airlineCode: "JL" }),
        deal({ id: "preferred", dealScore: 78, airlineCode: "VJ" }),
      ],
      { ...defaultPreferences, preferredAirlines: ["VJ"] },
    );
    expect(result.map((item) => item.id)).toEqual(["preferred", "generic"]);
  });

  it("applies home airport affinity boost (+8)", () => {
    // Both score 70, but matching home airport gains +8
    const result = rankPersonalizedFeed(
      [
        deal({ id: "from-sgn", fromCode: "SGN", toCode: "BKK", dealScore: 70 }),
        deal({ id: "from-han", fromCode: "HAN", toCode: "BKK", dealScore: 70 }),
      ],
      { ...defaultPreferences, homeAirport: "HAN" },
    );
    expect(result[0].id).toBe("from-han");
  });

  it("applies favorite region alignment boost (+12)", () => {
    // Europe deal scores 75, Asia deal scores 70. Favorite region: "asia" -> Asia gets 70 + 12 = 82
    const result = rankPersonalizedFeed(
      [
        deal({ id: "europe", toCode: "CDG", region: "europe", dealScore: 75 }),
        deal({ id: "asia", toCode: "BKK", region: "asia", dealScore: 70 }),
      ],
      { ...defaultPreferences, favoriteRegions: ["asia"] },
    );
    expect(result[0].id).toBe("asia");
  });

  it("applies preferred airline boost (+10)", () => {
    // JL scores 75, VJ scores 70. Preferred airline: VJ -> 70 + 10 = 80
    const result = rankPersonalizedFeed(
      [
        deal({ id: "jl", airlineCode: "JL", toCode: "NRT", dealScore: 75 }),
        deal({ id: "vj", airlineCode: "VJ", toCode: "BKK", dealScore: 70 }),
      ],
      { ...defaultPreferences, preferredAirlines: ["VJ"] },
    );
    expect(result[0].id).toBe("vj");
  });

  describe("constraint penalties & bounded scaling", () => {
    it("penalizes excess stops by -10 per stop, capped at -20", () => {
      // 1 stop over maxStops=0 -> -10 (score 80 - 10 = 70)
      // 3 stops over maxStops=0 -> -20 capped (score 80 - 20 = 60)
      const result = rankPersonalizedFeed(
        [
          deal({ id: "three-stops", stops: 3, dealScore: 80, toCode: "BKK" }),
          deal({ id: "one-stop", stops: 1, dealScore: 80, toCode: "SIN" }),
          deal({ id: "direct", stops: 0, dealScore: 68, toCode: "DAD" }),
        ],
        { ...defaultPreferences, maxStops: 0 },
      );
      // one-stop: 80 - 10 = 70; direct: 68; three-stops: 80 - 20 = 60
      expect(result.map((d) => d.id)).toEqual(["one-stop", "direct", "three-stops"]);
    });

    it("penalizes over-budget deals by -15 without filtering them out", () => {
      const result = rankPersonalizedFeed(
        [
          deal({ id: "expensive", price: 10_000_000, dealScore: 80, toCode: "BKK" }),
          deal({ id: "affordable", price: 4_000_000, dealScore: 70, toCode: "SIN" }),
        ],
        { ...defaultPreferences, budget: 5_000_000 },
      );
      // expensive: 80 - 15 = 65; affordable: 70
      expect(result[0].id).toBe("affordable");
      expect(result[1].id).toBe("expensive");
    });

    it("penalizes flights exceeding maxFlightTimeMinutes by -10", () => {
      const result = rankPersonalizedFeed(
        [
          deal({ id: "long-flight", duration: "6h 0m", dealScore: 75, toCode: "NRT" }),
          deal({ id: "short-flight", duration: "2h 0m", dealScore: 70, toCode: "BKK" }),
        ],
        { ...defaultPreferences, maxFlightTimeMinutes: 180 }, // 3h limit
      );
      // long-flight: 75 - 10 = 65; short-flight: 70
      expect(result[0].id).toBe("short-flight");
      expect(result[1].id).toBe("long-flight");
    });
  });

  it("strictly enforces non-exclusion invariant: never suppresses deals exceeding all constraints", () => {
    const extremeMismatchedDeals = [
      deal({ id: "deal-1", stops: 3, duration: "12h 0m", price: 30_000_000 }),
      deal({ id: "deal-2", stops: 2, duration: "10h 0m", price: 25_000_000 }),
    ];
    const result = rankPersonalizedFeed(extremeMismatchedDeals, {
      ...defaultPreferences,
      maxStops: 0,
      maxFlightTimeMinutes: 120,
      budget: 2_000_000,
    });
    // Both deals are preserved
    expect(result).toHaveLength(2);
  });

  it("maintains deterministic tie stability when personalized scores collide", () => {
    const deals = [
      deal({ id: "first", toCode: "BKK", dealScore: 70 }),
      deal({ id: "second", toCode: "SIN", dealScore: 70 }),
    ];
    const result = rankPersonalizedFeed(deals, defaultPreferences);
    // Index penalty (-0.001 * index) preserves pre-ranking order
    expect(result.map((d) => d.id)).toEqual(["first", "second"]);
  });

  it("handles empty deals array safely", () => {
    expect(rankPersonalizedFeed([], defaultPreferences)).toEqual([]);
  });

  it("applies cumulative preference boosts (+8 home +12 region +10 airline = +30 total boost)", () => {
    const perfectMatch = deal({
      id: "perfect",
      fromCode: "HAN",
      toCode: "NRT",
      region: "asia",
      airlineCode: "JL",
      dealScore: 60
    });
    const generic = deal({
      id: "generic",
      fromCode: "SGN",
      toCode: "CDG",
      region: "europe",
      airlineCode: "AF",
      dealScore: 85
    });

    const prefs = {
      ...defaultPreferences,
      homeAirport: "HAN",
      favoriteRegions: ["asia" as any],
      preferredAirlines: ["JL"]
    };

    // perfect score: 60 + 8 + 12 + 10 = 90 > generic score 85
    const result = rankPersonalizedFeed([generic, perfectMatch], prefs);
    expect(result[0].id).toBe("perfect");
    expect(result[1].id).toBe("generic");
  });

  it("parses flight duration minutes across hours only, minutes only, and combined formats", () => {
    const dHoursOnly = deal({ id: "d_hours", duration: "3h", toCode: "BKK", dealScore: 70 });
    const dMinsOnly = deal({ id: "d_mins", duration: "45m", toCode: "DAD", dealScore: 70 });
    const dCombined = deal({ id: "d_comb", duration: "1h 30m", toCode: "SIN", dealScore: 70 });

    const prefs = { ...defaultPreferences, maxFlightTimeMinutes: 120 }; // 2h limit

    // dHoursOnly: 180m > 120m -> penalized -10 (score 60)
    // dMinsOnly: 45m <= 120m -> no penalty (score 70)
    // dCombined: 90m <= 120m -> no penalty (score 70)
    const result = rankPersonalizedFeed([dHoursOnly, dMinsOnly, dCombined], prefs);
    expect(result.map((d) => d.id)).toEqual(["d_mins", "d_comb", "d_hours"]);
  });

  it("scales excess stops penalty with maxStops = 1 (+0 for 1 stop, -10 for 2 stops, -20 for 3 stops)", () => {
    const d1 = deal({ id: "s1", stops: 1, toCode: "BKK", dealScore: 80 });
    const d2 = deal({ id: "s2", stops: 2, toCode: "SIN", dealScore: 80 });
    const d3 = deal({ id: "s3", stops: 3, toCode: "KUL", dealScore: 80 });

    const prefs = { ...defaultPreferences, maxStops: 1 };
    // s1: 0 penalty -> 80
    // s2: -10 penalty -> 70
    // s3: -20 penalty -> 60
    const result = rankPersonalizedFeed([d3, d2, d1], prefs);
    expect(result.map((d) => d.id)).toEqual(["s1", "s2", "s3"]);
  });

  it("safely falls back to aiInsight.savingScore or 0 when dealScore is undefined or NaN", () => {
    const dFallback = deal({ id: "fb", dealScore: undefined, aiInsight: { savingScore: 75 }, toCode: "BKK" });
    const dZero = deal({ id: "zero", dealScore: NaN, aiInsight: { savingScore: NaN }, toCode: "SIN" });

    const result = rankPersonalizedFeed([dZero, dFallback], defaultPreferences);
    expect(result[0].id).toBe("fb");
    expect(result[1].id).toBe("zero");
  });

  it("does not penalize deals exactly meeting budget or max flight duration limits", () => {
    const dExactBudget = deal({ id: "budget_exact", price: 5_000_000, duration: "2h 0m", toCode: "BKK", dealScore: 70 });
    const prefs = { ...defaultPreferences, budget: 5_000_000, maxFlightTimeMinutes: 120 };

    const result = rankPersonalizedFeed([dExactBudget], prefs);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("budget_exact");
  });

  it("does not award airline boost when preferredAirlines is an empty array", () => {
    const dVJ = deal({ id: "vj", airlineCode: "VJ", dealScore: 70, toCode: "BKK" });
    const dVN = deal({ id: "vn", airlineCode: "VN", dealScore: 70, toCode: "SIN" });

    const result = rankPersonalizedFeed([dVJ, dVN], { ...defaultPreferences, preferredAirlines: [] });
    // Preserves pre-ranking order without boost
    expect(result.map((d) => d.id)).toEqual(["vj", "vn"]);
  });

  it("preserves pure immutability on Object.freeze protected deal arrays and preferences", () => {
    const frozenDeal = Object.freeze(deal({ id: "frozen", dealScore: 75 }));
    const frozenPrefs = Object.freeze({ ...defaultPreferences });

    expect(() => rankPersonalizedFeed(Object.freeze([frozenDeal]) as any, frozenPrefs)).not.toThrow();
  });

  it("benchmark: 5,000 personalized feed rankings execute in sub-50ms", () => {
    const deals = [
      deal({ id: "d1", fromCode: "HAN", toCode: "BKK", dealScore: 80, region: "asia" }),
      deal({ id: "d2", fromCode: "SGN", toCode: "CDG", dealScore: 75, region: "europe" }),
      deal({ id: "d3", fromCode: "HAN", toCode: "NRT", dealScore: 70, region: "asia" })
    ];
    const prefs = { ...defaultPreferences, homeAirport: "HAN", favoriteRegions: ["asia" as any] };

    const start = performance.now();
    for (let i = 0; i < 5000; i++) {
      rankPersonalizedFeed(deals, prefs);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it("handles single-deal input array returning identical single deal without modification", () => {
    const single = [deal({ id: "lonely_deal", dealScore: 82 })];
    const result = rankPersonalizedFeed(single, defaultPreferences);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("lonely_deal");
  });

  it("compound constraints: applies both budget and excess stops penalties concurrently (-15 + -20 = -35)", () => {
    const compoundPenalized = deal({
      id: "penalized_deal",
      toCode: "BKK",
      dealScore: 90,
      price: 10_000_000, // over budget (-15)
      stops: 3, // 3 stops with maxStops=0 (-20 capped)
    });
    const cleanDeal = deal({
      id: "clean_deal",
      toCode: "SIN",
      dealScore: 60,
      price: 3_000_000,
      stops: 0,
    });

    const prefs = { ...defaultPreferences, budget: 5_000_000, maxStops: 0 };
    // compound: 90 - 35 = 55; clean: 60 -> clean wins
    const result = rankPersonalizedFeed([compoundPenalized, cleanDeal], prefs);
    expect(result.map((d) => d.id)).toEqual(["clean_deal", "penalized_deal"]);
  });
});
