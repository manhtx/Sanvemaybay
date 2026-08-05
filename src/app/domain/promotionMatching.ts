import { Deal } from "../data/deals";

export interface Promotion {
  id: string;
  provider: string;
  code?: string;
  originCodes?: string[];
  destinationCodes?: string[];
  airlineCodes?: string[];
  validFrom: string;
  validUntil: string;
  departureFrom?: string;
  departureUntil?: string;
  kind: "fixed" | "percent";
  amount: number;
  maxDiscount?: number;
  minimumFare?: number;
  conditions: string[];
}

export interface MatchedPromotion {
  promotion: Promotion;
  estimatedSaving: number;
}

function date(value: string): number {
  return Date.parse(value);
}

function includesOrUnrestricted(values: string[] | undefined, value: string): boolean {
  return !values?.length || values.includes(value);
}

export function matchPromotions(
  deal: Pick<Deal, "fromCode" | "toCode" | "airlineCode" | "departDate" | "price">,
  promotions: Promotion[],
  now = new Date(),
): MatchedPromotion[] {
  const current = now.getTime();
  const departure = date(deal.departDate);
  if (!Number.isFinite(departure) || !Number.isFinite(deal.price) || deal.price <= 0) return [];
  return promotions
    .filter((promotion) => {
      const validFrom = date(promotion.validFrom);
      const validUntil = date(promotion.validUntil);
      const departureFrom = promotion.departureFrom ? date(promotion.departureFrom) : -Infinity;
      const departureUntil = promotion.departureUntil ? date(promotion.departureUntil) : Infinity;
      return Number.isFinite(validFrom) && Number.isFinite(validUntil) &&
        current >= validFrom && current <= validUntil &&
        departure >= departureFrom && departure <= departureUntil &&
        includesOrUnrestricted(promotion.originCodes, deal.fromCode) &&
        includesOrUnrestricted(promotion.destinationCodes, deal.toCode) &&
        includesOrUnrestricted(promotion.airlineCodes, deal.airlineCode) &&
        (promotion.minimumFare == null || deal.price >= promotion.minimumFare) &&
        Number.isFinite(promotion.amount) && promotion.amount > 0;
    })
    .map((promotion) => {
      const rawSaving = promotion.kind === "percent"
        ? deal.price * Math.min(100, promotion.amount) / 100
        : promotion.amount;
      const estimatedSaving = Math.max(0, Math.min(deal.price, promotion.maxDiscount ?? rawSaving, rawSaving));
      return { promotion, estimatedSaving };
    })
    .filter((match) => match.estimatedSaving > 0)
    .sort((a, b) => b.estimatedSaving - a.estimatedSaving);
}
