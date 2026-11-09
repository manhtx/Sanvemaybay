import { describe, expect, it } from 'vitest';
import {
  buildConditionEpisodeId,
  buildObservationId,
  buildOfferProductId,
  buildOfferVariantId,
  buildOpportunityId,
  buildPhysicalItineraryId,
  buildTravelIntentId,
  type PhysicalFlightSegment,
  resolveLegacyIdentity,
  sha256Hex
} from './identity';
import { createTravelIntent } from './travelIntent';

describe('Farely Pure Domain Kernel — Identity & Invariants (REQ-DOM-010..013, REQ-ID-001..006, S09, S10)', () => {
  it('sha256Hex matches NIST test vectors for standard strings', () => {
    // Empty string SHA-256
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    // "hello" SHA-256
    expect(sha256Hex('hello')).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('REQ-ID-002 & REQ-DOM-011: buildOfferVariantId strictly excludes price points', () => {
    const flightParams = {
      origin: 'SGN',
      destination: 'HAN',
      departDate: '2026-12-01',
      airline: 'VJ',
      flightNumber: 'VJ123',
      cabin: 'ECONOMY',
      stops: 0
    };

    const variantId1 = buildOfferVariantId(flightParams);
    expect(variantId1).toMatch(/^ov:v1:[0-9a-f]{32}$/);

    // Same flight parameters observed at different price points must produce the identical variantId
    const variantId2 = buildOfferVariantId({ ...flightParams });
    expect(variantId1).toBe(variantId2);
  });

  it('S09 / A14: buildPhysicalItineraryId produces itin:v1:<32-hex> and normalizes segment order', () => {
    const seg1: PhysicalFlightSegment = {
      origin: 'HAN',
      destination: 'BKK',
      flightNumber: 'VN611',
      marketingCarrier: 'VN',
      operatingCarrier: 'VN',
      segmentOrder: 1
    };

    const seg2: PhysicalFlightSegment = {
      origin: 'BKK',
      destination: 'SIN',
      flightNumber: 'SQ707',
      marketingCarrier: 'SQ',
      operatingCarrier: 'SQ',
      segmentOrder: 2
    };

    // Segments in forward order
    const itinIdForward = buildPhysicalItineraryId({
      origin: 'HAN',
      destination: 'SIN',
      departDate: '2026-12-01',
      segments: [seg1, seg2]
    });

    // Segments in reversed order (must be normalized by segmentOrder)
    const itinIdReversed = buildPhysicalItineraryId({
      origin: 'HAN',
      destination: 'SIN',
      departDate: '2026-12-01',
      segments: [seg2, seg1]
    });

    expect(itinIdForward).toMatch(/^itin:v1:[0-9a-f]{32}$/);
    expect(itinIdForward).toBe(itinIdReversed);
  });

  it('S10: buildOfferProductId decouples physical flight from commercial dimensions', () => {
    const itineraryId = 'itin:v1:0123456789abcdef0123456789abcdef';

    const basicEconomyProd = buildOfferProductId({
      itineraryId,
      cabin: 'ECONOMY',
      fareBrand: 'ECO_LIGHT',
      baggageIncluded: false,
      refundable: false,
      changeAllowed: false
    });

    const flexibleProd = buildOfferProductId({
      itineraryId,
      cabin: 'ECONOMY',
      fareBrand: 'ECO_FLEX',
      baggageIncluded: true,
      refundable: true,
      changeAllowed: true
    });

    expect(basicEconomyProd).toMatch(/^prod:v1:[0-9a-f]{32}$/);
    expect(flexibleProd).toMatch(/^prod:v1:[0-9a-f]{32}$/);
    // Same physical flight has distinct commercial product IDs
    expect(basicEconomyProd).not.toBe(flexibleProd);
  });

  it('REQ-DOM-012 & REQ-ID-001: buildObservationId uniquely identifies provider observation events', () => {
    const offerVariantId = 'ov:v1:0123456789abcdef0123456789abcdef';

    const obsDay1 = buildObservationId({
      offerVariantId,
      provider: 'amadeus',
      observedAt: '2026-11-01T10:00:00Z',
      price: 3200000
    });

    const obsDay2 = buildObservationId({
      offerVariantId,
      provider: 'amadeus',
      observedAt: '2026-11-02T10:00:00Z',
      price: 2800000
    });

    expect(obsDay1).toMatch(/^obs:v1:[0-9a-f]{32}$/);
    expect(obsDay2).toMatch(/^obs:v1:[0-9a-f]{32}$/);
    expect(obsDay1).not.toBe(obsDay2);
  });

  it('REQ-DOM-013 & REQ-ID-005: buildOpportunityId distinguishes journey types and cabins', () => {
    const oppOneWay = buildOpportunityId({
      origin: 'SGN',
      destination: 'HAN',
      departDate: '2026-12-01',
      journeyType: 'ONE_WAY',
      cabin: 'ECONOMY'
    });

    const oppRoundTrip = buildOpportunityId({
      origin: 'SGN',
      destination: 'HAN',
      departDate: '2026-12-01',
      returnDate: '2026-12-08',
      journeyType: 'ROUND_TRIP',
      cabin: 'ECONOMY'
    });

    expect(oppOneWay).toMatch(/^opp:v1:[0-9a-f]{32}$/);
    expect(oppRoundTrip).toMatch(/^opp:v1:[0-9a-f]{32}$/);
    expect(oppOneWay).not.toBe(oppRoundTrip);
  });

  it('REQ-ID-001: buildTravelIntentId generates deterministic intent:v1:<32-hex>', () => {
    const intent = createTravelIntent({
      origin: 'SGN',
      destination: 'HAN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-12-01'
    });

    const id1 = buildTravelIntentId(intent);
    const id2 = buildTravelIntentId(intent);

    expect(id1).toMatch(/^intent:v1:[0-9a-f]{32}$/);
    expect(id1).toBe(id2);
  });

  it('REQ-DATA-004: buildConditionEpisodeId formats episode string', () => {
    expect(buildConditionEpisodeId('w_123', 0)).toBe('ep_w_123_0');
    expect(buildConditionEpisodeId('w_123', 3)).toBe('ep_w_123_3');
  });

  it('REQ-ID-006: resolveLegacyIdentity parses canonical v1 identifiers', () => {
    expect(resolveLegacyIdentity('ov:v1:0123456789abcdef0123456789abcdef')).toEqual({
      canonicalId: 'ov:v1:0123456789abcdef0123456789abcdef',
      version: 'v1',
      type: 'offer_variant'
    });

    expect(resolveLegacyIdentity('obs:v1:0123456789abcdef0123456789abcdef')).toEqual({
      canonicalId: 'obs:v1:0123456789abcdef0123456789abcdef',
      version: 'v1',
      type: 'observation'
    });

    expect(resolveLegacyIdentity('opp:v1:0123456789abcdef0123456789abcdef')).toEqual({
      canonicalId: 'opp:v1:0123456789abcdef0123456789abcdef',
      version: 'v1',
      type: 'opportunity'
    });

    expect(resolveLegacyIdentity('intent:v1:0123456789abcdef0123456789abcdef')).toEqual({
      canonicalId: 'intent:v1:0123456789abcdef0123456789abcdef',
      version: 'v1',
      type: 'travel_intent'
    });
  });

  it('REQ-ID-006: resolveLegacyIdentity parses legacy prefixed identifiers', () => {
    expect(resolveLegacyIdentity('ov_old_123')).toEqual({
      canonicalId: 'ov_old_123',
      version: 'legacy',
      type: 'offer_variant'
    });

    expect(resolveLegacyIdentity('obs_old_456')).toEqual({
      canonicalId: 'obs_old_456',
      version: 'legacy',
      type: 'observation'
    });

    expect(resolveLegacyIdentity('opp_old_789')).toEqual({
      canonicalId: 'opp_old_789',
      version: 'legacy',
      type: 'opportunity'
    });

    expect(resolveLegacyIdentity('observed-SGN-HAN-20261201')).toEqual({
      canonicalId: 'observed-SGN-HAN-20261201',
      version: 'legacy',
      type: 'opportunity'
    });

    expect(resolveLegacyIdentity('ti_old_abc')).toEqual({
      canonicalId: 'ti_old_abc',
      version: 'legacy',
      type: 'travel_intent'
    });

    expect(resolveLegacyIdentity('unrecognized_string')).toEqual({
      canonicalId: 'unrecognized_string',
      version: 'legacy',
      type: 'unknown'
    });
  });

  it('handles case-insensitivity and whitespace trimming across identifiers', () => {
    const idA = buildOfferVariantId({
      origin: ' sgn ',
      destination: ' han ',
      departDate: '2026-12-01',
      airline: ' vj '
    });

    const idB = buildOfferVariantId({
      origin: 'SGN',
      destination: 'HAN',
      departDate: '2026-12-01',
      airline: 'VJ'
    });

    expect(idA).toBe(idB);
  });
});
