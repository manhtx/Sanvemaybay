export type BuyRecommendation = "buy_now" | "wait";

export function decideBuyRecommendation(input: {
  discount: number;
  confidence: number;
  comparableSamples: number;
}): BuyRecommendation {
  if (
    !Number.isFinite(input.discount) ||
    !Number.isFinite(input.confidence) ||
    input.comparableSamples < 3
  ) return "wait";

  return input.discount >= 30 && input.confidence >= 0.75 ? "buy_now" : "wait";
}
