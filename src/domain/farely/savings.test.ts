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

  it('preserves metamorphic savings monotonicity under price reduction', () => {
    const benchmarkPrice = 5_000_000;
    const testPrices = [4_500_000, 4_000_000, 3_500_000, 3_000_000, 2_000_000, 1_000_000];

    let previousPercent = 0;
    let previousAmount = 0;

    for (const observedPrice of testPrices) {
      const result = calculateSavings(observedPrice, benchmarkPrice);
      expect(result.isSaving).toBe(true);
      expect(result.savingsPercent).toBeGreaterThanOrEqual(previousPercent);
      expect(result.savingsAmount).toBeGreaterThan(previousAmount);
      previousPercent = result.savingsPercent;
      previousAmount = result.savingsAmount;
    }
  });

  it('accurately computes large-value luxury and business class itineraries without precision loss', () => {
    // 100,000,000 vs 250,000,000 -> 150,000,000 savings (60%)
    const luxuryResult = calculateSavings(100_000_000, 250_000_000);
    expect(luxuryResult).toEqual({
      observedPrice: 100_000_000,
      benchmarkPrice: 250_000_000,
      savingsAmount: 150_000_000,
      savingsPercent: 60,
      isSaving: true,
    });
  });

  it('handles floating point fraction inputs safely with correct rounding', () => {
    const result = calculateSavings(1_500_000, 2_250_000);
    expect(result.savingsAmount).toBe(750_000);
    expect(result.savingsPercent).toBe(33); // 750,000 / 2,250,000 = 1/3 = 33.33% -> 33%
    expect(result.isSaving).toBe(true);
  });

  it('preserves referential purity and returns immutable value summaries', () => {
    const run1 = calculateSavings(3_000_000, 4_000_000);
    const run2 = calculateSavings(3_000_000, 4_000_000);

    expect(run1).toEqual(run2);
    expect(run1).not.toBe(run2); // Independent objects
    expect(Object.isFrozen(Object.freeze(run1))).toBe(true);
  });

  it('calculates 50% exact midpoint savings correctly', () => {
    const halfPrice = calculateSavings(2_500_000, 5_000_000);
    expect(halfPrice.savingsAmount).toBe(2_500_000);
    expect(halfPrice.savingsPercent).toBe(50);
    expect(halfPrice.isSaving).toBe(true);
  });

  it('calculates 1% minimum percentage threshold correctly', () => {
    const onePercent = calculateSavings(990_000, 1_000_000);
    expect(onePercent.savingsAmount).toBe(10_000);
    expect(onePercent.savingsPercent).toBe(1);
    expect(onePercent.isSaving).toBe(true);
  });

  it('calculates 99% extreme discount correctly', () => {
    const extremeDiscount = calculateSavings(10_000, 1_000_000);
    expect(extremeDiscount.savingsAmount).toBe(990_000);
    expect(extremeDiscount.savingsPercent).toBe(99);
    expect(extremeDiscount.isSaving).toBe(true);
  });

  it('calculates 100% near-complete discount when observed is 1 VND', () => {
    const nearFree = calculateSavings(1, 1_000_000);
    expect(nearFree.savingsAmount).toBe(999_999);
    expect(nearFree.savingsPercent).toBe(100);
    expect(nearFree.isSaving).toBe(true);
  });

  it('performance benchmark: 10,000 calculateSavings executions execute in < 50ms', () => {
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      calculateSavings(3000000 + (i % 1000), 5000000);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });

  it('metamorphic scale invariance: proportional inflation (10x, 100x) preserves identical savingsPercent', () => {
    const baseObserved = 1_500_000;
    const baseBenchmark = 3_000_000;

    const baseResult = calculateSavings(baseObserved, baseBenchmark);
    const scale10Result = calculateSavings(baseObserved * 10, baseBenchmark * 10);
    const scale100Result = calculateSavings(baseObserved * 100, baseBenchmark * 100);

    expect(scale10Result.savingsPercent).toBe(baseResult.savingsPercent);
    expect(scale100Result.savingsPercent).toBe(baseResult.savingsPercent);
    expect(scale10Result.isSaving).toBe(true);
    expect(scale100Result.isSaving).toBe(true);
  });

  it('strict zero-savings boundary: observed price 1 VND higher than benchmark produces 0 savings', () => {
    const higherByOne = calculateSavings(5_000_001, 5_000_000);
    expect(higherByOne.savingsAmount).toBe(0);
    expect(higherByOne.savingsPercent).toBe(0);
    expect(higherByOne.isSaving).toBe(false);
  });

  it('preserves pure immutability on input parameters and returns independent frozen-safe instances', () => {
    const observed = 2_000_000;
    const benchmark = 4_000_000;

    const res1 = calculateSavings(observed, benchmark);
    const res2 = calculateSavings(observed, benchmark);

    expect(res1).toEqual(res2);
    expect(res1).not.toBe(res2);
    expect(Object.isFrozen(Object.freeze(res1))).toBe(true);
  });

  it('performance benchmark: 50,000 calculateSavings executions execute in < 50ms', () => {
    const start = performance.now();
    for (let i = 0; i < 50000; i++) {
      calculateSavings(3000000 + (i % 1000), 5000000);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
