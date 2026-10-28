import { describe, it, expect } from 'vitest';
import {
  compareAgainstCohort,
  determineEvidenceLevel,
  filterComparableCohort,
  COMPARATOR_THRESHOLDS,
  type HistoricalObservation,
} from './comparator';

describe('Farely Pure Domain Kernel — Price Comparator (WP01-COMPARATOR-EVIDENCE-ROBUSTNESS)', () => {
  const baseObs = (overrides: Partial<HistoricalObservation> = {}): HistoricalObservation => ({
    observationId: 'obs_1',
    observedAt: '2026-10-28T02:00:00Z',
    departLocalDate: '2026-11-15',
    origin: 'SGN',
    destination: 'HAN',
    price: 2000000,
    currency: 'VND',
    cabin: 'ECONOMY',
    stops: 0,
    ...overrides,
  });

  it('fails closed on non-positive or non-finite current price', () => {
    const cohort = [baseObs({ price: 2000000 })];

    const resZero = compareAgainstCohort(0, cohort);
    expect(resZero.evidenceLevel).toBe('INSUFFICIENT');
    expect(resZero.verdictLabel).toBe('Không đủ dữ liệu');
    expect(resZero.medianPrice).toBeNull();

    const resNegative = compareAgainstCohort(-500000, cohort);
    expect(resNegative.evidenceLevel).toBe('INSUFFICIENT');
    expect(resNegative.verdictLabel).toBe('Không đủ dữ liệu');

    const resNaN = compareAgainstCohort(NaN, cohort);
    expect(resNaN.evidenceLevel).toBe('INSUFFICIENT');
    expect(resNaN.verdictLabel).toBe('Không đủ dữ liệu');

    const resInf = compareAgainstCohort(Infinity, cohort);
    expect(resInf.evidenceLevel).toBe('INSUFFICIENT');
    expect(resInf.verdictLabel).toBe('Không đủ dữ liệu');
  });

  it('handles empty cohort and invalid price observations gracefully', () => {
    const resEmpty = compareAgainstCohort(1500000, []);
    expect(resEmpty.sampleSize).toBe(0);
    expect(resEmpty.evidenceLevel).toBe('INSUFFICIENT');
    expect(resEmpty.verdictLabel).toBe('Giá quan sát');
    expect(resEmpty.medianPrice).toBeNull();
    expect(resEmpty.lowestHistoricalPrice).toBeNull();

    const corruptedCohort = [
      baseObs({ price: -1000 }),
      baseObs({ price: 0 }),
      baseObs({ price: NaN }),
      baseObs({ price: '2000000' as unknown as number }),
    ];
    const resCorrupted = compareAgainstCohort(1500000, corruptedCohort);
    expect(resCorrupted.sampleSize).toBe(0);
    expect(resCorrupted.evidenceLevel).toBe('INSUFFICIENT');
  });

  it('REQ-COMP-004: Observation date must never become travel date', () => {
    // 15 observations but observedAt is missing or invalid; departLocalDate varies across 15 days
    // Without observedAt, distinct observation days must be 0, NOT 15
    const cohortWithoutObservedAt: HistoricalObservation[] = Array.from({ length: 15 }, (_, i) =>
      baseObs({
        observationId: `obs_${i}`,
        observedAt: '', // empty / missing
        scanEpoch: `epoch_${i % 2}`, // 2 epochs present
        departLocalDate: `2026-11-${String(i + 1).padStart(2, '0')}`,
        price: 2000000,
      })
    );

    const res = compareAgainstCohort(1600000, cohortWithoutObservedAt);
    // Distinct observation days = 0 (< 3) -> Evidence capped at MODERATE even with 15 samples
    expect(res.sampleSize).toBe(15);
    expect(res.evidenceLevel).toBe('MODERATE');
  });

  it('awards STRONG evidence when sampleSize >= 15, distinct days >= 3, and unique epochs >= 2', () => {
    const cohortStrong: HistoricalObservation[] = Array.from({ length: 15 }, (_, i) =>
      baseObs({
        observationId: `obs_${i}`,
        observedAt: `2026-10-${String(20 + (i % 5)).padStart(2, '0')}T${String(10 + (i % 4)).padStart(2, '0')}:00:00Z`,
        scanEpoch: `epoch_${i % 3}`,
        price: 2000000 + i * 10000,
      })
    );

    const res = compareAgainstCohort(1500000, cohortStrong);
    expect(res.sampleSize).toBe(15);
    expect(res.evidenceLevel).toBe('STRONG');
    expect(res.discountVsMedianPercent).toBeGreaterThanOrEqual(20);
    expect(res.verdictLabel).toBe('Giá rất tốt');
  });

  it('enforces zero-dispersion caveat: small discounts on fixed-price routes remain "Giá tiêu chuẩn"', () => {
    // All 15 historical observations are identical: exactly 2,000,000 (variance = 0)
    const cohortZeroDispersion: HistoricalObservation[] = Array.from({ length: 15 }, (_, i) =>
      baseObs({
        observationId: `obs_${i}`,
        observedAt: `2026-10-${String(20 + (i % 5)).padStart(2, '0')}T10:00:00Z`,
        scanEpoch: `epoch_${i % 3}`,
        price: 2000000,
      })
    );

    // Current price is 1,950,000 (2.5% discount) -> should remain 'Giá tiêu chuẩn'
    const resSmallDiscount = compareAgainstCohort(1950000, cohortZeroDispersion);
    expect(resSmallDiscount.discountVsMedianPercent).toBe(3);
    expect(resSmallDiscount.verdictLabel).toBe('Giá tiêu chuẩn');

    // Current price is 1,750,000 (12.5% discount >= 10%) -> gets 'Giá đáng chú ý'
    const resNoticeable = compareAgainstCohort(1750000, cohortZeroDispersion);
    expect(resNoticeable.discountVsMedianPercent).toBe(13);
    expect(resNoticeable.verdictLabel).toBe('Giá đáng chú ý');

    // Current price is 1,500,000 (25% discount >= 20%) -> gets 'Giá rất tốt'
    const resGreat = compareAgainstCohort(1500000, cohortZeroDispersion);
    expect(resGreat.discountVsMedianPercent).toBe(25);
    expect(resGreat.verdictLabel).toBe('Giá rất tốt');
  });

  it('determineEvidenceLevel caps single-epoch and degraded fallback correctly', () => {
    // Single epoch with sampleSize = 10 -> capped at WEAK
    expect(determineEvidenceLevel(10, { uniqueEpochs: 1 })).toBe('WEAK');

    // Degraded fallback with sampleSize = 15 -> capped at MODERATE
    expect(determineEvidenceLevel(15, { hasDegradedOnly: true })).toBe('MODERATE');

    // Insufficient sample size
    expect(determineEvidenceLevel(2)).toBe('INSUFFICIENT');
  });

  it('filters raw observations strictly by cohort dimensions', () => {
    const raw: HistoricalObservation[] = [
      baseObs({ origin: 'SGN', destination: 'HAN', cabin: 'ECONOMY', currency: 'VND', stops: 0 }),
      baseObs({ origin: 'SGN', destination: 'DAD', cabin: 'ECONOMY', currency: 'VND', stops: 0 }),
      baseObs({ origin: 'SGN', destination: 'HAN', cabin: 'BUSINESS', currency: 'VND', stops: 0 }),
      baseObs({ origin: 'SGN', destination: 'HAN', cabin: 'ECONOMY', currency: 'USD', stops: 0 }),
      baseObs({ origin: 'SGN', destination: 'HAN', cabin: 'ECONOMY', currency: 'VND', stops: 2 }),
    ];

    const filtered = filterComparableCohort(raw, {
      origin: 'SGN',
      destination: 'HAN',
      cabin: 'ECONOMY',
      currency: 'VND',
      maxStops: 1,
    });

    expect(filtered.length).toBe(1);
    expect(filtered[0].destination).toBe('HAN');
  });
});
