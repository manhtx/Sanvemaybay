import { describe, it, expect } from 'vitest';
import {
  createMoney,
  normalizeToPerTraveler,
  compareMoney,
  formatMoney,
  IncompatibleMoneyComparisonError,
  type Money,
} from './money';

describe('Farely Pure Domain Kernel — Money (WP02-MONEY-PRECISION-SANITIZATION)', () => {
  describe('createMoney', () => {
    it('creates valid Money instances for VND and USD with casing normalization', () => {
      const mVND = createMoney(1500000, 'vnd' as any);
      expect(mVND.amount).toBe(1500000);
      expect(mVND.currency).toBe('VND');
      expect(mVND.pricingUnit).toBe('PER_TRAVELER');

      const mUSD = createMoney(100.4, 'usd' as any);
      expect(mUSD.amount).toBe(100);
      expect(mUSD.currency).toBe('USD');
    });

    it('rejects unsupported currencies with IncompatibleMoneyComparisonError', () => {
      expect(() => createMoney(100, 'EUR' as any)).toThrow(IncompatibleMoneyComparisonError);
      expect(() => createMoney(100, 'THB' as any)).toThrow(IncompatibleMoneyComparisonError);
    });

    it('rejects negative, NaN, and infinite amounts', () => {
      expect(() => createMoney(-1000)).toThrow(TypeError);
      expect(() => createMoney(NaN)).toThrow(TypeError);
      expect(() => createMoney(Infinity)).toThrow(TypeError);
    });

    it('normalizes signed zero to standard 0', () => {
      const mZero = createMoney(-0);
      expect(mZero.amount).toBe(0);
      expect(Object.is(mZero.amount, -0)).toBe(false);
    });
  });

  describe('normalizeToPerTraveler', () => {
    it('divides party total by traveler count', () => {
      const partyMoney: Money = { amount: 3000000, currency: 'VND', pricingUnit: 'PARTY_TOTAL' };
      const normalized = normalizeToPerTraveler(partyMoney, 2);
      expect(normalized.amount).toBe(1500000);
      expect(normalized.pricingUnit).toBe('PER_TRAVELER');
    });

    it('passes through PER_TRAVELER without modification', () => {
      const perTraveler: Money = { amount: 1500000, currency: 'VND', pricingUnit: 'PER_TRAVELER' };
      const result = normalizeToPerTraveler(perTraveler, 2);
      expect(result).toBe(perTraveler);
    });

    it('rejects non-positive or non-integer traveler count', () => {
      const m = createMoney(1000000);
      expect(() => normalizeToPerTraveler(m, 0)).toThrow(RangeError);
      expect(() => normalizeToPerTraveler(m, -1)).toThrow(RangeError);
      expect(() => normalizeToPerTraveler(m, 1.5)).toThrow(RangeError);
    });

    it('D14 / NC-005: refuses flat division when mixed with children or infants', () => {
      const partyMoney: Money = { amount: 5000000, currency: 'VND', pricingUnit: 'PARTY_TOTAL' };
      expect(() =>
        normalizeToPerTraveler(partyMoney, 3, { adults: 2, children: 1, infants: 0 })
      ).toThrow(IncompatibleMoneyComparisonError);
      expect(() =>
        normalizeToPerTraveler(partyMoney, 3, { adults: 2, children: 0, infants: 1 })
      ).toThrow(IncompatibleMoneyComparisonError);
    });

    it('rejects UNKNOWN_PRICING_SCOPE normalization', () => {
      const unknownMoney: Money = { amount: 2000000, currency: 'VND', pricingUnit: 'UNKNOWN_PRICING_SCOPE' };
      expect(() => normalizeToPerTraveler(unknownMoney, 1)).toThrow(IncompatibleMoneyComparisonError);
    });
  });

  describe('compareMoney', () => {
    it('compares amounts when currency and pricing units match', () => {
      const m1 = createMoney(1000000);
      const m2 = createMoney(2000000);
      expect(compareMoney(m1, m2)).toBeLessThan(0);
      expect(compareMoney(m2, m1)).toBeGreaterThan(0);
      expect(compareMoney(m1, m1)).toBe(0);
    });

    it('rejects currency mismatch', () => {
      const mVND = createMoney(1000000, 'VND');
      const mUSD = createMoney(50, 'USD');
      expect(() => compareMoney(mVND, mUSD)).toThrow(IncompatibleMoneyComparisonError);
    });

    it('NC-005: rejects comparison between different pricing units', () => {
      const mPer = { amount: 1000000, currency: 'VND' as const, pricingUnit: 'PER_TRAVELER' as const };
      const mParty = { amount: 1000000, currency: 'VND' as const, pricingUnit: 'PARTY_TOTAL' as const };
      expect(() => compareMoney(mPer, mParty)).toThrow(IncompatibleMoneyComparisonError);
    });

    it('rejects invalid or undefined operands', () => {
      const m = createMoney(1000000);
      expect(() => compareMoney(m, null as any)).toThrow(IncompatibleMoneyComparisonError);
      expect(() => compareMoney(undefined as any, m)).toThrow(IncompatibleMoneyComparisonError);
      expect(() => compareMoney({ ...m, amount: NaN }, m)).toThrow(IncompatibleMoneyComparisonError);
    });
  });

  describe('formatMoney', () => {
    it('formats VND with Vietnamese locale conventions', () => {
      expect(formatMoney(createMoney(2000000, 'VND'))).toContain('₫');
    });

    it('formats USD with dollar sign conventions', () => {
      expect(formatMoney(createMoney(150, 'USD'))).toBe('$150');
    });

    it('handles negative or non-finite inputs defensively', () => {
      expect(formatMoney({ amount: NaN, currency: 'VND', pricingUnit: 'PER_TRAVELER' })).toBe('0₫');
      expect(formatMoney({ amount: -500, currency: 'VND', pricingUnit: 'PER_TRAVELER' })).toBe('0₫');
    });
  });
});
