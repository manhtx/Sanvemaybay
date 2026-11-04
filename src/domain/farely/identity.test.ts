import { describe, it, expect } from 'vitest';
import {
  sha256Hex,
  buildPhysicalItineraryId,
  buildOfferProductId,
  buildOfferVariantId,
  buildObservationId,
  buildOpportunityId,
  resolveLegacyIdentity,
} from './identity';

describe('Farely Pure Domain Kernel — Identity (WP01-IDENTITY-UNICODE-CANONICALIZATION)', () => {
  it('sha256Hex matches canonical NIST test vectors', () => {
    // Empty string
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    // Standard 'abc' test vector
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('sha256Hex supports multi-byte UTF-8 and Vietnamese text deterministically', () => {
    const hashDaNang = sha256Hex('Đà Nẵng');
    expect(hashDaNang).toBeTypeOf('string');
    expect(hashDaNang.length).toBe(64);
    // Distinct from non-accented
    expect(hashDaNang).not.toBe(sha256Hex('Da Nang'));

    // Emoji / supplementary plane text
    const hashEmoji = sha256Hex('Chuyến bay ✈️ Vietjet');
    expect(hashEmoji).toBeTypeOf('string');
    expect(hashEmoji.length).toBe(64);
  });

  it('buildPhysicalItineraryId creates deterministic format with segment ordering', () => {
    const id1 = buildPhysicalItineraryId({
      origin: 'sgn',
      destination: 'han',
      departDate: '2026-11-15',
      segments: [
        { origin: 'SGN', destination: 'DAD', flightNumber: 'VN123', marketingCarrier: 'VN', segmentOrder: 1 },
        { origin: 'DAD', destination: 'HAN', flightNumber: 'VN456', marketingCarrier: 'VN', segmentOrder: 2 },
      ],
    });

    // Shuffled segments produce identical ID
    const id2 = buildPhysicalItineraryId({
      origin: 'SGN',
      destination: 'HAN',
      departDate: '2026-11-15',
      segments: [
        { origin: 'DAD', destination: 'HAN', flightNumber: 'VN456', marketingCarrier: 'VN', segmentOrder: 2 },
        { origin: 'SGN', destination: 'DAD', flightNumber: 'VN123', marketingCarrier: 'VN', segmentOrder: 1 },
      ],
    });

    expect(id1).toBe(id2);
    expect(id1.startsWith('itin:v1:')).toBe(true);
    expect(id1.length).toBe('itin:v1:'.length + 32);
  });

  it('REQ-DOM-011: OfferVariantId MUST NOT contain price', () => {
    const ovToday = buildOfferVariantId({
      origin: 'SGN',
      destination: 'HAN',
      departDate: '2026-11-15',
      airline: 'VN',
      flightNumber: 'VN123',
      cabin: 'ECONOMY',
      stops: 0,
    });

    const ovTomorrow = buildOfferVariantId({
      origin: 'sgn ',
      destination: ' han',
      departDate: '2026-11-15',
      airline: 'vn',
      flightNumber: 'vn123',
      cabin: 'economy',
      stops: 0,
    });

    expect(ovToday).toBe(ovTomorrow);
    expect(ovToday.startsWith('ov:v1:')).toBe(true);
  });

  it('buildObservationId normalizes float prices to integer VND', () => {
    const obsInt = buildObservationId({
      offerVariantId: 'ov:v1:12345',
      provider: 'Travelpayouts',
      observedAt: '2026-10-28T02:00:00Z',
      price: 2000000,
    });

    const obsFloat = buildObservationId({
      offerVariantId: 'ov:v1:12345',
      provider: 'travelpayouts ',
      observedAt: '2026-10-28T02:00:00Z',
      price: 2000000.4, // sub-dong precision noise
    });

    expect(obsInt).toBe(obsFloat);
    expect(obsInt.startsWith('obs:v1:')).toBe(true);
  });

  it('buildOpportunityId generates canonical opp:v1: identifier', () => {
    const oppId = buildOpportunityId({
      origin: 'SGN',
      destination: 'HAN',
      departDate: '2026-11-15',
      journeyType: 'ONE_WAY',
      cabin: 'ECONOMY',
    });
    expect(oppId.startsWith('opp:v1:')).toBe(true);
    expect(oppId.length).toBe('opp:v1:'.length + 32);
  });

  it('resolveLegacyIdentity resolves legacy and v1 identifiers without loss', () => {
    expect(resolveLegacyIdentity('ov:v1:abc12345')).toEqual({
      canonicalId: 'ov:v1:abc12345',
      version: 'v1',
      type: 'offer_variant',
    });
    expect(resolveLegacyIdentity('obs:v1:abc12345')).toEqual({
      canonicalId: 'obs:v1:abc12345',
      version: 'v1',
      type: 'observation',
    });
    expect(resolveLegacyIdentity('ov_legacy_001')).toEqual({
      canonicalId: 'ov_legacy_001',
      version: 'legacy',
      type: 'offer_variant',
    });
    expect(resolveLegacyIdentity('opp_legacy_002')).toEqual({
      canonicalId: 'opp_legacy_002',
      version: 'legacy',
      type: 'opportunity',
    });
  });
});
