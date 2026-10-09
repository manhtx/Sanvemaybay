/**
 * Farely Pure Domain Kernel — Identifiers & Invariants
 * REQ-DOM-010, REQ-DOM-011, REQ-DOM-012, REQ-DOM-013, REQ-ID-001..006
 */

import type { TravelIntent } from './travelIntent.ts';
export { calculateElapsedDurationMinutes } from './time.ts';

/**
 * Pure SHA-256 Hex Digest Implementation
 * Synchronous and universal across Node, Deno, and Browser environments.
 */
export function sha256Hex(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number, j: number;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, number> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = ((asciiBitLength / maxWord) | 0);
  words[words.length] = asciiBitLength | 0;
  for (j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] = (i < 16)
          ? w[i]
          : (w[i - 16] +
            (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
            w[i - 7] +
            (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = a;
      hash[0] = (temp1 + temp2) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

export interface PhysicalFlightSegment {
  origin: string;
  destination: string;
  flightNumber: string;
  marketingCarrier: string;
  operatingCarrier?: string;
  departureInstant?: string;
  arrivalInstant?: string;
  segmentOrder?: number;
}

/**
 * Physical Itinerary Fingerprint (S09 / A14)
 * Distinguishes physical itineraries based on ordered physical flight segments.
 * Format: itin:v1:<128-bit sha256 hex>
 */
export function buildPhysicalItineraryId(params: {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string | null;
  segments?: PhysicalFlightSegment[];
  airline?: string;
  flightNumber?: string | null;
}): string {
  const parts: string[] = [
    params.origin.trim().toUpperCase(),
    params.destination.trim().toUpperCase(),
    params.departDate.trim(),
    (params.returnDate || '').trim(),
  ];

  if (params.segments && params.segments.length > 0) {
    const sortedSegments = [...params.segments].sort(
      (a, b) => (a.segmentOrder ?? 0) - (b.segmentOrder ?? 0)
    );
    for (const seg of sortedSegments) {
      parts.push(
        [
          seg.origin.trim().toUpperCase(),
          seg.destination.trim().toUpperCase(),
          seg.marketingCarrier.trim().toUpperCase(),
          (seg.operatingCarrier || seg.marketingCarrier).trim().toUpperCase(),
          seg.flightNumber.trim().toUpperCase(),
          (seg.departureInstant || '').trim(),
          (seg.arrivalInstant || '').trim(),
        ].join('>')
      );
    }
  } else {
    parts.push((params.airline || '').trim().toUpperCase());
    parts.push((params.flightNumber || '').trim().toUpperCase());
  }

  return `itin:v1:${sha256Hex(parts.join('|')).slice(0, 32)}`;
}

/**
 * Commercial Offer Product (S10)
 * Separates physical flight itinerary from commercial offer dimensions:
 * cabin, fare brand, baggage, refundability, changeability, and sales channel.
 * Format: prod:v1:<128-bit sha256 hex>
 */
export interface CommercialOfferProduct {
  itineraryId: string;
  cabin: string;
  fareBrand?: string;
  baggageIncluded?: boolean;
  refundable?: boolean;
  changeAllowed?: boolean;
  salesChannel?: string;
}

export function buildOfferProductId(params: CommercialOfferProduct): string {
  const parts = [
    params.itineraryId.trim(),
    (params.cabin || 'ECONOMY').trim().toUpperCase(),
    (params.fareBrand || '').trim().toUpperCase(),
    params.baggageIncluded === true ? 'BAG:YES' : params.baggageIncluded === false ? 'BAG:NO' : 'BAG:UNKNOWN',
    params.refundable === true ? 'REF:YES' : params.refundable === false ? 'REF:NO' : 'REF:UNKNOWN',
    params.changeAllowed === true ? 'CHG:YES' : params.changeAllowed === false ? 'CHG:NO' : 'CHG:UNKNOWN',
    (params.salesChannel || '').trim().toUpperCase(),
  ];
  return `prod:v1:${sha256Hex(parts.join('|')).slice(0, 32)}`;
}

/**
 * OfferVariantId MUST NOT contain price (REQ-DOM-011, REQ-ID-002).
 * Same itinerary at 3.2m today and 2.8m tomorrow has the SAME OfferVariantId.
 * Format: ov:v1:<128-bit sha256 hex> (REQ-ID-001)
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
  segments?: PhysicalFlightSegment[];
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

  if (params.segments && params.segments.length > 0) {
    const sorted = [...params.segments].sort((a, b) => (a.segmentOrder ?? 0) - (b.segmentOrder ?? 0));
    for (const s of sorted) {
      parts.push(`${s.origin}-${s.destination}-${s.flightNumber}`);
    }
  }

  return `ov:v1:${sha256Hex(parts.join('|')).slice(0, 32)}`;
}

/**
 * ObservationId represents a provider observation event (REQ-DOM-012, REQ-ID-001).
 * Format: obs:v1:<128-bit sha256 hex>
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
  return `obs:v1:${sha256Hex(parts.join('|')).slice(0, 32)}`;
}

/**
 * OpportunityId represents decision aggregate semantics (REQ-DOM-013, REQ-ID-005).
 * Format: opp:v1:<128-bit sha256 hex>
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
  return `opp:v1:${sha256Hex(parts.join('|')).slice(0, 32)}`;
}

/**
 * TravelIntentId: unique deterministic id for a canonical TravelIntent (REQ-ID-001).
 * Format: intent:v1:<128-bit sha256 hex>
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
  return `intent:v1:${sha256Hex(parts.join('|')).slice(0, 32)}`;
}

/**
 * ConditionEpisodeId: unique lifecycle episode id (REQ-DATA-004).
 */
export function buildConditionEpisodeId(watchId: string, episodeIndex: number): string {
  return `ep_${watchId}_${episodeIndex}`;
}

/**
 * Legacy Identity Resolution & Migration (REQ-ID-006).
 * Ensures old Saved/Watch URLs and bookmark references do not break silently.
 */
export function resolveLegacyIdentity(rawId: string): {
  canonicalId: string;
  version: 'v1' | 'legacy';
  type: 'offer_variant' | 'opportunity' | 'observation' | 'travel_intent' | 'unknown';
} {
  const trimmed = rawId.trim();

  if (trimmed.startsWith('ov:v1:')) {
    return { canonicalId: trimmed, version: 'v1', type: 'offer_variant' };
  }
  if (trimmed.startsWith('obs:v1:')) {
    return { canonicalId: trimmed, version: 'v1', type: 'observation' };
  }
  if (trimmed.startsWith('opp:v1:')) {
    return { canonicalId: trimmed, version: 'v1', type: 'opportunity' };
  }
  if (trimmed.startsWith('intent:v1:')) {
    return { canonicalId: trimmed, version: 'v1', type: 'travel_intent' };
  }

  // Legacy mappings
  if (trimmed.startsWith('ov_')) {
    return { canonicalId: trimmed, version: 'legacy', type: 'offer_variant' };
  }
  if (trimmed.startsWith('obs_')) {
    return { canonicalId: trimmed, version: 'legacy', type: 'observation' };
  }
  if (trimmed.startsWith('opp_') || trimmed.startsWith('observed-') || trimmed.includes(':')) {
    return { canonicalId: trimmed, version: 'legacy', type: 'opportunity' };
  }
  if (trimmed.startsWith('ti_')) {
    return { canonicalId: trimmed, version: 'legacy', type: 'travel_intent' };
  }

  return { canonicalId: trimmed, version: 'legacy', type: 'unknown' };
}
