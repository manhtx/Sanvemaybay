import { describe, expect, it } from 'vitest';
import {
  evaluateOfferEligibility,
  normalizeOfferForIntent,
  type RouteOffer,
  selectRouteBest
} from './routeBest';
import { createTravelIntent } from './travelIntent';

describe('Farely Pure Domain Kernel — RouteBest & Price Truth (REQ-PRICE-001..006, NC-001, NC-002, NC-004, NC-006, S08, A15)', () => {
  const baseIntent = createTravelIntent({
    origin: 'SGN',
    destination: 'HAN',
    journeyType: 'ONE_WAY',
    outboundDate: '2026-12-01'
  });

  const offer1: RouteOffer = {
    id: 'off_01',
    origin: 'SGN',
    destination: 'HAN',
    departDate: '2026-12-01',
    airline: 'VJ',
    price: 1800000,
    dealScore: 40,
    cabin: 'ECONOMY',
    stops: 0,
    durationMinutes: 125,
    currency: 'VND'
  };

  const offer2: RouteOffer = {
    id: 'off_02',
    origin: 'SGN',
    destination: 'HAN',
    departDate: '2026-12-01',
    airline: 'VN',
    price: 2200000,
    dealScore: 95,
    cabin: 'ECONOMY',
    stops: 0,
    durationMinutes: 120,
    currency: 'VND'
  };

  const offer3: RouteOffer = {
    id: 'off_03',
    origin: 'SGN',
    destination: 'HAN',
    departDate: '2026-12-01',
    airline: 'QH',
    price: 2500000,
    dealScore: 99,
    cabin: 'ECONOMY',
    stops: 0,
    durationMinutes: 130,
    currency: 'VND'
  };

  it('REQ-PRICE-002: selects the mathematical minimum valid compatible price', () => {
    const winner = selectRouteBest([offer2, offer3, offer1], baseIntent);
    expect(winner).not.toBeNull();
    expect(winner?.id).toBe('off_01');
    expect(winner?.price).toBe(1800000);
  });

  it('NC-001 & REQ-PRICE-003: deal score never overrides a lower compatible price', () => {
    // offer3 has dealScore 99 vs offer1 dealScore 40, but offer1 is cheaper
    const winner = selectRouteBest([offer3, offer1], baseIntent);
    expect(winner?.id).toBe('off_01');
    expect(winner?.price).toBe(1800000);
    expect(winner?.dealScore).toBe(40);
  });

  it('REQ-PRICE-005: deterministic under 50 random input permutations (metamorphic testing)', () => {
    const list = [offer1, offer2, offer3];
    for (let i = 0; i < 50; i++) {
      const shuffled = [...list].sort(() => Math.random() - 0.5);
      const winner = selectRouteBest(shuffled, baseIntent);
      expect(winner?.id).toBe('off_01');
    }
  });

  it('REQ-PRICE-005: breaks ties deterministically by offer ID when prices are identical', () => {
    const tieOfferA: RouteOffer = { ...offer1, id: 'off_tie_aaa', price: 1500000 };
    const tieOfferB: RouteOffer = { ...offer1, id: 'off_tie_bbb', price: 1500000 };

    const win1 = selectRouteBest([tieOfferB, tieOfferA], baseIntent);
    expect(win1?.id).toBe('off_tie_aaa');

    const win2 = selectRouteBest([tieOfferA, tieOfferB], baseIntent);
    expect(win2?.id).toBe('off_tie_aaa');
  });

  it('S08: tri-state eligibility resolves to ELIGIBLE when all constraints are met', () => {
    const result = evaluateOfferEligibility(offer1, baseIntent);
    expect(result.isEligible).toBe(true);
    expect(result.state).toBe('ELIGIBLE');
    expect(result.reasons).toEqual([]);
    expect(result.normalizedOffer).toBeDefined();
  });

  it('S08: tri-state eligibility resolves to INELIGIBLE on origin mismatch', () => {
    const mismatchOffer: RouteOffer = { ...offer1, origin: 'DAD' };
    const result = evaluateOfferEligibility(mismatchOffer, baseIntent);
    expect(result.isEligible).toBe(false);
    expect(result.state).toBe('INELIGIBLE');
    expect(result.reasons).toContain('ORIGIN_MISMATCH');
  });

  it('S08 & A15: unknown stops is NOT zero stops and fails closed under maxStops constraint', () => {
    const directIntent = createTravelIntent({
      origin: 'SGN',
      destination: 'HAN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-12-01',
      maxStops: 0
    });

    const unknownStopsOffer: RouteOffer = {
      ...offer1,
      stops: undefined
    };

    const result = evaluateOfferEligibility(unknownStopsOffer, directIntent);
    expect(result.isEligible).toBe(false);
    expect(result.state).toBe('UNKNOWN_COMPATIBILITY');
    expect(result.reasons).toContain('UNKNOWN_STOPS');
  });

  it('S08 & A15: unknown duration does NOT satisfy duration constraint', () => {
    const shortFlightIntent = createTravelIntent({
      origin: 'SGN',
      destination: 'HAN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-12-01',
      maxDurationMinutes: 150
    });

    const unknownDurationOffer: RouteOffer = {
      ...offer1,
      durationMinutes: undefined
    };

    const result = evaluateOfferEligibility(unknownDurationOffer, shortFlightIntent);
    expect(result.isEligible).toBe(false);
    expect(result.state).toBe('UNKNOWN_COMPATIBILITY');
    expect(result.reasons).toContain('UNKNOWN_DURATION');
  });

  it('NC-002: location scope isolation prevents DMK offer from satisfying exact BKK intent', () => {
    const bkkExactIntent = createTravelIntent({
      origin: 'BKK',
      destination: 'SGN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-12-01'
    });

    const dmkOffer: RouteOffer = {
      ...offer1,
      origin: 'DMK',
      destination: 'SGN'
    };

    const result = evaluateOfferEligibility(dmkOffer, bkkExactIntent);
    expect(result.isEligible).toBe(false);
    expect(result.state).toBe('INELIGIBLE');
    expect(result.reasons).toContain('ORIGIN_MISMATCH');
  });

  it('NC-006: round-trip intent rejects offers missing returnDate', () => {
    const rtIntent = createTravelIntent({
      origin: 'SGN',
      destination: 'HAN',
      journeyType: 'ROUND_TRIP',
      outboundDate: '2026-12-01',
      returnDate: '2026-12-08'
    });

    const oneWayOffer: RouteOffer = {
      ...offer1,
      returnDate: undefined
    };

    const result = evaluateOfferEligibility(oneWayOffer, rtIntent);
    expect(result.isEligible).toBe(false);
    expect(result.state).toBe('INELIGIBLE');
    expect(result.reasons).toContain('MISSING_RETURN_DATE');
  });

  it('NC-004: cabin mismatch rejects offers with incompatible cabin class', () => {
    const economyIntent = createTravelIntent({
      origin: 'SGN',
      destination: 'HAN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-12-01',
      cabin: 'ECONOMY'
    });

    const bizOffer: RouteOffer = {
      ...offer1,
      cabin: 'BUSINESS'
    };

    const result = evaluateOfferEligibility(bizOffer, economyIntent);
    expect(result.isEligible).toBe(false);
    expect(result.state).toBe('INELIGIBLE');
    expect(result.reasons).toContain('CABIN_MISMATCH');
  });

  it('currency isolation: rejects offer with mismatched currency code', () => {
    const usdOffer: RouteOffer = {
      ...offer1,
      currency: 'USD'
    };

    const result = evaluateOfferEligibility(usdOffer, baseIntent);
    expect(result.isEligible).toBe(false);
    expect(result.state).toBe('INELIGIBLE');
    expect(result.reasons).toContain('CURRENCY_MISMATCH');
  });

  it('price truth defense: quarantines non-positive and non-finite prices', () => {
    const zeroPriceOffer: RouteOffer = { ...offer1, price: 0 };
    const negativePriceOffer: RouteOffer = { ...offer1, price: -500000 };
    const nanPriceOffer: RouteOffer = { ...offer1, price: Number.NaN };
    const infPriceOffer: RouteOffer = { ...offer1, price: Number.POSITIVE_INFINITY };

    expect(evaluateOfferEligibility(zeroPriceOffer, baseIntent).reasons).toContain('INVALID_PRICE');
    expect(evaluateOfferEligibility(negativePriceOffer, baseIntent).reasons).toContain('INVALID_PRICE');
    expect(evaluateOfferEligibility(nanPriceOffer, baseIntent).reasons).toContain('INVALID_PRICE');
    expect(evaluateOfferEligibility(infPriceOffer, baseIntent).reasons).toContain('INVALID_PRICE');
  });

  it('NODE TK-05: normalizes PARTY_TOTAL pricing unit to per-traveler fare', () => {
    const familyIntent = createTravelIntent({
      origin: 'SGN',
      destination: 'HAN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-12-01',
      adults: 2,
      children: 2 // Total pax = 4
    });

    const partyOffer: RouteOffer = {
      ...offer1,
      price: 8000000,
      pricingUnit: 'PARTY_TOTAL'
    };

    const normalized = normalizeOfferForIntent(partyOffer, familyIntent);
    expect(normalized.price).toBe(2000000); // 8,000,000 / 4
    expect(normalized.pricingUnit).toBe('PER_TRAVELER');
  });

  it('selectRouteBest returns null for empty, null, or undefined offer lists', () => {
    expect(selectRouteBest([], baseIntent)).toBeNull();
    // @ts-expect-error Testing null input resiliency
    expect(selectRouteBest(null, baseIntent)).toBeNull();
    // @ts-expect-error Testing undefined input resiliency
    expect(selectRouteBest(undefined, baseIntent)).toBeNull();
  });

  it('selectRouteBest returns null when all offers are incompatible or ineligible', () => {
    const invalidOffers = [
      { ...offer1, origin: 'DAD' }, // mismatch
      { ...offer1, departDate: '2026-12-25' }, // date mismatch
      { ...offer1, price: -100 } // invalid price
    ];

    expect(selectRouteBest(invalidOffers, baseIntent)).toBeNull();
  });

  it('preserves pure immutability on Object.freeze protected offers and intent', () => {
    const frozenOffer = Object.freeze({
      id: 'off_frozen',
      origin: 'SGN',
      destination: 'HAN',
      departDate: '2026-12-01',
      airline: 'VJ',
      price: 1800000,
      cabin: 'ECONOMY',
      stops: 0,
      durationMinutes: 125,
      currency: 'VND',
    });

    const frozenIntent = Object.freeze({ ...baseIntent });

    expect(() => selectRouteBest([frozenOffer], frozenIntent as any)).not.toThrow();
    expect(frozenOffer.price).toBe(1800000);
  });

  it('maxStops constraint: direct-only intent (maxStops: 0) strictly rejects 1-stop or 2-stop offers', () => {
    const directIntent = createTravelIntent({
      origin: 'SGN',
      destination: 'HAN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-12-01',
      maxStops: 0,
    });

    const oneStopOffer: RouteOffer = {
      ...offer1,
      stops: 1,
    };

    const twoStopOffer: RouteOffer = {
      ...offer1,
      stops: 2,
    };

    const result1 = evaluateOfferEligibility(oneStopOffer, directIntent);
    expect(result1.isEligible).toBe(false);
    expect(result1.state).toBe('INELIGIBLE');
    expect(result1.reasons).toContain('STOPS_EXCEEDED');

    const result2 = evaluateOfferEligibility(twoStopOffer, directIntent);
    expect(result2.isEligible).toBe(false);
    expect(result2.state).toBe('INELIGIBLE');
    expect(result2.reasons).toContain('STOPS_EXCEEDED');
  });

  it('maxDurationMinutes constraint: rejects offers exceeding maximum travel duration', () => {
    const cappedIntent = createTravelIntent({
      origin: 'SGN',
      destination: 'HAN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-12-01',
      maxDurationMinutes: 120,
    });

    const longOffer: RouteOffer = {
      ...offer1,
      durationMinutes: 180,
    };

    const result = evaluateOfferEligibility(longOffer, cappedIntent);
    expect(result.isEligible).toBe(false);
    expect(result.state).toBe('INELIGIBLE');
    expect(result.reasons).toContain('DURATION_EXCEEDED');
  });

  it('processes 10,000 route best evaluations within sub-50ms latency budget', () => {
    const offers = [offer1, offer2, offer3];
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      selectRouteBest(offers, baseIntent);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
