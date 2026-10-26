# FARELY PROJECT 10X — MASTER GOAL G11 [G3]
# LEVEL: Pass 3: Anti-Fake-Done Turnkey Verification Oracles & Defense Matrix
# MANDATE: Subject AST diffs from G2 to automated adversarial verification oracles. Design deterministic negative vector tests.
# GIT_COMMIT: 7450b1ec38bb3e70ea7b8619b6d0bd87ae92ea17
# TIMESTAMP: 2026-10-26T07:38:00.000Z
# EXECUTION_RECEIPT_SHA256: 02707ca0a9f44467deff7702dfecf195c0280b77a90e9c7787459c4cdcfe9adc

---

## SECTION B: INVARIANT EXECUTOR CAGE
```text
INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
The executor is strictly bound to the locked technical solutions detailed in Section D & E.
The executor is FORBIDDEN from inventing new architectures, introducing alternative algorithms,
changing database schemas, or deviating from the specified file/function diffs.
Any deviation is a critical contract breach and will be rejected closed by the Evidence Admission Controller.
```

---

## REFUTATION MATRIX & AUDIT OF PASS G2

### Falsification 1: L05 Unregistered Provider Default Scope Leakage
- *Deficit in G2*: Pass G2 introduced `getSafeProviderRights()`, but returned an empty array for `authorizedScopes`. It failed to specify whether an unregistered provider could be accidentally passed to functions checking only `providerId` existence rather than scope membership.
- *Falsification & Falsification Vector*: In legacy utility functions, truthy checks on `getProviderSourceRights(id)` without scope inspection would treat the returned object as an authorized source, bypassing B2B distribution locks.
- *Correction in G3*: In `src/domain/farely/providerRights.ts`, ensure `isProviderQueryPermitted()` explicitly rejects any provider whose `licenseType === 'RESTRICTED'` or whose scopes do not contain the exact queried permission, returning strict boolean `false` with telemetry warning.

### Falsification 2: L06 Clock Drift & Negative Staleness Paradox
- *Deficit in G2*: Pass G2 implemented `evictExpiredOfflineDeals()`, but assumed monotonic forward time where `nowMs >= cachedTime`.
- *Falsification & Falsification Vector*: If a client device's clock is skewed backwards into the past (e.g. manual clock change or battery reset on mobile), `(nowMs - cachedTime)` yields a negative number. Under `< maxAgeMinutes`, a deal observed 2 years in the future would pass eviction, displaying an impossible future observation date to the user.
- *Correction in G3*: In `src/domain/farely/pwaOfflineFreshness.ts`, reject negative staleness: if `stalenessMinutes < -5` (allowing 5m NTP drift), mark as clock-tampered and evict immediately.

### Falsification 3: L07 Silent Suppression of Diagnostic Telemetry
- *Deficit in G2*: Pass G2 detailed safe circular serialization in `analytics.ts`, but did not specify an oracle test to ensure stripped circular references leave a recognizable diagnostic trace (`[Circular Reference]`).
- *Falsification & Falsification Vector*: If circular objects are stripped silently to `null` or omitted without placeholder markers, SRE engineers debugging production crashes cannot distinguish between an absent property and a recursive structure.
- *Correction in G3*: In `src/app/lib/analytics.ts`, replace detected circular references with the explicit sentinel string `"[Circular]"` and verify this substitution with a dedicated unit assertion oracle.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G72)

### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: Helper `parseNullableNumber(val)` preserves `null` and `undefined` without coercion to 0. In `src/domain/farely/priceAnomaly.ts`, require both sample variance $\sigma > 0.05 \mu$ AND sample size $N \ge 5$ before calculating z-scores. Routes with $N < 5$ yield `confidence: INSUFFICIENT_HISTORY` and return neutral anomaly rating (0).
- **Forbidden Deviations**: No anomaly extrapolation on micro-samples ($N < 5$); no float math for currency.
- **Verification Command**: `npm test src/app/domain/differentialAndMetamorphic.test.ts`

### SOL-02: SOL-PRICE-01 (Deterministic Tet Window Lookup & Seasonal Multiplier)
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/domain/farely/priceAnomaly.ts`, define static Tet travel epochs (2025: Jan 15 - Feb 15; 2026: Feb 03 - Mar 05; 2027: Jan 24 - Feb 24). Flight departures falling within these ranges apply a deterministic $2.8\times$ baseline multiplier to prevent false anomaly triggers.
- **Forbidden Deviations**: No dynamic unsealed third-party lunar dependencies; no static unseasoned baselines.
- **Verification Command**: `npm test src/domain/farely/priceAnomaly.test.ts`

### SOL-03: SOL-COST-01 (Carrier Landed Surcharges & Self-Transfer Risk)
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts` & `src/domain/farely/multiCityItinerary.ts`
- **Specification**: Domestic surcharge dictionary: VJ (350k VND bag, 55k fee), QH (320k VND bag, 45k fee), VU (300k VND bag, 50k fee), VN (included bag, 0k fee). Multi-carrier self-transfers require 150m (domestic) or 240m (international). If below, deduct 25 points from deal score with flag `SELF_TRANSFER_HIGH_RISK`.
- **Forbidden Deviations**: No naked base fare ranking; no unflagged interline transfers.
- **Verification Command**: `npm test src/domain/farely/multiCityItinerary.test.ts`

### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox & Row-Level Locking)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Enforces IP and email throttling at database level (max 5 alerts/hour) via `check_watch_rate_limit()`. Outbox batch evaluation utilizes `FOR UPDATE SKIP LOCKED` to prevent concurrent queue deadlocks.
- **Forbidden Deviations**: No unthrottled alert creation; no blocking table locks.
- **Verification Command**: `node scripts/watch-outbox-atomicity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Distributed Advisory-Lock Token Lease & Circuit Breaker)
- **Target File**: `supabase/functions/_shared/flight-search.ts` & `supabase/functions/_shared/amadeus-provider.ts`
- **Specification**: Distributed token refresh coordinates via Postgres advisory locks (`pg_try_advisory_xact_lock`) with 3000ms timeout and `TokenLeaseRecord` caching. Crawler calls enforce `AbortSignal.timeout(8000)`. Circuit breaker state syncs across workers via `operational_scan_health`.
- **Forbidden Deviations**: No isolate-local in-memory token mutexes; no un-timeouted fetches.
- **Verification Command**: `node scripts/provider-drift-and-killswitch.node-test.mjs`

### SOL-06: SOL-STALE-01 (Storage Exception Shield & 14-Day Eviction)
- **Target File**: `src/app/pages/DealsPage.tsx` & `src/domain/farely/pwaOfflineFreshness.ts`
- **Specification**: Sealed `createSafeStorageAdapter()` wraps IndexedDB access for private browsing safety, setting `isEphemeralStorage: true` on failure. Renders `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m) badges. Purges records older than 14 days ($20,160$ minutes).
- **Forbidden Deviations**: No unhandled `SecurityError` crashes on storage calls.
- **Verification Command**: `npm test src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Vite Code Splitting & Circular-Safe Telemetry)
- **Target File**: `src/app/lib/analytics.ts` & `src/app/data/api.ts`
- **Specification**: Safe error serializer traverses nested objects up to depth 3 with circular detection and 1,000-character string truncation. Enforces mobile bundle budget under 250KB gzipped by decoupling large type definitions from rendering components and lazy-loading heavy routes.
- **Forbidden Deviations**: No unhandled `JSON.stringify` exceptions; no bundle inflation >250KB.
- **Verification Command**: `node scripts/client-error-boundary.node-test.mjs`

### SOL-08: SOL-MIGRATION-01 (ForeignKey Index Parity & 47-Migration Parity)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs` & `supabase/migrations/`
- **Specification**: Exactly 47 canonical migrations verified. Ensures all foreign key constraints are indexed (`idx_watch_notifications_watch_id`, `idx_user_watches_user_id`) to prevent table-level share locks during cascade deletions.
- **Forbidden Deviations**: No sequential full-table scans on search queries; no unindexed foreign keys.
- **Verification Command**: `node scripts/test-migration-provenance.node-test.mjs`

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs` & `src/domain/farely/productionSmokeTruth.ts`
- **Specification**: Explicitly enforces `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Unit and integration test proofs strictly tagged as C1/C2, never elevated to C3/C4 without soak verification.
- **Forbidden Deviations**: Never emit self-awarded 10/10 scores; never treat C1 tests as C3 runtime proof.
- **Verification Command**: `node scripts/verify-adversarial-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (267 Historical Gates & 32 P2 Semantic Preservation)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs` & `scripts/convergence/anti-evasion-linter.mjs`
- **Specification**: Asserts 192 P0, 74 P1, and 1 P2 gates with authentic test assertions across all historical manifests.
- **Forbidden Deviations**: No gate deletion, no priority demotion, no gate renaming.
- **Verification Command**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (Transactional Execution & State Rollback Journal)
- **Target File**: `scripts/convergence/transactional-task-manager.mjs`
- **Specification**: Pre-task SHA-256 file hashing guarantees byte-for-byte rollback integrity. Rollback deletes newly created orphan files and releases PID write lock.
- **Forbidden Deviations**: No untracked file residue after task rollback.
- **Verification Command**: `node scripts/convergence/transactional-task-manager.mjs status`

### SOL-12: SOL-RELEASE-01 (Git Remote Fast-Forward & SHA Parity)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs` & `package.json`
- **Specification**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind, and zero untracked working-tree artifacts.
- **Forbidden Deviations**: No completion declaration with unpushed commits or untracked changes.
- **Verification Command**: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX (G3 ORACLES)

### L01: Product Truth & Founder Scope Integrity
Oracle validates that `src/domain/farely/providerRights.ts` never marks unverified indicative sources as certified live bookable feeds.

### L02: Price, Historical Baseline & Data Integrity
Oracle in `src/domain/farely/priceAnomaly.ts` asserts that micro-samples with high variance do not trigger spurious 5-star anomaly badges.

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
Oracle in `src/app/domain/dealComparison.ts` evaluates metamorphic permutations: changing display currency or reordering raw arrays produces strictly identical rank orders.

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
Oracle in `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` verifies that multi-tenant watch alert queues cannot leak cross-account recipient emails.

### L05: Provider Drift, Circuit Breakers & Kill Switches
Oracle in `src/domain/farely/providerCapabilities.ts` asserts that rate limit tripwires transition to backoff status upon receiving consecutive 429 or 503 response codes.

### L06: Freshness, Stale Degradation & UX Honesty
Oracle in `src/domain/farely/pwaOfflineFreshness.ts` verifies that expired records older than 14 days are completely omitted from the UI model on `src/app/pages/DealsPage.tsx`.

### L07: Observability, Secret Scrubbing & Error Boundaries
Oracle in `src/app/lib/analytics.ts` runs deeply nested and circular error objects through serialization, verifying zero memory leaks or unhandled exceptions.

### L08: Database Architecture, Schema Drift & Migration Provenance
Oracle in `scripts/verify-certification-integrity.node-test.mjs` verifies that every migration checksum matches git provenance history.

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
Oracle in `src/domain/farely/productionSmokeTruth.ts` programmatically blocks marking any capability `TARGET_PROVEN` solely from C1 unit test runs.

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
Oracle in `scripts/acceptance-anti-shrinkage.node-test.mjs` enforces invariant check across all 267 acceptance gates.

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
Oracle in `scripts/convergence/transactional-task-manager.mjs` verifies snapshot restoration parity upon synthetic task failure injection.

### L12: Zero-Trust Release & Remote Git Synchronization
Oracle in `scripts/convergence/watchdog-convergence.mjs` continuously asserts fast-forward parity against remote branch.

---

## TURNKEY VERIFICATION TEST SUITE SPECIFICATION

### ORACLE-01: Provider Rights Scope Oracle (`src/domain/farely/providerRights.test.ts`)
```typescript
it('rejects query permissions for unregistered or restricted providers', () => {
  expect(isProviderQueryPermitted('unknown_crawler', 'B2B_SYNDICATION')).toBe(false);
  expect(isProviderQueryPermitted('vietjet_direct', 'B2B_SYNDICATION')).toBe(false);
  expect(isProviderQueryPermitted('amadeus_commercial_gds', 'B2B_SYNDICATION')).toBe(true);
});
```

### ORACLE-02: PWA Eviction Oracle (`src/domain/farely/pwaOfflineFreshness.test.ts`)
```typescript
it('evicts records older than 14 days and handles clock skew', () => {
  const baseTime = '2026-10-26T12:00:00.000Z';
  const deals = [
    { id: 'fresh', cachedAt: '2026-10-26T10:00:00.000Z' }, // 2 hours old
    { id: 'expired', cachedAt: '2026-10-10T00:00:00.000Z' }, // 16 days old
    { id: 'skewed_future', cachedAt: '2026-11-01T00:00:00.000Z' }, // Invalid future
    { id: 'corrupt', cachedAt: 'not-a-valid-date' } // Malformed
  ];
  const valid = evictExpiredOfflineDeals(deals as any, 20160, baseTime);
  expect(valid.map(d => d.id)).toEqual(['fresh']);
});
```

### ORACLE-03: Deal Comparison Monotonicity Oracle (`src/app/domain/dealComparison.test.ts`)
```typescript
it('ranks deals with monotonic tie-breaking and deterministic sorting', () => {
  const rows = [
    { id: 'd2', ticketPrice: 2000000, durationMinutes: 120 },
    { id: 'd1', ticketPrice: 1500000, durationMinutes: 150 },
    { id: 'd3', ticketPrice: 1500000, durationMinutes: 110 }
  ];
  const sorted = sortComparisonRowsMonotonically(rows as any);
  expect(sorted.map(r => r.id)).toEqual(['d3', 'd1', 'd2']);
});
```
