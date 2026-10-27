import { describe, it, expect } from 'vitest';
import {
  createTravelIntent,
  deriveMarketScope,
  serializeTravelIntent,
  deserializeTravelIntent,
  TravelIntentValidationError,
} from './travelIntent.ts';

describe('WP03: Pure Domain Kernel — Canonical TravelIntent & Safety Bounds', () => {
  describe('Market Scope Derivation', () => {
    it('correctly classifies domestic routes within Vietnam', () => {
      expect(deriveMarketScope('HAN', 'SGN')).toBe('DOMESTIC');
      expect(deriveMarketScope('DAD', 'CXR')).toBe('DOMESTIC');
      expect(deriveMarketScope('VDO', 'PQC')).toBe('DOMESTIC');
    });

    it('correctly classifies international routes crossing Vietnam borders', () => {
      expect(deriveMarketScope('HAN', 'BKK')).toBe('INTERNATIONAL');
      expect(deriveMarketScope('SGN', 'SIN')).toBe('INTERNATIONAL');
      expect(deriveMarketScope('NRT', 'HAN')).toBe('INTERNATIONAL');
    });
  });

  describe('Basic TravelIntent Creation & NC-006 Boundary', () => {
    it('creates standard one-way domestic travel intent with defaults', () => {
      const intent = createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-11-20',
      });

      expect(intent.schemaVersion).toBe(1);
      expect(intent.journeyType).toBe('ONE_WAY');
      expect(intent.marketScope).toBe('DOMESTIC');
      expect(intent.outbound).toEqual({ exact: '2026-11-20' });
      expect(intent.inbound).toBeUndefined();
      expect(intent.passengers).toEqual({ adults: 1, children: 0, infants: 0 });
      expect(intent.cabin).toBe('ECONOMY');
      expect(intent.currency).toBe('VND');
      expect(intent.isGroupBooking).toBe(false);
    });

    it('NC-006: throws descriptive error when round trip omits returnDate', () => {
      expect(() => {
        createTravelIntent({
          origin: 'HAN',
          destination: 'BKK',
          journeyType: 'ROUND_TRIP',
          outboundDate: '2026-11-20',
        });
      }).toThrow(/NC-006 violation.*Round trip intent requires inbound return date/);
    });
  });

  describe('SOL-TRAVELINTENT-01: Chronological Safety & Date Validation', () => {
    it('accepts valid round trip where return date is strictly after outbound date', () => {
      const intent = createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ROUND_TRIP',
        outboundDate: '2026-11-20',
        returnDate: '2026-11-25',
      });

      expect(intent.outbound.exact).toBe('2026-11-20');
      expect(intent.inbound?.exact).toBe('2026-11-25');
    });

    it('permits same-day round trip flights (outbound === return)', () => {
      const intent = createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ROUND_TRIP',
        outboundDate: '2026-11-20',
        returnDate: '2026-11-20',
      });

      expect(intent.outbound.exact).toBe('2026-11-20');
      expect(intent.inbound?.exact).toBe('2026-11-20');
    });

    it('rejects inverted round-trip dates where inbound is before outbound', () => {
      expect(() => {
        createTravelIntent({
          origin: 'HAN',
          destination: 'SGN',
          journeyType: 'ROUND_TRIP',
          outboundDate: '2026-11-25',
          returnDate: '2026-11-20',
        });
      }).toThrowError(TravelIntentValidationError);

      try {
        createTravelIntent({
          origin: 'HAN',
          destination: 'SGN',
          journeyType: 'ROUND_TRIP',
          outboundDate: '2026-11-25',
          returnDate: '2026-11-20',
        });
      } catch (err: any) {
        expect(err.code).toBe('ERR_INVERTED_DATES');
        expect(err.message).toContain('Inverted round-trip dates');
      }
    });

    it('rejects inverted date windows where inbound latest precedes outbound earliest', () => {
      expect(() => {
        createTravelIntent({
          origin: 'HAN',
          destination: 'DAD',
          journeyType: 'ROUND_TRIP',
          outboundDate: { from: '2026-11-20', to: '2026-11-22' },
          returnDate: { from: '2026-11-15', to: '2026-11-18' },
        });
      }).toThrowError(TravelIntentValidationError);
    });

    it('sanitizes one-way journey so inbound remains undefined even if returnDate passed', () => {
      const intent = createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-11-20',
        returnDate: '2026-11-25',
      });

      expect(intent.journeyType).toBe('ONE_WAY');
      expect(intent.inbound).toBeUndefined();
    });
  });

  describe('SOL-TRAVELINTENT-02: Passenger Mix Integrity & Infant Safety', () => {
    it('throws RangeError when adults < 1', () => {
      expect(() => {
        createTravelIntent({
          origin: 'HAN',
          destination: 'SGN',
          journeyType: 'ONE_WAY',
          outboundDate: '2026-11-20',
          adults: 0,
        });
      }).toThrow(RangeError);
    });

    it('rejects fractional or non-integer passenger counts', () => {
      expect(() => {
        createTravelIntent({
          origin: 'HAN',
          destination: 'SGN',
          journeyType: 'ONE_WAY',
          outboundDate: '2026-11-20',
          adults: 1.5,
        });
      }).toThrowError(TravelIntentValidationError);

      try {
        createTravelIntent({
          origin: 'HAN',
          destination: 'SGN',
          journeyType: 'ONE_WAY',
          outboundDate: '2026-11-20',
          adults: 1.5,
        });
      } catch (err: any) {
        expect(err.code).toBe('ERR_PASSENGER_MIX_INVALID');
      }
    });

    it('rejects negative passenger counts for children or infants', () => {
      expect(() => {
        createTravelIntent({
          origin: 'HAN',
          destination: 'SGN',
          journeyType: 'ONE_WAY',
          outboundDate: '2026-11-20',
          adults: 2,
          children: -1,
        });
      }).toThrowError(TravelIntentValidationError);
    });

    it('enforces lap infant safety rule (infants <= adults)', () => {
      // 1 adult with 1 infant -> allowed
      const validSingle = createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-11-20',
        adults: 1,
        infants: 1,
      });
      expect(validSingle.passengers.infants).toBe(1);

      // 1 adult with 2 lap infants -> strictly prohibited by aviation safety standards
      expect(() => {
        createTravelIntent({
          origin: 'HAN',
          destination: 'SGN',
          journeyType: 'ONE_WAY',
          outboundDate: '2026-11-20',
          adults: 1,
          infants: 2,
        });
      }).toThrowError(TravelIntentValidationError);

      try {
        createTravelIntent({
          origin: 'HAN',
          destination: 'SGN',
          journeyType: 'ONE_WAY',
          outboundDate: '2026-11-20',
          adults: 1,
          infants: 2,
        });
      } catch (err: any) {
        expect(err.code).toBe('ERR_LAP_INFANT_EXCESS');
        expect(err.message).toContain('Lap infants');
      }
    });

    it('caps maximum total party size to 18 passengers', () => {
      expect(() => {
        createTravelIntent({
          origin: 'HAN',
          destination: 'SGN',
          journeyType: 'ONE_WAY',
          outboundDate: '2026-11-20',
          adults: 10,
          children: 10,
        });
      }).toThrowError(TravelIntentValidationError);
    });

    it('sets isGroupBooking to true when seated passengers (adults + children) > 9', () => {
      const individualIntent = createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-11-20',
        adults: 5,
        children: 4, // 9 total seated
      });
      expect(individualIntent.isGroupBooking).toBe(false);

      const groupIntent = createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-11-20',
        adults: 6,
        children: 4, // 10 total seated > 9
      });
      expect(groupIntent.isGroupBooking).toBe(true);
    });
  });

  describe('Search Filter Constraint Bounds', () => {
    it('rejects negative maxStops', () => {
      expect(() => {
        createTravelIntent({
          origin: 'HAN',
          destination: 'SGN',
          journeyType: 'ONE_WAY',
          outboundDate: '2026-11-20',
          maxStops: -1,
        });
      }).toThrowError(TravelIntentValidationError);
    });

    it('rejects unrealistic maxDurationMinutes (< 15 min)', () => {
      expect(() => {
        createTravelIntent({
          origin: 'HAN',
          destination: 'SGN',
          journeyType: 'ONE_WAY',
          outboundDate: '2026-11-20',
          maxDurationMinutes: 10,
        });
      }).toThrowError(TravelIntentValidationError);
    });

    it('accepts valid search constraints', () => {
      const intent = createTravelIntent({
        origin: 'HAN',
        destination: 'SGN',
        journeyType: 'ONE_WAY',
        outboundDate: '2026-11-20',
        maxStops: 1,
        maxDurationMinutes: 240,
      });
      expect(intent.maxStops).toBe(1);
      expect(intent.maxDurationMinutes).toBe(240);
    });
  });

  describe('Serialization & Deserialization Fidelity (REQ-DOM-015)', () => {
    it('round-trips TravelIntent through JSON preserving all fields', () => {
      const intent = createTravelIntent({
        origin: 'HAN',
        destination: 'SIN',
        journeyType: 'ROUND_TRIP',
        outboundDate: '2026-12-01',
        returnDate: '2026-12-10',
        adults: 2,
        children: 1,
        infants: 1,
        cabin: 'BUSINESS',
        maxStops: 0,
        maxDurationMinutes: 220,
        tripLength: { minDays: 8, maxDays: 10 },
        baggagePreference: 'CHECKED_20KG',
        currency: 'VND',
      });

      const serialized = serializeTravelIntent(intent);
      const deserialized = deserializeTravelIntent(serialized);

      expect(deserialized).toEqual(intent);
    });

    it('rejects invalid schemaVersion during deserialization', () => {
      const badJson = JSON.stringify({ schemaVersion: 2 });
      expect(() => deserializeTravelIntent(badJson)).toThrow(
        /Invalid or unsupported TravelIntent schema version/
      );
    });
  });
});
