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

export interface PriceScopeV2Params {
  originScope: LocationScope;
  destinationScope: LocationScope;
  journeyType: string;
  departDate: string;
  returnDate?: string | null;
  cabin?: string;
  currency?: string;
  maxStops?: number;
  passengers?: { adults: number; children: number; infants: number };
  pricingUnit?: string;
  tripLength?: { minDays?: number; maxDays?: number };
  maxDurationMinutes?: number;
}

/**
 * Builds canonical PriceScope V2 fingerprint containing every dimension
 * that changes eligibility/comparability (NODE TK-04).
 */
export function buildPriceScopeFingerprintV2(params: PriceScopeV2Params): string {
  const pax = params.passengers
    ? `${params.passengers.adults}A${params.passengers.children}C${params.passengers.infants}I`
    : '1A0C0I';
  const unit = (params.pricingUnit || 'PER_TRAVELER').toUpperCase();
  const trip = params.tripLength
    ? `${params.tripLength.minDays ?? '*'}-${params.tripLength.maxDays ?? '*'}`
    : 'EXACT';
  const maxDur = params.maxDurationMinutes !== undefined ? String(params.maxDurationMinutes) : 'ANY';
  const parts = [
    params.originScope.primaryCode.toUpperCase(),
    params.destinationScope.primaryCode.toUpperCase(),
    params.journeyType.toUpperCase(),
    params.departDate,
    params.returnDate || '',
    trip,
    pax,
    unit,
    (params.cabin || 'ECONOMY').toUpperCase(),
    (params.currency || 'VND').toUpperCase(),
    params.maxStops !== undefined ? String(params.maxStops) : 'ANY',
    maxDur
  ];
  return `scope_v2:${parts.join(':')}`;
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

/**
 * Builds the canonical PriceScope V2 Fingerprint from a TravelIntent.
 */
export function buildPriceScopeFingerprintV2FromIntent(intent: TravelIntent): string {
  const departDate = intent.outbound.exact || `${intent.outbound.from}:${intent.outbound.to}`;
  const returnDate = intent.inbound ? (intent.inbound.exact || `${intent.inbound.from}:${intent.inbound.to}`) : null;
  return buildPriceScopeFingerprintV2({
    originScope: intent.originScope,
    destinationScope: intent.destinationScope,
    journeyType: intent.journeyType,
    departDate,
    returnDate,
    cabin: intent.cabin,
    currency: intent.currency,
    maxStops: intent.maxStops,
    passengers: intent.passengers,
    pricingUnit: 'PER_TRAVELER',
    tripLength: intent.tripLength,
    maxDurationMinutes: intent.maxDurationMinutes
  });
}
