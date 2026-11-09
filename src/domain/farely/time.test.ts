import { describe, expect, it } from 'vitest';
import {
  calendarDaysBetween,
  formatLocalCalendarDate,
  parseLocalCalendarDate,
  validateObservationVsDeparture
} from './time';

describe('Farely Pure Domain Kernel — Time Contract & Calendar Invariants (REQ-DOM-009, NC-007)', () => {
  it('NC-007: validateObservationVsDeparture accepts valid UTC timestamp and YYYY-MM-DD local date', () => {
    expect(() =>
      validateObservationVsDeparture('2026-11-09T08:30:00.000Z', '2026-12-01')
    ).not.toThrow();
  });

  it('NC-007: validateObservationVsDeparture throws when either parameter is missing or empty', () => {
    expect(() => validateObservationVsDeparture('', '2026-12-01')).toThrowError(
      'Both observedAtUtc and departLocalDate are required'
    );
    expect(() => validateObservationVsDeparture('2026-11-09T08:30:00.000Z', '')).toThrowError(
      'Both observedAtUtc and departLocalDate are required'
    );
  });

  it('NC-007: validateObservationVsDeparture throws when departLocalDate is not YYYY-MM-DD', () => {
    expect(() =>
      validateObservationVsDeparture('2026-11-09T08:30:00.000Z', '2026/12/01')
    ).toThrowError(/departLocalDate must be YYYY-MM-DD/);

    expect(() =>
      validateObservationVsDeparture('2026-11-09T08:30:00.000Z', '2026-1-1')
    ).toThrowError(/departLocalDate must be YYYY-MM-DD/);
  });

  it('NC-007: validateObservationVsDeparture throws when observedAtUtc is an invalid timestamp', () => {
    expect(() =>
      validateObservationVsDeparture('not-a-valid-date', '2026-12-01')
    ).toThrowError(/Invalid observedAtUtc timestamp/);
  });

  it('parseLocalCalendarDate decomposes YYYY-MM-DD without timezone offset drift', () => {
    const result = parseLocalCalendarDate('2026-12-25');
    expect(result).toEqual({ year: 2026, month: 12, day: 25 });
  });

  it('parseLocalCalendarDate throws on malformed date string formats', () => {
    expect(() => parseLocalCalendarDate('2026-12')).toThrowError(/Invalid calendar date format/);
    expect(() => parseLocalCalendarDate('2026/12/25')).toThrowError(/Invalid calendar date format/);
    expect(() => parseLocalCalendarDate('invalid')).toThrowError(/Invalid calendar date format/);
  });

  it('formatLocalCalendarDate zero-pads single-digit month and day components', () => {
    expect(formatLocalCalendarDate(2026, 5, 4)).toBe('2026-05-04');
    expect(formatLocalCalendarDate(2026, 12, 25)).toBe('2026-12-25');
  });

  it('calendarDaysBetween calculates 0 days for identical dates', () => {
    expect(calendarDaysBetween('2026-12-01', '2026-12-01')).toBe(0);
  });

  it('calendarDaysBetween calculates exact duration across month boundaries', () => {
    // 2026-03-28 to 2026-04-05 is 8 days (31-day March)
    expect(calendarDaysBetween('2026-03-28', '2026-04-05')).toBe(8);

    // Negative interval for reverse order
    expect(calendarDaysBetween('2026-04-05', '2026-03-28')).toBe(-8);
  });

  it('calendarDaysBetween accurately resolves leap years', () => {
    // 2028 is a leap year (Feb 29 exists): 2028-02-27 to 2028-03-01 is 3 days
    expect(calendarDaysBetween('2028-02-27', '2028-03-01')).toBe(3);

    // 2027 is a non-leap year (Feb has 28 days): 2027-02-27 to 2027-03-01 is 2 days
    expect(calendarDaysBetween('2027-02-27', '2027-03-01')).toBe(2);
  });
});
