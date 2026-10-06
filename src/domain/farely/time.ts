/**
 * Farely Pure Domain Kernel — Time Contract & Calendar Invariants
 * REQ-DOM-009, NC-007
 */

export interface FlightTimeContract {
  observedAtUtc: string; // ISO 8601 UTC timestamp
  departLocalDate: string; // YYYY-MM-DD in origin airport local timezone
  departLocalTime?: string; // HH:mm in origin airport local timezone
  arrivalLocalDate?: string; // YYYY-MM-DD in destination airport local timezone
  arrivalLocalTime?: string; // HH:mm in destination airport local timezone
  originTimezone: string;
  destinationTimezone?: string;
}

/**
 * Validates that an observation timestamp (UTC) is not conflated with departure date (local).
 * Invariant NC-007: Observation date cannot become departure date.
 */
export function validateObservationVsDeparture(observedAtUtc: string, departLocalDate: string): void {
  if (!observedAtUtc || !departLocalDate) {
    throw new Error('Both observedAtUtc and departLocalDate are required');
  }

  // Validate format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(departLocalDate)) {
    throw new Error(`departLocalDate must be YYYY-MM-DD, got ${departLocalDate}`);
  }

  const obsDate = new Date(observedAtUtc);
  if (Number.isNaN(obsDate.getTime())) {
    throw new Error(`Invalid observedAtUtc timestamp: ${observedAtUtc}`);
  }
}

/**
 * Parses YYYY-MM-DD calendar date string safely without timezone shifting.
 */
export function parseLocalCalendarDate(dateStr: string): { year: number; month: number; day: number } {
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    throw new Error(`Invalid calendar date format: ${dateStr}. Expected YYYY-MM-DD`);
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  return { year, month, day };
}

/**
 * Formats year, month, day to YYYY-MM-DD.
 */
export function formatLocalCalendarDate(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Computes calendar day difference between two local dates (YYYY-MM-DD).
 */
export function calendarDaysBetween(fromDateStr: string, toDateStr: string): number {
  const a = parseLocalCalendarDate(fromDateStr);
  const b = parseLocalCalendarDate(toDateStr);
  const da = Date.UTC(a.year, a.month - 1, a.day);
  const db = Date.UTC(b.year, b.month - 1, b.day);
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}
