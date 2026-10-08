/**
 * Farely Pure Domain Kernel — Canonical TravelIntent
 * REQ-DOM-002, REQ-DOM-003, REQ-DOM-007, REQ-DOM-008, REQ-DOM-015, NC-004, NC-005, NC-006
 */

import { type LocationScope, resolveLocationScope, AIRPORT_CATALOG } from './locationScope.ts';
import type { CurrencyCode } from './money.ts';

export type JourneyType = 'ONE_WAY' | 'ROUND_TRIP';
export type MarketScope = 'DOMESTIC' | 'INTERNATIONAL';
export type CabinClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';

export interface PassengerMix {
  adults: number;
  children: number;
  infants: number;
}

export interface DateWindow {
  exact?: string; // YYYY-MM-DD
  from?: string; // YYYY-MM-DD inclusive
  to?: string; // YYYY-MM-DD inclusive
}

export interface TripLengthConstraint {
  minDays?: number;
  maxDays?: number;
}

export interface TravelIntent {
  schemaVersion: 1;
  originScope: LocationScope;
  destinationScope: LocationScope;
  journeyType: JourneyType;
  marketScope: MarketScope;
  outbound: DateWindow;
  inbound?: DateWindow;
  tripLength?: TripLengthConstraint;
  passengers: PassengerMix;
  cabin: CabinClass;
  maxStops?: number;
  maxDurationMinutes?: number;
  baggagePreference?: 'ANY' | 'CARRY_ON' | 'CHECKED_20KG';
  currency: CurrencyCode;
}

/**
 * Derives market scope from origin and destination countries.
 * Domestic if both within VN, International otherwise.
 * Sourced purely from canonical AIRPORT_CATALOG country metadata.
 */
export function deriveMarketScope(originCode: string, destinationCode: string): MarketScope {
  const originAirport = AIRPORT_CATALOG[originCode.toUpperCase()];
  const destAirport = AIRPORT_CATALOG[destinationCode.toUpperCase()];
  if (originAirport && destAirport) {
    return (originAirport.country === 'VN' && destAirport.country === 'VN') ? 'DOMESTIC' : 'INTERNATIONAL';
  }
  return 'INTERNATIONAL';
}

/**
 * Creates and validates a canonical TravelIntent.
 */
export function createTravelIntent(params: {
  origin: string;
  destination: string;
  journeyType: JourneyType;
  outboundDate: string | DateWindow;
  returnDate?: string | DateWindow;
  adults?: number;
  children?: number;
  infants?: number;
  cabin?: CabinClass;
  maxStops?: number;
  maxDurationMinutes?: number;
  tripLength?: TripLengthConstraint;
  baggagePreference?: 'ANY' | 'CARRY_ON' | 'CHECKED_20KG';
  currency?: CurrencyCode;
}): TravelIntent {
  const originScope = resolveLocationScope(params.origin);
  const destinationScope = resolveLocationScope(params.destination);
  const marketScope = deriveMarketScope(originScope.primaryCode, destinationScope.primaryCode);

  const outbound: DateWindow = typeof params.outboundDate === 'string'
    ? { exact: params.outboundDate }
    : params.outboundDate;

  let inbound: DateWindow | undefined = undefined;
  if (params.journeyType === 'ROUND_TRIP') {
    if (!params.returnDate) {
      throw new Error('NC-006 violation: Round trip intent requires inbound return date specification');
    }
    inbound = typeof params.returnDate === 'string'
      ? { exact: params.returnDate }
      : params.returnDate;
  }

  const adults = params.adults ?? 1;
  const children = params.children ?? 0;
  const infants = params.infants ?? 0;

  if (adults < 1) {
    throw new RangeError('At least 1 adult passenger required');
  }

  return {
    schemaVersion: 1,
    originScope,
    destinationScope,
    journeyType: params.journeyType,
    marketScope,
    outbound,
    inbound,
    tripLength: params.tripLength,
    passengers: { adults, children, infants },
    cabin: params.cabin ?? 'ECONOMY',
    maxStops: params.maxStops,
    maxDurationMinutes: params.maxDurationMinutes,
    baggagePreference: params.baggagePreference,
    currency: params.currency ?? 'VND'
  };
}

/**
 * Canonical round-trip serialization for URL params, local storage, and database persistence.
 * REQ-DOM-015: round-trip serialization must retain every supported semantic field.
 */
export function serializeTravelIntent(intent: TravelIntent): string {
  return JSON.stringify(intent);
}

export function deserializeTravelIntent(raw: string): TravelIntent {
  const parsed = JSON.parse(raw);
  if (!parsed || parsed.schemaVersion !== 1) {
    throw new Error('Invalid or unsupported TravelIntent schema version');
  }
  return parsed as TravelIntent;
}
