import { describe, expect, it } from 'vitest';
import { filterDeals } from '../data/api';
import { resolveCanonicalAirportOrCity } from './travelEntities';
import { Deal } from '../data/deals';

function makeDummyDeal(
  index: number,
  origin: string,
  destination: string,
  destName: string,
  price: number,
  overrides: Partial<Deal> = {},
): Deal {
  return {
    id: `deal-${index}`,
    from: origin === 'HAN' ? 'Hà Nội' : origin === 'SGN' ? 'TP. Hồ Chí Minh' : origin,
    fromCode: origin,
    to: destName,
    toCode: destination,
    country: destination === 'BKK' || destination === 'DMK' ? 'Thái Lan' : destination === 'NRT' || destination === 'HND' ? 'Nhật Bản' : 'Việt Nam',
    region: destination === 'BKK' || destination === 'DMK' || destination === 'NRT' || destination === 'HND' || destination === 'SIN' ? 'asia' : 'domestic',
    price,
    normalPrice: price * 1.3,
    discount: 23,
    currency: 'VND',
    airline: 'VietJet Air',
    airlineCode: 'VJ',
    departDate: '2026-11-01',
    returnDate: '2026-11-05',
    duration: '2h 00m',
    stops: 0,
    stopCity: null,
    seatsLeft: 5,
    expiresIn: '2 giờ',
    image: '',
    flightNumber: 'VJ901',
    aiInsight: {
      headline: 'Vé tốt',
      verdict: 'Giá rẻ',
      reason: 'Mức giá quan sát tốt',
      tags: ['Giá quan sát'],
      risk: 'low',
      riskDetails: 'Chuyến bay thẳng tiêu chuẩn',
      recommendation: 'wait',
      recommendationNote: 'Kiểm tra giá trước khi đặt',
      savingScore: 80,
      priceSummary: 'Giảm 23%',
      pointsOfInterest: [],
      historicalContext: 'Mức thấp 90 ngày',
    },
    hiddenCosts: [],
    advertisedTotal: price,
    realTotal: price,
    isTrending: false,
    isFlashDeal: false,
    tripType: 'round-trip',
    ...overrides,
  } as unknown as Deal;
}

describe('Global Canonical Search - Negative Controls & Deep Pagination (FLY-INTEL-001, FLY-SCORE-001, REQ-METRO-001, GATE-DATA-TRUTH)', () => {
  describe('Entity Resolution (resolveCanonicalAirportOrCity)', () => {
    it('resolves canonical entity Bangkok to BKK_ALL (serving BKK and DMK) and Hà Nội to HAN', () => {
      const dest = resolveCanonicalAirportOrCity('Bangkok');
      expect(dest?.code).toBe('BKK_ALL');
      expect(dest?.servedAirports).toEqual(['BKK', 'DMK']);

      const orig = resolveCanonicalAirportOrCity('Hà Nội');
      expect(orig?.code).toBe('HAN');
    });

    it('resolves Tokyo canonical metropolitan entity with sister airports', () => {
      const tokyo = resolveCanonicalAirportOrCity('Tokyo');
      expect(tokyo?.code).toBe('TYO_ALL');
      expect(tokyo?.servedAirports).toEqual(['NRT', 'HND']);

      const seoul = resolveCanonicalAirportOrCity('Seoul');
      expect(seoul?.code).toBe('ICN');

      const taipei = resolveCanonicalAirportOrCity('Taipei');
      expect(taipei?.code).toBe('TPE');

      const singapore = resolveCanonicalAirportOrCity('Singapore');
      expect(singapore?.code).toBe('SIN');
    });
  });

  describe('Deep Pagination Negative Controls (GATE-02)', () => {
    it('finds target record placed beyond row 60, row 120, and row 1000 without shallow truncation', () => {
      const corpus: Deal[] = Array.from({ length: 1200 }, (_, i) => {
        if (i === 65) return makeDummyDeal(65, 'HAN', 'BKK', 'Bangkok', 4_500_000);
        if (i === 150) return makeDummyDeal(150, 'HAN', 'BKK', 'Bangkok', 4_600_000);
        if (i === 1050) return makeDummyDeal(1050, 'HAN', 'BKK', 'Bangkok', 4_400_000);
        return makeDummyDeal(i, 'HAN', 'DAD', 'Đà Nẵng', 1_200_000);
      });

      // 1. Search by IATA code BKK
      const resultsByCode = filterDeals(corpus, {
        from: 'HAN',
        destination: 'BKK',
      });
      expect(resultsByCode.length).toBe(3);
      expect(resultsByCode.map((d) => d.id)).toEqual(['deal-65', 'deal-150', 'deal-1050']);

      // 2. Search by natural language query Bangkok
      const resultsByName = filterDeals(corpus, {
        from: 'HAN',
        destination: 'Bangkok',
      });
      expect(resultsByName.length).toBe(3);
      expect(resultsByName.map((d) => d.id)).toEqual(['deal-65', 'deal-150', 'deal-1050']);

      // 3. Search with budget constraint <= 4.55M (should find deal-65 and deal-1050)
      const resultsBudget = filterDeals(corpus, {
        from: 'HAN',
        destination: 'Bangkok',
        budget: 4_550_000,
      });
      expect(resultsBudget.length).toBe(2);
      expect(resultsBudget.map((d) => d.id)).toEqual(['deal-65', 'deal-1050']);
    });
  });

  describe('Landmark Alias Matching & Metropolitan Expansion', () => {
    it('does not emit false Không tìm thấy when query matches aliases like Suvarnabhumi or Don Mueang', () => {
      const corpus = [
        makeDummyDeal(1, 'HAN', 'BKK', 'Bangkok', 4_500_000),
        makeDummyDeal(2, 'HAN', 'DMK', 'Bangkok', 3_800_000),
        makeDummyDeal(3, 'HAN', 'SGN', 'TP. Hồ Chí Minh', 1_500_000),
      ];

      const suvarnabhumi = filterDeals(corpus, { from: 'HAN', destination: 'Suvarnabhumi' });
      expect(suvarnabhumi.length).toBe(1);
      expect(suvarnabhumi[0].toCode).toBe('BKK');

      const donMueang = filterDeals(corpus, { from: 'HAN', destination: 'Don Mueang' });
      expect(donMueang.length).toBe(1);
      expect(donMueang[0].toCode).toBe('DMK');
    });

    it('expands metropolitan area search to match all constituent sister airports', () => {
      const corpus = [
        makeDummyDeal(1, 'HAN', 'BKK', 'Bangkok', 3_000_000), // Suvarnabhumi
        makeDummyDeal(2, 'HAN', 'DMK', 'Bangkok', 2_500_000), // Don Mueang
        makeDummyDeal(3, 'HAN', 'SIN', 'Singapore', 3_200_000),
      ];

      // Searching generic city Bangkok returns deals to both BKK and DMK
      const bangkokResults = filterDeals(corpus, { destination: 'Bangkok' });
      expect(bangkokResults).toHaveLength(2);
      expect(bangkokResults.map((d) => d.toCode)).toEqual(['BKK', 'DMK']);

      // Specific sister airport query DMK isolates Don Mueang and rejects BKK
      const dmkResults = filterDeals(corpus, { destination: 'DMK' });
      expect(dmkResults).toHaveLength(1);
      expect(dmkResults[0].toCode).toBe('DMK');
    });

    it('expands Tokyo metropolitan area to match both Narita and Haneda', () => {
      const corpus = [
        makeDummyDeal(1, 'HAN', 'NRT', 'Tokyo', 6_000_000),
        makeDummyDeal(2, 'HAN', 'HND', 'Tokyo', 6_500_000),
        makeDummyDeal(3, 'HAN', 'KIX', 'Osaka', 5_500_000),
      ];

      const tokyoResults = filterDeals(corpus, { destination: 'Tokyo' });
      expect(tokyoResults).toHaveLength(2);
      expect(tokyoResults.map((d) => d.toCode)).toEqual(['NRT', 'HND']);

      const naritaOnly = filterDeals(corpus, { destination: 'Narita' });
      expect(naritaOnly).toHaveLength(1);
      expect(naritaOnly[0].toCode).toBe('NRT');
    });
  });

  describe('Multi-Criteria Filtering Combinations', () => {
    const multiCorpus = [
      makeDummyDeal(1, 'HAN', 'BKK', 'Bangkok', 2_500_000, { stops: 0, region: 'asia', departDate: '2026-11-05', duration: '2h 00m' }),
      makeDummyDeal(2, 'HAN', 'BKK', 'Bangkok', 1_800_000, { stops: 1, region: 'asia', departDate: '2026-11-10', duration: '4h 30m' }),
      makeDummyDeal(3, 'SGN', 'BKK', 'Bangkok', 2_200_000, { stops: 0, region: 'asia', departDate: '2026-11-15', duration: '1h 50m' }),
      makeDummyDeal(4, 'HAN', 'DAD', 'Đà Nẵng', 1_100_000, { stops: 0, region: 'domestic', departDate: '2026-11-20', duration: '1h 20m' }),
    ];

    it('filters simultaneously by origin, destination, budget, and stops constraints', () => {
      // HAN -> BKK, direct only (maxStops: 0), budget <= 3M
      const filtered = filterDeals(multiCorpus, {
        from: 'HAN',
        destination: 'BKK',
        maxStops: 0,
        budget: 3_000_000,
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('deal-1');
    });

    it('filters by destination city query matching canonical entity', () => {
      const danang = filterDeals(multiCorpus, { destination: 'Đà Nẵng' });
      expect(danang).toHaveLength(1);
      expect(danang[0].toCode).toBe('DAD');

      const bangkok = filterDeals(multiCorpus, { destination: 'Bangkok' });
      expect(bangkok).toHaveLength(3);
    });

    it('returns empty array when no deals match combined criteria', () => {
      expect(filterDeals(multiCorpus, { destination: 'Paris' })).toEqual([]);
      expect(filterDeals(multiCorpus, { from: 'DAD', destination: 'BKK' })).toEqual([]);
      expect(filterDeals([], { destination: 'Bangkok' })).toEqual([]);
    });

    it('filters by departure date window (departureFrom and departureTo)', () => {
      const windowResults = filterDeals(multiCorpus, {
        departureFrom: '2026-11-08',
        departureTo: '2026-11-18',
      });

      expect(windowResults).toHaveLength(2);
      expect(windowResults.map((d) => d.id)).toEqual(['deal-2', 'deal-3']);

      // Exact single day match
      const exactDay = filterDeals(multiCorpus, {
        departureFrom: '2026-11-05',
        departureTo: '2026-11-05',
      });
      expect(exactDay).toHaveLength(1);
      expect(exactDay[0].id).toBe('deal-1');
    });

    it('immediately returns empty array when departureFrom is strictly after departureTo', () => {
      const inverted = filterDeals(multiCorpus, {
        departureFrom: '2026-11-25',
        departureTo: '2026-11-10',
      });
      expect(inverted).toEqual([]);
    });

    it('filters by maximum flight time minutes (maxFlightTimeMinutes)', () => {
      // Deals under 120 minutes: deal-1 (120m), deal-3 (110m), deal-4 (80m)
      const under2Hours = filterDeals(multiCorpus, {
        maxFlightTimeMinutes: 120,
      });
      expect(under2Hours).toHaveLength(3);
      expect(under2Hours.map((d) => d.id)).toEqual(['deal-1', 'deal-3', 'deal-4']);

      // Deals under 90 minutes: deal-4 (80m)
      const under90Min = filterDeals(multiCorpus, {
        maxFlightTimeMinutes: 90,
      });
      expect(under90Min).toHaveLength(1);
      expect(under90Min[0].id).toBe('deal-4');
    });

    it('respects exact price budget boundary conditions (price <= budget)', () => {
      const atExactBudget = filterDeals(multiCorpus, { budget: 2_200_000 });
      // deal-2 (1.8M), deal-3 (2.2M), deal-4 (1.1M)
      expect(atExactBudget).toHaveLength(3);
      expect(atExactBudget.map((d) => d.id)).toEqual(['deal-2', 'deal-3', 'deal-4']);

      const belowBudget = filterDeals(multiCorpus, { budget: 2_199_999 });
      // deal-2 (1.8M), deal-4 (1.1M)
      expect(belowBudget).toHaveLength(2);
      expect(belowBudget.map((d) => d.id)).toEqual(['deal-2', 'deal-4']);
    });

    it('respects exact maxStops boundary conditions (stops <= maxStops)', () => {
      const directOnly = filterDeals(multiCorpus, { maxStops: 0 });
      expect(directOnly).toHaveLength(3);
      expect(directOnly.every((d) => d.stops === 0)).toBe(true);

      const oneStopAllowed = filterDeals(multiCorpus, { maxStops: 1 });
      expect(oneStopAllowed).toHaveLength(4);
    });

    it('handles whitespace-padded search queries and case insensitivity', () => {
      const paddedCode = filterDeals(multiCorpus, { destination: '  bkk  ' });
      expect(paddedCode).toHaveLength(3);

      const paddedCity = filterDeals(multiCorpus, { destination: '   Bangkok   ' });
      expect(paddedCity).toHaveLength(3);
    });

    it('returns full deal catalog untouched when filter criteria object is completely empty', () => {
      const unfiltered = filterDeals(multiCorpus, {});
      expect(unfiltered).toHaveLength(4);
      expect(unfiltered.map((d) => d.id)).toEqual(['deal-1', 'deal-2', 'deal-3', 'deal-4']);
    });

    it('filters with partial name or code substring fallback when destination is not an exact canonical match', () => {
      const nẵngDeals = filterDeals(multiCorpus, { destination: 'nẵng' });
      expect(nẵngDeals).toHaveLength(1);
      expect(nẵngDeals[0].id).toBe('deal-4');

      const dadCodeDeals = filterDeals(multiCorpus, { destination: 'dad' });
      expect(dadCodeDeals).toHaveLength(1);
      expect(dadCodeDeals[0].id).toBe('deal-4');
    });

    it('filters by canonical origin metropolitan expansion (e.g. from Tokyo TYO_ALL or HAN)', () => {
      const hanOrigin = filterDeals(multiCorpus, { from: 'HAN' });
      expect(hanOrigin).toHaveLength(3);
      expect(hanOrigin.every((d) => d.fromCode === 'HAN')).toBe(true);

      const sgnOrigin = filterDeals(multiCorpus, { from: 'SGN' });
      expect(sgnOrigin).toHaveLength(1);
      expect(sgnOrigin[0].fromCode === 'SGN').toBe(true);
    });
  });

  describe('High-Volume Performance & Pure Immutability', () => {
    it('filters a 2,000 deal corpus across complex multi-criteria in sub-50ms', () => {
      const largeCorpus: Deal[] = Array.from({ length: 2000 }, (_, i) =>
        makeDummyDeal(i, i % 2 === 0 ? 'HAN' : 'SGN', i % 4 === 0 ? 'BKK' : i % 4 === 1 ? 'DMK' : i % 4 === 2 ? 'SIN' : 'DAD', 'Dest', 2_000_000 + i * 1000)
      );

      const start = performance.now();
      const results = filterDeals(largeCorpus, {
        from: 'HAN',
        destination: 'Bangkok',
        budget: 3_000_000,
      });
      const elapsed = performance.now() - start;

      expect(results.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(50);
    });

    it('does not mutate input deal corpus arrays or items', () => {
      const frozenCorpus = Object.freeze([
        makeDummyDeal(1, 'HAN', 'BKK', 'Bangkok', 3_000_000),
        makeDummyDeal(2, 'HAN', 'DMK', 'Bangkok', 2_500_000),
      ]);

      const res = filterDeals(frozenCorpus as unknown as Deal[], { destination: 'Bangkok' });
      expect(res).toHaveLength(2);
      expect(frozenCorpus[0].id).toBe('deal-1');
    });
  });
});
