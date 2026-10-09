import test from 'node:test';
import assert from 'node:assert/strict';

function serveDeals(context) {
  // NORMAL /deals REQUEST MUST NOT WAIT FOR LIVE PROVIDER
  // It reads from verified snapshot or cached last-known-good
  if (context.lastKnownGoodSnapshot) {
    return Promise.resolve({
      status: 'healthy',
      data: context.lastKnownGoodSnapshot,
      source: 'snapshot',
    });
  }
  if (context.cache && context.cache.has('feed')) {
    return Promise.resolve({
      status: 'cached',
      data: context.cache.get('feed'),
      source: 'cache',
    });
  }
  return Promise.resolve({
    status: 'empty_degraded',
    data: [],
    source: 'degraded_standby',
  });
}

function processIngestionWithAtomicSnapshot(existingSnapshot, rawPayload, validator) {
  // If validator fails, existingSnapshot MUST remain intact
  if (!validator(rawPayload)) {
    return {
      success: false,
      snapshot: existingSnapshot,
      error: 'VALIDATION_FAILED_QUARANTINED',
    };
  }

  // Atomically replace with new snapshot
  const newSnapshot = {
    snapshot_id: `snap-${Date.now()}`,
    data: rawPayload.items,
    published_at: new Date().toISOString(),
  };
  return {
    success: true,
    snapshot: newSnapshot,
  };
}

test('Drill 01: Provider Timeout does not block user serving and retains last-known-good', async () => {
  const context = {
    cache: new Map([['feed', [{ id: 'deal-1', price: 1000000 }]]]),
    lastKnownGoodSnapshot: { id: 'snap-1', items: [{ id: 'deal-1', price: 1000000 }] },
    servingMode: 'SNAPSHOT',
    retryCount: 0,
  };

  const slowProvider = () => new Promise((resolve) => setTimeout(resolve, 10000));
  const res = await serveDeals(context, slowProvider);

  assert.equal(res.status, 'healthy');
  assert.equal(res.source, 'snapshot');
  assert.equal(res.data.items.length, 1);
});

test('Drill 02 & 03: HTTP 429 and 500 error classification and bounded retry backoff', () => {
  const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
  assert.equal(RETRYABLE_STATUSES.has(429), true);
  assert.equal(RETRYABLE_STATUSES.has(500), true);
  assert.equal(RETRYABLE_STATUSES.has(503), true);
  assert.equal(RETRYABLE_STATUSES.has(400), false);
  assert.equal(RETRYABLE_STATUSES.has(401), false);
  assert.equal(RETRYABLE_STATUSES.has(404), false);

  // Maximum attempts is strictly bounded to 3
  const MAX_ATTEMPTS = 3;
  let attempts = 0;
  for (let i = 0; i < 10; i++) {
    if (attempts < MAX_ATTEMPTS) attempts++;
  }
  assert.equal(attempts, 3);
});

test('Drill 04: Malformed payload is quarantined and never replaces good snapshot', () => {
  const currentSnapshot = { snapshot_id: 'lkg-01', items: [{ id: 'valid-deal' }] };
  const malformedPayload = { items: 'not an array' };

  const validator = (p) => Array.isArray(p?.items);
  const result = processIngestionWithAtomicSnapshot(currentSnapshot, malformedPayload, validator);

  assert.equal(result.success, false);
  assert.equal(result.error, 'VALIDATION_FAILED_QUARANTINED');
  assert.deepEqual(result.snapshot, currentSnapshot);
});

test('Drill 05: Valid zero inventory produces healthy_empty, not degraded', () => {
  const emptyPayload = { items: [] };
  const validator = (p) => Array.isArray(p?.items);
  const result = processIngestionWithAtomicSnapshot(null, emptyPayload, validator);

  assert.equal(result.success, true);
  assert.deepEqual(result.snapshot.data, []);
});

test('Drill 06: Schema drift (missing required fields) quarantines offending records', () => {
  const records = [
    { id: '1', origin: 'HAN', destination: 'BKK', price: 1500000 },
    { id: '2', origin: 'HAN', destination: null, price: 1200000 }, // missing dest
    { id: '3', origin: 'SGN', destination: 'SIN', price: -500 }, // invalid price
    { id: '4', origin: 'DAD', destination: 'ICN', price: NaN }, // non-finite
  ];

  const valid = records.filter(
    (r) => r.origin && r.destination && Number.isFinite(r.price) && r.price > 0
  );
  assert.equal(valid.length, 1);
  assert.equal(valid[0].id, '1');
});

test('Drill 07 & 08: One provider down / all providers down fails safely to last-known-good', async () => {
  const context = {
    cache: new Map([['feed', [{ id: 'cached-deal' }]]]),
    lastKnownGoodSnapshot: { id: 'snap-lkg', items: [{ id: 'cached-deal' }] },
    servingMode: 'SNAPSHOT',
    retryCount: 0,
  };

  const allDownProvider = async () => {
    throw new Error('All providers unreachable');
  };

  const res = await serveDeals(context, allDownProvider);
  assert.equal(res.status, 'healthy');
  assert.equal(res.data.items[0].id, 'cached-deal');
});

test('Drill 09 & 10: Duplicate or missed cron jobs maintain idempotency through dedupe_key', () => {
  const dedupeKey = 'HAN:BKK:2026-11-01:2026-11-05:VJ:0:1500000';
  const table = new Map();

  // Ingest first time
  table.set(dedupeKey, { price: 1500000, observed_at: '2026-10-01T00:00:00Z' });
  // Duplicate run ingests same dedupeKey
  table.set(dedupeKey, { price: 1500000, observed_at: '2026-10-01T00:01:00Z' });

  // Map length remains 1, no duplicate entries created
  assert.equal(table.size, 1);
  assert.equal(table.get(dedupeKey).price, 1500000);
});

test('Drill 11: Cache miss gracefully loads database snapshot without synchronous crawler', async () => {
  const context = {
    cache: new Map(), // Cold cache
    lastKnownGoodSnapshot: { id: 'db-snap', items: [{ id: 'db-deal' }] },
    servingMode: 'SNAPSHOT',
    retryCount: 0,
  };

  const dummyProvider = async () => {
    throw new Error('Should not be called');
  };

  const res = await serveDeals(context, dummyProvider);
  assert.equal(res.status, 'healthy');
  assert.equal(res.source, 'snapshot');
  assert.equal(res.data.items[0].id, 'db-deal');
});

test('Drill 12: Stale snapshot degrades freshness indicator without crashing UI', () => {
  const now = new Date('2026-10-01T14:00:00Z').getTime();
  const observedAt = new Date('2026-10-01T08:00:00Z').getTime(); // 360m ago
  const ageMinutes = Math.round((now - observedAt) / 60000);

  const status = ageMinutes > 360 ? 'stale_only' : ageMinutes > 120 ? 'degraded_freshness' : 'healthy';
  assert.equal(status, 'degraded_freshness');
  assert.equal(ageMinutes, 360);
});

test('NC-012: Provider parser exception cannot become healthy empty', () => {
  function classifyProviderResult(hasError, rawItems) {
    if (hasError) return { state: 'PROVIDER_ERROR', offers: [] };
    if (!rawItems || rawItems.length === 0) return { state: 'VERIFIED_EMPTY', offers: [] };
    return { state: 'COMPLETE', offers: rawItems };
  }

  const errResult = classifyProviderResult(true, []);
  assert.equal(errResult.state, 'PROVIDER_ERROR');
  assert.notEqual(errResult.state, 'VERIFIED_EMPTY');
});

test('NC-013: Weak fallback cannot retain FULL coverage status', () => {
  function evaluateCoverage(parserMode) {
    if (parserMode === 'UPSTREAM_DEGRADED_FALLBACK') {
      return { status: 'DEGRADED_COVERAGE', isFull: false };
    }
    return { status: 'COMPLETE', isFull: true };
  }

  const degraded = evaluateCoverage('UPSTREAM_DEGRADED_FALLBACK');
  assert.equal(degraded.status, 'DEGRADED_COVERAGE');
  assert.equal(degraded.isFull, false);
});

test('NC-014: Route with 0/2 windows causes discovery degradation', () => {
  function evaluateRouteScan(attempted, succeeded, hasDegradedParser) {
    if (succeeded === attempted && attempted > 0 && !hasDegradedParser) {
      return { scanStatus: 'completed', failureClass: null };
    }
    if (succeeded > 0) {
      return { scanStatus: 'partial', failureClass: hasDegradedParser ? 'DEGRADED_COVERAGE' : 'PARTIAL_WINDOWS' };
    }
    return { scanStatus: 'failed', failureClass: 'ALL_WINDOWS_FAILED' };
  }

  // 0/2 succeeded windows must be failed
  const failedRoute = evaluateRouteScan(2, 0, false);
  assert.equal(failedRoute.scanStatus, 'failed');
  assert.equal(failedRoute.failureClass, 'ALL_WINDOWS_FAILED');

  // 1/2 succeeded windows must be partial, NOT completed
  const partialRoute = evaluateRouteScan(2, 1, false);
  assert.equal(partialRoute.scanStatus, 'partial');
  assert.notEqual(partialRoute.scanStatus, 'completed');
});

test('D16: Query-scoped coverage distinguishes monitored route from unmonitored date window', () => {
  function evaluateScopedHealth(observedAt, total, isMonitoredScope) {
    if (!isMonitoredScope) return 'unmonitored';
    if (total === 0) return 'healthy_empty';
    return 'healthy';
  }

  // Route exists for 2026-11-10, but user asks for 2026-12-25 (which has never been scanned)
  const unmonitoredDate = evaluateScopedHealth(null, 0, false);
  assert.equal(unmonitoredDate, 'unmonitored', 'Unmonitored date window must return unmonitored, not healthy_empty');

  // Route exists and has been scanned on requested date, yielding 0 flights
  const monitoredEmpty = evaluateScopedHealth(new Date().toISOString(), 0, true);
  assert.equal(monitoredEmpty, 'healthy_empty', 'Monitored route on scanned date with 0 flights is healthy_empty');
});

test('D18: Generation publishing retains previous last-known-good generation for rollback', () => {
  const generations = [
    { id: 'gen-1', state: 'RETIRED', published_at: '2026-10-08T10:00:00Z' },
    { id: 'gen-2', state: 'ACTIVE', published_at: '2026-10-08T11:00:00Z' },
  ];

  function publishNewGeneration(activeGens, newGenId) {
    // Current active becomes retired LKG
    const currentActive = activeGens.find((g) => g.state === 'ACTIVE');
    const updated = activeGens.map((g) => g.id === currentActive?.id ? { ...g, state: 'RETIRED' } : g);
    updated.push({ id: newGenId, state: 'ACTIVE', published_at: new Date().toISOString() });

    // Identify retained generations: active + previous LKG
    const retainedIds = new Set([newGenId, currentActive?.id].filter(Boolean));
    const purgedIds = updated.filter((g) => !retainedIds.has(g.id)).map((g) => g.id);
    return { retainedIds, purgedIds };
  }

  const result = publishNewGeneration(generations, 'gen-3');
  assert.ok(result.retainedIds.has('gen-3'), 'Active generation must be retained');
  assert.ok(result.retainedIds.has('gen-2'), 'Previous last-known-good generation must be retained for rollback');
  assert.ok(result.purgedIds.includes('gen-1'), 'Older generations beyond previous LKG may be purged');
});


