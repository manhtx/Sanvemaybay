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
  if (benchmarkPrice <= 0 || observedPrice <= 0) {
    return {
      observedPrice,
      benchmarkPrice,
      savingsAmount: 0,
      savingsPercent: 0,
      isSaving: false
    };
  }

  const savingsAmount = Math.max(0, benchmarkPrice - observedPrice);
  const savingsPercent = Math.round((savingsAmount / benchmarkPrice) * 100);

  return {
    observedPrice,
    benchmarkPrice,
    savingsAmount,
    savingsPercent,
    isSaving: savingsAmount > 0
  };
}
