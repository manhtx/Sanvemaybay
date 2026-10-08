/**
 * Farely Pure Domain Kernel — Money & Pricing Units
 * REQ-DOM-006, NC-005
 */

export type PricingUnit = 'PER_TRAVELER' | 'PARTY_TOTAL' | 'OFFER_TOTAL' | 'UNKNOWN_PRICING_SCOPE';
export type CurrencyCode = 'VND' | 'USD';

export interface Money {
  amount: number;
  currency: CurrencyCode;
  pricingUnit: PricingUnit;
}

export class IncompatibleMoneyComparisonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IncompatibleMoneyComparisonError';
  }
}

/**
 * Creates a valid Money object.
 */
export function createMoney(amount: number, currency: CurrencyCode = 'VND', pricingUnit: PricingUnit = 'PER_TRAVELER'): Money {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new TypeError(`Invalid money amount: ${amount}`);
  }
  return { amount: Math.round(amount), currency, pricingUnit };
}

/**
 * Normalizes money to PER_TRAVELER given the number of travelers and optional passenger composition.
 * D14: Does not assume flat child/infant pricing when normalizing party total.
 */
export function normalizeToPerTraveler(
  money: Money,
  travelerCount: number,
  paxComposition?: { adults: number; children: number; infants: number }
): Money {
  if (travelerCount <= 0) {
    throw new RangeError(`Traveler count must be positive, got ${travelerCount}`);
  }
  if (money.pricingUnit === 'UNKNOWN_PRICING_SCOPE') {
    throw new IncompatibleMoneyComparisonError('Cannot normalize UNKNOWN_PRICING_SCOPE to PER_TRAVELER');
  }
  if (money.pricingUnit === 'PER_TRAVELER') {
    return money;
  }
  if (paxComposition && (paxComposition.children > 0 || paxComposition.infants > 0)) {
    throw new IncompatibleMoneyComparisonError(
      'Cannot normalize PARTY_TOTAL to PER_TRAVELER with mixed passenger composition (children/infants) without passenger-specific fare evidence'
    );
  }
  return {
    amount: Math.round(money.amount / travelerCount),
    currency: money.currency,
    pricingUnit: 'PER_TRAVELER'
  };
}

/**
 * Compares two Money instances.
 * Invariant NC-005: 1-person pricing cannot silently compare against 2-person party total.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareMoney(a: Money, b: Money): number {
  if (a.currency !== b.currency) {
    throw new IncompatibleMoneyComparisonError(`Cannot compare money in different currencies: ${a.currency} vs ${b.currency}`);
  }
  if (a.pricingUnit !== b.pricingUnit) {
    throw new IncompatibleMoneyComparisonError(`Cannot compare different pricing units: ${a.pricingUnit} vs ${b.pricingUnit}. Normalize first.`);
  }
  return a.amount - b.amount;
}

/**
 * Formats money with Vietnamese or USD conventions.
 */
export function formatMoney(money: Money): string {
  if (money.currency === 'VND') {
    return `${money.amount.toLocaleString('vi-VN')}₫`;
  }
  return `$${money.amount.toLocaleString('en-US')}`;
}
