/**
 * Farely Pure Domain Kernel — Identifiers & Invariants
 * REQ-DOM-010, REQ-DOM-011, REQ-DOM-012, REQ-DOM-013
 */

import { TravelIntent } from './travelIntent';

/**
 * Generates deterministic 32-bit FNV-1a hash formatted as hex string.
 */
function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * OfferVariantId MUST NOT contain price (REQ-DOM-011).
 * Same itinerary at 3.2m today and 2.8m tomorrow has the SAME OfferVariantId.
 */
export function buildOfferVariantId(params: {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string | null;
  airline: string;
  flightNumber?: string | null;
  cabin?: string;
  stops?: number;
}): string {
  const parts = [
    params.origin.trim().toUpperCase(),
    params.destination.trim().toUpperCase(),
    params.departDate.trim(),
    (params.returnDate || '').trim(),
    params.airline.trim().toUpperCase(),
    (params.flightNumber || '').trim().toUpperCase(),
    (params.cabin || 'ECONOMY').trim().toUpperCase(),
    String(params.stops ?? 0)
  ];
  return `ov_${fnv1a(parts.join('|'))}`;
}

/**
 * ObservationId represents a provider observation event (REQ-DOM-012).
 */
export function buildObservationId(params: {
  offerVariantId: string;
  provider: string;
  observedAt: string;
  price: number;
}): string {
  const parts = [
    params.offerVariantId,
    params.provider.trim().toLowerCase(),
    params.observedAt.trim(),
    String(params.price)
  ];
  return `obs_${fnv1a(parts.join('|'))}`;
}

/**
 * OpportunityId represents decision aggregate semantics (REQ-DOM-013).
 */
export function buildOpportunityId(params: {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string | null;
  journeyType: string;
  cabin?: string;
}): string {
  const parts = [
    params.origin.trim().toUpperCase(),
    params.destination.trim().toUpperCase(),
    params.departDate.trim(),
    (params.returnDate || '').trim(),
    params.journeyType.trim().toUpperCase(),
    (params.cabin || 'ECONOMY').trim().toUpperCase()
  ];
  return `opp_${fnv1a(parts.join('|'))}`;
}

/**
 * TravelIntentId: unique deterministic id for a canonical TravelIntent.
 */
export function buildTravelIntentId(intent: TravelIntent): string {
  const parts = [
    intent.originScope.primaryCode,
    intent.destinationScope.primaryCode,
    intent.journeyType,
    intent.outbound.exact || `${intent.outbound.from}-${intent.outbound.to}`,
    intent.inbound?.exact || `${intent.inbound?.from || ''}-${intent.inbound?.to || ''}`,
    intent.cabin,
    String(intent.passengers.adults),
    String(intent.passengers.children),
    String(intent.passengers.infants),
    intent.currency
  ];
  return `ti_${fnv1a(parts.join('|'))}`;
}

/**
 * ConditionEpisodeId: unique lifecycle episode id (REQ-DATA-004).
 */
export function buildConditionEpisodeId(watchId: string, episodeIndex: number): string {
  return `ep_${watchId}_${episodeIndex}`;
}
