import { describe, expect, it } from 'vitest';
import {
  buildPriceScopeFingerprint,
  buildPriceScopeFingerprintV2,
  buildPriceScopeFingerprintFromIntent,
  buildPriceScopeFingerprintV2FromIntent
} from './priceScope';
import { LocationScope, resolveLocationScope } from './locationScope';
import { TravelIntent } from './travelIntent';

describe('Farely Pure Domain Kernel — Price Scope Fingerprint (REQ-DOM-014)', () => {
  const hanScope: LocationScope = resolveLocationScope('HAN');
  const sgnScope: LocationScope = resolveLocationScope('SGN');
  const nrtScope: LocationScope = resolveLocationScope('NRT');

  describe('buildPriceScopeFingerprint (V1)', () => {
    it('constructs canonical fingerprint with default values for one-way flight', () => {
      const fp = buildPriceScopeFingerprint({
        originScope: hanScope,
        destinationScope: sgnScope,
        journeyType: 'ONE_WAY',
        departDate: '2026-12-01'
      });

      expect(fp).toBe('scope_HAN:SGN:ONE_WAY:2026-12-01::ECONOMY:VND:ANY');
    });

    it('constructs round-trip fingerprint with explicit cabin, currency, and stop constraints', () => {
      const fp = buildPriceScopeFingerprint({
        originScope: sgnScope,
        destinationScope: nrtScope,
        journeyType: 'ROUND_TRIP',
        departDate: '2026-12-01',
        returnDate: '2026-12-10',
        cabin: 'BUSINESS',
        currency: 'USD',
        maxStops: 1
      });

      expect(fp).toBe('scope_SGN:NRT:ROUND_TRIP:2026-12-01:2026-12-10:BUSINESS:USD:1');
    });

    it('normalizes codes, journey types, cabins, and currencies to uppercase', () => {
      const lowercaseScope: LocationScope = {
        type: 'EXACT_AIRPORT',
        primaryCode: 'han',
        expandedCodes: ['han']
      };
      const destScope: LocationScope = {
        type: 'EXACT_AIRPORT',
        primaryCode: 'sgn',
        expandedCodes: ['sgn']
      };

      const fp = buildPriceScopeFingerprint({
        originScope: lowercaseScope,
        destinationScope: destScope,
        journeyType: 'one_way',
        departDate: '2026-12-01',
        cabin: 'economy',
        currency: 'vnd',
        maxStops: 0
      });

      expect(fp).toBe('scope_HAN:SGN:ONE_WAY:2026-12-01::ECONOMY:VND:0');
    });
  });

  describe('buildPriceScopeFingerprintV2 (12-token format)', () => {
    it('constructs canonical V2 fingerprint with defaults (1A0C0I, PER_TRAVELER, EXACT, ANY duration)', () => {
      const fp = buildPriceScopeFingerprintV2({
        originScope: hanScope,
        destinationScope: sgnScope,
        journeyType: 'ONE_WAY',
        departDate: '2026-12-01'
      });

      expect(fp).toBe('scope_v2:HAN:SGN:ONE_WAY:2026-12-01::EXACT:1A0C0I:PER_TRAVELER:ECONOMY:VND:ANY:ANY');
    });

    it('encodes passenger mix, trip duration bounds, and max duration limit in V2', () => {
      const fp = buildPriceScopeFingerprintV2({
        originScope: sgnScope,
        destinationScope: nrtScope,
        journeyType: 'ROUND_TRIP',
        departDate: '2026-12-01',
        returnDate: '2026-12-10',
        passengers: { adults: 2, children: 1, infants: 1 },
        pricingUnit: 'PARTY_TOTAL',
        tripLength: { minDays: 5, maxDays: 14 },
        cabin: 'PREMIUM_ECONOMY',
        currency: 'JPY',
        maxStops: 2,
        maxDurationMinutes: 720
      });

      expect(fp).toBe(
        'scope_v2:SGN:NRT:ROUND_TRIP:2026-12-01:2026-12-10:5-14:2A1C1I:PARTY_TOTAL:PREMIUM_ECONOMY:JPY:2:720'
      );
    });

    it('handles wildcard open bounds for tripLength', () => {
      const fpMinOnly = buildPriceScopeFingerprintV2({
        originScope: hanScope,
        destinationScope: sgnScope,
        journeyType: 'ROUND_TRIP',
        departDate: '2026-12-01',
        tripLength: { minDays: 3 }
      });
      expect(fpMinOnly).toContain(':3-*:');

      const fpMaxOnly = buildPriceScopeFingerprintV2({
        originScope: hanScope,
        destinationScope: sgnScope,
        journeyType: 'ROUND_TRIP',
        departDate: '2026-12-01',
        tripLength: { maxDays: 10 }
      });
      expect(fpMaxOnly).toContain(':*-10:');
    });
  });

  describe('buildPriceScopeFingerprintFromIntent & V2FromIntent', () => {
    it('generates V1 fingerprint from TravelIntent with exact dates', () => {
      const intent: TravelIntent = {
        schemaVersion: 1,
        originScope: hanScope,
        destinationScope: sgnScope,
        journeyType: 'ONE_WAY',
        marketScope: 'DOMESTIC',
        passengers: { adults: 1, children: 0, infants: 0 },
        currency: 'VND',
        cabin: 'ECONOMY',
        maxStops: 0,
        outbound: { exact: '2026-12-01' }
      };

      const fp = buildPriceScopeFingerprintFromIntent(intent);
      expect(fp).toBe('scope_HAN:SGN:ONE_WAY:2026-12-01::ECONOMY:VND:0');
    });

    it('generates V1 fingerprint from TravelIntent with date range', () => {
      const intent: TravelIntent = {
        schemaVersion: 1,
        originScope: sgnScope,
        destinationScope: nrtScope,
        journeyType: 'ROUND_TRIP',
        marketScope: 'INTERNATIONAL',
        passengers: { adults: 2, children: 0, infants: 0 },
        currency: 'USD',
        cabin: 'BUSINESS',
        outbound: { from: '2026-12-01', to: '2026-12-05' },
        inbound: { from: '2026-12-10', to: '2026-12-15' }
      };

      const fp = buildPriceScopeFingerprintFromIntent(intent);
      expect(fp).toBe('scope_SGN:NRT:ROUND_TRIP:2026-12-01:2026-12-05:2026-12-10:2026-12-15:BUSINESS:USD:ANY');
    });

    it('generates canonical V2 fingerprint from TravelIntent including tripLength and duration', () => {
      const intent: TravelIntent = {
        schemaVersion: 1,
        originScope: hanScope,
        destinationScope: sgnScope,
        journeyType: 'ROUND_TRIP',
        marketScope: 'DOMESTIC',
        passengers: { adults: 2, children: 1, infants: 0 },
        currency: 'VND',
        cabin: 'ECONOMY',
        maxStops: 1,
        maxDurationMinutes: 300,
        tripLength: { minDays: 2, maxDays: 5 },
        outbound: { exact: '2026-12-01' },
        inbound: { exact: '2026-12-04' }
      };

      const fpV2 = buildPriceScopeFingerprintV2FromIntent(intent);
      expect(fpV2).toBe(
        'scope_v2:HAN:SGN:ROUND_TRIP:2026-12-01:2026-12-04:2-5:2A1C0I:PER_TRAVELER:ECONOMY:VND:1:300'
      );
    });
  });
});
