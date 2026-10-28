/**
 * Farely Pure Domain Kernel — Savings & Relative Value
 * REQ-DOM-001
 */

export interface SavingsSummary {
  observedPrice: number;
  benchmarkPrice: number;
  savingsAmount: number;
  savingsPercent: number;
  isSaving: boolean;
}

/**
 * Calculates absolute and relative savings against a benchmark price.
 */
export function calculateSavings(observedPrice: number, benchmarkPrice: number): SavingsSummary {
  // Eliminate IEEE 754 NaN and negative price bypasses
  if (
    !Number.isFinite(observedPrice) ||
    !Number.isFinite(benchmarkPrice) ||
    observedPrice <= 0 ||
    benchmarkPrice <= 0
  ) {
    return {
      observedPrice: Number.isFinite(observedPrice) ? observedPrice : 0,
      benchmarkPrice: Number.isFinite(benchmarkPrice) ? benchmarkPrice : 0,
      savingsAmount: 0,
      savingsPercent: 0,
      isSaving: false
    };
  }

  const rawDiff = benchmarkPrice - observedPrice;
  const savingsAmount = rawDiff > 0 ? Math.round(rawDiff) : 0;
  const savingsPercent = savingsAmount > 0 ? Math.round((savingsAmount / benchmarkPrice) * 100) : 0;
  const isSaving = savingsAmount > 0;

  return {
    observedPrice,
    benchmarkPrice,
    savingsAmount,
    savingsPercent,
    isSaving
  };
}
