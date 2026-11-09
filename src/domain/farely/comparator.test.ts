/**
 * Unit Test Suite for Price Comparator & Evidence Engine
 * REQ-COMP-001, REQ-COMP-002, REQ-COMP-003, REQ-COMP-004, REQ-COMP-005, REQ-COMP-006, REQ-COMP-007
 */

import { describe, it, expect } from 'vitest';
import {
  determineEvidenceLevel,
  compareAgainstCohort,
  filterComparableCohort,
  COMPARATOR_THRESHOLDS,
  HistoricalObservation
} from './comparator';

describe('Price Comparator & Evidence Engine Invariant Defense', () => {
  describe('determineEvidenceLevel — Thresholds & Temporal Caps', () => {
    it('returns INSUFFICIENT when sample size is below minimum threshold (<3)', () => {
      expect(determineEvidenceLevel(0)).toBe('INSUFFICIENT');
      expect(determineEvidenceLevel(1)).toBe('INSUFFICIENT');
      expect(determineEvidenceLevel(2)).toBe('INSUFFICIENT');
      expect(determineEvidenceLevel(COMPARATOR_THRESHOLDS.MIN_OBSERVATIONS_FOR_WEAK - 1)).toBe('INSUFFICIENT');
    });

    it('returns WEAK for sample sizes between 3 and 6 with default options', () => {
      expect(determineEvidenceLevel(3)).toBe('WEAK');
      expect(determineEvidenceLevel(5)).toBe('WEAK');
      expect(determineEvidenceLevel(6)).toBe('WEAK');
    });

    it('returns MODERATE for sample sizes between 7 and 14 with standard diversity', () => {
      expect(determineEvidenceLevel(7, { uniqueEpochs: 3, distinctDays: 4 })).toBe('MODERATE');
      expect(determineEvidenceLevel(14, { uniqueEpochs: 3, distinctDays: 4 })).toBe('MODERATE');
    });

    it('returns STRONG for sample sizes >= 15 with sufficient diversity', () => {
      expect(determineEvidenceLevel(15, { uniqueEpochs: 5, distinctDays: 5 })).toBe('STRONG');
      expect(determineEvidenceLevel(50, { uniqueEpochs: 10, distinctDays: 10 })).toBe('STRONG');
    });

    it('satisfies S13: degraded fallback data alone is capped at MODERATE even at high sample sizes', () => {
      expect(determineEvidenceLevel(20, { hasDegradedOnly: true, distinctDays: 5, uniqueEpochs: 5 })).toBe('MODERATE');
      expect(determineEvidenceLevel(5, { hasDegradedOnly: true })).toBe('WEAK');
    });

    it('satisfies S13: single epoch (<2) is capped at WEAK confidence', () => {
      expect(determineEvidenceLevel(10, { uniqueEpochs: 1 })).toBe('WEAK');
      expect(determineEvidenceLevel(25, { uniqueEpochs: 1 })).toBe('WEAK');
    });

    it('satisfies S13 & A17: repeated observations on fewer than 3 days cannot achieve STRONG confidence', () => {
      // 20 observations occurring across only 2 distinct days must cap at MODERATE
      expect(determineEvidenceLevel(20, { distinctDays: 2, uniqueEpochs: 5 })).toBe('MODERATE');
      expect(determineEvidenceLevel(20, { distinctDays: 1, uniqueEpochs: 5 })).toBe('MODERATE');
      // With >= 3 distinct days, it achieves STRONG
      expect(determineEvidenceLevel(20, { distinctDays: 3, uniqueEpochs: 5 })).toBe('STRONG');
    });
  });

  describe('compareAgainstCohort — Median Math & Verdict Grounding', () => {
    it('returns null median and null discount when sample size is insufficient (<3)', () => {
      const observations: HistoricalObservation[] = [
        {
          observationId: 'obs-1',
          observedAt: '2026-10-01T10:00:00Z',
          departLocalDate: '2026-11-01',
          origin: 'HAN',
          destination: 'SGN',
          price: 1500000,
          currency: 'VND',
          cabin: 'ECONOMY',
          stops: 0
        },
        {
          observationId: 'obs-2',
          observedAt: '2026-10-02T10:00:00Z',
          departLocalDate: '2026-11-01',
          origin: 'HAN',
          destination: 'SGN',
          price: 1600000,
          currency: 'VND',
          cabin: 'ECONOMY',
          stops: 0
        }
      ];

      const result = compareAgainstCohort(1200000, observations);
      expect(result.evidenceLevel).toBe('INSUFFICIENT');
      expect(result.medianPrice).toBeNull();
      expect(result.lowestHistoricalPrice).toBeNull();
      expect(result.discountVsMedianPercent).toBeNull();
      expect(result.verdictLabel).toBe('Giá quan sát');
    });

    it('computes exact median for odd sample size', () => {
      const prices = [1000000, 1500000, 2000000];
      const observations: HistoricalObservation[] = prices.map((price, i) => ({
        observationId: `obs-${i}`,
        observedAt: `2026-10-0${i + 1}T10:00:00Z`,
        departLocalDate: '2026-11-01',
        origin: 'HAN',
        destination: 'DAD',
        price,
        currency: 'VND',
        cabin: 'ECONOMY',
        stops: 0,
        scanEpoch: `epoch-${i}`
      }));

      const result = compareAgainstCohort(1200000, observations);
      expect(result.medianPrice).toBe(1500000);
      expect(result.lowestHistoricalPrice).toBe(1000000);
      expect(result.discountVsMedianPercent).toBe(20); // (1.5M - 1.2M) / 1.5M = 20%
    });

    it('computes exact median for even sample size', () => {
      const prices = [1000000, 1400000, 1600000, 2000000];
      const observations: HistoricalObservation[] = prices.map((price, i) => ({
        observationId: `obs-${i}`,
        observedAt: `2026-10-0${i + 1}T10:00:00Z`,
        departLocalDate: '2026-11-01',
        origin: 'HAN',
        destination: 'DAD',
        price,
        currency: 'VND',
        cabin: 'ECONOMY',
        stops: 0,
        scanEpoch: `epoch-${i}`
      }));

      const result = compareAgainstCohort(1200000, observations);
      expect(result.medianPrice).toBe(1500000); // (1.4M + 1.6M) / 2 = 1.5M
    });

    it('grounds verdict labels truthfully based on discount and evidence level', () => {
      // 16 observations across 5 days (STRONG evidence)
      const strongObservations: HistoricalObservation[] = Array.from({ length: 16 }, (_, i) => ({
        observationId: `obs-${i}`,
        observedAt: `2026-10-${String((i % 5) + 1).padStart(2, '0')}T10:00:00Z`,
        departLocalDate: '2026-11-01',
        origin: 'HAN',
        destination: 'SGN',
        price: 2000000,
        currency: 'VND',
        cabin: 'ECONOMY',
        stops: 0,
        scanEpoch: `epoch-${i % 4}`
      }));

      // 25% discount with STRONG evidence -> "Giá rất tốt"
      const bestDeal = compareAgainstCohort(1500000, strongObservations);
      expect(bestDeal.evidenceLevel).toBe('STRONG');
      expect(bestDeal.discountVsMedianPercent).toBe(25);
      expect(bestDeal.verdictLabel).toBe('Giá rất tốt');

      // 10% discount with STRONG evidence -> "Giá đáng chú ý"
      const goodDeal = compareAgainstCohort(1800000, strongObservations);
      expect(goodDeal.discountVsMedianPercent).toBe(10);
      expect(goodDeal.verdictLabel).toBe('Giá đáng chú ý');

      // 5% discount -> "Thấp hơn mức thông thường"
      const minorDeal = compareAgainstCohort(1900000, strongObservations);
      expect(minorDeal.discountVsMedianPercent).toBe(5);
      expect(minorDeal.verdictLabel).toBe('Thấp hơn mức thông thường');

      // 0% discount / price equal to median -> "Giá tiêu chuẩn"
      const standardDeal = compareAgainstCohort(2000000, strongObservations);
      expect(standardDeal.discountVsMedianPercent).toBe(0);
      expect(standardDeal.verdictLabel).toBe('Giá tiêu chuẩn');
    });

    it('filters out non-finite or negative prices before calculation', () => {
      const mixedObservations: HistoricalObservation[] = [
        { observationId: '1', observedAt: '2026-10-01T10:00:00Z', departLocalDate: '2026-11-01', origin: 'HAN', destination: 'SGN', price: 1000000, currency: 'VND', cabin: 'ECONOMY', stops: 0 },
        { observationId: '2', observedAt: '2026-10-02T10:00:00Z', departLocalDate: '2026-11-01', origin: 'HAN', destination: 'SGN', price: 2000000, currency: 'VND', cabin: 'ECONOMY', stops: 0 },
        { observationId: '3', observedAt: '2026-10-03T10:00:00Z', departLocalDate: '2026-11-01', origin: 'HAN', destination: 'SGN', price: 3000000, currency: 'VND', cabin: 'ECONOMY', stops: 0 },
        { observationId: 'bad-1', observedAt: '2026-10-04T10:00:00Z', departLocalDate: '2026-11-01', origin: 'HAN', destination: 'SGN', price: -500000, currency: 'VND', cabin: 'ECONOMY', stops: 0 },
        { observationId: 'bad-2', observedAt: '2026-10-05T10:00:00Z', departLocalDate: '2026-11-01', origin: 'HAN', destination: 'SGN', price: NaN, currency: 'VND', cabin: 'ECONOMY', stops: 0 },
        { observationId: 'bad-3', observedAt: '2026-10-06T10:00:00Z', departLocalDate: '2026-11-01', origin: 'HAN', destination: 'SGN', price: Infinity, currency: 'VND', cabin: 'ECONOMY', stops: 0 }
      ];

      const result = compareAgainstCohort(1500000, mixedObservations);
      expect(result.sampleSize).toBe(3);
      expect(result.medianPrice).toBe(2000000);
      expect(result.lowestHistoricalPrice).toBe(1000000);
    });
  });

  describe('filterComparableCohort — Strict Parameter Isolation', () => {
    const samplePool: HistoricalObservation[] = [
      { observationId: '1', observedAt: '2026-10-01T10:00:00Z', departLocalDate: '2026-11-01', origin: 'HAN', destination: 'SGN', price: 1500000, currency: 'VND', cabin: 'ECONOMY', stops: 0, tripLengthDays: 3 },
      { observationId: '2', observedAt: '2026-10-01T10:00:00Z', departLocalDate: '2026-11-01', origin: 'HAN', destination: 'SGN', price: 4000000, currency: 'VND', cabin: 'BUSINESS', stops: 0, tripLengthDays: 3 },
      { observationId: '3', observedAt: '2026-10-01T10:00:00Z', departLocalDate: '2026-11-01', origin: 'HAN', destination: 'SGN', price: 100, currency: 'USD', cabin: 'ECONOMY', stops: 0, tripLengthDays: 3 },
      { observationId: '4', observedAt: '2026-10-01T10:00:00Z', departLocalDate: '2026-11-01', origin: 'HAN', destination: 'SGN', price: 1200000, currency: 'VND', cabin: 'ECONOMY', stops: 1, tripLengthDays: 3 },
      { observationId: '5', observedAt: '2026-10-01T10:00:00Z', departLocalDate: '2026-11-01', origin: 'HAN', destination: 'SGN', price: 1600000, currency: 'VND', cabin: 'ECONOMY', stops: 0, tripLengthDays: 14 },
      { observationId: '6', observedAt: '2026-10-01T10:00:00Z', departLocalDate: '2026-11-01', origin: 'HAN', destination: 'DAD', price: 900000, currency: 'VND', cabin: 'ECONOMY', stops: 0, tripLengthDays: 3 }
    ];

    it('filters strictly by origin and destination with case insensitivity', () => {
      const filtered = filterComparableCohort(samplePool, { origin: 'han', destination: 'sgn' });
      expect(filtered.length).toBe(5);
      expect(filtered.every(o => o.origin === 'HAN' && o.destination === 'SGN')).toBe(true);
    });

    it('isolates cabin class', () => {
      const filtered = filterComparableCohort(samplePool, { origin: 'HAN', destination: 'SGN', cabin: 'BUSINESS' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].observationId).toBe('2');
    });

    it('isolates currency code', () => {
      const filtered = filterComparableCohort(samplePool, { origin: 'HAN', destination: 'SGN', currency: 'USD' });
      expect(filtered.length).toBe(1);
      expect(filtered[0].observationId).toBe('3');
    });

    it('isolates maximum stops constraint', () => {
      const filtered = filterComparableCohort(samplePool, { origin: 'HAN', destination: 'SGN', maxStops: 0, currency: 'VND', cabin: 'ECONOMY' });
      // Excludes stop=1 (id: '4')
      expect(filtered.map(o => o.observationId)).toEqual(['1', '5']);
    });

    it('isolates trip length in days', () => {
      const filtered = filterComparableCohort(samplePool, { origin: 'HAN', destination: 'SGN', tripLengthDays: 3, currency: 'VND', cabin: 'ECONOMY', maxStops: 0 });
      expect(filtered.length).toBe(1);
      expect(filtered[0].observationId).toBe('1');
    });

    it('returns empty array when observation pool is empty', () => {
      expect(filterComparableCohort([], { origin: 'HAN', destination: 'SGN' })).toEqual([]);
    });
  });

  describe('Comparator Edge Cases, Monotonicity & Scalability', () => {
    it('returns INSUFFICIENT and null median when observation cohort is completely empty', () => {
      const emptyResult = compareAgainstCohort(1_500_000, []);
      expect(emptyResult).toEqual({
        currentPrice: 1_500_000,
        sampleSize: 0,
        medianPrice: null,
        lowestHistoricalPrice: null,
        discountVsMedianPercent: null,
        evidenceLevel: 'INSUFFICIENT',
        verdictLabel: 'Giá quan sát',
        uniqueEpochs: 0,
      });
    });

    it('preserves metamorphic price reduction monotonicity on discount percent and verdict label', () => {
      // 16 observations across 5 days (STRONG evidence), median 2,000,000
      const strongCohort: HistoricalObservation[] = Array.from({ length: 16 }, (_, i) => ({
        observationId: `mono-${i}`,
        observedAt: `2026-10-${String((i % 5) + 1).padStart(2, '0')}T10:00:00Z`,
        departLocalDate: '2026-11-01',
        origin: 'HAN',
        destination: 'SGN',
        price: 2_000_000,
        currency: 'VND',
        cabin: 'ECONOMY',
        stops: 0,
        scanEpoch: `epoch-${i % 4}`,
      }));

      const tierRanks: Record<string, number> = {
        'Giá tiêu chuẩn': 1,
        'Thấp hơn mức thông thường': 2,
        'Giá đáng chú ý': 3,
        'Giá rất tốt': 4,
      };

      const prices = [2_000_000, 1_900_000, 1_800_000, 1_500_000, 1_000_000];
      let previousDiscount = -1;
      let previousTierRank = 0;

      for (const price of prices) {
        const result = compareAgainstCohort(price, strongCohort);
        expect(result.discountVsMedianPercent!).toBeGreaterThanOrEqual(previousDiscount);
        expect(tierRanks[result.verdictLabel]).toBeGreaterThanOrEqual(previousTierRank);
        previousDiscount = result.discountVsMedianPercent!;
        previousTierRank = tierRanks[result.verdictLabel];
      }
    });

    it('evaluates large historical cohorts (500+ items) within sub-50ms latency budget', () => {
      const largeCohort: HistoricalObservation[] = Array.from({ length: 500 }, (_, i) => ({
        observationId: `large-${i}`,
        observedAt: `2026-10-${String((i % 25) + 1).padStart(2, '0')}T10:00:00Z`,
        departLocalDate: '2026-11-01',
        origin: 'HAN',
        destination: 'SGN',
        price: 1_800_000 + (i % 20) * 20_000,
        currency: 'VND',
        cabin: 'ECONOMY',
        stops: 0,
        scanEpoch: `epoch-${i % 10}`,
      }));

      const start = performance.now();
      const result = compareAgainstCohort(1_500_000, largeCohort);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50);
      expect(result.sampleSize).toBe(500);
      expect(result.evidenceLevel).toBe('STRONG');
      expect(result.medianPrice).toBeGreaterThan(0);
    });

    it('preserves pure immutability on Object.freeze protected observation pools', () => {
      const frozenObservation = Object.freeze({
        observationId: 'freeze-1',
        observedAt: '2026-10-01T10:00:00Z',
        departLocalDate: '2026-11-01',
        origin: 'HAN',
        destination: 'SGN',
        price: 2_000_000,
        currency: 'VND',
        cabin: 'ECONOMY',
        stops: 0,
      });

      const frozenPool = Object.freeze([frozenObservation]);

      expect(() => compareAgainstCohort(1_500_000, frozenPool as any)).not.toThrow();
      expect(() => filterComparableCohort(frozenPool as any, { origin: 'HAN', destination: 'SGN' })).not.toThrow();
      expect(frozenObservation.price).toBe(2_000_000);
    });
  });
});
