export type DealLevel =
  | "NORMAL"
  | "WATCH"
  | "GOOD_DEAL"
  | "STRONG_DEAL"
  | "EXTREME_DEAL"
  | "SUSPICIOUS";

export type BuyAction =
  | "BUY_NOW"
  | "BUY_SOON"
  | "MONITOR"
  | "WAIT"
  | "AVOID"
  | "INSUFFICIENT_DATA";

export interface DealAssessment {
  baseline: number;
  discountPercent: number;
  level: DealLevel;
  score: number;
  confidence: number;
  suspicious: boolean;
}

export interface BuyDecisionInput {
  discountPercent: number;
  confidence: number;
  daysToDeparture: number;
  pricePercentile?: number;
  riskLevel?: "low" | "medium" | "high";
  historicalSamples: number;
}

export function median(values: number[]): number | undefined {
  const valid = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!valid.length) return undefined;
  const middle = Math.floor(valid.length / 2);
  return valid.length % 2 === 0 ? (valid[middle - 1] + valid[middle]) / 2 : valid[middle];
}

export function classifyDiscount(discountPercent: number): DealLevel {
  if (discountPercent < 10) return "NORMAL";
  if (discountPercent < 20) return "WATCH";
  if (discountPercent < 30) return "GOOD_DEAL";
  if (discountPercent < 40) return "STRONG_DEAL";
  return "EXTREME_DEAL";
}

export function assessDeal(input: {
  currentPrice: number;
  baselinePrice: number;
  comparableSamples: number;
  historicalSamples: number;
  riskPenalty?: number;
}): DealAssessment {
  if (input.currentPrice <= 0 || input.baselinePrice <= 0) {
    throw new Error("Prices must be greater than zero.");
  }
  if (input.comparableSamples < 0 || input.historicalSamples < 0) {
    throw new Error("Sample counts cannot be negative.");
  }

  const discountPercent = Math.max(0, (1 - input.currentPrice / input.baselinePrice) * 100);
  const samples = Math.max(input.comparableSamples, input.historicalSamples);
  const confidence = Math.min(0.95, 0.55 + Math.min(samples, 30) / 75);
  const suspicious = discountPercent >= 80 || input.currentPrice < input.baselinePrice * 0.1;
  const level = suspicious ? "SUSPICIOUS" : classifyDiscount(discountPercent);
  const score = Math.max(
    0,
    Math.min(100, Math.round(discountPercent * 1.7 + confidence * 30 - (input.riskPenalty ?? 0))),
  );

  return {
    baseline: input.baselinePrice,
    discountPercent,
    level,
    score,
    confidence,
    suspicious,
  };
}

export function calculateTotalCost(costs: number[]): number {
  if (costs.some((cost) => !Number.isFinite(cost) || cost < 0)) {
    throw new Error("Cost components must be finite and non-negative.");
  }
  return costs.reduce((total, cost) => total + cost, 0);
}

export function decideBuyAction(input: BuyDecisionInput): BuyAction {
  if (input.historicalSamples < 3 || input.confidence < 0.55) return "INSUFFICIENT_DATA";
  if (input.riskLevel === "high") return "AVOID";
  if (input.discountPercent >= 30 && input.confidence >= 0.75 && input.daysToDeparture <= 45) {
    return "BUY_NOW";
  }
  if (input.discountPercent >= 20 && input.confidence >= 0.65) return "BUY_SOON";
  if (input.pricePercentile != null && input.pricePercentile <= 25) return "MONITOR";
  return "WAIT";
}
