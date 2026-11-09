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
});
