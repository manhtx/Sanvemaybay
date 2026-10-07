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
  scanEpoch?: string;
  sourceQuality?: 'PROVEN_PROVIDER' | 'DEGRADED_FALLBACK' | 'UNVERIFIED';
  pricingUnit?: string;
  tripLengthDays?: number;
}

export interface ComparisonResult {
  currentPrice: number;
  sampleSize: number;
  medianPrice: number | null;
  lowestHistoricalPrice: number | null;
  discountVsMedianPercent: number | null;
  evidenceLevel: EvidenceLevel;
  verdictLabel: string;
  uniqueEpochs?: number;
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
 * Evaluates evidence level based on sample size, independent scan epochs, and source quality.
 * REQ-COMP-005, REQ-COMP-006, NODE TK-07.
 */
export function determineEvidenceLevel(
  sampleSize: number,
  options?: { uniqueEpochs?: number; hasDegradedOnly?: boolean }
): EvidenceLevel {
  if (sampleSize < COMPARATOR_THRESHOLDS.MIN_OBSERVATIONS_FOR_WEAK) {
    return 'INSUFFICIENT';
  }

  // Degraded fallback data alone cannot produce STRONG evidence
  if (options?.hasDegradedOnly) {
    return sampleSize >= COMPARATOR_THRESHOLDS.MIN_OBSERVATIONS_FOR_MODERATE ? 'MODERATE' : 'WEAK';
  }

  // If epochs are explicitly tracked, require independent scan epochs
  if (options?.uniqueEpochs !== undefined && options.uniqueEpochs < 2 && sampleSize >= COMPARATOR_THRESHOLDS.MIN_OBSERVATIONS_FOR_MODERATE) {
    return 'WEAK'; // Single epoch cannot provide MODERATE/STRONG confidence
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
  const validObservations = cohortObservations
    .filter(o => Number.isFinite(o.price) && o.price > 0);

  const validPrices = validObservations
    .map(o => o.price)
    .sort((a, b) => a - b);

  const sampleSize = validPrices.length;

  const epochs = new Set(
    validObservations
      .map(o => o.scanEpoch || o.observedAt.slice(0, 13))
      .filter(Boolean)
  );
  const uniqueEpochs = epochs.size;
  const hasDegradedOnly = validObservations.length > 0 && validObservations.every(o => o.sourceQuality === 'DEGRADED_FALLBACK');

  const evidenceLevel = determineEvidenceLevel(sampleSize, { uniqueEpochs, hasDegradedOnly });

  if (evidenceLevel === 'INSUFFICIENT' || sampleSize === 0) {
    return {
      currentPrice,
      sampleSize,
      medianPrice: null,
      lowestHistoricalPrice: null,
      discountVsMedianPercent: null,
      evidenceLevel: 'INSUFFICIENT',
      verdictLabel: 'Giá quan sát',
      uniqueEpochs
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
    verdictLabel,
    uniqueEpochs
  };
}

/**
 * Filters a raw observation pool into a strict Comparable Cohort.
 * NODE TK-07: Do not equate all fares with same origin/destination.
 */
export function filterComparableCohort(
  observations: HistoricalObservation[],
  filter: {
    origin: string;
    destination: string;
    cabin?: string;
    currency?: string;
    maxStops?: number;
    tripLengthDays?: number;
  }
): HistoricalObservation[] {
  return observations.filter(o => {
    if (o.origin.toUpperCase() !== filter.origin.toUpperCase()) return false;
    if (o.destination.toUpperCase() !== filter.destination.toUpperCase()) return false;
    if (filter.cabin && (o.cabin || 'ECONOMY').toUpperCase() !== filter.cabin.toUpperCase()) return false;
    if (filter.currency && o.currency && o.currency.toUpperCase() !== filter.currency.toUpperCase()) return false;
    if (filter.maxStops !== undefined && o.stops > filter.maxStops) return false;
    if (filter.tripLengthDays !== undefined && o.tripLengthDays !== undefined && o.tripLengthDays !== filter.tripLengthDays) return false;
    return true;
  });
}
