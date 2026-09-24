import test from 'node:test';
import assert from 'node:assert/strict';

function evaluateFreshnessAtTime(observedAtMs, currentClockMs) {
  const ageMinutes = (currentClockMs - observedAtMs) / (60 * 1000);
  if (ageMinutes <= 120) return 'HEALTHY';
  if (ageMinutes <= 360) return 'DEGRADED';
  return 'STALE';
}

function calculateFlightDurationMinutes(depIso, arrIso) {
  const dep = new Date(depIso).getTime();
  const arr = new Date(arrIso).getTime();
  if (isNaN(dep) || isNaN(arr)) return -1;
  return (arr - dep) / (60 * 1000);
}

test('clock and timezone adversarial test: exact freshness boundaries and cross-midnight flight transitions', () => {
  const baseClock = new Date('2026-11-15T12:00:00.000Z').getTime();

  // Freshness exact boundary tests
  // 1. Exactly 120 minutes ago -> HEALTHY
  const t120 = baseClock - (120 * 60 * 1000);
  assert.equal(evaluateFreshnessAtTime(t120, baseClock), 'HEALTHY', '120m must be HEALTHY');

  // 2. Exactly 121 minutes ago -> DEGRADED
  const t121 = baseClock - (121 * 60 * 1000);
  assert.equal(evaluateFreshnessAtTime(t121, baseClock), 'DEGRADED', '121m must be DEGRADED');

  // 3. Exactly 360 minutes ago -> DEGRADED
  const t360 = baseClock - (360 * 60 * 1000);
  assert.equal(evaluateFreshnessAtTime(t360, baseClock), 'DEGRADED', '360m must be DEGRADED');

  // 4. Exactly 361 minutes ago -> STALE
  const t361 = baseClock - (361 * 60 * 1000);
  assert.equal(evaluateFreshnessAtTime(t361, baseClock), 'STALE', '361m must be STALE');

  // Timezone and midnight boundary tests
  // 5. Overnight flight crossing midnight in UTC+7 (Vietnam time)
  // Departure: 23:30 (Day 1), Arrival: 06:15 (Day 2) -> Duration: 6h 45m = 405m
  const depOvernight = '2026-11-15T23:30:00+07:00';
  const arrOvernight = '2026-11-16T06:15:00+07:00';
  const duration = calculateFlightDurationMinutes(depOvernight, arrOvernight);
  assert.equal(duration, 405, 'Overnight flight duration must cross midnight boundary seamlessly');

  // 6. Cross-timezone flight: Hanoi (UTC+7) to Tokyo (UTC+9)
  // Departure: 00:30 UTC+7 (Hanoi) = 17:30 UTC (prev day)
  // Arrival: 07:00 UTC+9 (Tokyo) = 22:00 UTC (prev day)
  // Actual elapsed time: 4.5 hours = 270 minutes
  const depTokyo = '2026-11-15T00:30:00+07:00';
  const arrTokyo = '2026-11-15T07:00:00+09:00';
  const crossTzDuration = calculateFlightDurationMinutes(depTokyo, arrTokyo);
  assert.equal(crossTzDuration, 270, 'Cross-timezone flight must account for UTC offset difference');

  // 7. Invalid chronology: Arrival before departure
  const invalidDep = '2026-11-15T10:00:00Z';
  const invalidArr = '2026-11-15T08:00:00Z';
  assert.ok(calculateFlightDurationMinutes(invalidDep, invalidArr) < 0, 'Arrival before departure must be detected as invalid');
});
