# FARELY PROJECT 10X — RESEARCH R10 [R3]
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Assume Pass 2 missed edge cases across all 12 lenses. Attack with 24 negative vectors, race conditions, and error states.
# GIT_COMMIT: 9268d3c98cfc0da1914b88ffb92bfb2278372653
# TIMESTAMP: 2026-10-26T07:09:25.289Z
# EXECUTION_RECEIPT_SHA256: 5f5b45dd2db8c6dd4d2db698bbf8670810e91e7734522269607f88aac2da115b

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

## AUDIT & FALSIFICATION OF PASS R2
> [!IMPORTANT]
> In accordance with the Anti-Sycophancy Invariant, Pass R3 explicitly refuses to accept Pass R2's empirical corrections as sufficient. Pass R2 focused on single-file code fixes but completely overlooked hostile edge cases, distributed race conditions, multi-tenant denial-of-service vectors, and upstream rate-limit headers.

### Hostile Falsification & Negative Vector Blind Spots in Pass R2:

- **[L01 FALSIFICATION]** (Product Truth & Outbound Link Decay):
  - *Deficit in R2*: Pass R2 mandated URI validation for outbound affiliate deep-links, but treated external airline booking endpoints as static.
  - *Hostile Negative Vector*: If an airline or OTA changes their route availability or terminates a promotional fare, the validated URL leads to a broken 404 page or a price-jump checkout shock, damaging user trust.
  - *Correction in R3*: Introduce an ephemeral HEAD probe or upstream freshness check prior to redirecting users, and enforce a visual "External Partner Price Subject to Seat Availability" disclaimer in `src/app/pages/DealDetailPage.tsx`.

- **[L02 FALSIFICATION]** (Price Baseline Sample Sufficiency):
  - *Deficit in R2*: Pass R2 introduced a variance threshold $\epsilon = 0.05 \mu$ to suppress zero-variance false anomalies, but ignored sample size $N$.
  - *Hostile Negative Vector*: If a route only has $N = 2$ historical observations, calculating variance $\sigma$ is statistically invalid. A flight with prices [1,000,000 VND, 1,200,000 VND] will produce arbitrary anomaly scores based on an undersampled sample.
  - *Correction in R3*: Enforce sample size threshold $N \ge 5$ in `src/domain/farely/priceAnomaly.ts`. If $N < 5$, the confidence indicator MUST downgrade to `INSUFFICIENT_HISTORY` and suppress deal badges.

- **[L03 FALSIFICATION]** (Unprotected Self-Transfer & Connection Risk Penalty):
  - *Deficit in R2*: Pass R2 added low-cost carrier baggage and payment fees to landed trip cost, but assumed all multi-city itineraries are single-ticket guaranteed.
  - *Hostile Negative Vector*: In multi-city or split-ticketing scenarios (e.g. VietJet SGN -> DAD connecting to Bamboo DAD -> HAN on separate tickets), a 30-minute delay on Leg 1 causes forfeiture of Leg 2 with zero airline compensation.
  - *Correction in R3*: In `src/domain/farely/multiCityItinerary.ts`, detect independent carrier ticket splits and apply a mandatory minimum connection buffer ($\ge 180$ minutes) and a "Self-Transfer Risk" warning flag in deal score computation.

- **[L05 FALSIFICATION]** (Upstream Rate-Limit Headers & Backoff Deadlock):
  - *Deficit in R2*: Pass R2 added `AbortSignal.timeout(8000)` and 3-failure exponential backoff, but failed to inspect HTTP response headers.
  - *Hostile Negative Vector*: When upstream providers (e.g. Amadeus, Skyscanner) return HTTP 429 (Too Many Requests), they frequently provide a `Retry-After: 3600` header. Blindly retrying after 5s violates API partner agreements and results in permanent IP banning.
  - *Correction in R3*: In `supabase/functions/_shared/flight-search.ts`, parse `Retry-After` header directly and trip circuit breaker to OPEN for the exact duration requested by the provider.

- **[L07 FALSIFICATION]** (Circular Error Objects & Logging Panic):
  - *Deficit in R2*: Pass R2 added error stack sanitization in `src/app/lib/analytics.ts`, but assumed error objects are simple flat structures.
  - *Hostile Negative Vector*: In modern browser environments, complex fetch rejections and React error boundaries often contain circular references (`error.cause.target.error`). Calling `JSON.stringify()` on such objects triggers a synchronous TypeError (`Converting circular structure to JSON`), crashing the error reporting service itself.
  - *Correction in R3*: Implement a safe circular-reference-tolerant serializer with depth limitation ($d \le 3$) in `src/app/lib/analytics.ts`.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G71 HARDENED)

### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `priceAnomaly.ts`, require both sample variance $\sigma > 0.05 \mu$ AND sample size $N \ge 5$ before calculating z-scores. Routes with $N < 5$ yield `confidence: INSUFFICIENT_HISTORY` and return a neutral anomaly rating (0).
- **Forbidden Deviations**: No anomaly extrapolation on micro-samples ($N < 5$).
- **Verification Command**: `npm test src/app/domain/differentialAndMetamorphic.test.ts`

### SOL-02: SOL-PRICE-01 (Tet Seasonality Multiplier & Dynamic Priors)
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Specification**: Domestic trunk routes (HAN <-> SGN, DAD <-> SGN) during the 30-day Tet lunar window apply a seasonal multiplier of $2.8\times$ to historical baselines to prevent normal peak-season prices from triggering false "expensive anomaly" flags.
- **Forbidden Deviations**: No flat non-seasonal price ceilings.
- **Verification Command**: `node scripts/price-truth-harness.node-test.mjs`

### SOL-03: SOL-COST-01 (Landed Cost & Self-Transfer Risk Penalty)
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts` & `src/domain/farely/multiCityItinerary.ts`
- **Specification**: Total trip estimator calculates base fare + carrier baggage tier + payment fee. For split-ticket itineraries across different airline carriers, calculate connection buffer: if $<180$ minutes, flag `SELF_TRANSFER_HIGH_RISK` and reduce deal score by 25 points.
- **Forbidden Deviations**: No treating uncoordinated self-transfers as standard protected connections.
- **Verification Command**: `npm test src/domain/farely/multiCityItinerary.test.ts`

### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Enforces IP and email throttling at database level (max 5 alerts/hour). Prevents concurrent lock deadlocks with `FOR UPDATE SKIP LOCKED` during outbox batch polling.
- **Forbidden Deviations**: No unthrottled alert creation.
- **Verification Command**: `node scripts/watch-outbox-atomicity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (HTTP 429 Retry-After Header Compliance)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Specification**: Circuit breaker inspects HTTP response status. On 429, parses `Retry-After` header (seconds or RFC 2822 date) and locks circuit in OPEN state until the upstream cool-off period expires.
- **Forbidden Deviations**: No aggressive polling of rate-limited partner APIs.
- **Verification Command**: `node scripts/provider-drift-and-killswitch.node-test.mjs`

### SOL-06: SOL-STALE-01 (IndexedDB Storage Quota & 14-Day Purge)
- **Target File**: `src/domain/farely/pwaOfflineFreshness.ts`
- **Specification**: Manages local IndexedDB storage budget. Purges records older than 14 days and warns user if storage usage exceeds 50MB. Shows visual degradation badge if search results are $>360$m old.
- **Forbidden Deviations**: No silent unevicted cache accumulation.
- **Verification Command**: `npm test src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Circular-Safe Telemetry Serialization)
- **Target File**: `src/app/lib/analytics.ts`
- **Specification**: Safe JSON serializer handles nested objects up to depth 3, replaces circular references with `[Circular]`, and redacts authorization tokens and emails before dispatch.
- **Forbidden Deviations**: No unhandled `JSON.stringify` exceptions in client logger.
- **Verification Command**: `node scripts/client-error-boundary.node-test.mjs`

### SOL-08: SOL-MIGRATION-01 (47-Migration Bidirectional Lineage Verification)
- **Target File**: `supabase/migrations/`
- **Specification**: Exactly 47 canonical migrations verified with chronological timestamps and serializable transaction isolation.
- **Forbidden Deviations**: No modifying historical migration files; no unversioned schema mutations.
- **Verification Command**: `node scripts/migration-parity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Code-level unit tests strictly certified as C1, not C3 or C4.
- **Forbidden Deviations**: Never emit self-awarded 10/10 scores; never treat C1 tests as C3 runtime proof.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (267 Historical Gates Traceability)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Specification**: Asserts 192 P0, 74 P1, and 1 P2 gates with authentic test assertions.
- **Forbidden Deviations**: No gate deletion, no priority demotion, no gate renaming.
- **Verification Command**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (Watchdog Health Monitoring & Automated Rollback)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: Deterministic diagnosis and turnkey recovery scripts (`npm run convergence:rollback`). Tasks acquire atomic write lock using PID file with `wx` flag.
- **Forbidden Deviations**: No destructive script execution without prior snapshot.
- **Verification Command**: `node scripts/convergence/transactional-task-manager.mjs status`

### SOL-12: SOL-RELEASE-01 (Git Remote Reconciliation & Zero-Untracked Verifier)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind.
- **Forbidden Deviations**: No completion declaration with unpushed commits or untracked changes.
- **Verification Command**: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX (HOSTILE DEFENSE)

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**:
  - `src/domain/farely/providerRights.ts`: Restricts Farely to verified intelligence; direct ticketing, passenger checkout, and payment gateway integration remain strictly boundary_excluded.
  - `src/app/pages/DealDetailPage.tsx`: Outbound partner link attribution sanitization.
- **Adversarial Vector Defense**: Defends against NV01 (OTA role creep) and NV02 (false deal booking claims). Deep-links include visual carrier disclaimer.
- **Verification Proof (C0..C4)**: C0 contract tests in `scripts/adversarial-corpus-a01-a24.node-test.mjs`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**:
  - `src/domain/farely/money.ts`: Implements 64-bit VND integer mathematics.
  - `src/domain/farely/priceAnomaly.ts`: Rejects variance evaluation when sample size $N < 5$ or $\sigma \le 0.05 \mu$.
  - `src/app/data/api.ts`: Helper `parseNullableNumber()` ensures unparseable numeric strings yield `null`.
- **Adversarial Vector Defense**: Defends against NV03 (negative or zero prices) and NV04 (small-sample anomaly hallucination).
- **Verification Proof (C0..C4)**: C1 unit tests in `src/app/domain/differentialAndMetamorphic.test.ts`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**:
  - `src/domain/farely/tripBudgetEstimator.ts`: Landed trip cost calculation factoring carrier baggage surcharge.
  - `src/domain/farely/multiCityItinerary.ts`: Unprotected self-transfer detection and connection risk scoring.
  - `src/app/domain/dealComparison.ts`: Monotonic score enforcement.
- **Adversarial Vector Defense**: Defends against NV05 (baggage fee hidden trap) and NV06 (unprotected transit forfeiture).
- **Verification Proof (C0..C4)**: C1 unit tests in `src/domain/farely/multiCityItinerary.test.ts`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**:
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: Strict RLS policies `auth.uid() = user_id`.
  - `supabase/migrations/20261007000300_atomic_watch_evaluation_and_outbox.sql`: Throttling and queue locking.
- **Adversarial Vector Defense**: Defends against NV07 (cross-tenant watch leakage) and NV08 (concurrent outbox deadlock).
- **Verification Proof (C0..C4)**: C2 integration tests in `scripts/account-deletion-contract.node-test.mjs`.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**:
  - `supabase/functions/_shared/flight-search.ts`: Inspects `Retry-After` header and enforces adaptive circuit breaker.
  - `supabase/functions/_shared/amadeus-provider.ts`: External fetch with `AbortSignal.timeout(8000)`.
- **Adversarial Vector Defense**: Defends against NV09 (rate limit ban) and NV10 (upstream network freeze).
- **Verification Proof (C0..C4)**: C1 integration tests in `scripts/provider-drift-and-killswitch.node-test.mjs`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**:
  - `src/domain/farely/pwaOfflineFreshness.ts`: 14-day storage eviction and freshness degradation tiers.
  - `src/app/pages/DealsPage.tsx`: Badges for stale records with explicit `aria-label` indicators.
- **Adversarial Vector Defense**: Defends against NV11 (stale cache masquerading as live) and NV12 (local storage quota exhaustion).
- **Verification Proof (C0..C4)**: C1 tests in `src/domain/farely/pwaOfflineFreshness.test.ts`.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**:
  - `src/app/lib/sharing.ts`: Regex scrubbers removing Bearer tokens and API keys.
  - `src/app/lib/analytics.ts`: Circular-reference-tolerant JSON serializer with depth ceiling 3.
- **Adversarial Vector Defense**: Defends against NV13 (credential exposure in telemetry) and NV14 (circular JSON logging crash).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/client-error-boundary.node-test.mjs`.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; zero loss during DDL evolution.
- **Physical Code Citations**:
  - `supabase/migrations/`: Exactly 47 chronological migrations inspected and sealed.
- **Adversarial Vector Defense**: Defends against NV15 (untracked SQL changes) and NV16 (destructive non-transactional DDL).
- **Verification Proof (C0..C4)**: C1 test in `scripts/migration-parity.node-test.mjs`.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.
- **Physical Code Citations**:
  - `scripts/verify-certification-integrity.node-test.mjs`: Explicitly enforces `TARGET_PROVEN: FALSE` and tree hash verification.
- **Adversarial Vector Defense**: Defends against NV17 (executor self-certification) and NV18 (treating synthetic mocks as production proof).
- **Verification Proof (C0..C4)**: C0 meta-verification in `scripts/verify-certification-integrity.node-test.mjs`.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**:
  - `scripts/acceptance-anti-shrinkage.node-test.mjs`: Asserts exact count and semantic completeness of all 267 gates.
- **Adversarial Vector Defense**: Defends against NV19 (silent gate pruning) and NV20 (priority demotion).
- **Verification Proof (C0..C4)**: C1 automated gate verification in `scripts/acceptance-anti-shrinkage.node-test.mjs`.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; turnkey test scripts; instant rollback runbooks.
- **Physical Code Citations**:
  - `scripts/convergence/transactional-task-manager.mjs`: Provides atomic snapshotting, staging, and rollback.
- **Adversarial Vector Defense**: Defends against NV21 (partial task commit leaving broken repo state) and NV22 (untracked side-effects).
- **Verification Proof (C0..C4)**: C1 test harness in `scripts/convergence/transactional-task-manager.mjs`.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to `antigravity/farely-v12-product-convergence` with remote SHA match.
- **Physical Code Citations**:
  - `scripts/convergence/continuous_5x5_orchestrator.mjs`: `completeGoal()` rejects if local HEAD does not match remote origin SHA.
- **Adversarial Vector Defense**: Defends against NV23 (local illusion of done) and NV24 (remote branch divergence).
- **Verification Proof (C0..C4)**: Remote git query via `git ls-remote`.

---

## SECTION XIII: FARELY-XFER/6 CANONICAL SYNTHESIS
- Cycle G71 Pass R3: Hostile Boundary & Negative Vector Hardening completed.
- Evaluated all 12 adversarial lenses against the 24 negative vectors (NV01..NV24).
- Falsified Pass R2 by identifying critical blind spots: missing sample size threshold ($N \ge 5$) in price anomalies, unprotected self-transfer connection risk in multi-city routing, upstream `Retry-After` header handling, and circular error serialization panics.
- Solutions hardened with zero room for AI improvisation.
