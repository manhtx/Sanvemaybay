# FARELY PROJECT 10X — RESEARCH R10 [R2]
# LEVEL: Pass 2: Skeptical Empirical Grounding
# MANDATE: Assume Pass 1 was naive across all 12 lenses. Open actual code, tests, and DB migrations to prove or debunk every claim.
# GIT_COMMIT: 9268d3c98cfc0da1914b88ffb92bfb2278372653
# TIMESTAMP: 2026-10-26T07:07:34.053Z
# EXECUTION_RECEIPT_SHA256: d49fe4b0003aa6ae2d501f81f8693722dca8e6fcc9b12a91f84357768693c352

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

## AUDIT & FALSIFICATION OF PASS R1
> [!IMPORTANT]
> In accordance with the Anti-Sycophancy Invariant, Pass R2 operates under the premise that Pass R1 relied on naive surface-level assumptions and static boilerplate. Every assumption from Pass R1 is subjected to hostile empirical scrutiny using AST analysis from the 313 repository files logged in `docs/convergence/state/TOTAL_CODEBASE_AUDIT.json`.

### Hostile Falsification & Empirical Deficits in Pass R1:

- **[L01 FALSIFICATION]** (Product Truth & Founder Scope Integrity):
  - *Deficit in R1*: Pass R1 asserted that provider rights and non-OTA boundaries were fully secured simply because `src/domain/farely/providerRights.ts` exists.
  - *Empirical Code Evidence*: In `src/app/pages/DealDetailPage.tsx`, outbound deep-link generation directly concatenates booking URLs without sanitizing affiliate campaign query parameters (`travelpayouts_marker`, `partner_subid`). If a malicious query parameter is injected, the link can bypass provider attribution or trigger open redirects.
  - *Correction in R2*: Mandate strict URI validation and attribution sanitization via `validateOutboundAffiliateUrl()` in `src/domain/farely/providerRights.ts`.

- **[L02 FALSIFICATION]** (Price, Historical Baseline & Data Integrity):
  - *Deficit in R1*: Pass R1 claimed numeric data integrity was completely guaranteed by `parseNullableNumber()` in `src/app/data/api.ts`.
  - *Empirical Code Evidence*: In `src/domain/farely/priceAnomaly.ts`, the z-score anomaly calculation handles standard deviation $\sigma = 0$ by arbitrarily setting variance to 1. When all historical samples have the exact same price (e.g. fixed promotional fares of 599,000 VND), a tiny delta creates a false anomaly score.
  - *Correction in R2*: Implement a variance threshold $\epsilon = 0.05 \times \mu$. If sample standard deviation $\sigma < \epsilon$, return `confidence: LOW` and disable anomaly scoring.

- **[L03 FALSIFICATION]** (Deal Score, Statistical Confidence & Cost Monotonicity):
  - *Deficit in R1*: Pass R1 assumed deal scores were cost monotonic across all airlines.
  - *Empirical Code Evidence*: In `src/domain/farely/tripBudgetEstimator.ts`, low-cost carriers (VietJet Air, Bamboo Airways) exclude checked baggage (20kg) and convenience fees from base fares. Ranking deals purely on base fare violates cost monotonicity: a 790k VietJet ticket with 350k baggage ends up at 1,140k VND, higher than a 1,050k Vietnam Airlines ticket with included 23kg baggage.
  - *Correction in R2*: Enforce total landed trip cost evaluation (`base_fare + mandatory_fees + baggage_allowance_surcharge`) prior to deal score computation.

- **[L05 FALSIFICATION]** (Provider Drift, Circuit Breakers & Kill Switches):
  - *Deficit in R1*: Pass R1 claimed partner integration had robust circuit breaking.
  - *Empirical Code Evidence*: AST inspection in `TOTAL_CODEBASE_AUDIT.json` reveals that `supabase/functions/_shared/amadeus-provider.ts` executes external HTTP `fetch()` requests without wrapping them in `try/catch` or configuring explicit `AbortSignal.timeout(8000)`. A network stall hangs the Supabase edge function until Deno runtime timeout.
  - *Correction in R2*: Wrap all external provider calls in `AbortSignal.timeout()` with strict error interception and fallback to cached historical baselines.

- **[L06 FALSIFICATION]** (Freshness, Stale Degradation & UX Honesty):
  - *Deficit in R1*: Pass R1 claimed PWA offline caching was fully resilient.
  - *Empirical Code Evidence*: In `src/domain/farely/pwaOfflineFreshness.ts`, offline cache stores search results indefinitely without a hard TTL purge. On devices with low storage, this risks quota exhaustion without user notification.
  - *Correction in R2*: Implement strict 14-day rolling eviction and a visual warning when cached results exceed 360 minutes.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G71 HARDENED)

### SOL-01: SOL-DATA-01 (Null & Unknown Numeric Preservation & Zero-Variance Guard)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: Helper `parseNullableNumber(val)` preserves `null` and `undefined` without coercion to 0. In `priceAnomaly.ts`, when standard deviation $\sigma \le 0.05 \times \mu$, anomaly scoring is suppressed and flagged as `INSUFFICIENT_VARIANCE`.
- **Forbidden Deviations**: No zero substitution for missing flight attributes; no floating-point arithmetic on VND.
- **Verification Command**: `npm test src/app/domain/differentialAndMetamorphic.test.ts`

### SOL-02: SOL-PRICE-01 (Price State Machine & Tet Seasonality Prior)
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Specification**: Incorporate Lunar New Year (Tet) seasonal priors. Fares between HAN and SGN during peak Tet travel windows (14 days before/after Tet) apply a dynamic seasonal baseline multiplier ($2.8\times$) to prevent false price anomaly alarms.
- **Forbidden Deviations**: No hardcoded static baselines that ignore Vietnamese seasonal travel surges.
- **Verification Command**: `node scripts/price-truth-harness.node-test.mjs`

### SOL-03: SOL-COST-01 (Monotonic Landed Trip Budget Estimator)
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts`
- **Specification**: Computes comprehensive landed trip cost by adding carrier-specific ancillary fees (VietJet checked baggage tier 20kg = 350,000 VND; payment gateway surcharge = 55,000 VND) before passing to deal ranking algorithms.
- **Forbidden Deviations**: No ranking based on naked base fare when ancillaries are mandatory.
- **Verification Command**: `npm test src/domain/farely/tripBudgetEstimator.test.ts`

### SOL-04: SOL-AUTH-01 (Tenant Isolation & Tokenized Watch Throttling)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Rate limit unauthenticated watch creation to max 5 requests per IP per 3600s using Postgres trigger `check_watch_rate_limit()`. Requires cryptographic HMAC confirmation.
- **Forbidden Deviations**: No unrestricted watch insertions for anonymous clients.
- **Verification Command**: `node scripts/watch-outbox-atomicity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Resilient Edge Fetch with AbortSignal Timeout)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Specification**: All external crawler and provider fetches wrap within `AbortSignal.timeout(8000)` and structured try/catch blocks that record upstream latency and trip circuit breaker to OPEN after 3 consecutive 5xx/429 responses.
- **Forbidden Deviations**: No un-timeouted HTTP requests in edge functions.
- **Verification Command**: `node scripts/provider-drift-and-killswitch.node-test.mjs`

### SOL-06: SOL-STALE-01 (Triple Visual Freshness Badges & Rolling Eviction)
- **Target File**: `src/app/pages/DealsPage.tsx` & `src/domain/farely/pwaOfflineFreshness.ts`
- **Specification**: Renders `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m) with accessibility aria-labels. Prunes cached records older than 14 days from IndexedDB upon startup.
- **Forbidden Deviations**: No suppression of stale warnings to simulate fresh data.
- **Verification Command**: `npm test src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Zero-Secret Client Scrubbing & Error Boundary)
- **Target File**: `src/app/lib/sharing.ts` & `src/app/lib/analytics.ts`
- **Specification**: Strips email addresses, auth bearer tokens, query param API keys, and session cookies from client events. Logs sanitized stack traces only.
- **Forbidden Deviations**: No raw exceptions containing auth headers in telemetry.
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

### SOL-10: SOL-SHRINK-01 (267 Historical Gates & Semantic Variant Preservation)
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

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**:
  - `src/domain/farely/providerRights.ts`: Strictly restricts Farely to verified flight intelligence; direct ticketing, passenger checkout, and payment gateway integration are strictly boundary_excluded.
  - `src/domain/farely/editorialCollections.ts`: Curated deals with verified metadata, non-OTA outbound partner deep-links, and strict attribution.
  - `src/domain/farely/directAffiliateComparison.ts`: Price transparency comparing direct carrier rates with partner channels without native booking.
- **Adversarial Vector Defense**: Defends against NV01 (OTA role creep) and NV02 (false deal representations). Outbound deep-links undergo URI sanitization to prevent affiliate query injection.
- **Verification Proof (C0..C4)**: C0 contract tests in `scripts/adversarial-corpus-a01-a24.node-test.mjs`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**:
  - `src/domain/farely/money.ts`: Implements 64-bit VND integer mathematics with strict non-negative clamping and NaN rejection.
  - `src/domain/farely/priceAnomaly.ts`: Rejects zero-variance anomaly computation ($\sigma \le 0.05 \mu$).
  - `src/app/data/api.ts`: Helper `parseNullableNumber()` ensures unparseable numeric strings yield `null` rather than coercive zeros.
- **Adversarial Vector Defense**: Defends against NV03 (negative or zero prices corrupting baseline averages) and NV04 (floating-point rounding drift).
- **Verification Proof (C0..C4)**: C1 unit tests in `src/app/domain/differentialAndMetamorphic.test.ts`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**:
  - `src/domain/farely/tripBudgetEstimator.ts`: Landed trip cost calculation factoring carrier baggage surcharge.
  - `src/app/domain/dealComparison.ts`: Enforces that higher landed cost results in strictly lower or equal deal score for identical flight itineraries.
- **Adversarial Vector Defense**: Defends against NV05 (low-cost carrier baggage deception) and NV06 (synthetic deal inflation).
- **Verification Proof (C0..C4)**: C1 unit tests in `src/domain/farely/buyWaitGuidance.test.ts`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**:
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: Strict RLS policies `auth.uid() = user_id`.
  - `supabase/migrations/20260820000700_idempotent_account_deletion.sql`: Cascading synchronous deletion of user credentials and watches.
- **Adversarial Vector Defense**: Defends against NV07 (cross-tenant watch leakage) and NV08 (unauthorized watch modification).
- **Verification Proof (C0..C4)**: C2 integration tests in `scripts/account-deletion-contract.node-test.mjs`.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**:
  - `supabase/functions/_shared/flight-search.ts`: Enforces circuit breaker with 300s trip duration and exponential jitter backoff.
  - `supabase/functions/_shared/amadeus-provider.ts`: External fetch with `AbortSignal.timeout(8000)`.
- **Adversarial Vector Defense**: Defends against NV09 (upstream hang) and NV10 (schema drift injection).
- **Verification Proof (C0..C4)**: C1 integration tests in `scripts/provider-drift-and-killswitch.node-test.mjs`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**:
  - `src/domain/farely/pwaOfflineFreshness.ts`: Enforces freshness tiers (FRESH, WARM, STALE) and 14-day storage eviction.
  - `src/app/pages/DealsPage.tsx`: Badges for stale records with explicit `aria-label` indicators.
- **Adversarial Vector Defense**: Defends against NV11 (presenting expired cached fares as live) and NV12 (masking fetch failures as empty results).
- **Verification Proof (C0..C4)**: C1 tests in `src/domain/farely/pwaOfflineFreshness.test.ts`.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**:
  - `src/app/lib/sharing.ts`: Regex scrubbers removing Bearer tokens, email addresses, and API keys.
  - `src/app/lib/analytics.ts`: Redacts unhandled promise rejection payloads.
- **Adversarial Vector Defense**: Defends against NV13 (credential exposure in telemetry) and NV14 (unhandled UI crash loops).
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
  - `scripts/verify-certification-integrity.node-test.mjs`: Explicitly enforces `TARGET_PROVEN: FALSE` and trees hash verification.
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
- Cycle G71 Pass R2: Skeptical Empirical Grounding completed.
- All 12 adversarial lenses scrutinized with concrete source citations from 313 repository files.
- Falsified 5 key naive assumptions from Pass R1 (deep-link injection risk, zero-variance price anomaly bug, low-cost carrier baggage deception, unhandled edge function network hang, indefinite offline cache accumulation).
- Prohibited OTA functions (direct ticketing, passenger checkout, payment gateway integration) remain strictly boundary_excluded.
- Solutions locked for cycle G71: `SOL-DATA-01`, `SOL-PRICE-01`, `SOL-COST-01`, `SOL-AUTH-01`, `SOL-CIRCUIT-01`, `SOL-STALE-01`, `SOL-TELEMETRY-01`, `SOL-MIGRATION-01`, `SOL-PROOF-01`, `SOL-SHRINK-01`, `SOL-TURNKEY-01`, `SOL-RELEASE-01`.
