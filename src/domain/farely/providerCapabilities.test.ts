import { describe, it, expect } from 'vitest';
import {
  getProviderCapabilities,
  isProviderSupportingJourneyType,
  isProviderSupportingMultiCity,
  validateIntentProviderCompatibility,
  filterProvidersByIntent,
  createProviderSearchQuery,
} from './providerCapabilities.ts';
import { createTravelIntent } from './travelIntent.ts';

describe('F61: Typed Provider Capability Matrix & Journey Type Boundary', () => {
  it('registers canonical providers with typed capabilities', () => {
    const vietjet = getProviderCapabilities('vietjet_direct');
    expect(vietjet).toBeDefined();
    expect(vietjet?.supportedJourneyTypes).toContain('ONE_WAY');
    expect(vietjet?.supportedJourneyTypes).toContain('ROUND_TRIP');

    const charter = getProviderCapabilities('charter_oneway_only');
    expect(charter).toBeDefined();
    expect(charter?.supportedJourneyTypes).toEqual(['ONE_WAY']);

    const promo = getProviderCapabilities('vietjet_promo_roundtrip_only');
    expect(promo).toBeDefined();
    expect(promo?.supportedJourneyTypes).toEqual(['ROUND_TRIP']);
  });

  it('correctly queries journey type support per provider', () => {
    expect(isProviderSupportingJourneyType('vietjet_direct', 'ONE_WAY')).toBe(true);
    expect(isProviderSupportingJourneyType('vietjet_direct', 'ROUND_TRIP')).toBe(true);

    expect(isProviderSupportingJourneyType('charter_oneway_only', 'ONE_WAY')).toBe(true);
    expect(isProviderSupportingJourneyType('charter_oneway_only', 'ROUND_TRIP')).toBe(false);

    expect(isProviderSupportingJourneyType('vietjet_promo_roundtrip_only', 'ONE_WAY')).toBe(false);
    expect(isProviderSupportingJourneyType('vietjet_promo_roundtrip_only', 'ROUND_TRIP')).toBe(true);
  });

  it('F61 Invariant: One-way request NEVER silently becomes round-trip', () => {
    const oneWayIntent = createTravelIntent({
      origin: 'HAN',
      destination: 'SGN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-11-20',
      adults: 1,
    });

    // Validating against a roundtrip-only provider must fail explicitly, NOT coerce
    const result = validateIntentProviderCompatibility('vietjet_promo_roundtrip_only', oneWayIntent);
    expect(result.compatible).toBe(false);
    expect(result.violations[0]).toContain("không hỗ trợ hình thức hành trình 'ONE_WAY'");
    expect(result.violations[0]).toContain('không bao giờ được tự động chuyển đổi');

    // Attempting to build a provider query must throw, never synthesize return date
    expect(() => {
      createProviderSearchQuery('vietjet_promo_roundtrip_only', oneWayIntent);
    }).toThrowError(/F61 boundary violation/);
  });

  it('creates clean one-way provider query without returnDate when supported', () => {
    const oneWayIntent = createTravelIntent({
      origin: 'HAN',
      destination: 'SGN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-11-20',
      adults: 2,
    });

    const query = createProviderSearchQuery('vietjet_direct', oneWayIntent);
    expect(query.providerId).toBe('vietjet_direct');
    expect(query.journeyType).toBe('ONE_WAY');
    expect(query.origin).toBe('HAN');
    expect(query.destination).toBe('SGN');
    expect(query.outboundDate).toBe('2026-11-20');
    expect(query.returnDate).toBeUndefined();
    expect(query.adults).toBe(2);
  });

  it('creates clean round-trip provider query preserving outbound and inbound dates', () => {
    const roundTripIntent = createTravelIntent({
      origin: 'HAN',
      destination: 'BKK',
      journeyType: 'ROUND_TRIP',
      outboundDate: '2026-12-01',
      returnDate: '2026-12-10',
      adults: 1,
    });

    const query = createProviderSearchQuery('vietjet_direct', roundTripIntent);
    expect(query.journeyType).toBe('ROUND_TRIP');
    expect(query.outboundDate).toBe('2026-12-01');
    expect(query.returnDate).toBe('2026-12-10');
  });

  it('filters provider pool according to intent compatibility without mutating intent', () => {
    const oneWayIntent = createTravelIntent({
      origin: 'HAN',
      destination: 'SGN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-11-20',
      adults: 1,
    });

    const candidateProviders = [
      'vietjet_direct',
      'vietnam_airlines',
      'vietjet_promo_roundtrip_only',
      'charter_oneway_only',
    ];

    const compatible = filterProvidersByIntent(candidateProviders, oneWayIntent);
    expect(compatible).toContain('vietjet_direct');
    expect(compatible).toContain('vietnam_airlines');
    expect(compatible).toContain('charter_oneway_only');
    expect(compatible).not.toContain('vietjet_promo_roundtrip_only');
  });

  it('rejects unknown provider safely with descriptive violation', () => {
    const intent = createTravelIntent({
      origin: 'HAN',
      destination: 'SGN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-11-20',
    });

    const result = validateIntentProviderCompatibility('non_existent_ota', intent);
    expect(result.compatible).toBe(false);
    expect(result.violations[0]).toContain('không tồn tại trong danh mục hệ thống');

    // Safe null or empty string check
    expect(getProviderCapabilities('')).toBeUndefined();
    expect(getProviderCapabilities(null as any)).toBeUndefined();
  });

  it('enforces multi-city support boundary and verifies isProviderSupportingMultiCity (L01/L11)', () => {
    expect(isProviderSupportingMultiCity('vietnam_airlines')).toBe(true);
    expect(isProviderSupportingMultiCity('vietjet_direct')).toBe(false);
    expect(isProviderSupportingMultiCity('bamboo_airways')).toBe(false);

    const multiCityIntent = createTravelIntent({
      origin: 'HAN',
      destination: 'SGN',
      journeyType: 'MULTI_CITY',
      outboundDate: '2026-11-20',
    });

    // Vietjet does not support multi-city -> must be rejected
    const vjRes = validateIntentProviderCompatibility('vietjet_direct', multiCityIntent);
    expect(vjRes.compatible).toBe(false);
    expect(vjRes.violations.some((v) => v.includes('Multi-city'))).toBe(true);

    // Vietnam Airlines supports multi-city -> must be compatible
    const vnaRes = validateIntentProviderCompatibility('vietnam_airlines', multiCityIntent);
    expect(vnaRes.compatible).toBe(true);
  });

  it('enforces market scope compatibility when international route requested (L08)', () => {
    // Bamboo domestic config does not support international market scope
    const intlIntent = createTravelIntent({
      origin: 'HAN',
      destination: 'NRT',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-12-15',
    });

    const bambooRes = validateIntentProviderCompatibility('bamboo_airways', intlIntent);
    expect(bambooRes.compatible).toBe(false);
    expect(bambooRes.violations.some((v) => v.includes('phạm vi thị trường'))).toBe(true);
  });
});
