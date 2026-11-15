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

const DATE_CACHE = new Map<string, number>();
function date(value: string): number {
  let ts = DATE_CACHE.get(value);
  if (ts !== undefined) return ts;
  ts = Date.parse(value);
  if (DATE_CACHE.size < 500) {
    DATE_CACHE.set(value, ts);
  }
  return ts;
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

  const results: MatchedPromotion[] = [];
  const len = promotions.length;

  for (let i = 0; i < len; i++) {
    const promotion = promotions[i];
    if (!Number.isFinite(promotion.amount) || promotion.amount <= 0) continue;
    if (promotion.minimumFare != null && deal.price < promotion.minimumFare) continue;

    const validFrom = date(promotion.validFrom);
    const validUntil = date(promotion.validUntil);
    if (!Number.isFinite(validFrom) || !Number.isFinite(validUntil)) continue;
    if (current < validFrom || current > validUntil) continue;

    const departureFrom = promotion.departureFrom ? date(promotion.departureFrom) : -Infinity;
    const departureUntil = promotion.departureUntil ? date(promotion.departureUntil) : Infinity;
    if (departure < departureFrom || departure > departureUntil) continue;

    if (!includesOrUnrestricted(promotion.originCodes, deal.fromCode)) continue;
    if (!includesOrUnrestricted(promotion.destinationCodes, deal.toCode)) continue;
    if (!includesOrUnrestricted(promotion.airlineCodes, deal.airlineCode)) continue;

    const rawSaving = promotion.kind === "percent"
      ? (deal.price * Math.min(100, promotion.amount)) / 100
      : promotion.amount;
    const estimatedSaving = Math.max(0, Math.min(deal.price, promotion.maxDiscount ?? rawSaving, rawSaving));

    if (estimatedSaving > 0) {
      results.push({ promotion, estimatedSaving });
    }
  }

  if (results.length > 1) {
    results.sort((a, b) => b.estimatedSaving - a.estimatedSaving);
  }

  return results;
}
