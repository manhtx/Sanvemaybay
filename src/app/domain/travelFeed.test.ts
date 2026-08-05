import { describe, expect, it } from "vitest";
import { rankTravelFeed } from "./travelFeed";

const deal = (id: string, toCode: string, score: number, observedAt: string) => ({ id, toCode, dealScore: score, observedAt, aiInsight: { savingScore: score } }) as any;

describe("rankTravelFeed", () => {
  it("ranks by score and diversifies destinations before repeats", () => {
    const result = rankTravelFeed([
      deal("bkk-low", "BKK", 70, "2026-08-03"),
      deal("bkk-high", "BKK", 95, "2026-08-01"),
      deal("tpe", "TPE", 80, "2026-08-02"),
    ]);
    expect(result.map((item) => item.id)).toEqual(["bkk-high", "tpe", "bkk-low"]);
  });

  it("keeps deterministic order when score or timestamp is malformed", () => {
    const result = rankTravelFeed([
      deal("invalid", "BKK", Number.NaN, "not-a-date"),
      deal("valid", "TPE", 10, "2026-08-01"),
    ]);
    expect(result.map((item) => item.id)).toEqual(["valid", "invalid"]);
  });
});
