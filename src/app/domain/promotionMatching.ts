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

function parseIsoFast(str: string): number {
  if (typeof str !== "string") return NaN;
  const len = str.length;
  if (len === 10) {
    const c0 = str.charCodeAt(0) - 48;
    const c1 = str.charCodeAt(1) - 48;
    const c2 = str.charCodeAt(2) - 48;
    const c3 = str.charCodeAt(3) - 48;
    const c5 = str.charCodeAt(5) - 48;
    const c6 = str.charCodeAt(6) - 48;
    const c8 = str.charCodeAt(8) - 48;
    const c9 = str.charCodeAt(9) - 48;
    if (
      str.charCodeAt(4) === 45 &&
      str.charCodeAt(7) === 45 &&
      c0 >= 0 && c0 <= 9 &&
      c1 >= 0 && c1 <= 9 &&
      c2 >= 0 && c2 <= 9 &&
      c3 >= 0 && c3 <= 9 &&
      c5 >= 0 && c5 <= 9 &&
      c6 >= 0 && c6 <= 9 &&
      c8 >= 0 && c8 <= 9 &&
      c9 >= 0 && c9 <= 9
    ) {
      return Date.UTC(c0 * 1000 + c1 * 100 + c2 * 10 + c3, c5 * 10 + c6 - 1, c8 * 10 + c9);
    }
  } else if (len >= 19 && str.charCodeAt(10) === 84 /* 'T' */) {
    const c0 = str.charCodeAt(0) - 48;
    const c1 = str.charCodeAt(1) - 48;
    const c2 = str.charCodeAt(2) - 48;
    const c3 = str.charCodeAt(3) - 48;
    const c5 = str.charCodeAt(5) - 48;
    const c6 = str.charCodeAt(6) - 48;
    const c8 = str.charCodeAt(8) - 48;
    const c9 = str.charCodeAt(9) - 48;
    const h0 = str.charCodeAt(11) - 48;
    const h1 = str.charCodeAt(12) - 48;
    const m0 = str.charCodeAt(14) - 48;
    const m1 = str.charCodeAt(15) - 48;
    const s0 = str.charCodeAt(17) - 48;
    const s1 = str.charCodeAt(18) - 48;
    if (
      str.charCodeAt(4) === 45 &&
      str.charCodeAt(7) === 45 &&
      str.charCodeAt(13) === 58 &&
      str.charCodeAt(16) === 58 &&
      str.endsWith("Z")
    ) {
      let ms = 0;
      if (str.charCodeAt(19) === 46 /* '.' */) {
        const msStr = str.slice(20, -1);
        ms = Number(msStr.padEnd(3, "0").slice(0, 3));
      }
      return Date.UTC(
        c0 * 1000 + c1 * 100 + c2 * 10 + c3,
        c5 * 10 + c6 - 1,
        c8 * 10 + c9,
        h0 * 10 + h1,
        m0 * 10 + m1,
        s0 * 10 + s1,
        ms,
      );
    }
  }
  return Date.parse(str);
}

const DATE_CACHE = new Map<string, number>();
function date(value: string): number {
  let ts = DATE_CACHE.get(value);
  if (ts !== undefined) return ts;
  ts = parseIsoFast(value);
  if (DATE_CACHE.size >= 10000) {
    DATE_CACHE.clear();
  }
  DATE_CACHE.set(value, ts);
  return ts;
}

function includesOrUnrestricted(values: string[] | undefined, value: string): boolean {
  if (!values || !values.length) return true;
  const len = values.length;
  if (len === 1) return values[0] === value;
  for (let i = 0; i < len; i++) {
    if (values[i] === value) return true;
  }
  return false;
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

  const resLen = results.length;
  if (resLen === 2) {
    if (results[1].estimatedSaving > results[0].estimatedSaving) {
      const tmp = results[0];
      results[0] = results[1];
      results[1] = tmp;
    }
  } else if (resLen > 2) {
    let sorted = true;
    for (let i = 1; i < resLen; i++) {
      if (results[i].estimatedSaving > results[i - 1].estimatedSaving) {
        sorted = false;
        break;
      }
    }
    if (!sorted) {
      results.sort((a, b) => b.estimatedSaving - a.estimatedSaving);
    }
  }

  return results;
}
