import test from 'node:test';
import assert from 'node:assert/strict';

function evaluateFreshnessAtTime(observedAtMs, currentClockMs) {
  if (typeof observedAtMs !== 'number' || typeof currentClockMs !== 'number' || isNaN(observedAtMs) || isNaN(currentClockMs)) {
    return 'STALE';
  }
  const ageMinutes = (currentClockMs - observedAtMs) / (60 * 1000);
  if (ageMinutes <= 120) return 'HEALTHY';
  if (ageMinutes <= 360) return 'DEGRADED';
  return 'STALE';
}

function calculateFlightDurationMinutes(depIso, arrIso) {
  if (typeof depIso !== 'string' || typeof arrIso !== 'string') return -1;
  const dep = new Date(depIso).getTime();
  const arr = new Date(arrIso).getTime();
  if (isNaN(dep) || isNaN(arr) || arr <= dep) return -1;
  return (arr - dep) / (60 * 1000);
}

test('freshness evaluation: exact boundary precision (0m, 120m, 121m, 360m, 361m)', () => {
  const baseClock = new Date('2026-11-15T12:00:00.000Z').getTime();

  // Exactly 0 minutes ago -> HEALTHY
  assert.equal(evaluateFreshnessAtTime(baseClock, baseClock), 'HEALTHY');

  // Exactly 120 minutes ago -> HEALTHY
  const t120 = baseClock - (120 * 60 * 1000);
  assert.equal(evaluateFreshnessAtTime(t120, baseClock), 'HEALTHY', '120m must be HEALTHY');

  // Exactly 121 minutes ago -> DEGRADED
  const t121 = baseClock - (121 * 60 * 1000);
  assert.equal(evaluateFreshnessAtTime(t121, baseClock), 'DEGRADED', '121m must be DEGRADED');

  // Exactly 360 minutes ago -> DEGRADED
  const t360 = baseClock - (360 * 60 * 1000);
  assert.equal(evaluateFreshnessAtTime(t360, baseClock), 'DEGRADED', '360m must be DEGRADED');

  // Exactly 361 minutes ago -> STALE
  const t361 = baseClock - (361 * 60 * 1000);
  assert.equal(evaluateFreshnessAtTime(t361, baseClock), 'STALE', '361m must be STALE');
});

test('freshness evaluation: millisecond boundary transitions and future clock drift tolerance', () => {
  const baseClock = new Date('2026-11-15T12:00:00.000Z').getTime();

  // 120 minutes minus 1ms -> HEALTHY
  assert.equal(evaluateFreshnessAtTime(baseClock - (120 * 60 * 1000 - 1), baseClock), 'HEALTHY');

  // 120 minutes plus 1ms -> DEGRADED
  assert.equal(evaluateFreshnessAtTime(baseClock - (120 * 60 * 1000 + 1), baseClock), 'DEGRADED');

  // 360 minutes plus 1ms -> STALE
  assert.equal(evaluateFreshnessAtTime(baseClock - (360 * 60 * 1000 + 1), baseClock), 'STALE');

  // Future clock drift (scraper clock slightly ahead, e.g. 5 seconds into the future) -> HEALTHY
  const future5s = baseClock + 5000;
  assert.equal(evaluateFreshnessAtTime(future5s, baseClock), 'HEALTHY', 'Observation in immediate future must evaluate as HEALTHY');
});

test('flight duration: overnight red-eye flight crossing local midnight in Indochina time (UTC+7)', () => {
  // Departure: 23:30 (Day 1), Arrival: 06:15 (Day 2) -> Duration: 6h 45m = 405m
  const depOvernight = '2026-11-15T23:30:00+07:00';
  const arrOvernight = '2026-11-16T06:15:00+07:00';
  const duration = calculateFlightDurationMinutes(depOvernight, arrOvernight);
  assert.equal(duration, 405, 'Overnight flight duration must cross midnight boundary seamlessly');
});

test('flight duration: trans-meridian flights crossing UTC offsets (Hanoi to Tokyo, Saigon to Paris)', () => {
  // Hanoi (UTC+7) to Tokyo (UTC+9)
  // Departure: 00:30 UTC+7 (Hanoi) = 17:30 UTC (prev day)
  // Arrival: 07:00 UTC+9 (Tokyo) = 22:00 UTC (prev day)
  // Elapsed time: 4.5 hours = 270 minutes
  const depTokyo = '2026-11-15T00:30:00+07:00';
  const arrTokyo = '2026-11-15T07:00:00+09:00';
  assert.equal(calculateFlightDurationMinutes(depTokyo, arrTokyo), 270, 'Hanoi to Tokyo must account for UTC offset difference');

  // Saigon (UTC+7) to Paris (UTC+1 winter)
  // Departure: 23:00 UTC+7 = 16:00 UTC
  // Arrival: 06:30 UTC+1 (next day) = 05:30 UTC (next day)
  // Elapsed time: 13.5 hours = 810 minutes
  const depParis = '2026-11-15T23:00:00+07:00';
  const arrParis = '2026-11-16T06:30:00+01:00';
  assert.equal(calculateFlightDurationMinutes(depParis, arrParis), 810, 'Saigon to Paris must calculate exact long-haul elapsed duration');
});

test('flight duration: trans-Pacific International Date Line crossing (Saigon to San Francisco)', () => {
  // Departure: 2026-11-15 21:00 UTC+7 (Saigon) = 2026-11-15 14:00 UTC
  // Arrival: 2026-11-15 19:30 UTC-8 (San Francisco) = 2026-11-16 03:30 UTC
  // Elapsed time: 13.5 hours = 810 minutes
  const depSFO = '2026-11-15T21:00:00+07:00';
  const arrSFO = '2026-11-15T19:30:00-08:00';
  assert.equal(calculateFlightDurationMinutes(depSFO, arrSFO), 810, 'Trans-Pacific flight crossing date line must compute correct elapsed time');
});

test('flight duration: invalid chronology and inverted flight schedules fail closed (-1)', () => {
  // Arrival before departure
  const invalidDep = '2026-11-15T10:00:00Z';
  const invalidArr = '2026-11-15T08:00:00Z';
  assert.equal(calculateFlightDurationMinutes(invalidDep, invalidArr), -1, 'Arrival before departure must fail closed with -1');

  // Identical departure and arrival
  assert.equal(calculateFlightDurationMinutes(invalidDep, invalidDep), -1, 'Zero duration flight must fail closed with -1');
});

test('flight duration: leap year transition continuity (Feb 28 to Feb 29 to Mar 1)', () => {
  // 2028 is a leap year.
  // Overnight flight from Feb 28 22:00 UTC to Feb 29 04:00 UTC -> 6 hours = 360m
  const depFeb28 = '2028-02-28T22:00:00Z';
  const arrFeb29 = '2028-02-29T04:00:00Z';
  assert.equal(calculateFlightDurationMinutes(depFeb28, arrFeb29), 360, 'Crossing into leap day must preserve duration');

  // Overnight flight from Feb 29 23:00 UTC to Mar 01 05:00 UTC -> 6 hours = 360m
  const depFeb29 = '2028-02-29T23:00:00Z';
  const arrMar01 = '2028-03-01T05:00:00Z';
  assert.equal(calculateFlightDurationMinutes(depFeb29, arrMar01), 360, 'Crossing from leap day to March 1 must preserve duration');
});

test('flight duration: Daylight Saving Time (DST) shift offset invariance', () => {
  // London departing before DST shift (UTC+0) to New York (UTC-5)
  // Departure: 2026-10-24 10:00:00Z (10:00 UTC)
  // Arrival: 2026-10-24 13:30:00-04:00 (17:30 UTC)
  // Elapsed time: 7.5 hours = 450 minutes
  const depSummer = '2026-10-24T10:00:00Z';
  const arrSummer = '2026-10-24T13:30:00-04:00';
  assert.equal(calculateFlightDurationMinutes(depSummer, arrSummer), 450, 'Summer DST offset calculation must be exact');

  // Winter DST offset (-05:00)
  const depWinter = '2026-11-15T10:00:00Z';
  const arrWinter = '2026-11-15T12:30:00-05:00';
  assert.equal(calculateFlightDurationMinutes(depWinter, arrWinter), 450, 'Winter standard time offset calculation must be exact');
});

test('defensive input handling: non-string, null, undefined, and malformed inputs fail closed without throwing', () => {
  assert.equal(calculateFlightDurationMinutes(null, '2026-11-15T10:00:00Z'), -1);
  assert.equal(calculateFlightDurationMinutes('2026-11-15T10:00:00Z', null), -1);
  assert.equal(calculateFlightDurationMinutes(undefined, undefined), -1);
  assert.equal(calculateFlightDurationMinutes('invalid-date', '2026-11-15T10:00:00Z'), -1);
  assert.equal(calculateFlightDurationMinutes('2026-11-15T10:00:00Z', 'not-a-date'), -1);
  assert.equal(calculateFlightDurationMinutes(1234567, 1234568), -1);
  assert.equal(calculateFlightDurationMinutes({}, {}), -1);

  // Freshness with invalid types fails safe to STALE
  assert.equal(evaluateFreshnessAtTime(null, 1000), 'STALE');
  assert.equal(evaluateFreshnessAtTime(1000, null), 'STALE');
  assert.equal(evaluateFreshnessAtTime(NaN, 1000), 'STALE');
});

test('performance benchmark: 10,000 schedule duration evaluations execute in under 50ms', () => {
  const start = performance.now();
  const dep = '2026-11-15T00:30:00+07:00';
  const arr = '2026-11-15T07:00:00+09:00';

  for (let i = 0; i < 10000; i++) {
    const duration = calculateFlightDurationMinutes(dep, arr);
    if (duration !== 270) throw new Error('Benchmark assertion failed');
  }

  const elapsed = performance.now() - start;
  assert.ok(elapsed < 50, `10,000 duration evaluations must complete in under 50ms (took ${elapsed.toFixed(2)}ms)`);
});
