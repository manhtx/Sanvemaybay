import { describe, expect, it } from "vitest";
import { rankPersonalizedFeed } from "./travelFeed";
import { defaultPreferences } from "../lib/preferences";

const deal = (overrides: Record<string, unknown> = {}) => ({
  id: "base", fromCode: "HAN", toCode: "BKK", region: "asia", airlineCode: "VJ",
  price: 3_000_000, dealScore: 70, aiInsight: { savingScore: 70 }, stops: 0, duration: "2h 30m",
  observedAt: "2026-07-31T10:00:00Z", ...overrides,
}) as any;

describe("rankPersonalizedFeed", () => {
  it("promotes preference matches over a higher generic score", () => {
    const result = rankPersonalizedFeed([
      deal({ id: "generic", toCode: "NRT", region: "asia", dealScore: 85, airlineCode: "JL" }),
      deal({ id: "preferred", dealScore: 78, airlineCode: "VJ" }),
    ], { ...defaultPreferences, preferredAirlines: ["VJ"] });
    expect(result.map((item) => item.id)).toEqual(["preferred", "generic"]);
  });

  it("penalizes stop, duration and over-budget mismatches without filtering evidence out", () => {
    const result = rankPersonalizedFeed([deal({ id: "slow", stops: 2, duration: "8h 0m", price: 20_000_000 })], {
      ...defaultPreferences, maxStops: 0, maxFlightTimeMinutes: 300, budget: 5_000_000,
    });
    expect(result).toHaveLength(1);
  });
});
