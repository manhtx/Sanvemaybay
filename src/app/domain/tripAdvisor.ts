import { Deal } from "../data/deals";

export interface TripAdvice {
  deal: Deal;
  estimatedTripBudget: number;
  budgetRemaining: number;
  fitScore: number;
  reason: string;
}

export function buildTripAdvice(deals: Deal[], input: {
  origin: string;
  budget: number;
  days: number;
}): TripAdvice[] {
  const budget = input.budget;
  const days = input.days;
  if (!Number.isFinite(budget) || budget <= 0 || !Number.isInteger(days) || days < 1) return [];

  const origin = input.origin;
  const len = deals.length;
  const results: TripAdvice[] = [];
  const domesticDayCost = days * 700_000;
  const intlDayCost = days * 1_200_000;

  for (let i = 0; i < len; i++) {
    const d = deals[i];
    if (d.fromCode !== origin) continue;
    const isDomestic = d.tripType === "domestic";
    const estimatedTripBudget = d.realTotal + (isDomestic ? domesticDayCost : intlDayCost);
    const budgetRemaining = budget - estimatedTripBudget;
    if (budgetRemaining < 0) continue;

    const baseScore = Number(d.dealScore ?? d.aiInsight?.savingScore) || 0;
    const budgetPenalty = Math.min(10, Math.max(0, (estimatedTripBudget / budget) * 10));
    const fitScore = Math.max(0, Math.min(100, Math.round(baseScore - budgetPenalty)));

    results.push({
      deal: d,
      estimatedTripBudget,
      budgetRemaining,
      fitScore,
      reason: `${d.to} phù hợp vì giá vé và tổng chi phí đã biết nằm trong ngân sách; chi phí tại điểm đến được ước tính ${isDomestic ? "700.000" : "1.200.000"} VND/ngày từ rule hiện tại.`,
    });
  }

  const resLen = results.length;
  if (resLen === 2) {
    const a = results[0];
    const b = results[1];
    if (b.fitScore > a.fitScore || (b.fitScore === a.fitScore && a.estimatedTripBudget > b.estimatedTripBudget)) {
      results[0] = b;
      results[1] = a;
    }
  } else if (resLen > 2) {
    results.sort((a, b) => b.fitScore - a.fitScore || a.estimatedTripBudget - b.estimatedTripBudget);
  }

  return results;
}
