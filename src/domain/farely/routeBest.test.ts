import { describe, it, expect } from 'vitest';
import {
  evaluateOfferEligibility,
  selectRouteBest,
  normalizeOfferForIntent,
  isOfferCompatible,
  type RouteOffer,
} from './routeBest.ts';
import { createTravelIntent } from './travelIntent.ts';

describe('WP02: Pure Domain Kernel — Canonical RouteBest & Ineligibility Matrix', () => {
  const baseIntent = createTravelIntent({
    origin: 'HAN',
    destination: 'SGN',
    journeyType: 'ONE_WAY',
    outboundDate: '2026-11-20',
    adults: 1,
    cabin: 'ECONOMY',
    maxStops: 0,
    maxDurationMinutes: 150,
    currency: 'VND',
  });

  const validOffer: RouteOffer = {
    id: 'vn_200',
    origin: 'HAN',
    destination: 'SGN',
    departDate: '2026-11-20',
    airline: 'VN',
    price: 1_200_000,
    cabin: 'ECONOMY',
    stops: 0,
    durationMinutes: 130,
    currency: 'VND',
    pricingUnit: 'PER_TRAVELER',
  };

  describe('Exhaustive 14-Reason Ineligibility Battery', () => {
    it('flags ORIGIN_MISMATCH when offer origin does not satisfy intent', () => {
      const offer = { ...validOffer, origin: 'DAD' };
      const res = evaluateOfferEligibility(offer, baseIntent);
      expect(res.isEligible).toBe(false);
      expect(res.state).toBe('INELIGIBLE');
      expect(res.reasons).toContain('ORIGIN_MISMATCH');
    });

    it('flags DESTINATION_MISMATCH when offer destination does not satisfy intent', () => {
      const offer = { ...validOffer, destination: 'DAD' };
      const res = evaluateOfferEligibility(offer, baseIntent);
      expect(res.isEligible).toBe(false);
      expect(res.state).toBe('INELIGIBLE');
      expect(res.reasons).toContain('DESTINATION_MISMATCH');
    });

    it('flags OUTBOUND_DATE_MISMATCH on exact date mismatch or window bounds violation', () => {
      const offerWrongExact = { ...validOffer, departDate: '2026-11-21' };
      const res1 = evaluateOfferEligibility(offerWrongExact, baseIntent);
      expect(res1.reasons).toContain('OUTBOUND_DATE_MISMATCH');

      const windowIntent = createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ONE_WAY',
        outboundDate: { from: '2026-11-20', to: '2026-11-22' },
      });
      const offerOutsideWindow = { ...validOffer, departDate: '2026-11-25' };
      const res2 = evaluateOfferEligibility(offerOutsideWindow, windowIntent);
      expect(res2.reasons).toContain('OUTBOUND_DATE_MISMATCH');
    });

    it('flags MISSING_RETURN_DATE on round-trip intent when offer lacks returnDate', () => {
      const rtIntent = createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ROUND_TRIP',
        outboundDate: '2026-11-20',
        returnDate: '2026-11-25',
      });
      const offerNoReturn = { ...validOffer, returnDate: null };
      const res = evaluateOfferEligibility(offerNoReturn, rtIntent);
      expect(res.isEligible).toBe(false);
      expect(res.reasons).toContain('MISSING_RETURN_DATE');
    });

    it('flags RETURN_DATE_MISMATCH when returnDate does not match exact date or window', () => {
      const rtIntent = createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ROUND_TRIP',
        outboundDate: '2026-11-20',
        returnDate: '2026-11-25',
      });
      const offerWrongReturn = { ...validOffer, returnDate: '2026-11-26' };
      const res = evaluateOfferEligibility(offerWrongReturn, rtIntent);
      expect(res.reasons).toContain('RETURN_DATE_MISMATCH');
    });

    it('flags CABIN_MISMATCH when offer cabin does not match intent cabin', () => {
      const offerBusiness = { ...validOffer, cabin: 'BUSINESS' };
      const res = evaluateOfferEligibility(offerBusiness, baseIntent);
      expect(res.reasons).toContain('CABIN_MISMATCH');
    });

    it('flags STOPS_EXCEEDED when stops exceeds intent.maxStops', () => {
      const offerWithStops = { ...validOffer, stops: 1 };
      const res = evaluateOfferEligibility(offerWithStops, baseIntent);
      expect(res.reasons).toContain('STOPS_EXCEEDED');
    });

    it('flags DURATION_EXCEEDED when flight duration exceeds intent.maxDurationMinutes', () => {
      const longOffer = { ...validOffer, durationMinutes: 180 };
      const res = evaluateOfferEligibility(longOffer, baseIntent);
      expect(res.reasons).toContain('DURATION_EXCEEDED');
    });

    it('flags CURRENCY_MISMATCH when offer currency differs from intent', () => {
      const usdOffer = { ...validOffer, currency: 'USD' };
      const res = evaluateOfferEligibility(usdOffer, baseIntent);
      expect(res.reasons).toContain('CURRENCY_MISMATCH');
    });

    it('flags INVALID_PRICE when price is negative, zero, or non-finite', () => {
      expect(evaluateOfferEligibility({ ...validOffer, price: 0 }, baseIntent).reasons).toContain('INVALID_PRICE');
      expect(evaluateOfferEligibility({ ...validOffer, price: -100 }, baseIntent).reasons).toContain('INVALID_PRICE');
      expect(evaluateOfferEligibility({ ...validOffer, price: NaN }, baseIntent).reasons).toContain('INVALID_PRICE');
    });

    it('flags UNKNOWN_STOPS when intent requires maxStops but offer stops is unknown', () => {
      const unknownStopsOffer = { ...validOffer, stops: undefined };
      const res = evaluateOfferEligibility(unknownStopsOffer, baseIntent);
      expect(res.state).toBe('UNKNOWN_COMPATIBILITY');
      expect(res.reasons).toContain('UNKNOWN_STOPS');
    });

    it('flags UNKNOWN_DURATION when intent requires maxDurationMinutes but offer duration is unknown', () => {
      const unknownDurOffer = { ...validOffer, durationMinutes: undefined };
      const res = evaluateOfferEligibility(unknownDurOffer, baseIntent);
      expect(res.state).toBe('UNKNOWN_COMPATIBILITY');
      expect(res.reasons).toContain('UNKNOWN_DURATION');
    });

    it('flags UNKNOWN_CABIN when offer cabin is unknown on non-economy or explicit intent', () => {
      const unknownCabinOffer = { ...validOffer, cabin: 'UNKNOWN' };
      const res = evaluateOfferEligibility(unknownCabinOffer, baseIntent);
      expect(res.state).toBe('UNKNOWN_COMPATIBILITY');
      expect(res.reasons).toContain('UNKNOWN_CABIN');
    });

    it('flags UNKNOWN_COMPATIBILITY on UNKNOWN_PRICING_SCOPE or party total with children', () => {
      const unknownScopeOffer = { ...validOffer, pricingUnit: 'UNKNOWN_PRICING_SCOPE' };
      const res1 = evaluateOfferEligibility(unknownScopeOffer, baseIntent);
      expect(res1.state).toBe('UNKNOWN_COMPATIBILITY');
      expect(res1.reasons).toContain('UNKNOWN_COMPATIBILITY');

      const familyIntent = createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-11-20',
        adults: 2,
        children: 1,
      });
      const partyTotalOffer = { ...validOffer, pricingUnit: 'PARTY_TOTAL', price: 4_000_000 };
      const res2 = evaluateOfferEligibility(partyTotalOffer, familyIntent);
      expect(res2.state).toBe('UNKNOWN_COMPATIBILITY');
      expect(res2.reasons).toContain('UNKNOWN_COMPATIBILITY');
    });
  });

  describe('Date Slicing & ISO Timestamp Normalization', () => {
    it('correctly matches offers with full ISO timestamp against date-only intent', () => {
      const timestampOffer = {
        ...validOffer,
        departDate: '2026-11-20T08:30:00.000Z',
      };
      const res = evaluateOfferEligibility(timestampOffer, baseIntent);
      expect(res.isEligible).toBe(true);
      expect(res.state).toBe('ELIGIBLE');
      expect(isOfferCompatible(timestampOffer, baseIntent)).toBe(true);
    });
  });

  describe('selectRouteBest Mathematical Minimality & Invariants', () => {
    it('REQ-PRICE-002: selects mathematical minimum price from eligible offers', () => {
      const offers: RouteOffer[] = [
        { ...validOffer, id: 'offer_1', price: 1_500_000 },
        { ...validOffer, id: 'offer_2', price: 1_200_000 },
        { ...validOffer, id: 'offer_3', price: 1_800_000 },
      ];
      const best = selectRouteBest(offers, baseIntent);
      expect(best?.id).toBe('offer_2');
      expect(best?.price).toBe(1_200_000);
    });

    it('NC-001: Deal Score NEVER overrides a lower compatible price', () => {
      const offers: RouteOffer[] = [
        { ...validOffer, id: 'offer_high_score', price: 1_500_000, dealScore: 99 },
        { ...validOffer, id: 'offer_cheapest', price: 1_100_000, dealScore: 40 },
      ];
      const best = selectRouteBest(offers, baseIntent);
      expect(best?.id).toBe('offer_cheapest');
      expect(best?.price).toBe(1_100_000);
    });

    it('stably breaks price ties on canonical offer ID string comparison', () => {
      const offers: RouteOffer[] = [
        { ...validOffer, id: 'z_offer', price: 1_200_000 },
        { ...validOffer, id: 'a_offer', price: 1_200_000 },
        { ...validOffer, id: 'm_offer', price: 1_200_000 },
      ];
      const best = selectRouteBest(offers, baseIntent);
      expect(best?.id).toBe('a_offer');
    });

    it('returns null on empty offers array or zero eligible offers', () => {
      expect(selectRouteBest([], baseIntent)).toBeNull();
      const ineligibleOffers = [{ ...validOffer, origin: 'DAD' }];
      expect(selectRouteBest(ineligibleOffers, baseIntent)).toBeNull();
    });

    it('normalizes offer price and clamps non-positive prices', () => {
      const partyOffer: RouteOffer = {
        ...validOffer,
        pricingUnit: 'PARTY_TOTAL',
        price: 3_000_000,
      };
      const twoAdultsIntent = createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-11-20',
        adults: 2,
      });
      const normalized = normalizeOfferForIntent(partyOffer, twoAdultsIntent);
      expect(normalized.price).toBe(1_500_000);
      expect(normalized.pricingUnit).toBe('PER_TRAVELER');

      const badOffer: RouteOffer = { ...validOffer, price: -500 };
      expect(normalizeOfferForIntent(badOffer, baseIntent).price).toBe(0);
    });
  });
});
