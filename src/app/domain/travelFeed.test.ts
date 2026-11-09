import { describe, expect, it } from "vitest";
import { rankTravelFeed } from "./travelFeed";

const deal = (
  id: string,
  toCode: string,
  score: number | undefined,
  observedAt: string,
  savingScore?: number,
) =>
  ({
    id,
    toCode,
    dealScore: score,
    observedAt,
    aiInsight: { savingScore: savingScore ?? score ?? 0 },
  }) as any;

describe("rankTravelFeed", () => {
  it("ranks by score and diversifies destinations before repeats", () => {
    const result = rankTravelFeed([
      deal("bkk-low", "BKK", 70, "2026-08-03"),
      deal("bkk-high", "BKK", 95, "2026-08-01"),
      deal("tpe", "TPE", 80, "2026-08-02"),
    ]);
    expect(result.map((item) => item.id)).toEqual(["bkk-high", "tpe", "bkk-low"]);
  });

  it("prioritizes dealScore over aiInsight.savingScore when dealScore is present", () => {
    const result = rankTravelFeed([
      // dealScore 90 beats savingScore 85
      deal("deal-canonical", "BKK", 90, "2026-08-01", 50),
      deal("deal-legacy", "SIN", undefined, "2026-08-01", 85),
    ]);
    expect(result.map((item) => item.id)).toEqual(["deal-canonical", "deal-legacy"]);
  });

  it("breaks score ties by newest observedAt timestamp", () => {
    const result = rankTravelFeed([
      deal("older", "BKK", 80, "2026-08-01T10:00:00Z"),
      deal("newer", "SIN", 80, "2026-08-02T10:00:00Z"),
      deal("oldest", "TPE", 80, "2026-07-31T10:00:00Z"),
    ]);
    expect(result.map((item) => item.id)).toEqual(["newer", "older", "oldest"]);
  });

  it("preserves 100% of deals without dropping any repeat destination alternatives", () => {
    const deals = [
      deal("bkk-1", "BKK", 90, "2026-08-01"),
      deal("bkk-2", "BKK", 85, "2026-08-01"),
      deal("bkk-3", "BKK", 70, "2026-08-01"),
      deal("sin-1", "SIN", 80, "2026-08-01"),
    ];
    const result = rankTravelFeed(deals);
    expect(result).toHaveLength(4);
    // Distinct destinations first (BKK, SIN), then secondary BKK deals
    expect(result.map((item) => item.id)).toEqual(["bkk-1", "sin-1", "bkk-2", "bkk-3"]);
  });

  it("keeps deterministic order when score or timestamp is malformed", () => {
    const result = rankTravelFeed([
      deal("invalid", "BKK", Number.NaN, "not-a-date"),
      deal("valid", "TPE", 10, "2026-08-01"),
    ]);
    expect(result.map((item) => item.id)).toEqual(["valid", "invalid"]);
  });

  it("handles empty arrays cleanly", () => {
    expect(rankTravelFeed([])).toEqual([]);
  });

  it("does not mutate the original input array", () => {
    const input = [
      deal("a", "BKK", 50, "2026-08-01"),
      deal("b", "SIN", 90, "2026-08-01"),
    ];
    Object.freeze(input);
    const result = rankTravelFeed(input);
    expect(result[0].id).toBe("b");
    expect(input[0].id).toBe("a");
  });
});
