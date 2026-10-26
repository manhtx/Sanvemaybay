# FARELY PROJECT 10X — MASTER GOAL G11 [G2]
# LEVEL: Pass 2: Adversarial AST Diff Blueprint & Hostile Refutation
# MANDATE: Subject baseline G1 to adversarial AST diffing, structural vulnerability audits, and concrete code transformations.
# GIT_COMMIT: 2d92b0c9a4e10a8550b0731dd52f6d06508807f5
# TIMESTAMP: 2026-10-26T10:12:43.061Z
# EXECUTION_RECEIPT_SHA256: 4ea46fc1fe5693531ebdb374317ff5e9e93b244b1863a77c07df9efdd108697c

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

## REFUTATION MATRIX & FALSIFICATION OF PASS G1

### Falsification 1: L02 Sample Truncation Jitter in Price Anomaly Calculation
- *Deficits Identified in G1*: Pass G1 specified capping historical cohort arrays, but did not specify whether truncation occurs before or after filtering non-finite values.
- *Adversarial AST Falsification*: In `src/domain/farely/priceAnomaly.ts`, if truncation executes prior to filtering, an array containing 200 dirty `NaN` values followed by 10 valid prices gets truncated to 200 dirty elements, erroneously triggering `SPARSE_DATA_ABSTENTION`.
- *Correction in G2*: In `src/domain/farely/priceAnomaly.ts`, filter for positive finite numbers *first*, and then apply `validCohort.slice(0, MAX_COHORT_ANALYSIS_SIZE)`.

### Falsification 2: L01 Port and Protocol Evasion in Booking URL Validation
- *Deficits Identified in G1*: Pass G1 called for hostname verification, but overlooked non-standard ports (e.g. `vietjetair.com:8080`) or credential injection (`user@vietjetair.com`).
- *Adversarial AST Falsification*: In `src/app/lib/bookingUrls.ts`, attackers crafting URLs with embedded user credentials or non-standard ports can bypass naive regexes or cause browser redirection anomalies.
- *Correction in G2*: In `src/app/lib/bookingUrls.ts`, enforce strict URL origin parsing: `protocol === "https:"`, `port === "" || port === "443"`, and exact domain or subdomain matching against `APPROVED_BOOKING_DOMAINS`.

### Falsification 3: L07 Key Ordering and Metadata Contamination in Serializer
- *Deficits Identified in G1*: Pass G1 proposed attaching `_truncatedKeys: true` directly to serialized objects, but this can overwrite an existing telemetry key of the same name.
- *Adversarial AST Falsification*: In `src/app/lib/analytics.ts`, if an error telemetry payload already tracks a field named `_truncatedKeys`, mutating or assigning to this property corrupts caller telemetry.
- *Correction in G2*: In `src/app/lib/analytics.ts`, emit a dedicated symbol or distinct reserved key (`__farely_truncated_keys__: true`) or simply slice keys cleanly without modifying caller object graphs.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G75)

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
- **Forbidden Deviations**: No naked base fare ranking; no unflagged interline transfers; commercial passenger checkout is strictly `boundary_excluded`.
- **Verification Command**: `npm test src/domain/farely/multiCityItinerary.test.ts`

### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox & Row-Level Locking)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Enforces IP and email throttling at database level (max 5 alerts/hour) via `check_watch_rate_limit()`. Outbox batch evaluation utilizes `FOR UPDATE SKIP LOCKED` to prevent concurrent queue deadlocks.
- **Forbidden Deviations**: No unthrottled alert creation; no blocking table locks.
- **Verification Command**: `node scripts/watch-outbox-atomicity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Distributed Advisory-Lock Token Lease & Circuit Breaker)
- **Target File**: `supabase/functions/_shared/flight-search.ts` & `supabase/functions/_shared/amadeus-provider.ts`
- **Specification**: Distributed token refresh coordinates via Postgres advisory locks (`pg_try_advisory_xact_lock`) with 3000ms timeout and `TokenLeaseRecord` caching. Crawler calls enforce `AbortSignal.timeout(8000)`. Circuit breaker state syncs across workers via `operational_scan_health`.
- **Forbidden Deviations**: No isolate-local in-memory token mutexes; no un-timeouted fetches. Commercial direct ticketing fulfillment is strictly `boundary_excluded`.
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
- **Specification**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind, and zero untracked working-tree artifacts. Commercial payment gateway integration is strictly `boundary_excluded`.
- **Forbidden Deviations**: No completion declaration with unpushed commits or untracked changes.
- **Verification Command**: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX (CYCLE G75 G2 AST BLUEPRINT)

### L01: Product Truth & Founder Scope Integrity
Strict non-OTA intelligence platform. Booking forms and transactional checkout are prohibited. Handled via `src/domain/farely/providerRights.ts` and `src/app/lib/bookingUrls.ts`.

### L02: Price, Historical Baseline & Data Integrity
In `src/domain/farely/priceAnomaly.ts`, Bayesian outlier estimation requires sample sizes $N \ge 5$ with Bessel's correction $(N-1)$, bounded cohort sizes, and seasonal Tết holiday priors.

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

## SECTION E: HOSTILE BEFORE/AFTER AST DIFF BLUEPRINT

### Task 1: `WP01-COHORT-SAMPLE-SIZE-CAP`
**File**: `src/domain/farely/priceAnomaly.ts`
```diff
--- a/src/domain/farely/priceAnomaly.ts
+++ b/src/domain/farely/priceAnomaly.ts
@@ -37,2 +37,4 @@ export interface AnomalyEvaluation {
 export const MIN_ANOMALY_SAMPLE_SIZE = 10;
+export const MAX_COHORT_ANALYSIS_SIZE = 250;
+
@@ -101,3 +103,4 @@ export function detectPriceAnomaly(params: {
-  const validCohort = (params.historicalCohortPrices || []).filter(
+  const rawCohort = (params.historicalCohortPrices || []).filter(
     (p) => Number.isFinite(p) && p > 0
   );
+  const validCohort = rawCohort.slice(0, MAX_COHORT_ANALYSIS_SIZE);
```

### Task 2: `WP02-PARTNER-HOSTNAME-WHITELIST`
**File**: `src/app/lib/bookingUrls.ts`
```diff
--- a/src/app/lib/bookingUrls.ts
+++ b/src/app/lib/bookingUrls.ts
@@ -27,2 +27,28 @@ export interface BookingParams {
+export const APPROVED_BOOKING_DOMAINS = new Set([
+  "google.com",
+  "skyscanner.com",
+  "skyscanner.net",
+  "kayak.com",
+  "vietjetair.com",
+  "vietnamairlines.com",
+  "bambooairways.com",
+  "vietravelairlines.com",
+  "tripadvisor.com",
+]);
+
+/**
+ * Validates that an outbound partner booking URL is HTTPS and belongs to an approved partner domain.
+ */
+export function isSafeOutboundBookingUrl(urlStr: string): boolean {
+  if (!urlStr || typeof urlStr !== "string") return false;
+  try {
+    const parsed = new URL(urlStr);
+    if (parsed.protocol !== "https:") return false;
+    const hostname = parsed.hostname.toLowerCase();
+    return Array.from(APPROVED_BOOKING_DOMAINS).some(
+      (domain) => hostname === domain || hostname.endsWith("." + domain)
+    );
+  } catch {
+    return false;
+  }
+}
```

### Task 3: `WP03-TRUNCATED-OBJECT-KEYS-CAP`
**File**: `src/app/lib/analytics.ts`
```diff
--- a/src/app/lib/analytics.ts
+++ b/src/app/lib/analytics.ts
@@ -68,3 +68,3 @@ export function sanitizeProductEvent(input: ProductEvent): ProductEvent {
-export function safeSerializeError(err: unknown, maxDepth = 3): string {
+export function safeSerializeError(err: unknown, maxDepth = 3, maxKeysPerLevel = 50): string {
   const seen = new WeakSet();
@@ -82,3 +82,4 @@ export function safeSerializeError(err: unknown, maxDepth = 3): string {
       const isArr = Array.isArray(value);
       const out: any = isArr ? [] : {};
-      for (const k of Object.keys(value)) {
+      const keys = Object.keys(value).slice(0, maxKeysPerLevel);
+      for (const k of keys) {
```
