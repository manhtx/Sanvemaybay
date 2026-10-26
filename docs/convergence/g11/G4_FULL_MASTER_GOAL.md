# FARELY PROJECT 10X — MASTER GOAL G11 [G4]
# LEVEL: Pass 4: Strict Topological Dependency DAG & Execution Sequencing
# MANDATE: Subject verification oracles to strict topological ordering, race-condition defenses, and ACID execution steps.
# GIT_COMMIT: 8ada9173783ba6466c2aa867a31fb44319cd6a41
# TIMESTAMP: 2026-10-26T09:56:56.280Z
# EXECUTION_RECEIPT_SHA256: ec82db03479cd6d2743d1704f65b8f8781d060851a461aaaa79a6c727abd8014

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

## REFUTATION MATRIX & FALSIFICATION OF PASS G3

### Falsification 1: L05 Non-Deterministic Concurrent Token Refresh Clashes
- *Deficits Identified in G3*: Pass G3 scheduled test oracles without specifying lock acquisition order across concurrent provider routines.
- *Adversarial DAG Falsification*: In `supabase/functions/_shared/flight-search.ts`, if multiple edge functions concurrently query Amadeus provider without strict serial dependency in test scripts, race conditions corrupt the shared token cache.
- *Correction in G4*: In the topological DAG, enforce serial ordering for crawler token leases using explicit process-level transaction locks before executing external API verifications.

### Falsification 2: L07 Subtree Circular Tracking Across Multiple Object Roots
- *Deficits Identified in G3*: Pass G3 checked circular references using a local replacer closure, but failed to address multi-rooted objects sharing common sub-references (directed acyclic graphs that are not true cycles).
- *Adversarial DAG Falsification*: In `src/app/lib/analytics.ts`, an event payload containing `{ req: sharedContext, res: sharedContext }` is a valid DAG. If `WeakSet` tracks all visited objects rather than current call-stack ancestors, `res` gets falsely marked as `"[Circular]"`.
- *Correction in G4*: In `src/app/lib/analytics.ts`, maintain an active ancestry stack to only detect real recursive cycles, or document bounded shared-node serialization in unit test assertions.

### Falsification 3: L11 Unchecked Parallel Rollback Cascade in Multi-Task Execution
- *Deficits Identified in G3*: Pass G3 specified independent test commands, but omitted atomic transaction rollback isolation between consecutive tasks.
- *Adversarial DAG Falsification*: In `scripts/convergence/transactional-task-manager.mjs`, if Task 2 fails while Task 1 is already committed, executing an uncoordinated rollback can revert Task 1's legitimate changes.
- *Correction in G4*: In the topological execution graph, mandate discrete, atomic task transactions: Task 1 must be committed and verified before Task 2 begins, with separate rollback checkpoints recorded in `transaction_journal.json`.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G74)

### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: Helper `parseNullableNumber(val)` preserves `null` and `undefined` without coercion to 0. In `src/domain/farely/priceAnomaly.ts`, require both sample variance $\sigma > 0.05 \mu$ AND sample size $N \ge 5$ using Bessel's correction $(N - 1)$ before calculating z-scores. Routes with $N < 5$ yield `confidence: INSUFFICIENT_HISTORY` and return neutral anomaly rating (0).
- **Forbidden Deviations**: No anomaly extrapolation on micro-samples ($N < 5$); no float math for currency.
- **Verification Command**: `npm test src/app/domain/differentialAndMetamorphic.test.ts`

### SOL-02: SOL-PRICE-01 (Deterministic Tet Window Lookup & Seasonal Multiplier)
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/domain/farely/priceAnomaly.ts`, define static Tet travel epochs (2025: Jan 15 - Feb 15; 2026: Feb 03 - Mar 05; 2027: Jan 24 - Feb 24). Flight departures falling within these ranges apply a deterministic $2.8\times$ baseline multiplier to prevent false anomaly triggers.
- **Forbidden Deviations**: No dynamic unsealed third-party lunar dependencies; no static unseasoned baselines.
- **Verification Command**: `npm test src/domain/farely/priceAnomaly.test.ts`

### SOL-03: SOL-COST-01 (Carrier Landed Surcharges & Self-Transfer Penalty)
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts` & `src/domain/farely/multiCityItinerary.ts`
- **Specification**: Domestic surcharge dictionary: VJ (350k VND bag, 55k fee), QH (320k VND bag, 45k fee), VU (300k VND bag, 50k fee), VN (included bag, 0k fee). Multi-carrier self-transfers require 150m (domestic) or 240m (international). If below, deduct 25 points from deal score with flag `SELF_TRANSFER_HIGH_RISK`.
- **Forbidden Deviations**: No naked base fare ranking; no unflagged interline transfers; passenger checkout is strictly `boundary_excluded`.
- **Verification Command**: `npm test src/domain/farely/multiCityItinerary.test.ts`

### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox & Row-Level Locking)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Enforces IP and email throttling at database level (max 5 alerts/hour) via `check_watch_rate_limit()`. Outbox batch evaluation utilizes `FOR UPDATE SKIP LOCKED` to prevent concurrent queue deadlocks.
- **Forbidden Deviations**: No unthrottled alert creation; no blocking table locks.
- **Verification Command**: `node scripts/watch-outbox-atomicity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Distributed Advisory-Lock Token Lease & Circuit Breaker)
- **Target File**: `supabase/functions/_shared/flight-search.ts` & `supabase/functions/_shared/amadeus-provider.ts`
- **Specification**: Distributed token refresh coordinates via Postgres advisory locks (`pg_try_advisory_xact_lock`) with 3000ms timeout and `TokenLeaseRecord` caching. Crawler calls enforce `AbortSignal.timeout(8000)`. Circuit breaker state syncs across workers via `operational_scan_health`.
- **Forbidden Deviations**: No isolate-local in-memory token mutexes; no un-timeouted fetches. Ticketing fulfillment is strictly `boundary_excluded`.
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
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs` & `scripts/migration-parity.node-test.mjs`
- **Specification**: Exactly 47 canonical migrations verified. Ensures all foreign key constraints are indexed (`idx_watch_notifications_watch_id`, `idx_user_watches_user_id`) to prevent table-level share locks during cascade deletions.
- **Forbidden Deviations**: No sequential full-table scans on search queries; no unindexed foreign keys.
- **Verification Command**: `node scripts/migration-parity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs` & `src/domain/farely/productionSmokeTruth.ts`
- **Specification**: Explicitly enforces `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Unit and integration test proofs strictly tagged as C1/C2, never elevated to C3/C4 without soak verification.
- **Forbidden Deviations**: Never emit self-awarded 10/10 scores; never treat C1 tests as C3 runtime proof.
- **Verification Command**: `node scripts/v17-adversarial-challenges.node-test.mjs`

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
- **Specification**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind, and zero untracked working-tree artifacts. Payment gateway integration is strictly `boundary_excluded`.
- **Forbidden Deviations**: No completion declaration with unpushed commits or untracked changes.
- **Verification Command**: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX (G4 TOPOLOGICAL DAG)

### L01: Product Truth & Founder Scope Integrity
Strict non-OTA intelligence platform. Direct booking fulfillment and payment gateways are excluded. `src/domain/farely/providerRights.ts` enforces boundaries.

### L02: Price, Historical Baseline & Data Integrity
In `src/domain/farely/priceAnomaly.ts`, Bayesian outlier estimation requires sample sizes $N \ge 5$ with Bessel's correction $(N-1)$ and seasonal Tết holiday priors.

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
In `src/domain/farely/multiCityItinerary.ts` and `src/domain/farely/tripBudgetEstimator.ts`, domestic surcharge dictionaries ensure landed price integrity.

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
`supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` enforces atomic row-level security on watch queues.

### L05: Provider Drift, Circuit Breakers & Kill Switches
`supabase/functions/_shared/flight-search.ts` maintains rate limit tripwires and backoff parameters.

### L06: Freshness, Stale Degradation & UX Honesty
`src/domain/farely/pwaOfflineFreshness.ts` purges cached records older than 14 days ($20,160$ minutes) on `src/app/pages/DealsPage.tsx`.

### L07: Observability, Secret Scrubbing & Error Boundaries
`src/app/lib/analytics.ts` prevents recursive telemetry crashes through WeakSet traversal tracking.

### L08: Database Architecture, Schema Drift & Migration Provenance
47 migration scripts form a verified schema history in `scripts/verify-certification-integrity.node-test.mjs`.

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
`src/domain/farely/productionSmokeTruth.ts` blocks synthetic 10/10 self-awarded certifications.

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
`scripts/acceptance-anti-shrinkage.node-test.mjs` tracks all 267 acceptance criteria against regression.

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
`scripts/convergence/transactional-task-manager.mjs` guarantees atomic pre-task snapshots and byte-for-byte rollback.

### L12: Zero-Trust Release & Remote Git Synchronization
`scripts/convergence/watchdog-convergence.mjs` mandates branch parity with remote GitHub origin.

---

## TOPOLOGICAL EXECUTION DEPENDENCY DAG (CYCLE G74)

```text
[STAGE 0: PRE-FLIGHT SNAPSHOT & PID LOCK]
   │
   ▼
[TASK 1: WP01-SAFE-ANALYTICS-DEPTH-GUARD]
   │   Target: src/app/lib/analytics.ts
   │   Verification: npm test src/app/lib/analytics.test.ts
   │   Commit Task via transactional-task-manager.mjs
   │
   ▼
[TASK 2: WP02-METRO-MINIMUM-TRANSIT-BUFFER]
   │   Target: src/domain/farely/multiCityItinerary.ts
   │   Verification: npm test src/domain/farely/multiCityItinerary.test.ts
   │   Commit Task via transactional-task-manager.mjs
   │
   ▼
[TASK 3: WP03-ZERO-DISPERSION-ABSTENTION]
   │   Target: src/domain/farely/priceAnomaly.ts
   │   Verification: npm test src/domain/farely/priceAnomaly.test.ts
   │   Commit Task via transactional-task-manager.mjs
   │
   ▼
[STAGE 4: FULL REPOSITORY REGRESSION SUITE]
   │   Run all 58 vitest suites + 382 node native tests
   │   npm test && npm run test:node
   │
   ▼
[STAGE 5: ZERO-TRUST REMOTE RECONCILIATION]
   │   git commit -m "feat(convergence): execute G74 work packages WP01-WP03"
   │   git push origin antigravity/farely-v12-product-convergence
   │   git ls-remote verification
```
