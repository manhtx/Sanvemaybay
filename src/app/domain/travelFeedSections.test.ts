import { describe, expect, it } from "vitest";
import { buildTravelFeedSections } from "./travelFeedSections";
import { defaultPreferences } from "../lib/preferences";
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
  departDate: "2026-10-01",
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

describe("Farely Pure Domain — Curated Travel Feed Sections (REQ-SCORE-001, REQ-DOM-008)", () => {
  it("safely handles an empty deal set by returning empty arrays across all 5 sections", () => {
    const sections = buildTravelFeedSections([], defaultPreferences);

    expect(sections).toEqual({
      hot: [],
      newlyDetected: [],
      biggestDrops: [],
      recommendations: [],
      trendingDestinations: []
    });
  });

  it("strictly caps each section to at most 4 items regardless of inventory size", () => {
    const deals = Array.from({ length: 12 }, (_, i) =>
      makeDeal({
        id: `d_${i}`,
        toCode: `DEST_${i}`,
        dealScore: 50 + i,
        discount: 10 + i,
        observedAt: `2026-08-${String(i + 1).padStart(2, "0")}T00:00:00Z`
      })
    );

    const sections = buildTravelFeedSections(deals, defaultPreferences);

    expect(sections.hot).toHaveLength(4);
    expect(sections.newlyDetected).toHaveLength(4);
    expect(sections.biggestDrops).toHaveLength(4);
    expect(sections.recommendations).toHaveLength(4);
    expect(sections.trendingDestinations).toHaveLength(4);
  });

  it("ranks hot section by dealScore (with fallback to savingScore) descending", () => {
    const deals = [
      makeDeal({ id: "d_mid", dealScore: 75 }),
      makeDeal({ id: "d_top", dealScore: 95 }),
      makeDeal({ id: "d_low", dealScore: 60 }),
      makeDeal({ id: "d_fallback", dealScore: undefined, aiInsight: { savingScore: 85 } as any })
    ];

    const sections = buildTravelFeedSections(deals, defaultPreferences);
    expect(sections.hot.map((d) => d.id)).toEqual(["d_top", "d_fallback", "d_mid", "d_low"]);
  });

  it("ranks newlyDetected section by observedAt timestamp descending", () => {
    const deals = [
      makeDeal({ id: "d_old", observedAt: "2026-07-01T00:00:00Z" }),
      makeDeal({ id: "d_newest", observedAt: "2026-07-05T12:00:00Z" }),
      makeDeal({ id: "d_recent", observedAt: "2026-07-03T08:00:00Z" }),
      makeDeal({ id: "d_no_timestamp", observedAt: undefined })
    ];

    const sections = buildTravelFeedSections(deals, defaultPreferences);
    expect(sections.newlyDetected[0].id).toBe("d_newest");
    expect(sections.newlyDetected[1].id).toBe("d_recent");
    expect(sections.newlyDetected[2].id).toBe("d_old");
    expect(sections.newlyDetected[3].id).toBe("d_no_timestamp");
  });

  it("ranks biggestDrops section by discount percentage descending", () => {
    const deals = [
      makeDeal({ id: "d_small", discount: 15 }),
      makeDeal({ id: "d_huge", discount: 65 }),
      makeDeal({ id: "d_med", discount: 40 })
    ];

    const sections = buildTravelFeedSections(deals, defaultPreferences);
    expect(sections.biggestDrops.map((d) => d.id)).toEqual(["d_huge", "d_med", "d_small"]);
  });

  it("deduplicates trendingDestinations by destination, selecting the highest-scoring deal per city", () => {
    const deals = [
      // 3 deals to Bangkok, highest score is 92
      makeDeal({ id: "bkk_low", toCode: "BKK", to: "Bangkok", dealScore: 70 }),
      makeDeal({ id: "bkk_top", toCode: "BKK", to: "Bangkok", dealScore: 92 }),
      makeDeal({ id: "bkk_mid", toCode: "BKK", to: "Bangkok", dealScore: 80 }),

      // 2 deals to Tokyo, highest score is 88
      makeDeal({ id: "tyo_low", toCode: "NRT", to: "Tokyo", dealScore: 65 }),
      makeDeal({ id: "tyo_top", toCode: "NRT", to: "Tokyo", dealScore: 88 }),

      // 1 deal to Singapore
      makeDeal({ id: "sin_only", toCode: "SIN", to: "Singapore", dealScore: 85 })
    ];

    const sections = buildTravelFeedSections(deals, defaultPreferences);

    // Trending destinations must contain exactly 3 distinct destinations
    expect(sections.trendingDestinations).toHaveLength(3);
    expect(sections.trendingDestinations[0].id).toBe("bkk_top"); // 92
    expect(sections.trendingDestinations[1].id).toBe("tyo_top"); // 88
    expect(sections.trendingDestinations[2].id).toBe("sin_only"); // 85
  });

  it("falls back to destination name (to) when toCode is empty or undefined in trendingDestinations", () => {
    const deals = [
      makeDeal({ id: "d1", to: "Phú Quốc", toCode: "", dealScore: 80 }),
      makeDeal({ id: "d2", to: "Phú Quốc", toCode: "", dealScore: 90 })
    ];

    const sections = buildTravelFeedSections(deals, defaultPreferences);
    expect(sections.trendingDestinations).toHaveLength(1);
    expect(sections.trendingDestinations[0].id).toBe("d2"); // Higher score selected
  });
});
