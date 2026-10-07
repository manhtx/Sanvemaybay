import { describe, it, expect } from 'vitest';
import {
  createTravelIntent,
  deriveMarketScope,
  resolveLocationScope,
  satisfiesLocationScope,
  AIRPORT_CATALOG,
  METRO_CATALOG,
  createMoney,
  normalizeToPerTraveler,
  compareMoney,
  IncompatibleMoneyComparisonError,
  buildPriceScopeFingerprint,
  buildPriceScopeFingerprintV2,
  buildPriceScopeFingerprintV2FromIntent,
  evaluateOfferEligibility,
  normalizeOfferForIntent,
  selectRouteBest,
  RouteOffer,
  determineEvidenceLevel,
  compareAgainstCohort,
  filterComparableCohort,
  HistoricalObservation,
  evaluateTrueCost
} from './index';

describe('NODE TK-01 & TK-02: Canonical TravelIntent V2 & One Location Catalog', () => {
  it('exposes complete AIRPORT_CATALOG and METRO_CATALOG metadata', () => {
    expect(AIRPORT_CATALOG.HAN.country).toBe('VN');
    expect(AIRPORT_CATALOG.BKK.metroId).toBe('BKK_METRO');
    expect(METRO_CATALOG.BKK_METRO.airports).toContain('DMK');
    expect(METRO_CATALOG.TYO_METRO.airports).toContain('NRT');
  });

  it('derives marketScope purely from AIRPORT_CATALOG country metadata without separate VN list', () => {
    // Domestic: HAN -> SGN both have country 'VN'
    expect(deriveMarketScope('HAN', 'SGN')).toBe('DOMESTIC');
    expect(deriveMarketScope('DAD', 'CXR')).toBe('DOMESTIC');
    expect(deriveMarketScope('BMV', 'VCA')).toBe('DOMESTIC');

    // International: HAN -> BKK (VN to TH)
    expect(deriveMarketScope('HAN', 'BKK')).toBe('INTERNATIONAL');
    // International: SGN -> SIN (VN to SG)
    expect(deriveMarketScope('SGN', 'SIN')).toBe('INTERNATIONAL');
  });

  it('normalizes legacy BKK_ALL and TYO_ALL to canonical BKK_METRO and TYO_METRO', () => {
    const bkk = resolveLocationScope('BKK_ALL');
    expect(bkk.primaryCode).toBe('BKK_METRO');
    expect(bkk.expandedCodes).toEqual(['BKK', 'DMK']);

    const tyo = resolveLocationScope('TYO_ALL');
    expect(tyo.primaryCode).toBe('TYO_METRO');
    expect(tyo.expandedCodes).toEqual(['HND', 'NRT']);

    const sel = resolveLocationScope('SEL_METRO');
    expect(sel.primaryCode).toBe('SEL_METRO');
    expect(sel.expandedCodes).toEqual(['ICN', 'GMP']);
  });

  it('preserves exact airport scope vs metro scope invariants (NC-002, NC-003)', () => {
    const exactBkk = resolveLocationScope('BKK', 'EXACT_AIRPORT');
    expect(satisfiesLocationScope('BKK', exactBkk)).toBe(true);
    expect(satisfiesLocationScope('DMK', exactBkk)).toBe(false);

    const bkkMetro = resolveLocationScope('BKK_METRO');
    expect(satisfiesLocationScope('BKK', bkkMetro)).toBe(true);
    expect(satisfiesLocationScope('DMK', bkkMetro)).toBe(true);
  });

  it('preserves full binding TravelIntent fields including tripLength and maxDurationMinutes', () => {
    const intent = createTravelIntent({
      origin: 'HAN',
      destination: 'BKK',
      journeyType: 'ROUND_TRIP',
      outboundDate: '2026-11-10',
      returnDate: '2026-11-15',
      adults: 2,
      children: 1,
      cabin: 'BUSINESS',
      maxStops: 0,
      maxDurationMinutes: 180,
      tripLength: { minDays: 5, maxDays: 7 },
      baggagePreference: 'CHECKED_20KG'
    });

    expect(intent.marketScope).toBe('INTERNATIONAL');
    expect(intent.passengers).toEqual({ adults: 2, children: 1, infants: 0 });
    expect(intent.cabin).toBe('BUSINESS');
    expect(intent.maxDurationMinutes).toBe(180);
    expect(intent.tripLength).toEqual({ minDays: 5, maxDays: 7 });
    expect(intent.baggagePreference).toBe('CHECKED_20KG');
  });
});

describe('NODE TK-03 & TK-04: Money & PriceScope V2', () => {
  it('enforces pricing unit comparability (NC-005)', () => {
    const perTraveler = createMoney(2000000, 'VND', 'PER_TRAVELER');
    const partyTotal = createMoney(4000000, 'VND', 'PARTY_TOTAL');

    expect(() => compareMoney(perTraveler, partyTotal)).toThrow(IncompatibleMoneyComparisonError);

    const normalized = normalizeToPerTraveler(partyTotal, 2);
    expect(compareMoney(perTraveler, normalized)).toBe(0);
  });

  it('builds canonical PriceScope V2 fingerprint containing all comparability dimensions', () => {
    const intent = createTravelIntent({
      origin: 'HAN',
      destination: 'BKK',
      journeyType: 'ROUND_TRIP',
      outboundDate: '2026-11-10',
      returnDate: '2026-11-15',
      adults: 2,
      children: 1,
      cabin: 'ECONOMY',
      maxStops: 0,
      maxDurationMinutes: 180,
      tripLength: { minDays: 5, maxDays: 5 }
    });

    const fpV2 = buildPriceScopeFingerprintV2FromIntent(intent);
    expect(fpV2).toContain('scope_v2:');
    expect(fpV2).toContain('HAN:BKK:ROUND_TRIP:2026-11-10:2026-11-15:5-5:2A1C0I:PER_TRAVELER:ECONOMY:VND:0:180');

    const directV2 = buildPriceScopeFingerprintV2({
      originScope: resolveLocationScope('HAN'),
      destinationScope: resolveLocationScope('BKK'),
      journeyType: 'ROUND_TRIP',
      departDate: '2026-11-10',
      returnDate: '2026-11-15',
      tripLength: { minDays: 5, maxDays: 5 },
      passengers: { adults: 2, children: 1, infants: 0 },
      pricingUnit: 'PER_TRAVELER',
      cabin: 'ECONOMY',
      currency: 'VND',
      maxStops: 0,
      maxDurationMinutes: 180
    });
    expect(directV2).toBe(fpV2);

    const legacyFp = buildPriceScopeFingerprint({
      originScope: resolveLocationScope('HAN'),
      destinationScope: resolveLocationScope('BKK'),
      journeyType: 'ROUND_TRIP',
      departDate: '2026-11-10',
      returnDate: '2026-11-15'
    });
    expect(legacyFp).toContain('scope_');
  });
});

describe('NODE TK-05 & TK-06: Offer Eligibility & Canonical RouteBest', () => {
  const baseIntent = createTravelIntent({
    origin: 'HAN',
    destination: 'BKK',
    journeyType: 'ROUND_TRIP',
    outboundDate: '2026-11-10',
    returnDate: '2026-11-15',
    adults: 2,
    cabin: 'ECONOMY',
    maxStops: 0,
    maxDurationMinutes: 200
  });

  it('emits typed ineligibility reasons on mismatch', () => {
    // Ineligible due to stops
    const stopsOffer: RouteOffer = {
      id: 'off_stops',
      origin: 'HAN',
      destination: 'BKK',
      departDate: '2026-11-10',
      returnDate: '2026-11-15',
      airline: 'VN',
      price: 2000000,
      stops: 1
    };
    const evalStops = evaluateOfferEligibility(stopsOffer, baseIntent);
    expect(evalStops.isEligible).toBe(false);
    expect(evalStops.reasons).toContain('STOPS_EXCEEDED');

    // Ineligible due to cabin
    const cabinOffer: RouteOffer = {
      id: 'off_biz',
      origin: 'HAN',
      destination: 'BKK',
      departDate: '2026-11-10',
      returnDate: '2026-11-15',
      airline: 'VN',
      price: 3500000,
      cabin: 'BUSINESS',
      stops: 0
    };
    const evalCabin = evaluateOfferEligibility(cabinOffer, baseIntent);
    expect(evalCabin.isEligible).toBe(false);
    expect(evalCabin.reasons).toContain('CABIN_MISMATCH');

    // Ineligible due to missing return date on round trip
    const noReturnOffer: RouteOffer = {
      id: 'off_noreturn',
      origin: 'HAN',
      destination: 'BKK',
      departDate: '2026-11-10',
      airline: 'VN',
      price: 1500000,
      stops: 0
    };
    const evalNoReturn = evaluateOfferEligibility(noReturnOffer, baseIntent);
    expect(evalNoReturn.isEligible).toBe(false);
    expect(evalNoReturn.reasons).toContain('MISSING_RETURN_DATE');
  });

  it('normalizes PARTY_TOTAL to PER_TRAVELER when selecting RouteBest', () => {
    const partyOffer: RouteOffer = {
      id: 'off_party',
      origin: 'HAN',
      destination: 'BKK',
      departDate: '2026-11-10',
      returnDate: '2026-11-15',
      airline: 'VJ',
      price: 5000000, // 5M for party of 2 = 2.5M per person
      pricingUnit: 'PARTY_TOTAL',
      stops: 0
    };

    const perTravelerOffer: RouteOffer = {
      id: 'off_pax',
      origin: 'HAN',
      destination: 'BKK',
      departDate: '2026-11-10',
      returnDate: '2026-11-15',
      airline: 'VN',
      price: 2800000, // 2.8M per person
      pricingUnit: 'PER_TRAVELER',
      stops: 0
    };

    const best = selectRouteBest([perTravelerOffer, partyOffer], baseIntent);
    expect(best).not.toBeNull();
    expect(best?.id).toBe('off_party');
    expect(best?.price).toBe(2500000); // normalized to per traveler
  });

  it('mathematical minimum always beats higher Deal Score (REQ-PRICE-003, NC-001)', () => {
    const cheapOffer: RouteOffer = {
      id: 'off_cheap',
      origin: 'HAN',
      destination: 'BKK',
      departDate: '2026-11-10',
      returnDate: '2026-11-15',
      airline: 'AK',
      price: 2400000,
      dealScore: 70,
      stops: 0
    };

    const highDealScoreOffer: RouteOffer = {
      id: 'off_high_score',
      origin: 'HAN',
      destination: 'BKK',
      departDate: '2026-11-10',
      returnDate: '2026-11-15',
      airline: 'VN',
      price: 2700000,
      dealScore: 99,
      stops: 0
    };

    const best = selectRouteBest([highDealScoreOffer, cheapOffer], baseIntent);
    expect(best?.id).toBe('off_cheap');
    expect(best?.price).toBe(2400000);
  });

  it('normalizes PARTY_TOTAL offer prices to PER_TRAVELER based on party size', () => {
    const rawPartyOffer: RouteOffer = {
      id: 'off_party',
      origin: 'HAN',
      destination: 'BKK',
      departDate: '2026-11-10',
      returnDate: '2026-11-15',
      airline: 'VN',
      price: 6000000,
      pricingUnit: 'PARTY_TOTAL',
      stops: 0
    };
    // party size is 2 adults = 2 paying travelers
    const normalized = normalizeOfferForIntent(rawPartyOffer, baseIntent);
    expect(normalized.price).toBe(3000000);
    expect(normalized.pricingUnit).toBe('PER_TRAVELER');
  });
});

describe('NODE TK-07: One Comparable Cohort Engine', () => {
  it('determines evidence level directly based on sample size and epoch diversity', () => {
    expect(determineEvidenceLevel(2)).toBe('INSUFFICIENT');
    expect(determineEvidenceLevel(7, { uniqueEpochs: 1 })).toBe('WEAK');
    expect(determineEvidenceLevel(10, { uniqueEpochs: 4 })).toBe('MODERATE');
    expect(determineEvidenceLevel(25, { uniqueEpochs: 8 })).toBe('STRONG');
    expect(determineEvidenceLevel(25, { uniqueEpochs: 8, hasDegradedOnly: true })).toBe('MODERATE'); // degraded capped
  });

  const observations: HistoricalObservation[] = [
    { observationId: '1', observedAt: '2026-10-01T08:00:00Z', departLocalDate: '2026-11-10', origin: 'HAN', destination: 'BKK', price: 2500000, currency: 'VND', cabin: 'ECONOMY', stops: 0, scanEpoch: 'epoch_1' },
    { observationId: '2', observedAt: '2026-10-01T08:00:00Z', departLocalDate: '2026-11-10', origin: 'HAN', destination: 'BKK', price: 2600000, currency: 'VND', cabin: 'ECONOMY', stops: 0, scanEpoch: 'epoch_1' },
    { observationId: '3', observedAt: '2026-10-01T08:00:00Z', departLocalDate: '2026-11-10', origin: 'HAN', destination: 'BKK', price: 2700000, currency: 'VND', cabin: 'ECONOMY', stops: 0, scanEpoch: 'epoch_1' },
    { observationId: '4', observedAt: '2026-10-01T08:00:00Z', departLocalDate: '2026-11-10', origin: 'HAN', destination: 'BKK', price: 2550000, currency: 'VND', cabin: 'ECONOMY', stops: 0, scanEpoch: 'epoch_1' },
    { observationId: '5', observedAt: '2026-10-01T08:00:00Z', departLocalDate: '2026-11-10', origin: 'HAN', destination: 'BKK', price: 2650000, currency: 'VND', cabin: 'ECONOMY', stops: 0, scanEpoch: 'epoch_1' },
    { observationId: '6', observedAt: '2026-10-01T08:00:00Z', departLocalDate: '2026-11-10', origin: 'HAN', destination: 'BKK', price: 2580000, currency: 'VND', cabin: 'ECONOMY', stops: 0, scanEpoch: 'epoch_1' },
    { observationId: '7', observedAt: '2026-10-01T08:00:00Z', departLocalDate: '2026-11-10', origin: 'HAN', destination: 'BKK', price: 2590000, currency: 'VND', cabin: 'ECONOMY', stops: 0, scanEpoch: 'epoch_1' },
  ];

  it('caps single-epoch observations at WEAK evidence despite sample size >= 7', () => {
    // 7 rows but only 1 epoch
    const res = compareAgainstCohort(2400000, observations);
    expect(res.sampleSize).toBe(7);
    expect(res.uniqueEpochs).toBe(1);
    expect(res.evidenceLevel).toBe('WEAK'); // Single epoch cannot provide MODERATE/STRONG confidence
  });

  it('promotes to MODERATE or STRONG when observations span multiple independent epochs', () => {
    const multiEpochObs: HistoricalObservation[] = observations.map((o, idx) => ({
      ...o,
      scanEpoch: `epoch_${idx + 1}`
    }));
    const res = compareAgainstCohort(2400000, multiEpochObs);
    expect(res.uniqueEpochs).toBe(7);
    expect(res.evidenceLevel).toBe('MODERATE');
  });

  it('caps degraded fallback observations at MODERATE maximum', () => {
    const degradedObs: HistoricalObservation[] = Array.from({ length: 20 }, (_, i) => ({
      observationId: String(i),
      observedAt: `2026-10-0${(i % 5) + 1}T08:00:00Z`,
      departLocalDate: '2026-11-10',
      origin: 'HAN',
      destination: 'BKK',
      price: 2500000 + i * 10000,
      currency: 'VND',
      cabin: 'ECONOMY',
      stops: 0,
      scanEpoch: `epoch_${i}`,
      sourceQuality: 'DEGRADED_FALLBACK'
    }));

    const res = compareAgainstCohort(2400000, degradedObs);
    expect(res.evidenceLevel).toBe('MODERATE'); // Capped: cannot be STRONG
  });

  it('filters raw observations strictly by cohort dimensions', () => {
    const mixedObs: HistoricalObservation[] = [
      { observationId: '1', observedAt: '2026-10-01T00:00:00Z', departLocalDate: '2026-11-10', origin: 'HAN', destination: 'BKK', price: 2500000, currency: 'VND', cabin: 'ECONOMY', stops: 0 },
      { observationId: '2', observedAt: '2026-10-01T00:00:00Z', departLocalDate: '2026-11-10', origin: 'HAN', destination: 'BKK', price: 5000000, currency: 'VND', cabin: 'BUSINESS', stops: 0 },
      { observationId: '3', observedAt: '2026-10-01T00:00:00Z', departLocalDate: '2026-11-10', origin: 'HAN', destination: 'SGN', price: 2000000, currency: 'VND', cabin: 'ECONOMY', stops: 0 }
    ];

    const filtered = filterComparableCohort(mixedObs, { origin: 'HAN', destination: 'BKK', cabin: 'ECONOMY' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].observationId).toBe('1');
  });
});

describe('NODE TK-08: Cost Epistemics Single Authority', () => {
  it('enforces epistemic honesty: UNKNOWN mandatory != 0', () => {
    const evalResult = evaluateTrueCost({
      basePrice: 2000000,
      airline: 'VJ',
      isInternational: true
    });

    expect(evalResult.hasUnknownMandatoryCost).toBe(true);
    expect(evalResult.totalLabel).toBe('Tổng ước tính');
    const tax = evalResult.itemizedFees.find(f => f.id === 'taxes_and_fees');
    expect(tax?.status).toBe('UNKNOWN');
    expect(tax?.amount).toBeNull(); // Never zero
  });
});
