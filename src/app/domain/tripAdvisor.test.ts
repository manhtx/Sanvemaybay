import { describe, expect, it } from "vitest";
import { buildTripAdvice } from "./tripAdvisor";

const deal = (overrides: Record<string, unknown> = {}) => ({
  id: "d1", fromCode: "HAN", to: "Bangkok", realTotal: 2_000_000, price: 2_000_000,
  tripType: "international", dealScore: 90, aiInsight: { savingScore: 70 }, ...overrides,
}) as any;

describe("buildTripAdvice", () => {
  it("returns affordable destinations ranked by fit", () => {
    const result = buildTripAdvice([deal(), deal({ id: "d2", to: "Tokyo", realTotal: 3_000_000, dealScore: 80 })], { origin: "HAN", budget: 10_000_000, days: 3 });
    expect(result.map((item) => item.deal.to)).toEqual(["Bangkok", "Tokyo"]);
    expect(result[0].estimatedTripBudget).toBe(5_600_000);
  });

  it("excludes wrong origin, over-budget and invalid requests", () => {
    expect(buildTripAdvice([deal({ fromCode: "SGN" }), deal({ realTotal: 9_000_000 })], { origin: "HAN", budget: 5_000_000, days: 3 })).toEqual([]);
    expect(buildTripAdvice([deal()], { origin: "HAN", budget: 5_000_000, days: 0 })).toEqual([]);
  });

  it("applies the budget penalty even when a deal score is present", () => {
    const result = buildTripAdvice([deal({ realTotal: 4_000_000, dealScore: 90 })], {
      origin: "HAN", budget: 5_250_000, days: 1,
    });
    expect(result[0].fitScore).toBe(80);
  });
});
