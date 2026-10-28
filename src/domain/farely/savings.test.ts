import { describe, it, expect } from 'vitest';
import { calculateSavings } from './savings';

describe('Farely Pure Domain Kernel — Savings (WP03-SAVINGS-RELATIVE-VALUE-BOUNDS)', () => {
  it('guards against IEEE 754 NaN inputs without crashing or leaking NaN', () => {
    const resObsNaN = calculateSavings(NaN, 2000000);
    expect(resObsNaN.savingsAmount).toBe(0);
    expect(resObsNaN.savingsPercent).toBe(0);
    expect(resObsNaN.isSaving).toBe(false);
    expect(resObsNaN.observedPrice).toBe(0);

    const resBenchNaN = calculateSavings(1500000, NaN);
    expect(resBenchNaN.savingsAmount).toBe(0);
    expect(resBenchNaN.savingsPercent).toBe(0);
    expect(resBenchNaN.isSaving).toBe(false);
    expect(resBenchNaN.benchmarkPrice).toBe(0);

    const resBothNaN = calculateSavings(NaN, NaN);
    expect(resBothNaN.savingsAmount).toBe(0);
    expect(resBothNaN.isSaving).toBe(false);
  });

  it('guards against non-positive and non-finite prices', () => {
    expect(calculateSavings(0, 2000000).isSaving).toBe(false);
    expect(calculateSavings(-500000, 2000000).isSaving).toBe(false);
    expect(calculateSavings(1500000, 0).isSaving).toBe(false);
    expect(calculateSavings(1500000, -1000000).isSaving).toBe(false);
    expect(calculateSavings(Infinity, 2000000).isSaving).toBe(false);
    expect(calculateSavings(1500000, Infinity).isSaving).toBe(false);
  });

  it('normalizes when observedPrice >= benchmarkPrice to zero savings and false', () => {
    // Equal prices
    const resEqual = calculateSavings(2000000, 2000000);
    expect(resEqual.savingsAmount).toBe(0);
    expect(resEqual.savingsPercent).toBe(0);
    expect(resEqual.isSaving).toBe(false);
    expect(Object.is(resEqual.savingsPercent, -0)).toBe(false);

    // Observed price more expensive
    const resMoreExpensive = calculateSavings(2500000, 2000000);
    expect(resMoreExpensive.savingsAmount).toBe(0);
    expect(resMoreExpensive.savingsPercent).toBe(0);
    expect(resMoreExpensive.isSaving).toBe(false);
  });

  it('calculates savings accurately with integer VND rounding', () => {
    const res = calculateSavings(1500000, 2000000);
    expect(res.savingsAmount).toBe(500000);
    expect(res.savingsPercent).toBe(25);
    expect(res.isSaving).toBe(true);

    // Floating-point difference rounding
    const resFloat = calculateSavings(1999999.4, 2500000.1);
    expect(Number.isInteger(resFloat.savingsAmount)).toBe(true);
    expect(resFloat.isSaving).toBe(true);
  });
});
