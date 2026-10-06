/**
 * Farely Pure Domain Kernel — Price Scope Fingerprint
 * REQ-DOM-014
 */

import { TravelIntent } from './travelIntent';
import { LocationScope } from './locationScope';

export interface PriceScopeOfferMatch {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string | null;
  cabin?: string;
  stops?: number;
  currency: string;
}

/**
 * Builds the canonical PriceScopeFingerprint for RouteBest, comparator,
 * Cheaper Alternative, Watch matching, and Saved price resolution.
 * REQ-DOM-014
 */
export function buildPriceScopeFingerprint(params: {
  originScope: LocationScope;
  destinationScope: LocationScope;
  journeyType: string;
  departDate: string;
  returnDate?: string | null;
  cabin?: string;
  currency?: string;
  maxStops?: number;
}): string {
  const parts = [
    params.originScope.primaryCode.toUpperCase(),
    params.destinationScope.primaryCode.toUpperCase(),
    params.journeyType.toUpperCase(),
    params.departDate,
    params.returnDate || '',
    (params.cabin || 'ECONOMY').toUpperCase(),
    (params.currency || 'VND').toUpperCase(),
    params.maxStops !== undefined ? String(params.maxStops) : 'ANY'
  ];
  return `scope_${parts.join(':')}`;
}

/**
 * Builds the canonical PriceScopeFingerprint from a TravelIntent.
 */
export function buildPriceScopeFingerprintFromIntent(intent: TravelIntent): string {
  const departDate = intent.outbound.exact || `${intent.outbound.from}:${intent.outbound.to}`;
  const returnDate = intent.inbound ? (intent.inbound.exact || `${intent.inbound.from}:${intent.inbound.to}`) : null;
  return buildPriceScopeFingerprint({
    originScope: intent.originScope,
    destinationScope: intent.destinationScope,
    journeyType: intent.journeyType,
    departDate,
    returnDate,
    cabin: intent.cabin,
    currency: intent.currency,
    maxStops: intent.maxStops
  });
}
