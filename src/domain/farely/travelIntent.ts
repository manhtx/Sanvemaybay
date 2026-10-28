/**
 * Farely Pure Domain Kernel — Canonical TravelIntent
 * REQ-DOM-002, REQ-DOM-003, REQ-DOM-007, REQ-DOM-008, REQ-DOM-015, NC-004, NC-005, NC-006
 */

import { type LocationScope, resolveLocationScope, AIRPORT_CATALOG } from './locationScope.ts';
import type { CurrencyCode } from './money.ts';

export type JourneyType = 'ONE_WAY' | 'ROUND_TRIP';
export type MarketScope = 'DOMESTIC' | 'INTERNATIONAL';
export type CabinClass = 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';

export type TravelIntentErrorCode =
  | 'ERR_INVERTED_DATES'
  | 'ERR_PASSENGER_MIX_INVALID'
  | 'ERR_LAP_INFANT_EXCESS'
  | 'ERR_INVALID_CONSTRAINTS';

export class TravelIntentValidationError extends Error {
  public readonly code: TravelIntentErrorCode;

  constructor(code: TravelIntentErrorCode, message: string) {
    super(message);
    this.name = 'TravelIntentValidationError';
    this.code = code;
    Object.setPrototypeOf(this, TravelIntentValidationError.prototype);
  }
}

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
  isGroupBooking?: boolean;
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

    // Chronological validation for round trips
    if (outbound.exact && inbound.exact) {
      if (inbound.exact < outbound.exact) {
        throw new TravelIntentValidationError(
          'ERR_INVERTED_DATES',
          `Inverted round-trip dates: inbound (${inbound.exact}) cannot be earlier than outbound (${outbound.exact})`
        );
      }
    } else {
      const outboundEarliest = outbound.exact || outbound.from;
      const inboundLatest = inbound.exact || inbound.to;
      if (outboundEarliest && inboundLatest && inboundLatest < outboundEarliest) {
        throw new TravelIntentValidationError(
          'ERR_INVERTED_DATES',
          `Inverted round-trip date window: inbound latest (${inboundLatest}) cannot precede outbound earliest (${outboundEarliest})`
        );
      }
    }
  }

  const adults = params.adults ?? 1;
  const children = params.children ?? 0;
  const infants = params.infants ?? 0;

  // Passenger integer & non-negative integrity
  if (!Number.isInteger(adults) || !Number.isInteger(children) || !Number.isInteger(infants)) {
    throw new TravelIntentValidationError('ERR_PASSENGER_MIX_INVALID', 'Passenger counts must be integers');
  }

  if (children < 0 || infants < 0) {
    throw new TravelIntentValidationError('ERR_PASSENGER_MIX_INVALID', 'Passenger counts cannot be negative');
  }

  if (adults < 1) {
    throw new RangeError('At least 1 adult passenger required');
  }

  // Lap infant safety rule: maximum 1 lap infant per adult
  if (infants > adults) {
    throw new TravelIntentValidationError(
      'ERR_LAP_INFANT_EXCESS',
      `Lap infants (${infants}) cannot exceed adult count (${adults}). Each infant requires an accompanying adult.`
    );
  }

  const totalPassengers = adults + children + infants;
  if (totalPassengers > 18) {
    throw new TravelIntentValidationError(
      'ERR_PASSENGER_MIX_INVALID',
      `Total party size (${totalPassengers}) exceeds maximum party limit of 18`
    );
  }

  // Individual airline PNR capacity threshold (9 seated passengers)
  const isGroupBooking = (adults + children) > 9;

  // Search filter constraints
  if (params.maxStops !== undefined && (!Number.isInteger(params.maxStops) || params.maxStops < 0)) {
    throw new TravelIntentValidationError('ERR_INVALID_CONSTRAINTS', 'maxStops must be a non-negative integer');
  }

  if (params.maxDurationMinutes !== undefined && (typeof params.maxDurationMinutes !== 'number' || params.maxDurationMinutes < 15)) {
    throw new TravelIntentValidationError('ERR_INVALID_CONSTRAINTS', 'maxDurationMinutes must be at least 15 minutes');
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
    currency: params.currency ?? 'VND',
    isGroupBooking,
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
