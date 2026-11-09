import { describe, expect, it } from 'vitest';
import { rankPersonalizedFeed, rankTravelFeed } from './travelFeed';
import { defaultPreferences, UserPreferences } from '../lib/preferences';
import { Deal } from '../data/deals';

const createDeal = (overrides: Partial<Deal> = {}): Deal =>
  ({
    id: 'test-deal-1',
    fromCode: 'HAN',
    toCode: 'BKK',
    region: 'asia',
    airline: 'Vietjet Air',
    airlineCode: 'VJ',
    flightNumber: 'VJ901',
    price: 2_500_000,
    originalPrice: 4_000_000,
    dealScore: 75,
    departureDate: '2026-11-15',
    returnDate: '2026-11-20',
    stops: 0,
    duration: '2h 15m',
    bookingUrl: 'https://vietjetair.com',
    observedAt: '2026-10-01T12:00:00Z',
    aiInsight: {
      headline: 'Vé tốt',
      verdict: 'Giá rẻ',
      savingScore: 75,
      priceSummary: 'Giảm 37%',
      pointsOfInterest: [],
      historicalContext: 'Mức thấp 90 ngày',
    },
    ...overrides,
  }) as unknown as Deal;

describe('Travel Feed Ranking & Destination Diversification (REQ-DOM-001, FLY-SCORE-001, FLY-INTEL-001)', () => {
  describe('rankTravelFeed (Generic Feed)', () => {
    it('ranks by score and diversifies destinations before repeats', () => {
      const result = rankTravelFeed([
        createDeal({ id: 'bkk-low', toCode: 'BKK', dealScore: 70, observedAt: '2026-08-03' }),
        createDeal({ id: 'bkk-high', toCode: 'BKK', dealScore: 95, observedAt: '2026-08-01' }),
        createDeal({ id: 'tpe', toCode: 'TPE', dealScore: 80, observedAt: '2026-08-02' }),
      ]);
      expect(result.map((item) => item.id)).toEqual(['bkk-high', 'tpe', 'bkk-low']);
    });

    it('prioritizes dealScore over aiInsight.savingScore when dealScore is present', () => {
      const result = rankTravelFeed([
        createDeal({ id: 'deal-canonical', toCode: 'BKK', dealScore: 90, aiInsight: { savingScore: 50 } as any }),
        createDeal({ id: 'deal-legacy', toCode: 'SIN', dealScore: undefined, aiInsight: { savingScore: 85 } as any }),
      ]);
      expect(result.map((item) => item.id)).toEqual(['deal-canonical', 'deal-legacy']);
    });

    it('breaks score ties by newest observedAt timestamp', () => {
      const result = rankTravelFeed([
        createDeal({ id: 'older', toCode: 'BKK', dealScore: 80, observedAt: '2026-08-01T10:00:00Z' }),
        createDeal({ id: 'newer', toCode: 'SIN', dealScore: 80, observedAt: '2026-08-02T10:00:00Z' }),
        createDeal({ id: 'oldest', toCode: 'TPE', dealScore: 80, observedAt: '2026-07-31T10:00:00Z' }),
      ]);
      expect(result.map((item) => item.id)).toEqual(['newer', 'older', 'oldest']);
    });

    it('preserves 100% of deals without dropping any repeat destination alternatives', () => {
      const deals = [
        createDeal({ id: 'bkk-1', toCode: 'BKK', dealScore: 90 }),
        createDeal({ id: 'bkk-2', toCode: 'BKK', dealScore: 85 }),
        createDeal({ id: 'bkk-3', toCode: 'BKK', dealScore: 70 }),
        createDeal({ id: 'sin-1', toCode: 'SIN', dealScore: 80 }),
        createDeal({ id: 'tpe-1', toCode: 'TPE', dealScore: 88 }),
      ];
      const result = rankTravelFeed(deals);
      expect(result).toHaveLength(5);
      // Unique destinations first: bkk-1 (90), tpe-1 (88), sin-1 (80), then bkk-2 (85), bkk-3 (70)
      expect(result.map((item) => item.id)).toEqual(['bkk-1', 'tpe-1', 'sin-1', 'bkk-2', 'bkk-3']);
    });

    it('ranks purely by score and timestamp when all deals share a single destination', () => {
      const deals = [
        createDeal({ id: 'bkk-med', toCode: 'BKK', dealScore: 80, observedAt: '2026-08-01' }),
        createDeal({ id: 'bkk-high', toCode: 'BKK', dealScore: 90, observedAt: '2026-08-01' }),
        createDeal({ id: 'bkk-low', toCode: 'BKK', dealScore: 70, observedAt: '2026-08-01' }),
      ];
      const result = rankTravelFeed(deals);
      expect(result.map((item) => item.id)).toEqual(['bkk-high', 'bkk-med', 'bkk-low']);
    });

    it('keeps deterministic order when score or timestamp is NaN or malformed', () => {
      const result = rankTravelFeed([
        createDeal({ id: 'invalid', toCode: 'BKK', dealScore: Number.NaN, observedAt: 'not-a-date' }),
        createDeal({ id: 'valid', toCode: 'TPE', dealScore: 10, observedAt: '2026-08-01' }),
      ]);
      expect(result.map((item) => item.id)).toEqual(['valid', 'invalid']);
    });

    it('handles empty and single-element deal arrays cleanly', () => {
      expect(rankTravelFeed([])).toEqual([]);
      const single = [createDeal({ id: 'lone-wolf' })];
      expect(rankTravelFeed(single)).toEqual(single);
    });

    it('does not mutate the original input array or objects', () => {
      const input = Object.freeze([
        createDeal({ id: 'a', toCode: 'BKK', dealScore: 50 }),
        createDeal({ id: 'b', toCode: 'SIN', dealScore: 90 }),
      ]);
      const result = rankTravelFeed(input as unknown as Deal[]);
      expect(result[0].id).toBe('b');
      expect(input[0].id).toBe('a');
    });
  });

  describe('rankPersonalizedFeed (User Preferences Layer)', () => {
    it('applies home airport affinity boost (+8)', () => {
      const deals = [
        createDeal({ id: 'from-sgn', fromCode: 'SGN', toCode: 'BKK', dealScore: 70 }),
        createDeal({ id: 'from-han', fromCode: 'HAN', toCode: 'BKK', dealScore: 70 }),
      ];
      const prefs: UserPreferences = { ...defaultPreferences, homeAirport: 'HAN' };
      const result = rankPersonalizedFeed(deals, prefs);

      expect(result[0].id).toBe('from-han');
    });

    it('applies favorite region alignment boost (+12)', () => {
      const deals = [
        createDeal({ id: 'europe', toCode: 'CDG', region: 'europe', dealScore: 75 }),
        createDeal({ id: 'asia', toCode: 'BKK', region: 'asia', dealScore: 70 }),
      ];
      const prefs: UserPreferences = { ...defaultPreferences, favoriteRegions: ['asia'] };
      const result = rankPersonalizedFeed(deals, prefs);

      // Asia gets 70 + 12 = 82 vs Europe 75
      expect(result[0].id).toBe('asia');
    });

    it('applies preferred airline boost (+10)', () => {
      const deals = [
        createDeal({ id: 'airline-other', airlineCode: 'JL', dealScore: 75 }),
        createDeal({ id: 'airline-preferred', airlineCode: 'VJ', dealScore: 70 }),
      ];
      const prefs: UserPreferences = { ...defaultPreferences, preferredAirlines: ['VJ'] };
      const result = rankPersonalizedFeed(deals, prefs);

      // Preferred gets 70 + 10 = 80 vs 75
      expect(result[0].id).toBe('airline-preferred');
    });

    it('penalizes excess stops by -10 per stop, capped at -20', () => {
      const deals = [
        createDeal({ id: 'three-stops', stops: 3, dealScore: 80, toCode: 'BKK' }),
        createDeal({ id: 'one-stop', stops: 1, dealScore: 80, toCode: 'SIN' }),
        createDeal({ id: 'direct', stops: 0, dealScore: 68, toCode: 'DAD' }),
      ];
      const prefs: UserPreferences = { ...defaultPreferences, maxStops: 0 };
      const result = rankPersonalizedFeed(deals, prefs);

      // one-stop: 80 - 10 = 70; direct: 68; three-stops: 80 - 20 = 60
      expect(result.map((d) => d.id)).toEqual(['one-stop', 'direct', 'three-stops']);
    });

    it('penalizes over-budget deals by -15 without dropping them from the feed', () => {
      const deals = [
        createDeal({ id: 'expensive', price: 10_000_000, dealScore: 80, toCode: 'BKK' }),
        createDeal({ id: 'affordable', price: 4_000_000, dealScore: 70, toCode: 'SIN' }),
      ];
      const prefs: UserPreferences = { ...defaultPreferences, budget: 5_000_000 };
      const result = rankPersonalizedFeed(deals, prefs);

      // expensive: 80 - 15 = 65; affordable: 70
      expect(result.map((d) => d.id)).toEqual(['affordable', 'expensive']);
    });

    it('penalizes flights exceeding maxFlightTimeMinutes by -10', () => {
      const deals = [
        createDeal({ id: 'long-flight', duration: '5h 30m', dealScore: 75 }), // 330 min
        createDeal({ id: 'short-flight', duration: '2h 15m', dealScore: 70 }), // 135 min
      ];
      const prefs: UserPreferences = { ...defaultPreferences, maxFlightTimeMinutes: 240 };
      const result = rankPersonalizedFeed(deals, prefs);

      // long-flight: 75 - 10 = 65; short-flight: 70
      expect(result[0].id).toBe('short-flight');
    });
  });

  describe('High-Volume Performance & Immutability', () => {
    it('ranks and personalizes 1,000 deals in sub-50ms', () => {
      const destinations = ['BKK', 'SIN', 'KUL', 'TPE', 'ICN', 'NRT', 'HKG', 'DPS', 'SYD', 'CDG'];
      const deals: Deal[] = [];

      for (let i = 0; i < 1000; i++) {
        deals.push(
          createDeal({
            id: `deal-${i}`,
            toCode: destinations[i % destinations.length],
            dealScore: 50 + (i % 50),
            price: 2_000_000 + (i % 20) * 100_000,
            observedAt: new Date(1700000000000 + i * 100000).toISOString(),
          })
        );
      }

      const start = performance.now();
      const ranked = rankTravelFeed(deals);
      const personalized = rankPersonalizedFeed(deals, defaultPreferences);
      const elapsed = performance.now() - start;

      expect(ranked).toHaveLength(1000);
      expect(personalized).toHaveLength(1000);
      expect(elapsed).toBeLessThan(50);
    });

    it('does not mutate frozen deal input arrays during personalization', () => {
      const frozenDeals = Object.freeze([
        createDeal({ id: 'd1', dealScore: 80 }),
        createDeal({ id: 'd2', dealScore: 60 }),
      ]);

      const result = rankPersonalizedFeed(frozenDeals as unknown as Deal[], defaultPreferences);
      expect(result).toHaveLength(2);
      expect(frozenDeals[0].id).toBe('d1');
    });
  });
});
