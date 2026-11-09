import { describe, expect, it } from 'vitest';
import {
  compareMoney,
  createMoney,
  formatMoney,
  IncompatibleMoneyComparisonError,
  normalizeToPerTraveler
} from './money';
import { calculateSavings } from './savings';

describe('Farely Pure Domain Kernel — Money & Savings Truth (REQ-DOM-001, REQ-DOM-006, NC-005)', () => {
  it('createMoney initializes valid Money with canonical defaults and integer rounding', () => {
    const m = createMoney(1850000.75);
    expect(m.amount).toBe(1850001);
    expect(m.currency).toBe('VND');
    expect(m.pricingUnit).toBe('PER_TRAVELER');

    const mUsd = createMoney(120, 'USD', 'PARTY_TOTAL');
    expect(mUsd.amount).toBe(120);
    expect(mUsd.currency).toBe('USD');
    expect(mUsd.pricingUnit).toBe('PARTY_TOTAL');
  });

  it('createMoney throws TypeError on negative, NaN, or non-finite amounts', () => {
    expect(() => createMoney(-100)).toThrowError(TypeError);
    expect(() => createMoney(Number.NaN)).toThrowError(TypeError);
    expect(() => createMoney(Number.POSITIVE_INFINITY)).toThrowError(TypeError);
  });

  it('NC-005: compareMoney throws IncompatibleMoneyComparisonError when comparing differing pricing units', () => {
    const perTraveler = createMoney(2000000, 'VND', 'PER_TRAVELER');
    const partyTotal = createMoney(4000000, 'VND', 'PARTY_TOTAL');

    expect(() => compareMoney(perTraveler, partyTotal)).toThrowError(IncompatibleMoneyComparisonError);
    expect(() => compareMoney(perTraveler, partyTotal)).toThrowError(
      /Cannot compare different pricing units: PER_TRAVELER vs PARTY_TOTAL/
    );
  });

  it('currency isolation: compareMoney throws IncompatibleMoneyComparisonError when currencies differ', () => {
    const vnd = createMoney(2000000, 'VND');
    const usd = createMoney(100, 'USD');

    expect(() => compareMoney(vnd, usd)).toThrowError(IncompatibleMoneyComparisonError);
    expect(() => compareMoney(vnd, usd)).toThrowError(/Cannot compare money in different currencies: VND vs USD/);
  });

  it('compareMoney returns negative, zero, or positive for compatible Money instances', () => {
    const m1 = createMoney(1500000);
    const m2 = createMoney(2000000);
    const m3 = createMoney(1500000);

    expect(compareMoney(m1, m2)).toBeLessThan(0);
    expect(compareMoney(m2, m1)).toBeGreaterThan(0);
    expect(compareMoney(m1, m3)).toBe(0);
  });

  it('normalizeToPerTraveler divides party total by traveler count and normalizes pricing unit', () => {
    const partyMoney = createMoney(7500000, 'VND', 'PARTY_TOTAL');
    const perPax = normalizeToPerTraveler(partyMoney, 3);

    expect(perPax.amount).toBe(2500000); // 7,500,000 / 3
    expect(perPax.pricingUnit).toBe('PER_TRAVELER');
    expect(perPax.currency).toBe('VND');
    // Original money object must NOT be mutated
    expect(partyMoney.pricingUnit).toBe('PARTY_TOTAL');
  });

  it('normalizeToPerTraveler throws RangeError when traveler count is <= 0', () => {
    const partyMoney = createMoney(5000000, 'VND', 'PARTY_TOTAL');

    expect(() => normalizeToPerTraveler(partyMoney, 0)).toThrowError(RangeError);
    expect(() => normalizeToPerTraveler(partyMoney, -2)).toThrowError(RangeError);
  });

  it('normalizeToPerTraveler is idempotent when pricingUnit is already PER_TRAVELER', () => {
    const singleMoney = createMoney(1800000, 'VND', 'PER_TRAVELER');
    const normalized = normalizeToPerTraveler(singleMoney, 4);

    expect(normalized).toBe(singleMoney); // Exact same reference
    expect(normalized.amount).toBe(1800000);
  });

  it('REQ-DOM-001: calculateSavings computes exact savings amount and rounded percent when deal exists', () => {
    // Benchmark 2,000,000 VND vs observed 1,600,000 VND (saving 400,000 VND = 20%)
    const savings = calculateSavings(1600000, 2000000);

    expect(savings.isSaving).toBe(true);
    expect(savings.savingsAmount).toBe(400000);
    expect(savings.savingsPercent).toBe(20);
    expect(savings.observedPrice).toBe(1600000);
    expect(savings.benchmarkPrice).toBe(2000000);
  });

  it('calculateSavings returns 0 savings and isSaving: false when observed price exceeds benchmark', () => {
    // Observed price 2,500,000 vs benchmark 2,000,000 (expensive, no deal)
    const savings = calculateSavings(2500000, 2000000);

    expect(savings.isSaving).toBe(false);
    expect(savings.savingsAmount).toBe(0);
    expect(savings.savingsPercent).toBe(0);
  });

  it('calculateSavings handles exact price parity with 0 savings', () => {
    const savings = calculateSavings(2000000, 2000000);

    expect(savings.isSaving).toBe(false);
    expect(savings.savingsAmount).toBe(0);
    expect(savings.savingsPercent).toBe(0);
  });

  it('calculateSavings defends against non-positive benchmark or observed prices', () => {
    const zeroBenchmark = calculateSavings(1500000, 0);
    expect(zeroBenchmark.isSaving).toBe(false);
    expect(zeroBenchmark.savingsAmount).toBe(0);

    const negativeBenchmark = calculateSavings(1500000, -2000000);
    expect(negativeBenchmark.isSaving).toBe(false);
    expect(negativeBenchmark.savingsAmount).toBe(0);

    const zeroObserved = calculateSavings(0, 2000000);
    expect(zeroObserved.isSaving).toBe(false);
    expect(zeroObserved.savingsAmount).toBe(0);
  });

  it('calculateSavings accurately calculates deep flash sale discounts', () => {
    // Flash sale: 700,000 VND vs benchmark 2,000,000 VND (saving 1,300,000 = 65%)
    const savings = calculateSavings(700000, 2000000);

    expect(savings.isSaving).toBe(true);
    expect(savings.savingsAmount).toBe(1300000);
    expect(savings.savingsPercent).toBe(65);
  });

  it('end-to-end: normalizes party total before valid money comparison and savings evaluation', () => {
    const partyFare = createMoney(8000000, 'VND', 'PARTY_TOTAL');
    const benchmarkPerPax = createMoney(2500000, 'VND', 'PER_TRAVELER');

    // Attempting raw comparison throws NC-005
    expect(() => compareMoney(partyFare, benchmarkPerPax)).toThrowError(IncompatibleMoneyComparisonError);

    // Normalize for 4 passengers
    const normalizedFare = normalizeToPerTraveler(partyFare, 4); // 2,000,000 VND per pax
    expect(compareMoney(normalizedFare, benchmarkPerPax)).toBeLessThan(0); // 2.0M < 2.5M

    // Compute savings
    const savings = calculateSavings(normalizedFare.amount, benchmarkPerPax.amount);
    expect(savings.isSaving).toBe(true);
    expect(savings.savingsAmount).toBe(500000);
    expect(savings.savingsPercent).toBe(20);
  });

  it('formatMoney formats VND and USD with proper locale separators and currency symbols', () => {
    const m1 = createMoney(2500000, 'VND');
    expect(formatMoney(m1)).toBe('2.500.000₫');

    const m2 = createMoney(150, 'USD');
    expect(formatMoney(m2)).toBe('$150');

    const mZeroVnd = createMoney(0, 'VND');
    expect(formatMoney(mZeroVnd)).toBe('0₫');

    const mZeroUsd = createMoney(0, 'USD');
    expect(formatMoney(mZeroUsd)).toBe('$0');
  });

  it('normalizeToPerTraveler supports OFFER_TOTAL pricing unit normalization', () => {
    const offerMoney = createMoney(9000000, 'VND', 'OFFER_TOTAL');
    const normalized = normalizeToPerTraveler(offerMoney, 3);

    expect(normalized.amount).toBe(3000000);
    expect(normalized.pricingUnit).toBe('PER_TRAVELER');
    expect(normalized.currency).toBe('VND');
  });

  it('createMoney and normalizeToPerTraveler enforce integer rounding on fractional division', () => {
    const party = createMoney(10000000, 'VND', 'PARTY_TOTAL');
    const perPax3 = normalizeToPerTraveler(party, 3);
    expect(perPax3.amount).toBe(3333333); // 10,000,000 / 3 = 3333333.333... rounded to 3333333

    const perPax6 = normalizeToPerTraveler(party, 6);
    expect(perPax6.amount).toBe(1666667); // 10,000,000 / 6 = 1666666.666... rounded to 1666667
  });

  it('createMoney accepts boundary value 0 as a valid non-negative amount', () => {
    const zeroMoney = createMoney(0);
    expect(zeroMoney.amount).toBe(0);
    expect(zeroMoney.currency).toBe('VND');
    expect(zeroMoney.pricingUnit).toBe('PER_TRAVELER');

    const otherZero = createMoney(0);
    expect(compareMoney(zeroMoney, otherZero)).toBe(0);
  });

  it('preserves pure immutability on Object.freeze protected Money objects', () => {
    const frozenM1 = Object.freeze(createMoney(2000000, 'VND', 'PARTY_TOTAL'));
    const frozenM2 = Object.freeze(createMoney(2500000, 'VND', 'PER_TRAVELER'));

    expect(() => formatMoney(frozenM1)).not.toThrow();
    expect(() => normalizeToPerTraveler(frozenM1, 2)).not.toThrow();
    const normalized = normalizeToPerTraveler(frozenM1, 2);
    expect(() => compareMoney(normalized, frozenM2)).not.toThrow();
    expect(frozenM1.amount).toBe(2000000);
  });

  it('benchmark: 10,000 money creation, comparison, and normalization operations in sub-50ms', () => {
    const party = createMoney(6000000, 'VND', 'PARTY_TOTAL');
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      const perTraveler = normalizeToPerTraveler(party, 3);
      compareMoney(perTraveler, perTraveler);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
