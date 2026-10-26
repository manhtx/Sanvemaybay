# FARELY PROJECT 10X — MASTER GOAL G11 [G2]
# LEVEL: Pass 2: Adversarial AST Diff Blueprint & Hostile Refutation
# MANDATE: Subject baseline G1 to adversarial AST diffing, structural vulnerability audits, and concrete code transformations.
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

## REFUTATION MATRIX & FALSIFICATION OF PASS G1

### Falsification 1: L02 Floating-Point Epsilon Failure in Zero-Variance Anomaly Checks
- *Deficits Identified in G1*: Pass G1 specified checking for zero dispersion using exact equality (`stdDev === 0` or `mad === 0`), but overlooked IEEE 754 floating-point inaccuracies in calculation.
- *Adversarial AST Falsification*: If historical prices differ by trivial floating-point noise (e.g. 1e-14), `rawMad === 0` evaluates false, triggering standard z-score evaluation that emits absurd scores ($Z > 10^{12}$).
- *Correction in G2*: In `src/domain/farely/priceAnomaly.ts`, apply an epsilon threshold: if `rawMad < 1e-6` or `sampleVariance < 1e-6`, classify immediately as `INSUFFICIENT_DISPERSION_ABSTENTION`.

### Falsification 2: L03 Open-Jaw Surface Ground Buffer Without Metro Differentiation
- *Deficits Identified in G1*: Pass G1 checked general open-jaw segments but did not differentiate between same-airport surface connections and cross-metropolitan inter-airport transfers.
- *Adversarial AST Falsification*: In `src/domain/farely/multiCityItinerary.ts`, transit between different terminals at SGN is not an inter-airport transfer, while transit between HND and NRT requires traveling across greater Tokyo.
- *Correction in G2*: In `src/domain/farely/multiCityItinerary.ts`, gate transit buffer enforcement explicitly on `isMetropolitanAirportChange(prev.destinationCode, current.originCode)`.

### Falsification 3: L07 WeakSet Garbage Collector Memory Retention in Serializer
- *Deficits Identified in G1*: Pass G1 proposed capping depth in `safeSerializeError`, but failed to specify how primitive wrappers (e.g. `Object(42)`) or prototype chains affect depth calculation.
- *Adversarial AST Falsification*: In `src/app/lib/analytics.ts`, if depth is not decremented upon returning from subtree recursion or if cycle detection doesn't track path ancestry, branch siblings get erroneously marked as circular.
- *Correction in G2*: In `src/app/lib/analytics.ts`, implement a clean path-depth tracker that correctly scopes depth to the current branch.

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

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX (G2 AST REFUTATION)

### L01: Product Truth & Founder Scope Integrity
Strict non-OTA flight opportunity intelligence platform. `src/domain/farely/providerRights.ts` enforces boundaries against booking stubs.

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

## SECTION E: HOSTILE BEFORE/AFTER AST DIFF BLUEPRINT

### Task 1: `WP01-SAFE-ANALYTICS-DEPTH-GUARD`
**File**: `src/app/lib/analytics.ts`
```diff
--- a/src/app/lib/analytics.ts
+++ b/src/app/lib/analytics.ts
@@ -68,14 +68,26 @@ export function sanitizeProductEvent(input: ProductEvent): ProductEvent {
 export function safeSerializeError(err: unknown, maxDepth = 3): string {
   const seen = new WeakSet();
+  function replacer(this: any, key: string, value: any, depth = 0): any {
+    if (typeof value === "string" && value.length > 1000) {
+      return value.slice(0, 1000) + "...[TRUNCATED]";
+    }
+    if (typeof value === "object" && value !== null) {
+      if (seen.has(value)) {
+        return "[Circular]";
+      }
+      if (depth >= maxDepth) {
+        return "[MaxDepthExceeded]";
+      }
+      seen.add(value);
+      const out: Record<string, any> = Array.isArray(value) ? [] : {};
+      for (const k of Object.keys(value)) {
+        out[k] = replacer.call(out, k, value[k], depth + 1);
+      }
+      return out;
+    }
+    return value;
+  }
   try {
-    return JSON.stringify(err, (key, value) => {
-      if (typeof value === "string" && value.length > 1000) {
-        return value.slice(0, 1000) + "...[TRUNCATED]";
-      }
-      if (typeof value === "object" && value !== null) {
-        if (seen.has(value)) {
-          return "[Circular]";
-        }
-        seen.add(value);
-      }
-      return value;
-    });
+    return JSON.stringify(replacer.call({ "": err }, "", err, 0));
   } catch {
     return JSON.stringify({ message: String(err) });
   }
```

### Task 2: `WP02-METRO-MINIMUM-TRANSIT-BUFFER`
**File**: `src/domain/farely/multiCityItinerary.ts`
```diff
--- a/src/domain/farely/multiCityItinerary.ts
+++ b/src/domain/farely/multiCityItinerary.ts
@@ -160,2 +160,9 @@ export function isMetropolitanAirportChange(fromAirport: string, toAirport: stri
   return METROPOLITAN_AIRPORT_PAIRS.has(key);
 }
+
+/**
+ * Returns required ground transit buffer in minutes for inter-airport metropolitan transfers.
+ */
+export function getMetropolitanMinimumTransitMinutes(fromAirport: string, toAirport: string): number {
+  return isMetropolitanAirportChange(fromAirport, toAirport) ? 210 : 0;
+}
```

### Task 3: `WP03-ZERO-DISPERSION-ABSTENTION`
**File**: `src/domain/farely/priceAnomaly.ts`
```diff
--- a/src/domain/farely/priceAnomaly.ts
+++ b/src/domain/farely/priceAnomaly.ts
@@ -139,2 +139,16 @@ export function detectPriceAnomaly(params: {
   // AUD-12: If the historical cohort is homogeneous (rawMad === 0), there is zero empirical dispersion.
+  if (rawMad < 1e-6) {
+    return {
+      classification: "INSUFFICIENT_DISPERSION_ABSTENTION",
+      sampleSize: validCohort.length,
+      medianPrice: median,
+      mad: 0,
+      modifiedZScore: 0,
+      discountVsMedianPercent: 0,
+      isActionableDeal: false,
+      explanationVi: "Độ phân tán giá quan sát bằng 0 (tất cả các mức giá lịch sử đều giống nhau). Hệ thống từ chối đánh giá bất thường.",
+      cohortScope,
+    };
+  }
```
