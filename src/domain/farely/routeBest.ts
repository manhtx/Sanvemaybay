/**
 * Farely Pure Domain Kernel — RouteBest & Price Truth
 * REQ-PRICE-001, REQ-PRICE-002, REQ-PRICE-003, REQ-PRICE-004, REQ-PRICE-005, REQ-PRICE-006
 * NC-001, NC-002, NC-004, NC-005, NC-006
 */

import { TravelIntent } from './travelIntent';
import { satisfiesLocationScope } from './locationScope';

export interface RouteOffer {
  id: string;
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string | null;
  airline: string;
  price: number;
  dealScore?: number;
  cabin?: string;
  stops?: number;
  durationMinutes?: number;
  currency?: string;
  pricingUnit?: string;
}

export type IneligibilityReason =
  | 'ORIGIN_MISMATCH'
  | 'DESTINATION_MISMATCH'
  | 'OUTBOUND_DATE_MISMATCH'
  | 'RETURN_DATE_MISMATCH'
  | 'MISSING_RETURN_DATE'
  | 'CABIN_MISMATCH'
  | 'STOPS_EXCEEDED'
  | 'DURATION_EXCEEDED'
  | 'CURRENCY_MISMATCH'
  | 'INVALID_PRICE'
  | 'UNKNOWN_STOPS'
  | 'UNKNOWN_DURATION'
  | 'UNKNOWN_COMPATIBILITY';

export type EligibilityState = 'ELIGIBLE' | 'INELIGIBLE' | 'UNKNOWN_COMPATIBILITY';

export interface EligibilityResult {
  isEligible: boolean;
  state: EligibilityState;
  reasons: IneligibilityReason[];
  normalizedOffer?: RouteOffer;
}

/**
 * Normalizes an offer for a given TravelIntent (e.g. party total -> per traveler).
 * NODE TK-05
 */
export function normalizeOfferForIntent(offer: RouteOffer, intent: TravelIntent): RouteOffer {
  let normalizedPrice = offer.price;
  let normalizedPricingUnit = offer.pricingUnit || 'PER_TRAVELER';

  if (normalizedPricingUnit === 'PARTY_TOTAL') {
    const totalPax = (intent.passengers.adults || 1) + (intent.passengers.children || 0);
    if (totalPax > 1) {
      normalizedPrice = Math.round(offer.price / totalPax);
      normalizedPricingUnit = 'PER_TRAVELER';
    }
  }

  return {
    ...offer,
    price: normalizedPrice,
    pricingUnit: normalizedPricingUnit
  };
}

/**
 * Evaluates offer eligibility against canonical TravelIntent, emitting typed reasons and tri-state result.
 * S08: ELIGIBLE, INELIGIBLE, UNKNOWN_COMPATIBILITY.
 * Unknown stops is not zero stops. Unknown duration does not satisfy duration constraint.
 */
export function evaluateOfferEligibility(offer: RouteOffer, intent: TravelIntent): EligibilityResult {
  const reasons: IneligibilityReason[] = [];

  // 1. Origin scope (NC-002: DMK cannot satisfy exact BKK)
  if (!satisfiesLocationScope(offer.origin, intent.originScope)) {
    reasons.push('ORIGIN_MISMATCH');
  }

  // 2. Destination scope
  if (!satisfiesLocationScope(offer.destination, intent.destinationScope)) {
    reasons.push('DESTINATION_MISMATCH');
  }

  // 3. Return date & journey (NC-006: Missing return cannot satisfy explicit round-trip intent)
  if (intent.journeyType === 'ROUND_TRIP') {
    if (!offer.returnDate) {
      reasons.push('MISSING_RETURN_DATE');
    } else if (intent.inbound?.exact && offer.returnDate !== intent.inbound.exact) {
      reasons.push('RETURN_DATE_MISMATCH');
    } else if (intent.inbound?.from && intent.inbound?.to) {
      if (offer.returnDate < intent.inbound.from || offer.returnDate > intent.inbound.to) {
        reasons.push('RETURN_DATE_MISMATCH');
      }
    }
  }

  // 4. Outbound date & windows (S08 / C-13)
  if (intent.outbound.exact && offer.departDate !== intent.outbound.exact) {
    reasons.push('OUTBOUND_DATE_MISMATCH');
  } else if (intent.outbound.from && intent.outbound.to) {
    if (offer.departDate < intent.outbound.from || offer.departDate > intent.outbound.to) {
      reasons.push('OUTBOUND_DATE_MISMATCH');
    }
  }

  // 5. Cabin compatibility (NC-004: Business cannot match Economy intent)
  const offerCabin = (offer.cabin || 'ECONOMY').toUpperCase();
  if (offerCabin !== intent.cabin.toUpperCase()) {
    reasons.push('CABIN_MISMATCH');
  }

  // 6. Max stops constraint (S08 / A15: Unknown stops is not 0 stops)
  if (intent.maxStops !== undefined) {
    if (offer.stops === undefined || offer.stops === null || !Number.isFinite(offer.stops)) {
      reasons.push('UNKNOWN_STOPS');
    } else if (offer.stops > intent.maxStops) {
      reasons.push('STOPS_EXCEEDED');
    }
  }

  // 7. Max duration constraint (S08 / A15: Unknown duration does not satisfy constraint)
  if (intent.maxDurationMinutes !== undefined) {
    if (offer.durationMinutes === undefined || offer.durationMinutes === null || !Number.isFinite(offer.durationMinutes)) {
      reasons.push('UNKNOWN_DURATION');
    } else if (offer.durationMinutes > intent.maxDurationMinutes) {
      reasons.push('DURATION_EXCEEDED');
    }
  }

  // 8. Currency match
  if (offer.currency && offer.currency !== intent.currency) {
    reasons.push('CURRENCY_MISMATCH');
  }

  // 9. Non-negative, finite price
  if (!Number.isFinite(offer.price) || offer.price <= 0) {
    reasons.push('INVALID_PRICE');
  }

  // Tri-state classification
  const hasUnknown = reasons.some((r) => r.startsWith('UNKNOWN_'));
  if (hasUnknown) {
    return {
      isEligible: false,
      state: 'UNKNOWN_COMPATIBILITY',
      reasons,
    };
  }

  if (reasons.length > 0) {
    return {
      isEligible: false,
      state: 'INELIGIBLE',
      reasons,
    };
  }

  return {
    isEligible: true,
    state: 'ELIGIBLE',
    reasons: [],
    normalizedOffer: normalizeOfferForIntent(offer, intent),
  };
}

/**
 * Checks whether an offer is compatible with a TravelIntent.
 */
export function isOfferCompatible(offer: RouteOffer, intent: TravelIntent): boolean {
  return evaluateOfferEligibility(offer, intent).isEligible;
}

/**
 * Canonical selectRouteBest implementation.
 * Invariants:
 * - REQ-PRICE-002: Cheapest = mathematical minimum valid compatible price.
 * - REQ-PRICE-003 / NC-001: Deal Score never overrides a lower compatible price.
 * - REQ-PRICE-005: Deterministic under input shuffling.
 * - NODE TK-06: Evaluates eligibility, normalizes, selects minimum eligible price.
 */
export function selectRouteBest(offers: RouteOffer[], intent: TravelIntent): RouteOffer | null {
  if (!offers || offers.length === 0) return null;

  const eligibleOffers: RouteOffer[] = [];
  for (const offer of offers) {
    const evalResult = evaluateOfferEligibility(offer, intent);
    if (evalResult.isEligible && evalResult.normalizedOffer) {
      eligibleOffers.push(evalResult.normalizedOffer);
    }
  }

  if (eligibleOffers.length === 0) return null;

  // Sort deterministically by price ascending, with stable tie-breaker on offer ID
  eligibleOffers.sort((a, b) => {
    if (a.price !== b.price) {
      return a.price - b.price; // mathematical minimum
    }
    return a.id.localeCompare(b.id);
  });

  return eligibleOffers[0];
}
