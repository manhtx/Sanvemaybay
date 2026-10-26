# FARELY PROJECT 10X — MASTER GOAL G11 [G2]
# LEVEL: Pass 2: Hostile Before/After AST Diff Blueprint & Code Mutation Contracts
# MANDATE: Subject baseline G1 to adversarial stress testing across all 12 lenses. Establish rigorous code-level AST diff blueprints.
# GIT_COMMIT: 7450b1ec38bb3e70ea7b8619b6d0bd87ae92ea17
# TIMESTAMP: 2026-10-26T07:37:00.000Z
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

## REFUTATION MATRIX & AUDIT OF PASS G1

### Falsification 1: L03 Cost Monotonicity Under Incomplete Ancillary Data
- *Deficit in G1*: Pass G1 proposed basic monotonic sorting in `dealComparison.ts`, but failed to define deterministic behavior when two flights share the same base price and both lack baggage fee declarations.
- *Falsification & Falsification Vector*: Without an explicit secondary and tertiary tie-breaking mechanism (e.g., departing timestamp, carrier reliability tier, or duration), sorting results fluctuate non-deterministically across re-renders, causing visual jitter in the UI comparison table.
- *Correction in G2*: In `src/app/domain/dealComparison.ts`, specify strict deterministic ordering: primary by `totalCost ?? ticketPrice`, secondary by `durationMinutes ?? 9999`, and tertiary by `id`.

### Falsification 2: L05 Provider Query Advisory Throttling Boundary
- *Deficit in G1*: Pass G1 outlined advisory limits in `providerRights.ts`, but omitted execution-level rejection if a client caller queries an unregistered or unentitled route without fallback handling.
- *Falsification & Falsification Vector*: An unhandled exception during route lookup can crash background feed aggregators when an upstream service sends an experimental carrier code.
- *Correction in G2*: In `src/domain/farely/providerRights.ts`, define safe default capabilities (`canDisplayDirectly: false`, `cacheTtlSeconds: 300`) for unknown provider identifiers rather than throwing fatal runtime exceptions.

### Falsification 3: L06 PWA Offline Cache Boundary & Eviction Monotonicity
- *Deficit in G1*: Pass G1 declared a 14-day eviction rule, but did not define handling for malformed or unparseable `observedAt` / `cachedAt` ISO strings.
- *Falsification & Falsification Vector*: If IndexedDB contains corrupted timestamps (`Invalid Date`), `new Date(deal.cachedAt).getTime()` evaluates to `NaN`, causing timestamp comparison `now - NaN` to evaluate to `NaN` and bypassing eviction logic entirely.
- *Correction in G2*: In `src/domain/farely/pwaOfflineFreshness.ts`, parse timestamps with fallback to current epoch if `Number.isNaN(cachedTime)` occurs, guaranteeing immediate eviction of corrupt records.

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

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX (G2 AST BLUEPRINTS)

### L01: Product Truth & Founder Scope Integrity
In `src/domain/farely/providerRights.ts`, ensure provider definitions strictly reflect verification boundaries without admitting prohibited merchant booking execution features.

### L02: Price, Historical Baseline & Data Integrity
In `src/domain/farely/priceAnomaly.ts`, verify that `isTetDeparture()` properly handles UTC vs local ICT offsets to avoid shifting midnight departures into non-Tet status.

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
In `src/app/domain/dealComparison.ts`, ensure that comparisons rank dominant offers with strictly lower total landed cost higher, while preserving explicit null disclosures.

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
`supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` guarantees that all watch evaluations enforce `auth.uid() = user_id` row-level tenancy.

### L05: Provider Drift, Circuit Breakers & Kill Switches
`src/domain/farely/providerCapabilities.ts` registers fallback rate-limiting windows and default quotas to safeguard downstream services against runaway concurrency.

### L06: Freshness, Stale Degradation & UX Honesty
`src/domain/farely/pwaOfflineFreshness.ts` enforces `evictExpiredOfflineDeals` with explicit temporal filtering and Vietnamese warning banners on `src/app/pages/DealsPage.tsx`.

### L07: Observability, Secret Scrubbing & Error Boundaries
`src/app/lib/analytics.ts` uses recursive depth traversal with object identity tracking to sanitize diagnostic reports without circular crash vectors.

### L08: Database Architecture, Schema Drift & Migration Provenance
`scripts/verify-certification-integrity.node-test.mjs` asserts migration immutability across 47 schema revisions.

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
`src/domain/farely/productionSmokeTruth.ts` documents that local verification represents C1 code proof, leaving production deployment verification to live C3 smoke jobs.

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
`scripts/acceptance-anti-shrinkage.node-test.mjs` tests all 267 gates against regression.

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
`scripts/convergence/transactional-task-manager.mjs` encapsulates state transitions within explicit transactional rollback frames.

### L12: Zero-Trust Release & Remote Git Synchronization
`scripts/convergence/watchdog-convergence.mjs` verifies that every committed artifact matches upstream git tracking branches.

---

## AST MUTATION SPECIFICATIONS FOR CYCLE G72

### WP01: AST BLUEPRINT FOR `src/domain/farely/providerRights.ts`
```typescript
// AST Addition: Safe default rights and scope query validator
export function getSafeProviderRights(providerId: string): ProviderSourceRights {
  const existing = PROVIDER_SOURCE_RIGHTS_REGISTRY[providerId];
  if (existing) return existing;
  return {
    providerId,
    sourceName: `Unknown Provider (${providerId})`,
    licenseType: 'RESTRICTED',
    declarationStatus: 'INTERNAL_DECLARATION',
    canScrape: false,
    canDisplayDirectly: false,
    canCache: false,
    cacheTtlSeconds: 0,
    canRedistributeB2B: false,
    canMonetizeAffiliate: false,
    attributionRequired: true,
    termsSummary: 'Unregistered source; strictly denied for external display or distribution.',
    authorizedScopes: [],
  };
}

export function isProviderQueryPermitted(providerId: string, scope: AuthorizedDataScope): boolean {
  const rights = getSafeProviderRights(providerId);
  return rights.authorizedScopes.includes(scope);
}
```

### WP02: AST BLUEPRINT FOR `src/domain/farely/pwaOfflineFreshness.ts`
```typescript
// AST Addition: 14-day eviction filter with corrupted timestamp safety
export const MAX_OFFLINE_CACHE_AGE_MINUTES = 20160; // 14 days = 14 * 24 * 60

export function evictExpiredOfflineDeals(
  cachedDeals: CachedDealRecord[],
  maxAgeMinutes: number = MAX_OFFLINE_CACHE_AGE_MINUTES,
  nowIsoString: string = new Date().toISOString()
): CachedDealRecord[] {
  const nowMs = new Date(nowIsoString).getTime();
  return cachedDeals.filter((deal) => {
    const cachedTime = new Date(deal.cachedAt).getTime();
    if (Number.isNaN(cachedTime)) return false; // Corrupt timestamp evicted immediately
    const stalenessMinutes = (nowMs - cachedTime) / (60 * 1000);
    return stalenessMinutes <= maxAgeMinutes;
  });
}
```

### WP03: AST BLUEPRINT FOR `src/app/domain/dealComparison.ts`
```typescript
// AST Modification: Monotonic tie-breaking in compareDeals
export function sortComparisonRowsMonotonically(rows: DealComparisonRow[]): DealComparisonRow[] {
  return [...rows].sort((a, b) => {
    const costA = a.totalCost ?? a.ticketPrice;
    const costB = b.totalCost ?? b.ticketPrice;
    if (costA !== costB) return costA - costB;

    const durA = a.durationMinutes ?? 9999;
    const durB = b.durationMinutes ?? 9999;
    if (durA !== durB) return durA - durB;

    return a.id.localeCompare(b.id);
  });
}
```
