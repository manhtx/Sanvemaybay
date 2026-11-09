import { describe, expect, it } from 'vitest';
import {
  createTravelIntent,
  deriveMarketScope,
  deserializeTravelIntent,
  serializeTravelIntent
} from './travelIntent';

describe('Farely Pure Domain Kernel — Canonical TravelIntent (REQ-DOM-002..015, NC-004, NC-006)', () => {
  it('constructs a valid one-way domestic TravelIntent with canonical defaults', () => {
    const intent = createTravelIntent({
      origin: 'SGN',
      destination: 'HAN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-12-01'
    });

    expect(intent.schemaVersion).toBe(1);
    expect(intent.journeyType).toBe('ONE_WAY');
    expect(intent.marketScope).toBe('DOMESTIC');
    expect(intent.outbound).toEqual({ exact: '2026-12-01' });
    expect(intent.inbound).toBeUndefined();
    expect(intent.passengers).toEqual({ adults: 1, children: 0, infants: 0 });
    expect(intent.cabin).toBe('ECONOMY');
    expect(intent.currency).toBe('VND');
    expect(intent.originScope.primaryCode).toBe('SGN');
    expect(intent.destinationScope.primaryCode).toBe('HAN');
  });

  it('constructs a valid round-trip TravelIntent with returnDate', () => {
    const intent = createTravelIntent({
      origin: 'HAN',
      destination: 'DAD',
      journeyType: 'ROUND_TRIP',
      outboundDate: '2026-12-01',
      returnDate: '2026-12-08'
    });

    expect(intent.journeyType).toBe('ROUND_TRIP');
    expect(intent.marketScope).toBe('DOMESTIC');
    expect(intent.outbound).toEqual({ exact: '2026-12-01' });
    expect(intent.inbound).toEqual({ exact: '2026-12-08' });
  });

  it('NC-006: throws an explicit error when ROUND_TRIP intent lacks returnDate', () => {
    expect(() =>
      createTravelIntent({
        origin: 'SGN',
        destination: 'DAD',
        journeyType: 'ROUND_TRIP',
        outboundDate: '2026-12-01'
      })
    ).toThrowError(/NC-006 violation: Round trip intent requires inbound return date specification/);
  });

  it('NC-004: deriveMarketScope correctly identifies domestic routes within Vietnam', () => {
    expect(deriveMarketScope('SGN', 'HAN')).toBe('DOMESTIC');
    expect(deriveMarketScope('DAD', 'CXR')).toBe('DOMESTIC');
    expect(deriveMarketScope('PQC', 'VCA')).toBe('DOMESTIC');
    expect(deriveMarketScope('HPH', 'UIH')).toBe('DOMESTIC');
  });

  it('NC-004: deriveMarketScope correctly identifies international routes', () => {
    expect(deriveMarketScope('SGN', 'SIN')).toBe('INTERNATIONAL');
    expect(deriveMarketScope('HAN', 'BKK')).toBe('INTERNATIONAL');
    expect(deriveMarketScope('DAD', 'ICN')).toBe('INTERNATIONAL');
    expect(deriveMarketScope('NRT', 'HAN')).toBe('INTERNATIONAL');
    expect(deriveMarketScope('LHR', 'CDG')).toBe('INTERNATIONAL');
  });

  it('NC-004: deriveMarketScope fails closed to INTERNATIONAL for unknown or uncatalogued airports', () => {
    expect(deriveMarketScope('ZZZ', 'HAN')).toBe('INTERNATIONAL');
    expect(deriveMarketScope('SGN', 'XYZ')).toBe('INTERNATIONAL');
    expect(deriveMarketScope('FOO', 'BAR')).toBe('INTERNATIONAL');
  });

  it('throws RangeError when adult passenger count is less than 1', () => {
    expect(() =>
      createTravelIntent({
        origin: 'SGN',
        destination: 'HAN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-12-01',
        adults: 0
      })
    ).toThrowError(RangeError);

    expect(() =>
      createTravelIntent({
        origin: 'SGN',
        destination: 'HAN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-12-01',
        adults: -1
      })
    ).toThrowError(RangeError);
  });

  it('supports custom passenger mixes with children and infants', () => {
    const intent = createTravelIntent({
      origin: 'SGN',
      destination: 'HAN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-12-01',
      adults: 2,
      children: 2,
      infants: 1
    });

    expect(intent.passengers).toEqual({ adults: 2, children: 2, infants: 1 });
  });

  it('supports flexible DateWindow specifications for outbound and inbound', () => {
    const intent = createTravelIntent({
      origin: 'SGN',
      destination: 'BKK',
      journeyType: 'ROUND_TRIP',
      outboundDate: { from: '2026-12-01', to: '2026-12-05' },
      returnDate: { from: '2026-12-10', to: '2026-12-15' }
    });

    expect(intent.marketScope).toBe('INTERNATIONAL');
    expect(intent.outbound).toEqual({ from: '2026-12-01', to: '2026-12-05' });
    expect(intent.inbound).toEqual({ from: '2026-12-10', to: '2026-12-15' });
  });

  it('preserves flexible trip length constraints', () => {
    const intent = createTravelIntent({
      origin: 'SGN',
      destination: 'HAN',
      journeyType: 'ROUND_TRIP',
      outboundDate: '2026-12-01',
      returnDate: '2026-12-08',
      tripLength: { minDays: 5, maxDays: 10 }
    });

    expect(intent.tripLength).toEqual({ minDays: 5, maxDays: 10 });
  });

  it('preserves flight constraints: maxStops and maxDurationMinutes', () => {
    const intent = createTravelIntent({
      origin: 'SGN',
      destination: 'HAN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-12-01',
      maxStops: 0,
      maxDurationMinutes: 150
    });

    expect(intent.maxStops).toBe(0);
    expect(intent.maxDurationMinutes).toBe(150);
  });

  it('preserves baggage preference and custom cabin class', () => {
    const intent = createTravelIntent({
      origin: 'SGN',
      destination: 'SIN',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-12-01',
      cabin: 'BUSINESS',
      baggagePreference: 'CHECKED_20KG'
    });

    expect(intent.cabin).toBe('BUSINESS');
    expect(intent.baggagePreference).toBe('CHECKED_20KG');
  });

  it('REQ-DOM-015: serializeTravelIntent and deserializeTravelIntent perform lossless round-trip serialization', () => {
    const original = createTravelIntent({
      origin: 'SGN',
      destination: 'HAN',
      journeyType: 'ROUND_TRIP',
      outboundDate: { from: '2026-12-01', to: '2026-12-03' },
      returnDate: { from: '2026-12-08', to: '2026-12-10' },
      adults: 2,
      children: 1,
      cabin: 'PREMIUM_ECONOMY',
      maxStops: 1,
      maxDurationMinutes: 300,
      baggagePreference: 'CARRY_ON',
      currency: 'USD'
    });

    const serialized = serializeTravelIntent(original);
    expect(typeof serialized).toBe('string');

    const deserialized = deserializeTravelIntent(serialized);
    expect(deserialized).toEqual(original);
  });

  it('deserializeTravelIntent throws an error when schemaVersion is invalid or missing', () => {
    const invalidVersion = JSON.stringify({
      schemaVersion: 2,
      journeyType: 'ONE_WAY'
    });

    expect(() => deserializeTravelIntent(invalidVersion)).toThrowError(
      'Invalid or unsupported TravelIntent schema version'
    );

    const missingVersion = JSON.stringify({
      journeyType: 'ONE_WAY'
    });

    expect(() => deserializeTravelIntent(missingVersion)).toThrowError(
      'Invalid or unsupported TravelIntent schema version'
    );
  });

  it('rejects passenger mixes with zero or negative adults (cardinality boundary)', () => {
    expect(() =>
      createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-12-01',
        adults: 0,
      })
    ).toThrowError(RangeError);

    expect(() =>
      createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-12-01',
        adults: -1,
      })
    ).toThrowError(RangeError);
  });

  it('resolves metropolitan multi-airport aliases inside intent creation (BKK_ALL, TYO_ALL)', () => {
    const metroIntent = createTravelIntent({
      origin: 'BKK_ALL',
      destination: 'TYO_ALL',
      journeyType: 'ONE_WAY',
      outboundDate: '2026-12-01',
    });

    expect(metroIntent.originScope.primaryCode).toBe('BKK_METRO');
    expect(metroIntent.originScope.expandedCodes).toEqual(['BKK', 'DMK']);
    expect(metroIntent.destinationScope.primaryCode).toBe('TYO_METRO');
    expect(metroIntent.destinationScope.expandedCodes).toEqual(['HND', 'NRT']);
  });

  it('creates and serializes 1,000 travel intents within sub-50ms latency budget', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const intent = createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-12-01',
        adults: 2,
        children: 1,
      });
      serializeTravelIntent(intent);
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });

  it('rejects negative children or infants passenger counts (cardinality boundary)', () => {
    expect(() =>
      createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-12-01',
        children: -1,
      })
    ).toThrowError(RangeError);

    expect(() =>
      createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-12-01',
        infants: -1,
      })
    ).toThrowError(RangeError);
  });

  it('deserializeTravelIntent rejects null, undefined, empty string, or non-string inputs', () => {
    expect(() => deserializeTravelIntent(null as any)).toThrowError(
      'Invalid or unsupported TravelIntent schema version'
    );
    expect(() => deserializeTravelIntent(undefined as any)).toThrowError(
      'Invalid or unsupported TravelIntent schema version'
    );
    expect(() => deserializeTravelIntent('')).toThrowError(
      'Invalid or unsupported TravelIntent schema version'
    );
  });

  it('preserves pure immutability on Object.freeze protected TravelIntent objects', () => {
    const intent = createTravelIntent({
      origin: 'HAN',
      destination: 'DAD',
      journeyType: 'ROUND_TRIP',
      outboundDate: '2026-12-01',
      returnDate: '2026-12-08',
    });

    const frozen = Object.freeze(intent);
    expect(() => serializeTravelIntent(frozen)).not.toThrow();
    expect(frozen.journeyType).toBe('ROUND_TRIP');
  });
});
