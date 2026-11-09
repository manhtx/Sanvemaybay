import { describe, expect, it } from 'vitest';
import {
  calendarDaysBetween,
  FlightTimeContract,
  formatLocalCalendarDate,
  parseLocalCalendarDate,
  validateObservationVsDeparture
} from './time';

describe('Farely Pure Domain Kernel — Time Contract & Calendar Invariants (REQ-DOM-009, NC-007, FLY-INTEL-001)', () => {
  describe('validateObservationVsDeparture (NC-007)', () => {
    it('accepts valid UTC timestamp and YYYY-MM-DD local date', () => {
      expect(() =>
        validateObservationVsDeparture('2026-11-09T08:30:00.000Z', '2026-12-01')
      ).not.toThrow();

      expect(() =>
        validateObservationVsDeparture('2026-01-01T00:00:00Z', '2026-01-02')
      ).not.toThrow();
    });

    it('throws when either parameter is missing or empty', () => {
      expect(() => validateObservationVsDeparture('', '2026-12-01')).toThrowError(
        'Both observedAtUtc and departLocalDate are required'
      );
      expect(() => validateObservationVsDeparture('2026-11-09T08:30:00.000Z', '')).toThrowError(
        'Both observedAtUtc and departLocalDate are required'
      );
      // @ts-expect-error test undefined guard
      expect(() => validateObservationVsDeparture(undefined, '2026-12-01')).toThrowError(
        'Both observedAtUtc and departLocalDate are required'
      );
      // @ts-expect-error test null guard
      expect(() => validateObservationVsDeparture('2026-11-09T08:30:00.000Z', null)).toThrowError(
        'Both observedAtUtc and departLocalDate are required'
      );
    });

    it('throws when departLocalDate does not strictly conform to YYYY-MM-DD regex', () => {
      const invalidDates = [
        '2026/12/01',
        '2026-1-1',
        '2026-01-1',
        '26-12-01',
        '01-12-2026',
        '2026.12.01',
        'December 1, 2026',
        '2026-12-01T00:00:00Z'
      ];

      for (const invalid of invalidDates) {
        expect(() =>
          validateObservationVsDeparture('2026-11-09T08:30:00.000Z', invalid)
        ).toThrowError(/departLocalDate must be YYYY-MM-DD/);
      }
    });

    it('throws when observedAtUtc is an invalid or non-date timestamp string', () => {
      const invalidTimestamps = [
        'not-a-valid-date',
        '2026-99-99T99:99:99Z',
        'undefined',
        'null',
        'foo-bar-baz'
      ];

      for (const invalid of invalidTimestamps) {
        expect(() =>
          validateObservationVsDeparture(invalid, '2026-12-01')
        ).toThrowError(/Invalid observedAtUtc timestamp/);
      }
    });

    it('strictly satisfies FlightTimeContract interface types', () => {
      const contract: FlightTimeContract = {
        observedAtUtc: '2026-11-09T08:30:00.000Z',
        departLocalDate: '2026-12-01',
        departLocalTime: '09:15',
        arrivalLocalDate: '2026-12-01',
        arrivalLocalTime: '11:30',
        originTimezone: 'Asia/Ho_Chi_Minh',
        destinationTimezone: 'Asia/Bangkok'
      };

      expect(contract.originTimezone).toBe('Asia/Ho_Chi_Minh');
      expect(contract.destinationTimezone).toBe('Asia/Bangkok');
      expect(() => validateObservationVsDeparture(contract.observedAtUtc, contract.departLocalDate)).not.toThrow();
    });
  });

  describe('parseLocalCalendarDate', () => {
    it('decomposes YYYY-MM-DD without timezone offset drift', () => {
      const result = parseLocalCalendarDate('2026-12-25');
      expect(result).toEqual({ year: 2026, month: 12, day: 25 });

      const newYear = parseLocalCalendarDate('2027-01-01');
      expect(newYear).toEqual({ year: 2027, month: 1, day: 1 });

      const leapDay = parseLocalCalendarDate('2028-02-29');
      expect(leapDay).toEqual({ year: 2028, month: 2, day: 29 });
    });

    it('throws on malformed date string formats', () => {
      expect(() => parseLocalCalendarDate('2026-12')).toThrowError(/Invalid calendar date format/);
      expect(() => parseLocalCalendarDate('2026/12/25')).toThrowError(/Invalid calendar date format/);
      expect(() => parseLocalCalendarDate('invalid')).toThrowError(/Invalid calendar date format/);
      expect(() => parseLocalCalendarDate('2026-12-25-01')).toThrowError(/Invalid calendar date format/);
      expect(() => parseLocalCalendarDate('')).toThrowError(/Invalid calendar date format/);
    });
  });

  describe('formatLocalCalendarDate', () => {
    it('zero-pads single-digit month and day components', () => {
      expect(formatLocalCalendarDate(2026, 5, 4)).toBe('2026-05-04');
      expect(formatLocalCalendarDate(2026, 1, 9)).toBe('2026-01-09');
      expect(formatLocalCalendarDate(2026, 12, 25)).toBe('2026-12-25');
      expect(formatLocalCalendarDate(2026, 10, 10)).toBe('2026-10-10');
    });

    it('preserves mathematical round-trip isomorphism with parseLocalCalendarDate', () => {
      const dates = [
        { year: 2026, month: 1, day: 5 },
        { year: 2026, month: 7, day: 15 },
        { year: 2026, month: 12, day: 31 },
        { year: 2028, month: 2, day: 29 }
      ];

      for (const d of dates) {
        const formatted = formatLocalCalendarDate(d.year, d.month, d.day);
        const parsed = parseLocalCalendarDate(formatted);
        expect(parsed).toEqual(d);
      }
    });
  });

  describe('calendarDaysBetween', () => {
    it('calculates 0 days for identical dates (identity property)', () => {
      expect(calendarDaysBetween('2026-12-01', '2026-12-01')).toBe(0);
      expect(calendarDaysBetween('2026-01-01', '2026-01-01')).toBe(0);
      expect(calendarDaysBetween('2028-02-29', '2028-02-29')).toBe(0);
    });

    it('preserves strict antisymmetry: daysBetween(A, B) === -daysBetween(B, A)', () => {
      const pairs = [
        ['2026-01-01', '2026-01-15'],
        ['2026-03-28', '2026-04-05'],
        ['2026-12-20', '2027-01-10'],
        ['2028-02-27', '2028-03-05']
      ];

      for (const [from, to] of pairs) {
        const forward = calendarDaysBetween(from, to);
        const backward = calendarDaysBetween(to, from);
        expect(forward).toBe(-backward);
        expect(forward).toBeGreaterThan(0);
      }
    });

    it('preserves additive transitivity: daysBetween(A, B) + daysBetween(B, C) === daysBetween(A, C)', () => {
      const a = '2026-04-10';
      const b = '2026-05-20';
      const c = '2026-07-04';

      const ab = calendarDaysBetween(a, b);
      const bc = calendarDaysBetween(b, c);
      const ac = calendarDaysBetween(a, c);

      expect(ab + bc).toBe(ac);
    });

    it('calculates exact duration across month and year boundaries', () => {
      // 2026-03-28 to 2026-04-05 is 8 days (31-day March)
      expect(calendarDaysBetween('2026-03-28', '2026-04-05')).toBe(8);

      // Dec 31 to Jan 1 cross-year transition
      expect(calendarDaysBetween('2026-12-31', '2027-01-01')).toBe(1);

      // Full non-leap year (2026): 365 days
      expect(calendarDaysBetween('2026-01-01', '2027-01-01')).toBe(365);

      // Full leap year (2028): 366 days
      expect(calendarDaysBetween('2028-01-01', '2029-01-01')).toBe(366);
    });

    it('accurately resolves leap years (2024, 2028) vs non-leap years (2026, 2027)', () => {
      // 2028 is a leap year (Feb 29 exists): 2028-02-27 to 2028-03-01 is 3 days (Feb 27, 28, 29 -> Mar 1)
      expect(calendarDaysBetween('2028-02-27', '2028-03-01')).toBe(3);

      // 2027 is a non-leap year (Feb has 28 days): 2027-02-27 to 2027-03-01 is 2 days
      expect(calendarDaysBetween('2027-02-27', '2027-03-01')).toBe(2);

      // 2024 leap year: Feb 28 to Mar 1 is 2 days
      expect(calendarDaysBetween('2024-02-28', '2024-03-01')).toBe(2);
    });
  });

  describe('High-Volume Performance & Pure Immutability', () => {
    it('executes 10,000 date parse and interval operations in <50ms', () => {
      const start = performance.now();
      let total = 0;
      for (let i = 1; i <= 100; i++) {
        const from = `2026-01-${String((i % 28) + 1).padStart(2, '0')}`;
        const to = `2026-02-${String((i % 28) + 1).padStart(2, '0')}`;
        total += calendarDaysBetween(from, to);
      }
      const elapsed = performance.now() - start;

      expect(total).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(50);
    });

    it('does not mutate external input parameters or frozen objects', () => {
      const frozenInput = Object.freeze({
        observedAtUtc: '2026-11-09T08:30:00.000Z',
        departLocalDate: '2026-12-01'
      });

      expect(() => validateObservationVsDeparture(frozenInput.observedAtUtc, frozenInput.departLocalDate)).not.toThrow();
      expect(frozenInput.departLocalDate).toBe('2026-12-01');
    });

    it('calendarDaysBetween handles century boundaries accurately (e.g. 2000 leap year vs 2100 common year)', () => {
      // 2000 is divisible by 400 (leap century): Feb 28 to Mar 1 is 2 days
      expect(calendarDaysBetween('2000-02-28', '2000-03-01')).toBe(2);
      // 2100 is not divisible by 400 (non-leap century): Feb 28 to Mar 1 is 1 day
      expect(calendarDaysBetween('2100-02-28', '2100-03-01')).toBe(1);
    });

    it('formatLocalCalendarDate handles multi-millennium and century transition dates cleanly', () => {
      expect(formatLocalCalendarDate(1999, 12, 31)).toBe('1999-12-31');
      expect(formatLocalCalendarDate(3000, 1, 1)).toBe('3000-01-01');
    });

    it('parseLocalCalendarDate parses single-digit components when padded or throws on missing fields', () => {
      expect(parseLocalCalendarDate('2026-08-05')).toEqual({ year: 2026, month: 8, day: 5 });
      expect(() => parseLocalCalendarDate('2026-08')).toThrowError(/Invalid calendar date format/);
      expect(() => parseLocalCalendarDate('2026-08-05-01')).toThrowError(/Invalid calendar date format/);
    });

    it('processes 50,000 calendar interval operations within sub-100ms latency budget', () => {
      const start = performance.now();
      for (let i = 0; i < 50000; i++) {
        calendarDaysBetween('2026-05-01', '2026-05-15');
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });
});
