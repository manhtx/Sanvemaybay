import { describe, expect, it } from "vitest";
import { buildTravelFeedSections } from "./travelFeedSections";
import { defaultPreferences } from "../lib/preferences";

const deal = (overrides: Record<string, unknown> = {}) => ({
  id: "a", from: "Hà Nội", fromCode: "HAN", to: "Bangkok", toCode: "BKK", country: "Thailand", region: "asia",
  price: 2_000_000, normalPrice: 3_000_000, discount: 33, currency: "VND", airline: "Air", airlineCode: "EA",
  departDate: "2026-10-01", duration: "2h", stops: 0, stopCity: null, seatsLeft: 0, expiresIn: "soon", image: "", flightNumber: "EA1",
  aiInsight: { reason: "data", tags: [], risk: "low", riskDetails: "", recommendation: "wait", recommendationNote: "", savingScore: 70 },
  hiddenCosts: [], advertisedTotal: 2_000_000, realTotal: 2_000_000, tripType: "international", ...overrides,
} as any);

describe("buildTravelFeedSections", () => {
  it("builds deterministic hot, latest, biggest-drop and personalized sections", () => {
    const sections = buildTravelFeedSections([
      deal({ id: "old", to: "Bangkok", toCode: "BKK", discount: 20, dealScore: 60, observedAt: "2026-01-01T00:00:00Z" }),
      deal({ id: "new", to: "Tokyo", toCode: "NRT", discount: 50, dealScore: 90, observedAt: "2026-01-03T00:00:00Z" }),
    ], defaultPreferences);
    expect(sections.hot[0].id).toBe("new");
    expect(sections.newlyDetected[0].id).toBe("new");
    expect(sections.biggestDrops[0].id).toBe("new");
    expect(sections.trendingDestinations).toHaveLength(2);
  });
});
