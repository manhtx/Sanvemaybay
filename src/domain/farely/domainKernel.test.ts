/**
 * Comprehensive Domain Kernel Property & Invariant Tests
 * Enforcing REQ-DOM-001..015, REQ-PRICE-001..006, and Negative Controls NC-001..NC-033
 */

import { describe, it, expect } from 'vitest';
import {
  resolveLocationScope,
  satisfiesLocationScope,
  createMoney,
  compareMoney,
  normalizeToPerTraveler,
  IncompatibleMoneyComparisonError,
  validateObservationVsDeparture,
  createTravelIntent,
  serializeTravelIntent,
  deserializeTravelIntent,
  buildOfferVariantId,
  buildObservationId,
  buildPriceScopeFingerprintFromIntent,
  selectRouteBest,
  RouteOffer,
  compareAgainstCohort,
  evaluateTrueCost,
  createErrorResult,
  createSuccessResult,
  evaluateWatchCondition,
  calculateSavings
} from './index';

describe('Farely Pure Domain Kernel — Location Scope (REQ-DOM-004, NC-002, NC-003)', () => {
  it('NC-002: DMK cannot satisfy exact BKK', () => {
    const exactBkk = resolveLocationScope('BKK', 'EXACT_AIRPORT');
    expect(exactBkk.type).toBe('EXACT_AIRPORT');
    expect(satisfiesLocationScope('BKK', exactBkk)).toBe(true);
    expect(satisfiesLocationScope('DMK', exactBkk)).toBe(false);
  });

  it('NC-003: DMK can satisfy Bangkok Metro', () => {
    const bkkMetro = resolveLocationScope('BKK', 'METRO');
    expect(bkkMetro.type).toBe('METRO');
    expect(satisfiesLocationScope('BKK', bkkMetro)).toBe(true);
    expect(satisfiesLocationScope('DMK', bkkMetro)).toBe(true);
    expect(satisfiesLocationScope('SIN', bkkMetro)).toBe(false);
  });
});

describe('Farely Pure Domain Kernel — Money & Pricing Units (REQ-DOM-006, NC-005)', () => {
  it('NC-005: 1-person pricing cannot silently satisfy 2-person party total', () => {
    const perTraveler = createMoney(2500000, 'VND', 'PER_TRAVELER');
    const partyTotal = createMoney(5000000, 'VND', 'PARTY_TOTAL');

    // Directly comparing different units must throw IncompatibleMoneyComparisonError
    expect(() => compareMoney(perTraveler, partyTotal)).toThrow(IncompatibleMoneyComparisonError);

    // After explicit normalization, comparison succeeds
    const normalizedParty = normalizeToPerTraveler(partyTotal, 2);
    expect(compareMoney(perTraveler, normalizedParty)).toBe(0);
  });
});

describe('Farely Pure Domain Kernel — Time Invariants (REQ-DOM-009, NC-007)', () => {
  it('NC-007: Observation date cannot become departure date', () => {
    const utcObserved = '2026-10-06T14:30:00.000Z';
    const departDate = '2026-11-15';

    expect(() => validateObservationVsDeparture(utcObserved, departDate)).not.toThrow();
    expect(() => validateObservationVsDeparture('', departDate)).toThrow();
    expect(() => validateObservationVsDeparture(utcObserved, 'invalid-date')).toThrow();
  });
});

describe('Farely Pure Domain Kernel — TravelIntent (REQ-DOM-002, REQ-DOM-003, REQ-DOM-015, NC-004, NC-006)', () => {
  it('NC-006: Missing return cannot satisfy explicit round trip', () => {
    expect(() => {
      createTravelIntent({
        origin: 'HAN',
        destination: 'BKK',
        journeyType: 'ROUND_TRIP',
        outboundDate: '2026-11-12'
        // returnDate missing
      });
    }).toThrow(/NC-006 violation/);
  });

  it('REQ-DOM-003: Separates journeyType from marketScope', () => {
    const domestic = createTravelIntent({
      origin: 'HAN',
      destination: 'SGN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-11-12'
    });
    expect(domestic.journeyType).toBe('ONE_WAY');
    expect(domestic.marketScope).toBe('DOMESTIC');

    const international = createTravelIntent({
      origin: 'HAN',
      destination: 'BKK',
      journeyType: 'ROUND_TRIP',
      outboundDate: '2026-11-12',
      returnDate: '2026-11-17'
    });
    expect(international.journeyType).toBe('ROUND_TRIP');
    expect(international.marketScope).toBe('INTERNATIONAL');
  });

  it('REQ-DOM-015: Round-trip serialization retains every supported semantic field', () => {
    const original = createTravelIntent({
      origin: 'HAN',
      destination: 'BKK',
      journeyType: 'ROUND_TRIP',
      outboundDate: '2026-11-12',
      returnDate: '2026-11-17',
      adults: 2,
      children: 1,
      infants: 0,
      cabin: 'BUSINESS',
      maxStops: 0,
      currency: 'VND'
    });

    const serialized = serializeTravelIntent(original);
    const restored = deserializeTravelIntent(serialized);

    expect(restored).toEqual(original);
    expect(restored.passengers.adults).toBe(2);
    expect(restored.cabin).toBe('BUSINESS');
    expect(restored.maxStops).toBe(0);
  });
});

describe('Farely Pure Domain Kernel — Identity (REQ-DOM-011, REQ-DOM-012)', () => {
  it('REQ-DOM-011: OfferVariantId MUST NOT contain price', () => {
    const offerParams = {
      origin: 'HAN',
      destination: 'BKK',
      departDate: '2026-11-12',
      returnDate: '2026-11-17',
      airline: 'VJ',
      flightNumber: 'VJ901',
      cabin: 'ECONOMY',
      stops: 0
    };

    const ov1 = buildOfferVariantId(offerParams);
    const ov2 = buildOfferVariantId(offerParams);

    // Exact same OfferVariantId regardless of price change
    expect(ov1).toBe(ov2);

    // But observation IDs differ when price or time differs
    const obsToday = buildObservationId({
      offerVariantId: ov1,
      provider: 'fast_flights',
      observedAt: '2026-10-06T08:00:00Z',
      price: 3200000
    });

    const obsTomorrow = buildObservationId({
      offerVariantId: ov1,
      provider: 'fast_flights',
      observedAt: '2026-10-07T08:00:00Z',
      price: 2800000
    });

    expect(obsToday).not.toBe(obsTomorrow);
  });
});

describe('Farely Pure Domain Kernel — RouteBest & Price Truth (REQ-PRICE-001..006, NC-001, NC-004)', () => {
  const intent = createTravelIntent({
    origin: 'HAN',
    destination: 'KUL',
    journeyType: 'ROUND_TRIP',
    outboundDate: '2026-11-12',
    returnDate: '2026-11-17',
    cabin: 'ECONOMY',
    maxStops: 0
  });

  const offers: RouteOffer[] = [
    { id: 'off_1', origin: 'HAN', destination: 'KUL', departDate: '2026-11-12', returnDate: '2026-11-17', airline: 'VN', price: 5210000, dealScore: 70, cabin: 'ECONOMY', stops: 0 },
    { id: 'off_2', origin: 'HAN', destination: 'KUL', departDate: '2026-11-12', returnDate: '2026-11-17', airline: 'AK', price: 4265000, dealScore: 82, cabin: 'ECONOMY', stops: 0 },
    { id: 'off_3', origin: 'HAN', destination: 'KUL', departDate: '2026-11-12', returnDate: '2026-11-17', airline: 'VJ', price: 4670000, dealScore: 98, cabin: 'ECONOMY', stops: 0 }, // High Deal Score!
    { id: 'off_4', origin: 'HAN', destination: 'KUL', departDate: '2026-11-12', returnDate: '2026-11-17', airline: 'MH', price: 5300000, dealScore: 65, cabin: 'ECONOMY', stops: 0 },
    // Ineligible offers:
    { id: 'off_ineligible_stops', origin: 'HAN', destination: 'KUL', departDate: '2026-11-12', returnDate: '2026-11-17', airline: 'SQ', price: 3500000, cabin: 'ECONOMY', stops: 1 }, // Cheaper but 1 stop
    { id: 'off_ineligible_cabin', origin: 'HAN', destination: 'KUL', departDate: '2026-11-12', returnDate: '2026-11-17', airline: 'VN', price: 3800000, cabin: 'BUSINESS', stops: 0 } // Cheaper but Business (NC-004)
  ];

  it('REQ-PRICE-002, NC-001: Cheapest is mathematical minimum; Deal Score never overrides', () => {
    const best = selectRouteBest(offers, intent);
    expect(best).not.toBeNull();
    expect(best?.price).toBe(4265000);
    expect(best?.id).toBe('off_2');
    // Notice off_3 has dealScore 98 vs off_2's 82, but off_2 is strictly cheaper
  });

  it('REQ-PRICE-005: 50 input shuffles all yield identical minimum', () => {
    for (let i = 0; i < 50; i++) {
      const shuffled = [...offers].sort(() => Math.random() - 0.5);
      const best = selectRouteBest(shuffled, intent);
      expect(best?.id).toBe('off_2');
      expect(best?.price).toBe(4265000);
    }
  });
});

describe('Farely Pure Domain Kernel — True Cost & Epistemics (REQ-COST-001..005, NC-033)', () => {
  it('NC-033: Unknown mandatory cost cannot become zero', () => {
    const evalResult = evaluateTrueCost({
      basePrice: 2500000,
      airline: 'VJ',
      isInternational: true
      // airportTaxes omitted and providerVerifiedAllIn is false
    });

    expect(evalResult.hasUnknownMandatoryCost).toBe(true);
    const taxFee = evalResult.itemizedFees.find(f => f.id === 'taxes_and_fees');
    expect(taxFee?.status).toBe('UNKNOWN');
    expect(taxFee?.amount).toBeNull();
  });

  it('REQ-COST-001: Consumes providedHiddenCosts correctly', () => {
    const evalResult = evaluateTrueCost({
      basePrice: 2500000,
      airline: 'VJ',
      isInternational: true,
      providedHiddenCosts: {
        baggageFee: 400000,
        airportTaxes: 600000,
        paymentFee: 50000
      }
    });

    expect(evalResult.hasUnknownMandatoryCost).toBe(false);
    expect(evalResult.knownMandatoryTotal).toBe(600000);
    expect(evalResult.minVerifiableTotal).toBe(3100000);
  });
});

describe('Farely Pure Domain Kernel — Watch Condition Episodes (REQ-WATCH-015..018, NC-017, NC-018, NC-019)', () => {
  const watchId = 'watch_123';
  const targetPrice = 3000000;

  it('NC-017, NC-018, NC-019: Complete episode lifecycle transition', () => {
    // 1. Initial entry: price drops to 2.9M <= 3.0M
    const res1 = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 2900000,
      activeEpisode: null
    });
    expect(res1.stateChanged).toBe(true);
    expect(res1.shouldAlert).toBe(true);
    expect(res1.nextEpisode?.state).toBe('ENTERED');

    // 2. Price exits condition (NC-017): price rises to 3.2M > 3.0M
    const res2 = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 3200000,
      activeEpisode: res1.nextEpisode
    });
    expect(res2.stateChanged).toBe(true);
    expect(res2.shouldAlert).toBe(false);
    expect(res2.nextEpisode?.state).toBe('EXITED');
    expect(res2.nextEpisode?.closedAt).not.toBeNull();

    // 3. Price re-enters condition (NC-018): price drops back to 2.8M <= 3.0M
    const res3 = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 2800000,
      activeEpisode: res2.nextEpisode
    });
    expect(res3.stateChanged).toBe(true);
    expect(res3.shouldAlert).toBe(true);
    expect(res3.nextEpisode?.state).toBe('REENTERED');

    // 4. Minor fluctuation inside condition: drops to 2.78M (< 5% drop from 2.8M)
    const res4 = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 2780000,
      activeEpisode: res3.nextEpisode
    });
    expect(res4.stateChanged).toBe(false);
    expect(res4.shouldAlert).toBe(false);
    expect(res4.nextEpisode?.state).toBe('STILL_INSIDE');

    // 5. Material price drop inside condition (NC-019): drops to 2.5M (> 10% drop from 2.8M)
    const res5 = evaluateWatchCondition({
      watchId,
      targetPrice,
      observedPrice: 2500000,
      activeEpisode: res4.nextEpisode
    });
    expect(res5.stateChanged).toBe(true);
    expect(res5.shouldAlert).toBe(true); // RE-ALERT triggered!
    expect(res5.nextEpisode?.state).toBe('MATERIAL_IMPROVEMENT');
  });
});

describe('Farely Pure Domain Kernel — Provider Result & Contracts (REQ-PROV-001..005, NC-011, NC-026)', () => {
  it('NC-011: Provider parser exception cannot become healthy empty', () => {
    const errorResult = createErrorResult('fast_flights', 'PARSER_SCHEMA_DRIFT', 'Unexpected HTML response format');
    expect(errorResult.isDegraded).toBe(true);
    expect(errorResult.status).toBe('PARSER_SCHEMA_DRIFT');
    expect(errorResult.data).toEqual([]);

    const validEmpty = createSuccessResult('fast_flights', []);
    expect(validEmpty.isDegraded).toBe(false);
    expect(validEmpty.status).toBe('VERIFIED_EMPTY');
  });
});

describe('Farely Pure Domain Kernel — Price Scope Fingerprint (REQ-DOM-014)', () => {
  it('REQ-DOM-014: Generates deterministic fingerprint from TravelIntent', () => {
    const intent = createTravelIntent({
      origin: 'HAN',
      destination: 'BKK',
      journeyType: 'ROUND_TRIP',
      outboundDate: '2026-11-12',
      returnDate: '2026-11-17',
      cabin: 'ECONOMY',
      maxStops: 0
    });

    const fp = buildPriceScopeFingerprintFromIntent(intent);
    expect(fp).toBe('scope_HAN:BKK:ROUND_TRIP:2026-11-12:2026-11-17:ECONOMY:VND:0');
  });
});

describe('Farely Pure Domain Kernel — Price Comparator (REQ-COMP-001..007)', () => {
  it('REQ-COMP-005, REQ-COMP-006: Categorizes evidence level without pseudo-confidence', () => {
    // Insufficient sample (< 3)
    const ins = compareAgainstCohort(2500000, [
      { observationId: '1', observedAt: '2026-10-01T00:00:00Z', departLocalDate: '2026-11-12', origin: 'HAN', destination: 'BKK', price: 3000000, currency: 'VND', cabin: 'ECONOMY', stops: 0 }
    ]);
    expect(ins.evidenceLevel).toBe('INSUFFICIENT');
    expect(ins.medianPrice).toBeNull();

    // Sufficient sample (>= 3)
    const cohorts = [
      { observationId: '1', observedAt: '2026-10-01T00:00:00Z', departLocalDate: '2026-11-12', origin: 'HAN', destination: 'BKK', price: 3200000, currency: 'VND', cabin: 'ECONOMY', stops: 0 },
      { observationId: '2', observedAt: '2026-10-02T00:00:00Z', departLocalDate: '2026-11-12', origin: 'HAN', destination: 'BKK', price: 3000000, currency: 'VND', cabin: 'ECONOMY', stops: 0 },
      { observationId: '3', observedAt: '2026-10-03T00:00:00Z', departLocalDate: '2026-11-12', origin: 'HAN', destination: 'BKK', price: 3400000, currency: 'VND', cabin: 'ECONOMY', stops: 0 }
    ];
    const comp = compareAgainstCohort(2500000, cohorts);
    expect(comp.evidenceLevel).toBe('WEAK');
    expect(comp.medianPrice).toBe(3200000);
    expect(comp.lowestHistoricalPrice).toBe(3000000);
    expect(comp.discountVsMedianPercent).toBe(22);
  });
});

describe('Farely Pure Domain Kernel — Savings (REQ-DOM-001)', () => {
  it('REQ-DOM-001: Computes absolute and percentage savings against benchmark', () => {
    const s1 = calculateSavings(2400000, 3000000);
    expect(s1.isSaving).toBe(true);
    expect(s1.savingsAmount).toBe(600000);
    expect(s1.savingsPercent).toBe(20);

    const s2 = calculateSavings(3500000, 3000000);
    expect(s2.isSaving).toBe(false);
    expect(s2.savingsAmount).toBe(0);
    expect(s2.savingsPercent).toBe(0);
  });
});
