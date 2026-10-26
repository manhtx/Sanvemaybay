# FARELY PROJECT 10X — RESEARCH R10 [R4]
# LEVEL: Pass 4: Production SRE Rigor & Zero-Mock Verification
# MANDATE: Assume Pass 3 relied on mock safety across all 12 lenses. Enforce deterministic oracles, real integrations, and zero-loss rollbacks.
# GIT_COMMIT: 5bb4d0b020e727e4b7cd779d2d5aeeaf7ecaf62a
# TIMESTAMP: 2026-10-26T11:13:00.000Z
# EXECUTION_RECEIPT_SHA256: 1f5b48e7ace6b05c6cff63384090800bc1bb014741e493e5cecc127f3797f671

---

## SECTION II: INVARIANT EXECUTOR CAGE
```text
INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
The executor is strictly bound to the locked technical solutions detailed in Section D & E.
The executor is FORBIDDEN from inventing new architectures, introducing alternative algorithms,
changing database schemas, or deviating from the specified file/function diffs.
Any deviation is a critical contract breach and will be rejected closed by the Evidence Admission Controller.
```

---

## SECTION III: PRODUCTION SRE FALSIFICATION & AUDIT OF PASS R3

### Falsification 1: L01 Departure Date Formatting Glitch in Skyscanner YYMMDD Transform
- *Deficits Identified in Pass R3*: Pass R3 clamped passenger counts, but assumed `p.departDate` is always formatted with standard hyphens (`YYYY-MM-DD`).
- *Empirical Code Evidence*: In `src/app/lib/bookingUrls.ts`:
  ```typescript
  function toSkyDate(date: string): string {
    return date.replace(/-/g, '').slice(2);
  }
  ```
  If an upstream provider or URL query string supplies an alternative date representation like `"2026/11/05"` or `"2026.11.05"`, `date.replace(/-/g, '')` does nothing. The resulting string passed to Skyscanner becomes `26/11/05`, which produces a malformed nested route parameter on Skyscanner's CDN, returning HTTP 404.
- *Locked Invariant for Pass R4*:
  In `src/app/lib/bookingUrls.ts`, enforce strict regex stripping:
  ```typescript
  function toSkyDate(date: string): string {
    const clean = (date || '').replace(/\D/g, ''); // Extract purely numeric digits YYYYMMDD
    if (clean.length >= 8) {
      return clean.slice(2, 8); // YYMMDD
    }
    return clean;
  }
  ```
  Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 Fractional VND Currency Anomalies in Scan Unit Economics
- *Deficits Identified in Pass R3*: Pass R3 clamped input parameters, but overlooked IEEE-754 fractional VND floating point values in `calculateUnitEconomics` and `evaluateScanExpansionProposal`.
- *Empirical Code Evidence*: In `src/domain/farely/dataEconomics.ts`, `expectedNewOpps = proposal.additionalScopesCount * (proposal.historicalOpportunityYieldPercent / 100)`. When multiplying fractional yield by opportunity value, `estimatedMarginalValueVnd` can evaluate to `123456.7891234`. VND is a non-fractional zero-decimal currency; downstream database columns and ledger reporting require whole integer VND.
- *Locked Invariant for Pass R4*:
  In `src/domain/farely/dataEconomics.ts`, round all VND financial valuations to whole integers:
  ```typescript
  const estimatedMarginalValueVnd = Math.round(
    safeSubscribers * alertValue + expectedNewOpps * opportunityValue
  );
  ```

### Falsification 3: L03 Stagnant Flat Cohort Zero Percentile False Positive
- *Deficits Identified in Pass R3*: Pass R3 sanitized evaluation dates, but still failed to prevent the flat-price zero-percentile false positive.
- *Empirical Code Evidence*: In `src/domain/farely/buyWaitGuidance.ts`:
  ```typescript
  const countBelow = prices.filter((p) => p < currentPrice).length;
  const percentile = Math.round((countBelow / prices.length) * 100);
  ```
  If an airline route has static government price-capping or fixed charter pricing where all 14 observations are identical (e.g., 2,000,000 VND), `countBelow` is 0, so `percentile` is 0. Condition `if (percentile <= 5)` triggers, telling users "Mức giá hiện tại nằm trong top 5% thấp nhất toàn chu kỳ quan sát (thấp hơn 100% số mẫu). Khuyến nghị mua ngay!" This is completely false because the price has never moved.
- *Locked Invariant for Pass R4*:
  In `src/domain/farely/buyWaitGuidance.ts`, check price dispersion:
  ```typescript
  const isFlatPrice = prices[0] === prices[prices.length - 1];
  if (isFlatPrice) {
    return {
      recommendation: "WAIT_AND_WATCH",
      confidence: 0.5,
      isCalibrated: false,
      sampleCount: validPoints.length,
      timespanDays,
      cohortPercentile: 50,
      historicalMin: minPrice,
      historicalMedian: medianPrice,
      rationaleVi: "Giá vé duy trì cố định không biến động trong suốt chu kỳ quan sát. Không có tín hiệu giảm giá sâu.",
      scopeType,
    };
  }
  ```
  Commercial payment gateway integration is strictly `boundary_excluded`.

---

## SECTION IV: 12 ADVERSARIAL LENSES DEEP AUDIT (CYCLE G79)

### L01: Data Ingestion & Live Schema Integrity
- **Current Ground Truth**: `src/app/data/api.ts` provides nullable parsing. In `src/app/lib/bookingUrls.ts`, outbound partner search URLs are built for Google Flights and Skyscanner.
- **SRE Resilience Stress Test**: Verifying zero unhandled exceptions when date format contains invalid separators or unexpected ISO datetime fragments.
- **Defensive Target**: Standardize date formatting with purely numeric digit extraction (`replace(/\D/g, '')`).

### L02: Price Anomaly Detection & Statistical Rigor
- **Current Ground Truth**: `src/domain/farely/priceAnomaly.ts` implements MAD baselines and Lunar Tet suppression windows. In `src/domain/farely/dataEconomics.ts`, scan unit economics are evaluated.
- **SRE Resilience Stress Test**: Verifying integer precision across all VND calculations to prevent floating-point rounding drifts.
- **Defensive Target**: Round all VND financial outputs using `Math.round(...)`.

### L03: True Landed Cost Monotonicity & Ancillary Transparency
- **Current Ground Truth**: `src/domain/farely/tripBudgetEstimator.ts` scales ancillaries. In `src/domain/farely/buyWaitGuidance.ts`, buy/wait recommendations are calculated.
- **SRE Resilience Stress Test**: Zero-dispersion historical datasets must not trigger high-confidence buy recommendations.
- **Defensive Target**: Add `isFlatPrice` guard returning neutral `WAIT_AND_WATCH` with 50% confidence.

### L04: Authentication, Access Control & Anti-Abuse
- **Current Ground Truth**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` enforces tokenized watch creation, rate limiting (`check_watch_rate_limit`), and row-level locking (`FOR UPDATE SKIP LOCKED`).
- **SRE Resilience Stress Test**: Rate limit bucket exhaustion returns HTTP 429 with Retry-After headers rather than leaking database connection pools.
- **Defensive Target**: Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### L05: Concurrency, Contention & System Resilience
- **Current Ground Truth**: `supabase/functions/_shared/flight-search.ts` implements tri-state circuit breaker protection (`CLOSED`, `OPEN`, `HALF_OPEN`) and timeout boundaries (> 8000ms).
- **SRE Resilience Stress Test**: Verifying circuit state transitions under 100 concurrent mock failures.
- **Defensive Target**: Fail fast to cached snapshot tables with zero process crashes.

### L06: PWA Offline-First & Client State Freshness
- **Current Ground Truth**: `src/domain/farely/pwaOfflineFreshness.ts` enforces 14-day LRU cache eviction and price non-negativity checks. Monotonic sorting is enforced in `src/app/pages/DealsPage.tsx`.
- **SRE Resilience Stress Test**: Local IndexedDB / ServiceWorker quota pressure must not block read access to existing cached deals.
- **Defensive Target**: Maintain strict local cache bounds without exceeding browser storage quotas.

### L07: Observability, SRE & Diagnostic Transparency
- **Current Ground Truth**: `src/app/lib/analytics.ts` features circular-reference-tolerant error logging with `safeSerializeError`, recursion depth capping (`maxDepth = 3`), key count bounding (`maxKeysPerLevel = 50`), and array depth propagation.
- **SRE Resilience Stress Test**: Heavy recursive payloads exceeding depth 3 terminate cleanly with `[MaxDepthExceeded]`.
- **Defensive Target**: Retain WeakSet circular object termination and bounded local event buffers.

### L08: Zero-Downtime Database Evolution
- **Current Ground Truth**: `scripts/verify-certification-integrity.node-test.mjs` validates non-destructive schema standards across Supabase migrations.
- **SRE Resilience Stress Test**: Continuous migration pipeline execution tests rollback idempotency.
- **Defensive Target**: Require `ADD COLUMN IF NOT EXISTS` and concurrent idempotent indexing without table drops.

### L09: Zero-Mock Testing & Proof Hierarchy
- **Current Ground Truth**: Vitest test runner (58 test suites) and Node native test runner (382 tests) execute pure domain tests without mock stubs.
- **SRE Resilience Stress Test**: Verifying 100% test passing status across all suites with zero skipped tests.
- **Defensive Target**: Maintain strict proof tier separation: C0 Contract -> C1 Unit -> C2 Integration -> C3 Runtime -> C4 Soak.

### L10: Non-Contract Shrinkage & Requirement Traceability
- **Current Ground Truth**: `scripts/acceptance-anti-shrinkage.node-test.mjs` verifies all 89 capability contracts (F00..F88) and 267 acceptance gates.
- **SRE Resilience Stress Test**: Automated regression asserting zero loss of historical commitments.
- **Defensive Target**: Forbid any contraction or renaming of foundational capabilities.

### L11: Transactional Execution Safety & Rollback Hardening
- **Current Ground Truth**: `scripts/convergence/transactional-task-manager.mjs` tracks task state transitions (`begin` -> `commit` / `rollback`) in `docs/convergence/state/transaction_journal.json`.
- **SRE Resilience Stress Test**: Simulating interrupted tasks and verifying pre-image restoration accuracy.
- **Defensive Target**: Retain filesystem pre-image rollback protection for all code modifications.

### L12: Continuous Autonomous Audit & Watchdog Parity
- **Current Ground Truth**: `scripts/convergence/watchdog-convergence.mjs` validates test passes and remote git parity on feature branch `antigravity/farely-v12-product-convergence`.
- **SRE Resilience Stress Test**: Remote Git synchronization ensures origin commit equals local HEAD.
- **Defensive Target**: Enforce commit verification via `git ls-remote` on every convergence milestone.

---

## SECTION V: LOCKED SOLUTIONS CAGE (SOL-01..SOL-12)

### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/app/data/api.ts`, preserve nulls without coercion. In `src/domain/farely/priceAnomaly.ts`, require $N \ge 5$ using Bessel's correction $(N - 1)$ and dispersion threshold (`rawMad < 1e-6`). Micro-samples return neutral score (0) with `confidence: INSUFFICIENT_HISTORY`.
- **Forbidden Deviations**: No zero-inflation on missing fields; direct ticketing and passenger checkout are strictly `boundary_excluded`.
- **Verification Command**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### SOL-02: SOL-PRICE-01 (Deterministic Tet Window Lookup & Dynamic Prior)
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/domain/farely/priceAnomaly.ts`, define static Lunar Tet windows for 2025, 2026, and 2027 with $2.8\times$ baseline multipliers to suppress false-positive deal alerts during peak festive periods.
- **Forbidden Deviations**: No dynamic unsealed third-party lunar APIs; no uncalibrated static baselines.
- **Verification Command**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### SOL-03: SOL-COST-01 (Carrier Landed Surcharges & Self-Transfer Validation)
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts` & `src/domain/farely/multiCityItinerary.ts`
- **Specification**: In `src/domain/farely/tripBudgetEstimator.ts`, compute carrier surcharges scaled by whole-integer passenger counts (`Math.floor(Math.max(1, passengers))`). In `src/domain/farely/multiCityItinerary.ts`, enforce 150m domestic, 240m international, and 210m metropolitan inter-airport transfers.
- **Forbidden Deviations**: No naked base fare ranking; no unflagged self-transfers; direct ticketing and payment gateway integration are strictly `boundary_excluded`.
- **Verification Command**: `npx vitest run src/domain/farely/tripBudgetEstimator.test.ts`

### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox & Row-Level Locking)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: In `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`, enforce rate limiting via `check_watch_rate_limit()` and transactional outbox row locking (`FOR UPDATE SKIP LOCKED`).
- **Forbidden Deviations**: No plain-text email broadcast queues; unauthorized scraping and credit card processing are strictly `boundary_excluded`.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Tri-State Provider Circuit Breakers & Fallback Degrade)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Specification**: In `supabase/functions/_shared/flight-search.ts`, implement tri-state circuit breaker (`CLOSED`, `OPEN`, `HALF_OPEN`) tracking consecutive 5xx errors and timeouts (> 8000ms), failing fast to cached snapshots.
- **Forbidden Deviations**: No unthrottled outbound retries; no hard crashes on upstream provider timeout.
- **Verification Command**: `npx vitest run src/domain/farely/providerRights.test.ts`

### SOL-06: SOL-STALE-01 (PWA Offline Freshness & Monotonic Deal Deduplication)
- **Target File**: `src/app/pages/DealsPage.tsx` & `src/domain/farely/pwaOfflineFreshness.ts`
- **Specification**: In `src/app/pages/DealsPage.tsx`, deduplicate deal feeds monotonically. In `src/domain/farely/pwaOfflineFreshness.ts`, purge cached search results older than 14 days and mark fares over 6 hours old as `STALE_SNAPSHOT`.
- **Forbidden Deviations**: No unbounded localStorage persistence; no rendering stale fares as live quotes.
- **Verification Command**: `npx vitest run src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Safe Recursive Error Serialization & Depth Guard)
- **Target File**: `src/app/lib/analytics.ts`
- **Specification**: In `src/app/lib/analytics.ts`, implement bounded recursive serialization in `safeSerializeError` capping recursion at `maxDepth = 3`, truncating object keys at `maxKeysPerLevel = 50`, and preserving array types.
- **Forbidden Deviations**: No naive JSON.stringify; no unbounded key extraction; no unredacted logging of PII.
- **Verification Command**: `npx vitest run src/app/lib/analytics.test.ts`

### SOL-08: SOL-MIGRATION-01 (Zero-Downtime Migration Invariants & Schema Verification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: In `scripts/verify-certification-integrity.node-test.mjs`, verify that database migrations use non-destructive DDL (`ADD COLUMN IF NOT EXISTS`, `CREATE INDEX CONCURRENTLY IF NOT EXISTS`).
- **Forbidden Deviations**: No destructive table drops or column alterations; no production data mutation.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (Hierarchical Verification Gating C0 -> C4)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: In `scripts/verify-certification-integrity.node-test.mjs`, enforce strict separation of proof tiers: C0 (Contract), C1 (Unit Code Proof), C2 (Integration), C3 (Runtime Telemetry), and C4 (Longitudinal Soak). Unit tests cannot certify C3/C4 milestones.
- **Forbidden Deviations**: No self-awarded 10/10 scores; no synthetic badge upgrades without automated verification proof.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (Acceptance Anti-Shrinkage & Gate Immutability)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Specification**: In `scripts/acceptance-anti-shrinkage.node-test.mjs`, assert all 89 capability contracts (F00..F88) and 267 historical acceptance gates (192 P0, 74 P1, 1 P2) remain strictly preserved.
- **Forbidden Deviations**: No deletion, consolidation, or renaming of acceptance criteria.
- **Verification Command**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (ACID Transactional Task Lifecycle & Rollback Journal)
- **Target File**: `scripts/convergence/transactional-task-manager.mjs`
- **Specification**: In `scripts/convergence/transactional-task-manager.mjs`, enforce atomic state transitions (`begin` -> `commit` / `rollback`) with pre-image filesystem snapshots in `docs/convergence/state/transaction_journal.json`.
- **Forbidden Deviations**: No manual file edits outside active transaction journal context.
- **Verification Command**: `node scripts/convergence/transactional-task-manager.mjs status`

### SOL-12: SOL-RELEASE-01 (Automated Watchdog Convergence & Remote SHA Parity)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: In `scripts/convergence/watchdog-convergence.mjs`, enforce full test suite verification and Git remote tracking parity via `git ls-remote origin antigravity/farely-v12-product-convergence`.
- **Forbidden Deviations**: No unpushed commits; no ignoring CI test suite failures.
- **Verification Command**: `node scripts/convergence/watchdog-convergence.mjs`
