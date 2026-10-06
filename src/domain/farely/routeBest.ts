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
  currency?: string;
  pricingUnit?: string;
}

/**
 * Checks whether an offer is compatible with a TravelIntent.
 */
export function isOfferCompatible(offer: RouteOffer, intent: TravelIntent): boolean {
  // 1. Origin scope (NC-002: DMK cannot satisfy exact BKK)
  if (!satisfiesLocationScope(offer.origin, intent.originScope)) {
    return false;
  }

  // 2. Destination scope
  if (!satisfiesLocationScope(offer.destination, intent.destinationScope)) {
    return false;
  }

  // 3. Dates (NC-006: Missing return cannot satisfy explicit round-trip intent)
  if (intent.journeyType === 'ROUND_TRIP') {
    if (!offer.returnDate) return false;
    if (intent.inbound?.exact && offer.returnDate !== intent.inbound.exact) return false;
  }

  if (intent.outbound.exact && offer.departDate !== intent.outbound.exact) {
    return false;
  }

  // 4. Cabin compatibility (NC-004: Business cannot match Economy intent)
  const offerCabin = (offer.cabin || 'ECONOMY').toUpperCase();
  if (offerCabin !== intent.cabin.toUpperCase()) {
    return false;
  }

  // 5. Max stops constraint
  if (intent.maxStops !== undefined && (offer.stops ?? 0) > intent.maxStops) {
    return false;
  }

  // 6. Currency match
  if (offer.currency && offer.currency !== intent.currency) {
    return false;
  }

  // 7. Non-negative, finite price
  if (!Number.isFinite(offer.price) || offer.price <= 0) {
    return false;
  }

  return true;
}

/**
 * Canonical selectRouteBest implementation.
 * Invariants:
 * - REQ-PRICE-002: Cheapest = mathematical minimum valid compatible price.
 * - REQ-PRICE-003 / NC-001: Deal Score never overrides a lower compatible price.
 * - REQ-PRICE-005: Deterministic under input shuffling.
 */
export function selectRouteBest(offers: RouteOffer[], intent: TravelIntent): RouteOffer | null {
  if (!offers || offers.length === 0) return null;

  const compatible = offers.filter(o => isOfferCompatible(o, intent));
  if (compatible.length === 0) return null;

  // Sort deterministically by price ascending, with stable tie-breaker on offer ID
  compatible.sort((a, b) => {
    if (a.price !== b.price) {
      return a.price - b.price; // mathematical minimum
    }
    return a.id.localeCompare(b.id);
  });

  return compatible[0];
}
