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
  if (!Number.isFinite(input.budget) || input.budget <= 0 || !Number.isInteger(input.days) || input.days < 1) return [];
  return deals
    .filter((deal) => deal.fromCode === input.origin)
    .map((deal) => {
      const estimatedTripBudget = deal.realTotal + input.days * (deal.tripType === "domestic" ? 700_000 : 1_200_000);
      const budgetRemaining = input.budget - estimatedTripBudget;
      const baseScore = deal.dealScore ?? deal.aiInsight.savingScore;
      const budgetPenalty = Math.min(10, Math.max(0, estimatedTripBudget / input.budget * 10));
      const fitScore = Math.max(0, Math.min(100, Math.round(baseScore - budgetPenalty)));
      return {
        deal,
        estimatedTripBudget,
        budgetRemaining,
        fitScore,
        reason: `${deal.to} phù hợp vì giá vé và tổng chi phí đã biết nằm trong ngân sách; chi phí tại điểm đến được ước tính ${deal.tripType === "domestic" ? "700.000" : "1.200.000"} VND/ngày từ rule hiện tại.`,
      };
    })
    .filter((advice) => advice.budgetRemaining >= 0)
    .sort((a, b) => b.fitScore - a.fitScore || a.estimatedTripBudget - b.estimatedTripBudget);
}
