# FARELY PROJECT 10X — RESEARCH R10 [R3]
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Assume Pass 2 missed edge cases across all 12 lenses. Attack with 24 negative vectors, race conditions, and error states.
# GIT_COMMIT: 5bb4d0b020e727e4b7cd779d2d5aeeaf7ecaf62a
# TIMESTAMP: 2026-10-26T11:12:00.000Z
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

## SECTION III: HOSTILE FALSIFICATION & RIGOROUS AUDIT OF PASS R2

### Falsification 1: L01 Zero Adult Passenger & Negative Child Count in URL Builder
- *Deficits Identified in Pass R2*: Pass R2 sanitized 3-letter IATA airport codes, but completely overlooked passenger decomposition bugs in `buildSkyscannerUrl` and `buildGoogleFlightsUrl`.
- *Empirical Code Evidence*: In `src/app/lib/bookingUrls.ts`:
  ```typescript
  const adults = p.passengerMix?.adults ?? p.passengers ?? 1;
  ```
  If an upstream caller passes an unvalidated payload with `{ adults: 0, children: 2 }`, `adults` evaluates to 0. Skyscanner rejects zero-adult queries with HTTP 400 or redirects to homepage, causing total handoff drop-off for families traveling with children. Furthermore, if `children` is negative (`-1`), Skyscanner receives `&children=-1`, corrupting upstream search session state.
- *Locked Invariant for Pass R3*:
  Enforce strict non-negative integer sanitization across all passenger types in `src/app/lib/bookingUrls.ts`:
  ```typescript
  const safeAdults = Math.floor(Math.max(1, p.passengerMix?.adults ?? p.passengers ?? 1));
  const safeChildren = Math.floor(Math.max(0, p.passengerMix?.children ?? 0));
  const safeInfants = Math.floor(Math.max(0, p.passengerMix?.infants ?? 0));
  ```
  Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 Negative Active Watch Subscribers & Fractional ROI in Data Economics
- *Deficits Identified in Pass R2*: Pass R2 clamped yield percentage between 0 and 100, but ignored the subscriber multiplier `proposal.activeWatchSubscribersCount` and potential division-by-zero or negative costs in `evaluateScanExpansionProposal`.
- *Empirical Code Evidence*: In `src/domain/farely/dataEconomics.ts`:
  ```typescript
  const estimatedMarginalValueVnd =
    proposal.activeWatchSubscribersCount * alertValue + expectedNewOpps * opportunityValue;
  ```
  If `activeWatchSubscribersCount` is negative (which occurs when unsubscribe decrement operations race without transaction atomicity), `proposal.activeWatchSubscribersCount * alertValue` becomes negative, subtracting value from genuine opportunities and causing legitimate scan expansions to be falsely rejected. Moreover, if `marginalCostVnd <= 0`, `marginalRoiRatio` defaults to 1.0, which erroneously marks zero-cost ghost proposals as `APPROVED_VALUE_ACCRETIVE`.
- *Locked Invariant for Pass R3*:
  In `src/domain/farely/dataEconomics.ts`, enforce integer clamping:
  ```typescript
  const safeScopes = Math.floor(Math.max(1, proposal.additionalScopesCount || 0));
  const safeCostPerScope = Math.max(0, proposal.estimatedCostPerScopeVnd || 0);
  const safeSubscribers = Math.floor(Math.max(0, proposal.activeWatchSubscribersCount || 0));
  const safeYieldPercent = Math.min(100, Math.max(0, proposal.historicalOpportunityYieldPercent || 0));
  ```

### Falsification 3: L03 Malformed Evaluation Date Parsing & Negative Timespan in Buy/Wait Kernel
- *Deficits Identified in Pass R2*: Pass R2 checked past departure dates, but failed to assert what happens if `params.evaluationDate` is provided as an unparseable string or if historical timestamps are chronologically inverted.
- *Empirical Code Evidence*: In `src/domain/farely/buyWaitGuidance.ts`:
  ```typescript
  const evalDate = params.evaluationDate ? new Date(params.evaluationDate) : new Date();
  ```
  If `params.evaluationDate = "invalid-date"`, `evalDate.getTime()` returns `NaN`. Consequently, `daysUntilDeparture = Math.round((depDate.getTime() - evalDate.getTime()) / ...)` evaluates to `NaN`. All comparisons like `daysUntilDeparture <= 7` fail silently, meaning an urgent flight departing tomorrow will miss the yield-management window check!
- *Locked Invariant for Pass R3*:
  In `src/domain/farely/buyWaitGuidance.ts`, sanitize `evalDate` robustly:
  ```typescript
  const evalMs = params.evaluationDate ? Date.parse(params.evaluationDate) : Date.now();
  const safeEvalDate = Number.isFinite(evalMs) ? new Date(evalMs) : new Date();
  if (!Number.isFinite(depDate.getTime())) {
    return {
      recommendation: "INSUFFICIENT_DATA",
      confidence: 0,
      isCalibrated: false,
      sampleCount: validPoints.length,
      timespanDays,
      rationaleVi: "Ngày khởi hành không hợp lệ hoặc không thể phân tích.",
      scopeType,
    };
  }
  ```
  Commercial payment gateway integration is strictly `boundary_excluded`.

---

## SECTION IV: 12 ADVERSARIAL LENSES DEEP AUDIT (CYCLE G79)

### L01: Data Ingestion & Live Schema Integrity
- **Current Ground Truth**: `src/app/data/api.ts` provides nullable parsing. In `src/app/lib/bookingUrls.ts`, outbound partner search URLs are built for Google Flights and Skyscanner. In `src/domain/farely/airportAlternatives.ts`, alternative airport evaluation compares base and alternate routes.
- **Hostile Negative Vector Attack**: An attacker passes malicious script tags in airport codes (`fromCode: "<script>"`). While URL encoding prevents XSS in query parameters, Skyscanner path segments execute raw routing.
- **Defensive Target**: Add strict regex sanitization: `(code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3)`. Ensure length is exactly 3; if invalid, reject or return empty string.

### L02: Price Anomaly Detection & Statistical Rigor
- **Current Ground Truth**: `src/domain/farely/priceAnomaly.ts` implements median absolute deviation (MAD) and Lunar Tet windows. In `src/domain/farely/dataEconomics.ts`, unit economics and scan proposals are modeled.
- **Hostile Negative Vector Attack**: A scan proposal with `additionalScopesCount: 0` or negative numbers bypasses ROI checks by creating `marginalCostVnd = 0`.
- **Defensive Target**: Enforce `safeScopes = Math.floor(Math.max(1, proposal.additionalScopesCount || 0))`. If marginal cost is 0 and estimated value is 0, status must evaluate to `REJECTED_UNECONOMIC` rather than approved.

### L03: True Landed Cost Monotonicity & Ancillary Transparency
- **Current Ground Truth**: `src/domain/farely/tripBudgetEstimator.ts` models carrier surcharges. In `src/app/domain/dealComparison.ts`, duration and price comparisons are parsed.
- **Hostile Negative Vector Attack**: In `src/app/domain/dealComparison.ts`, Vietnamese duration strings like `"1 giờ 45 phút"` are parsed with regex. If duration is `"0 phút"` or missing, division by zero or NaN duration ratios distort deal scoring.
- **Defensive Target**: Enforce minimum duration of 15 minutes for commercial domestic flights.

### L04: Authentication, Access Control & Anti-Abuse
- **Current Ground Truth**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` enforces tokenized watch creation, rate limiting (`check_watch_rate_limit`), and row-level locking (`FOR UPDATE SKIP LOCKED`).
- **Hostile Negative Vector Attack**: An unauthorized user attempts to query watch alerts of another subscriber by manipulating anonymous session IDs.
- **Defensive Target**: RLS policies enforce `auth.uid() = user_id OR session_token = current_setting('request.headers')::json->>'x-watch-token'`. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### L05: Concurrency, Contention & System Resilience
- **Current Ground Truth**: `supabase/functions/_shared/flight-search.ts` implements tri-state circuit breaker protection (`CLOSED`, `OPEN`, `HALF_OPEN`) and timeout boundaries (> 8000ms).
- **Hostile Negative Vector Attack**: High-concurrency burst of 50 simultaneous partner timeouts causes memory exhaustion or connection pooling depletion.
- **Defensive Target**: Bounded execution pool with abort controllers and instant fallback to cached snapshot tables.

### L06: PWA Offline-First & Client State Freshness
- **Current Ground Truth**: `src/domain/farely/pwaOfflineFreshness.ts` enforces 14-day LRU cache eviction and price non-negativity checks. Monotonic sorting is enforced in `src/app/pages/DealsPage.tsx`.
- **Hostile Negative Vector Attack**: Offline client loads corrupt cached records with `observedAt` timestamp set to the year 2099 or negative unix epoch.
- **Defensive Target**: Evict timestamps with clock drift exceeding 5 minutes into the future or older than 14 days.

### L07: Observability, SRE & Diagnostic Transparency
- **Current Ground Truth**: `src/app/lib/analytics.ts` features circular-reference-tolerant error logging with `safeSerializeError`, recursion depth capping (`maxDepth = 3`), key count bounding (`maxKeysPerLevel = 50`), and array depth propagation.
- **Hostile Negative Vector Attack**: Massive nested exception payload with deeply nested circular graphs attempts to cause browser heap OOM.
- **Defensive Target**: WeakSet-based visited object tracking, truncating after depth 3 and capping array items at `Math.min(arr.length, 50)`.

### L08: Zero-Downtime Database Evolution
- **Current Ground Truth**: `scripts/verify-certification-integrity.node-test.mjs` validates non-destructive schema standards across Supabase migrations.
- **Hostile Negative Vector Attack**: Unsafe `ALTER TABLE DROP COLUMN` or locking table rewrites trigger production service disruption.
- **Defensive Target**: Require `ADD COLUMN IF NOT EXISTS` and concurrent idempotent indexing without table drops.

### L09: Zero-Mock Testing & Proof Hierarchy
- **Current Ground Truth**: Vitest test runner (58 test suites) and Node native test runner (382 tests) execute pure domain tests without mock stubs.
- **Hostile Negative Vector Attack**: Synthetic test mocks simulating success without validating underlying domain constraints.
- **Defensive Target**: Enforce pure algorithmic inputs and outputs with strict separation of proof tiers (C0 -> C1 -> C2 -> C3 -> C4).

### L10: Non-Contract Shrinkage & Requirement Traceability
- **Current Ground Truth**: `scripts/acceptance-anti-shrinkage.node-test.mjs` verifies all 89 capability contracts (F00..F88) and 267 acceptance gates.
- **Hostile Negative Vector Attack**: Silent deprecation or renaming of historical P0/P1 capability contracts to manufacture fake completion.
- **Defensive Target**: Strict AST validation preserving all 89 contracts and 267 historical gates.

### L11: Transactional Execution Safety & Rollback Hardening
- **Current Ground Truth**: `scripts/convergence/transactional-task-manager.mjs` tracks task state transitions (`begin` -> `commit` / `rollback`) in `docs/convergence/state/transaction_journal.json`.
- **Hostile Negative Vector Attack**: Abrupt crash during code modification leaves files in inconsistent, partially edited state.
- **Defensive Target**: Atomic pre-image snapshots stored in journal allowing instant rollback to exact pre-transaction state.

### L12: Continuous Autonomous Audit & Watchdog Parity
- **Current Ground Truth**: `scripts/convergence/watchdog-convergence.mjs` validates test passes and remote git parity on feature branch `antigravity/farely-v12-product-convergence`.
- **Hostile Negative Vector Attack**: Local commits diverge from remote repository without synchronization.
- **Defensive Target**: Mandatory remote SHA verification via `git ls-remote` before completing any convergence milestone.

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
