/**
 * Farely Pure Domain Kernel — Price Comparator & Evidence Engine
 * REQ-COMP-001, REQ-COMP-002, REQ-COMP-003, REQ-COMP-004, REQ-COMP-005, REQ-COMP-006, REQ-COMP-007
 */

export type EvidenceLevel = 'INSUFFICIENT' | 'WEAK' | 'MODERATE' | 'STRONG';

export interface HistoricalObservation {
  observationId: string;
  observedAt: string; // UTC ISO timestamp (REQ-COMP-004: Observation date must never become travel date)
  departLocalDate: string;
  returnLocalDate?: string | null;
  origin: string;
  destination: string;
  price: number;
  currency: string;
  cabin: string;
  stops: number;
}

export interface ComparisonResult {
  currentPrice: number;
  sampleSize: number;
  medianPrice: number | null;
  lowestHistoricalPrice: number | null;
  discountVsMedianPercent: number | null;
  evidenceLevel: EvidenceLevel;
  verdictLabel: string;
}

// Canonical sample size thresholds (REQ-COMP-002: One threshold registry)
export const COMPARATOR_THRESHOLDS = {
  MIN_OBSERVATIONS_FOR_WEAK: 3,
  MIN_OBSERVATIONS_FOR_MODERATE: 7,
  MIN_OBSERVATIONS_FOR_STRONG: 15,
};

/**
 * Computes median from a sorted array of numbers.
 */
function computeMedian(sortedValues: number[]): number {
  const n = sortedValues.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  if (n % 2 !== 0) {
    return sortedValues[mid];
  }
  return (sortedValues[mid - 1] + sortedValues[mid]) / 2;
}

/**
 * Evaluates evidence level based on sample size and independent observations.
 * REQ-COMP-005, REQ-COMP-006 (no pseudo-confidence percentage).
 */
export function determineEvidenceLevel(sampleSize: number): EvidenceLevel {
  if (sampleSize < COMPARATOR_THRESHOLDS.MIN_OBSERVATIONS_FOR_WEAK) {
    return 'INSUFFICIENT';
  }
  if (sampleSize < COMPARATOR_THRESHOLDS.MIN_OBSERVATIONS_FOR_MODERATE) {
    return 'WEAK';
  }
  if (sampleSize < COMPARATOR_THRESHOLDS.MIN_OBSERVATIONS_FOR_STRONG) {
    return 'MODERATE';
  }
  return 'STRONG';
}

/**
 * Compares an offer against compatible historical observations.
 */
export function compareAgainstCohort(
  currentPrice: number,
  cohortObservations: HistoricalObservation[]
): ComparisonResult {
  const validPrices = cohortObservations
    .map(o => o.price)
    .filter(p => Number.isFinite(p) && p > 0)
    .sort((a, b) => a - b);

  const sampleSize = validPrices.length;
  const evidenceLevel = determineEvidenceLevel(sampleSize);

  if (evidenceLevel === 'INSUFFICIENT' || sampleSize === 0) {
    return {
      currentPrice,
      sampleSize,
      medianPrice: null,
      lowestHistoricalPrice: null,
      discountVsMedianPercent: null,
      evidenceLevel: 'INSUFFICIENT',
      verdictLabel: 'Giá quan sát'
    };
  }

  const medianPrice = computeMedian(validPrices);
  const lowestHistoricalPrice = validPrices[0];

  const discountPercent = Math.round(((medianPrice - currentPrice) / medianPrice) * 100);

  let verdictLabel = 'Giá tiêu chuẩn';
  if (discountPercent >= 20 && evidenceLevel === 'STRONG') {
    verdictLabel = 'Giá rất tốt';
  } else if (discountPercent >= 10 && (evidenceLevel === 'STRONG' || evidenceLevel === 'MODERATE')) {
    verdictLabel = 'Giá đáng chú ý';
  } else if (discountPercent > 0) {
    verdictLabel = 'Thấp hơn mức thông thường';
  }

  return {
    currentPrice,
    sampleSize,
    medianPrice,
    lowestHistoricalPrice,
    discountVsMedianPercent: discountPercent,
    evidenceLevel,
    verdictLabel
  };
}
