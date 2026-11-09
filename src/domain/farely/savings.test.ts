import { describe, expect, it } from 'vitest';
import { calculateSavings } from './savings';

describe('Farely Pure Domain Kernel — Savings & Relative Value (REQ-DOM-001)', () => {
  it('calculates positive savings and rounded percentage when observed < benchmark', () => {
    // 3,000,000 vs 5,000,000 -> 2,000,000 savings (40%)
    const result = calculateSavings(3000000, 5000000);

    expect(result).toEqual({
      observedPrice: 3000000,
      benchmarkPrice: 5000000,
      savingsAmount: 2000000,
      savingsPercent: 40,
      isSaving: true
    });
  });

  it('rounds percentage mathematically to nearest integer', () => {
    // 2,000,000 vs 3,000,000 -> 1,000,000 savings (33.333% -> 33%)
    const result1 = calculateSavings(2000000, 3000000);
    expect(result1.savingsPercent).toBe(33);

    // 1,000,000 vs 1,500,000 -> 500,000 savings (33.333% -> 33%)
    // 1,000,000 vs 3,000,000 -> 2,000,000 savings (66.666% -> 67%)
    const result2 = calculateSavings(1000000, 3000000);
    expect(result2.savingsPercent).toBe(67);
  });

  it('returns zero savings and isSaving: false when observedPrice >= benchmarkPrice', () => {
    // Exact equal price
    const equalResult = calculateSavings(5000000, 5000000);
    expect(equalResult).toEqual({
      observedPrice: 5000000,
      benchmarkPrice: 5000000,
      savingsAmount: 0,
      savingsPercent: 0,
      isSaving: false
    });

    // Higher observed price (no negative savings)
    const higherResult = calculateSavings(6000000, 5000000);
    expect(higherResult).toEqual({
      observedPrice: 6000000,
      benchmarkPrice: 5000000,
      savingsAmount: 0,
      savingsPercent: 0,
      isSaving: false
    });
  });

  it('safely handles non-positive benchmark price (<= 0)', () => {
    const zeroBenchmark = calculateSavings(2000000, 0);
    expect(zeroBenchmark).toEqual({
      observedPrice: 2000000,
      benchmarkPrice: 0,
      savingsAmount: 0,
      savingsPercent: 0,
      isSaving: false
    });

    const negativeBenchmark = calculateSavings(2000000, -5000000);
    expect(negativeBenchmark).toEqual({
      observedPrice: 2000000,
      benchmarkPrice: -5000000,
      savingsAmount: 0,
      savingsPercent: 0,
      isSaving: false
    });
  });

  it('safely handles non-positive observed price (<= 0) to prevent false 100% discount claims', () => {
    const zeroPrice = calculateSavings(0, 5000000);
    expect(zeroPrice).toEqual({
      observedPrice: 0,
      benchmarkPrice: 5000000,
      savingsAmount: 0,
      savingsPercent: 0,
      isSaving: false
    });

    const negativePrice = calculateSavings(-100000, 5000000);
    expect(negativePrice).toEqual({
      observedPrice: -100000,
      benchmarkPrice: 5000000,
      savingsAmount: 0,
      savingsPercent: 0,
      isSaving: false
    });
  });

  it('calculates deep discounts and flash sales accurately', () => {
    // 500,000 vs 5,000,000 -> 90% savings
    const flashSale = calculateSavings(500000, 5000000);
    expect(flashSale.savingsAmount).toBe(4500000);
    expect(flashSale.savingsPercent).toBe(90);
    expect(flashSale.isSaving).toBe(true);
  });

  it('handles micro-savings where savings is positive but percentage rounds to 0%', () => {
    // 9,995,000 vs 10,000,000 -> 5,000 savings (0.05% -> 0%)
    const microSavings = calculateSavings(9995000, 10000000);
    expect(microSavings.savingsAmount).toBe(5000);
    expect(microSavings.savingsPercent).toBe(0);
    expect(microSavings.isSaving).toBe(true);
  });
});
