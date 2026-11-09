import { describe, expect, it } from 'vitest';
import {
  assessDeal,
  buildFlexibleFareMatrix,
  calculateTotalCost,
  classifyDiscount,
  compareMetroAirports,
  decideBuyAction,
  median,
  ObservedOfferForMatrix,
  verifyOfferPrice,
} from './flightIntelligence';

describe('Flight Intelligence Engine (FLY-INTEL-001, FLY-SCORE-001, REQ-METRO-001, GATE-DATA-TRUTH)', () => {
  describe('median calculation', () => {
    it('calculates the median of odd-length and even-length arrays without mutating input', () => {
      const odd = [900, 100, 500];
      expect(median(odd)).toBe(500);
      expect(odd).toEqual([900, 100, 500]); // immutability verified

      const even = [900, 100, 500, 300];
      expect(median(even)).toBe(400); // (300 + 500) / 2
      expect(even).toEqual([900, 100, 500, 300]);
    });

    it('returns single element for single-element array', () => {
      expect(median([1_500_000])).toBe(1_500_000);
    });

    it('filters out non-finite numbers (NaN, Infinity) and returns undefined for empty or invalid arrays', () => {
      expect(median([])).toBeUndefined();
      expect(median([Number.NaN, Number.POSITIVE_INFINITY])).toBeUndefined();
      expect(median([Number.NaN, 500, Number.NEGATIVE_INFINITY, 1500])).toBe(1000);
    });
  });

  describe('classifyDiscount', () => {
    it('classifies exact boundary thresholds across discount tiers', () => {
      expect(classifyDiscount(0)).toBe('NORMAL');
      expect(classifyDiscount(9.99)).toBe('NORMAL');
      expect(classifyDiscount(10)).toBe('WATCH');
      expect(classifyDiscount(19.99)).toBe('WATCH');
      expect(classifyDiscount(20)).toBe('GOOD_DEAL');
      expect(classifyDiscount(29.99)).toBe('GOOD_DEAL');
      expect(classifyDiscount(30)).toBe('STRONG_DEAL');
      expect(classifyDiscount(39.99)).toBe('STRONG_DEAL');
      expect(classifyDiscount(40)).toBe('EXTREME_DEAL');
      expect(classifyDiscount(75)).toBe('EXTREME_DEAL');
    });
  });

  describe('assessDeal & outlier quarantine', () => {
    it('calculates score and confidence for healthy deals', () => {
      const deal = assessDeal({
        currentPrice: 1_400_000,
        baselinePrice: 2_000_000,
        comparableSamples: 15,
        historicalSamples: 20,
      });

      expect(deal.baseline).toBe(2_000_000);
      expect(deal.discountPercent).toBeCloseTo(30, 2);
      expect(deal.level).toBe('STRONG_DEAL');
      expect(deal.suspicious).toBe(false);
      expect(deal.confidence).toBeGreaterThanOrEqual(0.75);
      expect(deal.score).toBeGreaterThan(60);
    });

    it('quarantines extreme discount outliers (>80%) as SUSPICIOUS (NC-014 defense)', () => {
      const extreme = assessDeal({
        currentPrice: 100_000,
        baselinePrice: 1_000_000,
        comparableSamples: 10,
        historicalSamples: 10,
      });

      expect(extreme.discountPercent).toBe(90);
      expect(extreme.level).toBe('SUSPICIOUS');
      expect(extreme.suspicious).toBe(true);
    });

    it('quarantines prices under 10% of baseline even if discount calculation differs', () => {
      const flash = assessDeal({
        currentPrice: 50_000,
        baselinePrice: 600_000,
        comparableSamples: 12,
        historicalSamples: 15,
      });

      expect(flash.level).toBe('SUSPICIOUS');
      expect(flash.suspicious).toBe(true);
    });

    it('throws when prices or sample counts violate domain constraints', () => {
      expect(() =>
        assessDeal({ currentPrice: 0, baselinePrice: 1_000_000, comparableSamples: 5, historicalSamples: 5 })
      ).toThrowError('Prices must be greater than zero.');

      expect(() =>
        assessDeal({ currentPrice: 1_000_000, baselinePrice: -500, comparableSamples: 5, historicalSamples: 5 })
      ).toThrowError('Prices must be greater than zero.');

      expect(() =>
        assessDeal({ currentPrice: 1_000_000, baselinePrice: 1_500_000, comparableSamples: -1, historicalSamples: 5 })
      ).toThrowError('Sample counts cannot be negative.');
    });

    it('applies risk penalty to deal score within [0, 100] bounds', () => {
      const normal = assessDeal({
        currentPrice: 1_500_000,
        baselinePrice: 2_000_000,
        comparableSamples: 10,
        historicalSamples: 10,
      });

      const penalized = assessDeal({
        currentPrice: 1_500_000,
        baselinePrice: 2_000_000,
        comparableSamples: 10,
        historicalSamples: 10,
        riskPenalty: 25,
      });

      expect(penalized.score).toBe(Math.max(0, normal.score - 25));
    });
  });

  describe('calculateTotalCost', () => {
    it('calculates total cost accurately across fare and ancillary components', () => {
      expect(calculateTotalCost([2_000_000, 500_000, 250_000])).toBe(2_750_000);
      expect(calculateTotalCost([])).toBe(0);
      expect(calculateTotalCost([1_200_000])).toBe(1_200_000);
    });

    it('throws Error on negative or non-finite cost components', () => {
      expect(() => calculateTotalCost([2_000_000, -100_000])).toThrowError(
        'Cost components must be finite and non-negative.'
      );
      expect(() => calculateTotalCost([2_000_000, Number.NaN])).toThrowError(
        'Cost components must be finite and non-negative.'
      );
      expect(() => calculateTotalCost([2_000_000, Number.POSITIVE_INFINITY])).toThrowError(
        'Cost components must be finite and non-negative.'
      );
    });
  });

  describe('decideBuyAction (NC-014)', () => {
    it('returns INSUFFICIENT_DATA when historical samples < 3 or confidence < 0.55', () => {
      expect(
        decideBuyAction({
          discountPercent: 50,
          confidence: 0.9,
          daysToDeparture: 10,
          historicalSamples: 2,
        })
      ).toBe('INSUFFICIENT_DATA');

      expect(
        decideBuyAction({
          discountPercent: 50,
          confidence: 0.5,
          daysToDeparture: 10,
          historicalSamples: 10,
        })
      ).toBe('INSUFFICIENT_DATA');
    });

    it('returns AVOID when operational risk level is high regardless of discount', () => {
      expect(
        decideBuyAction({
          discountPercent: 45,
          confidence: 0.85,
          daysToDeparture: 15,
          historicalSamples: 10,
          riskLevel: 'high',
        })
      ).toBe('AVOID');
    });

    it('returns BUY_NOW for high-confidence deals within 45 days of departure', () => {
      expect(
        decideBuyAction({
          discountPercent: 35,
          confidence: 0.8,
          daysToDeparture: 20,
          historicalSamples: 10,
          riskLevel: 'low',
        })
      ).toBe('BUY_NOW');
    });

    it('returns BUY_SOON when discount >= 20% and confidence >= 0.65', () => {
      expect(
        decideBuyAction({
          discountPercent: 25,
          confidence: 0.7,
          daysToDeparture: 60, // > 45 days so not BUY_NOW
          historicalSamples: 10,
          riskLevel: 'low',
        })
      ).toBe('BUY_SOON');
    });

    it('returns MONITOR when pricePercentile is in the bottom quartile (<=25)', () => {
      expect(
        decideBuyAction({
          discountPercent: 12,
          confidence: 0.6,
          daysToDeparture: 40,
          historicalSamples: 8,
          pricePercentile: 20,
          riskLevel: 'low',
        })
      ).toBe('MONITOR');
    });

    it('returns WAIT when no positive signal criteria are met', () => {
      expect(
        decideBuyAction({
          discountPercent: 10,
          confidence: 0.6,
          daysToDeparture: 90,
          historicalSamples: 8,
          pricePercentile: 60,
          riskLevel: 'medium',
        })
      ).toBe('WAIT');
    });
  });

  describe('Flexible Fare Matrix (GATE-DATA-TRUTH, RG01, RG14)', () => {
    const fixedNow = '2026-10-06T12:00:00.000Z';

    it('constructs complete Cartesian grid and enforces isGuaranteedLive: false on every cell', () => {
      const depDates = ['2026-11-01', '2026-11-02'];
      const retDates = ['2026-11-05', undefined];
      const offers: ObservedOfferForMatrix[] = [
        {
          departDate: '2026-11-01',
          returnDate: '2026-11-05',
          price: 2_150_000,
          observedAt: '2026-10-06T11:40:00.000Z', // 20 min ago -> fresh_observed
          carrier: 'VJ',
        },
        {
          departDate: '2026-11-02',
          returnDate: undefined,
          price: 1_200_000,
          observedAt: '2026-10-05T10:00:00.000Z', // 26h ago -> stale
          carrier: 'VN',
        },
      ];

      const matrix = buildFlexibleFareMatrix(depDates, retDates, offers, fixedNow);

      expect(matrix).toHaveLength(4); // 2 dep x 2 ret
      for (const cell of matrix) {
        expect(cell.isGuaranteedLive).toBe(false); // Invariant RG14
      }

      // Matching round-trip fresh cell
      const freshCell = matrix.find((c) => c.departDate === '2026-11-01' && c.returnDate === '2026-11-05');
      expect(freshCell?.freshness).toBe('fresh_observed');
      expect(freshCell?.price).toBe(2_150_000);
      expect(freshCell?.carrier).toBe('VJ');

      // Matching one-way stale cell
      const staleCell = matrix.find((c) => c.departDate === '2026-11-02' && c.returnDate === undefined);
      expect(staleCell?.freshness).toBe('stale');
      expect(staleCell?.price).toBe(1_200_000);
      expect(staleCell?.carrier).toBe('VN');

      // Unavailable cells
      const unavailCell = matrix.find((c) => c.departDate === '2026-11-01' && c.returnDate === undefined);
      expect(unavailCell?.freshness).toBe('unavailable');
      expect(unavailCell?.price).toBeUndefined();
    });

    it('classifies offers between 1 hour and 24 hours as observed', () => {
      const matrix = buildFlexibleFareMatrix(
        ['2026-11-01'],
        [undefined],
        [
          {
            departDate: '2026-11-01',
            returnDate: undefined,
            price: 1_500_000,
            observedAt: '2026-10-06T08:00:00.000Z', // 4 hours ago -> observed
          },
        ],
        fixedNow,
      );

      expect(matrix[0].freshness).toBe('observed');
      expect(matrix[0].price).toBe(1_500_000);
    });

    it('selects the lowest price offer when multiple observations exist for the same cell', () => {
      const matrix = buildFlexibleFareMatrix(
        ['2026-11-01'],
        [undefined],
        [
          {
            departDate: '2026-11-01',
            returnDate: undefined,
            price: 2_000_000,
            observedAt: '2026-10-06T11:50:00.000Z',
            carrier: 'VN',
          },
          {
            departDate: '2026-11-01',
            returnDate: undefined,
            price: 1_650_000, // Cheaper offer
            observedAt: '2026-10-06T11:45:00.000Z',
            carrier: 'VJ',
          },
        ],
        fixedNow,
      );

      expect(matrix[0].price).toBe(1_650_000);
      expect(matrix[0].carrier).toBe('VJ');
    });
  });

  describe('Live Price Verification (verifyOfferPrice)', () => {
    it('tracks exact match when live price equals observed price', () => {
      const match = verifyOfferPrice(2_000_000, {
        status: 'SUCCESS',
        livePrice: 2_000_000,
        provider: 'vietjet_live',
        timestamp: '2026-10-06T12:00:00.000Z',
      });

      expect(match.accuracyStatus).toBe('EXACT_MATCH');
      expect(match.absoluteDelta).toBe(0);
      expect(match.percentageDelta).toBe(0);
      expect(match.success).toBe(true);
      expect(match.verifiedPrice).toBe(2_000_000);
    });

    it('tracks price increase with positive delta and percentage', () => {
      const increased = verifyOfferPrice(2_000_000, {
        status: 'SUCCESS',
        livePrice: 2_200_000,
        provider: 'vietjet_live',
      });

      expect(increased.accuracyStatus).toBe('PRICE_INCREASED');
      expect(increased.absoluteDelta).toBe(200_000);
      expect(increased.percentageDelta).toBe(10);
      expect(increased.success).toBe(true);
    });

    it('tracks price drop with negative delta and percentage', () => {
      const dropped = verifyOfferPrice(2_000_000, {
        status: 'SUCCESS',
        livePrice: 1_800_000,
        provider: 'vietnam_airlines_live',
      });

      expect(dropped.accuracyStatus).toBe('PRICE_DROPPED');
      expect(dropped.absoluteDelta).toBe(-200_000);
      expect(dropped.percentageDelta).toBe(-10);
      expect(dropped.success).toBe(true);
    });

    it('handles PROVIDER_UNAVAILABLE without fabricating price or success', () => {
      const unavail = verifyOfferPrice(2_000_000, {
        status: 'UNAVAILABLE',
        provider: 'amadeus_live',
      });

      expect(unavail.accuracyStatus).toBe('PROVIDER_UNAVAILABLE');
      expect(unavail.success).toBe(false);
      expect(unavail.verifiedPrice).toBeUndefined();
      expect(unavail.absoluteDelta).toBeUndefined();
    });

    it('handles SOLD_OUT or missing livePrice with SEATS_EXHAUSTED', () => {
      const soldOut = verifyOfferPrice(2_000_000, {
        status: 'SOLD_OUT',
        provider: 'bamboo_live',
      });

      expect(soldOut.accuracyStatus).toBe('SEATS_EXHAUSTED');
      expect(soldOut.success).toBe(false);
    });
  });

  describe('Metro Airport Comparison (compareMetroAirports)', () => {
    it('returns null when fewer than two airport pair options are provided', () => {
      expect(compareMetroAirports({ origin: 'HAN', destination: 'BKK_METRO' }, [])).toBeNull();
      expect(
        compareMetroAirports({ origin: 'HAN', destination: 'BKK_METRO' }, [
          { originAirport: 'HAN', destinationAirport: 'BKK', price: 2_500_000 },
        ])
      ).toBeNull();
    });

    it('sorts options by price, identifies cheaper option, and computes cost delta', () => {
      const result = compareMetroAirports(
        { origin: 'HAN', destination: 'BKK_METRO' },
        [
          {
            originAirport: 'HAN',
            destinationAirport: 'BKK',
            price: 2_450_000,
            groundTransferNote: 'Suvarnabhumi Airport Link 45 THB',
          },
          {
            originAirport: 'HAN',
            destinationAirport: 'DMK',
            price: 2_150_000,
            groundTransferNote: 'SRT Red Line 33 THB',
          },
        ]
      );

      expect(result).not.toBeNull();
      expect(result?.originMetro).toBe('HAN');
      expect(result?.destinationMetro).toBe('BKK_METRO');
      expect(result?.cheaperOptionAirport).toBe('HAN → DMK');
      expect(result?.priceDifference).toBe(300_000);
      expect(result?.options).toHaveLength(2);
      expect(result?.options[0].bestPrice).toBe(2_150_000);
      expect(result?.options[0].groundTransferNote).toBe('SRT Red Line 33 THB');
      expect(result?.options[1].bestPrice).toBe(2_450_000);
    });

    it('handles equal prices with 0 priceDifference', () => {
      const result = compareMetroAirports(
        { origin: 'SGN', destination: 'TYO_METRO' },
        [
          { originAirport: 'SGN', destinationAirport: 'NRT', price: 5_000_000 },
          { originAirport: 'SGN', destinationAirport: 'HND', price: 5_000_000 },
        ]
      );

      expect(result).not.toBeNull();
      expect(result?.priceDifference).toBe(0);
      expect(result?.options).toHaveLength(2);
    });
  });

  describe('High-Volume Performance & Pure Immutability', () => {
    it('builds a 7x7 flexible fare matrix in <50ms', () => {
      const depDates = Array.from({ length: 7 }, (_, i) => `2026-11-0${i + 1}`);
      const retDates = Array.from({ length: 7 }, (_, i) => `2026-11-1${i + 1}`);
      const offers: ObservedOfferForMatrix[] = [];

      for (let i = 0; i < 7; i++) {
        offers.push({
          departDate: depDates[i],
          returnDate: retDates[i],
          price: 2_000_000 + i * 50_000,
          observedAt: new Date().toISOString(),
        });
      }

      const start = performance.now();
      const matrix = buildFlexibleFareMatrix(depDates, retDates, offers);
      const elapsed = performance.now() - start;

      expect(matrix).toHaveLength(49);
      expect(elapsed).toBeLessThan(50);
    });

    it('does not mutate input array parameters', () => {
      const costs = Object.freeze([1_000_000, 200_000, 50_000]);
      expect(calculateTotalCost(costs as unknown as number[])).toBe(1_250_000);

      const pairs = Object.freeze([
        Object.freeze({ originAirport: 'HAN', destinationAirport: 'BKK', price: 2_500_000 }),
        Object.freeze({ originAirport: 'HAN', destinationAirport: 'DMK', price: 2_200_000 }),
      ]);

      const res = compareMetroAirports(
        { origin: 'HAN', destination: 'BKK_METRO' },
        pairs as unknown as { originAirport: string; destinationAirport: string; price: number }[]
      );
      expect(res?.priceDifference).toBe(300_000);
    });
  });
});
