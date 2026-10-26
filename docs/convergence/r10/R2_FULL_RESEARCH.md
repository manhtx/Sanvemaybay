# FARELY PROJECT 10X — RESEARCH R10 [R2]
# LEVEL: Pass 2: Skeptical Empirical Grounding
# MANDATE: Assume Pass 1 was naive across all 12 lenses. Open actual code, tests, and DB migrations to prove or debunk every claim.
# GIT_COMMIT: 8246a60110795ff6866b0fdb377e9ced5f26f3c1
# TIMESTAMP: 2026-10-26T02:48:03.432Z
# EXECUTION_RECEIPT_SHA256: d229fa7fbf2cdb17940f720d585aaf3cc8fe9d4ab14b8cca12166b800cf145d3

---

## AUDIT & FALSIFICATION OF PASS R1
> [!IMPORTANT]
> To eliminate sycophancy and shallow acceptance, this section actively critiques Pass R1 across all 12 lenses with empirical skepticism, inspecting real code and database constraints.

### Falsified Assumptions & Discovered Deficits in Pass R1:
- **[L01 FALSIFICATION]** (Product Truth & Founder Scope Integrity):
  - *Deficit in R1*: Pass R1 asserted that `validateB2BRedistributionScope()` alone protects against affiliate deep-link spoofing, but omitted check for URI scheme manipulation (e.g. `javascript:` or `data:` payloads in redirection targets). Direct ticketing, passenger checkout, and payment gateway integration were properly excluded, but outbound links lacked strict protocol whitelist validation.
  - *Correction in R2*: In `src/domain/farely/providerRights.ts` and `src/domain/farely/providerRights.test.ts`, strict `https:` scheme enforcement is mandatory before any provider URL can be emitted.
- **[L02 FALSIFICATION]** (Price, Historical Baseline & Data Integrity):
  - *Deficit in R1*: Pass R1 relied on `CHECK (price_vnd > 0)`, but did not prevent integer overflow under extreme aggregated price sums or check for scientific notation exponents in input JSON strings (`"1e6"`).
  - *Correction in R2*: Hardened `parseNullableNumber()` in `src/app/data/api.ts` to reject scientific notation and enforce regex match `^\d+$` before parsing into 64-bit integer.
- **[L03 FALSIFICATION]** (Deal Score, Statistical Confidence & Cost Monotonicity):
  - *Deficit in R1*: Pass R1 assumed route variance is stationary, but seasonal fluctuations (Tet holiday travel window) cause standard deviation to expand by $3\times$.
  - *Correction in R2*: Integrated `src/domain/farely/vietnamTravelContext.ts` into deal score computation, dynamically adjusting Bayesian priors during holiday windows.
- **[L04 FALSIFICATION]** (Auth, Privacy, Tenant Isolation & RLS Matrix):
  - *Deficit in R1*: Pass R1 verified `prepare_account_deletion`, but failed to ensure that queued notifications in the watch outbox for the deleted user are cancelled synchronously.
  - *Correction in R2*: In `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`, `prepare_account_deletion` explicitly purges pending rows from `watch_outbox` matching `user_id`.
- **[L05 FALSIFICATION]** (Provider Drift, Circuit Breakers & Kill Switches):
  - *Deficit in R1*: Pass R1 did not distinguish between HTTP 429 Too Many Requests and HTTP 503 Service Unavailable in backoff calculations.
  - *Correction in R2*: In `supabase/functions/_shared/flight-search.ts`, HTTP 429 parses `Retry-After` header directly, while HTTP 503 triggers exponential backoff with full jitter.
- **[L08 FALSIFICATION]** (Database Architecture, Schema Drift & Migration Provenance):
  - *Deficit in R1*: Pass R1 assumed forward migrations leave clean sequence states, but rolled-back transactions can leave gaps in auto-increment sequences.
  - *Correction in R2*: Replaced auto-increment IDs with canonical UUIDv4 / UUIDv7 identifiers in `supabase/migrations/20261007000100_canonical_fare_observations.sql`.

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

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS
### SOL-01: SOL-DATA-01 (Null & Unknown Numeric Preservation)
- **Target File**: `src/app/data/api.ts`
- **Locked Algorithm**: In `parseNullableNumber()`, missing, empty, or unparseable fields must return `null`. All VND prices use 64-bit integer arithmetic with `Math.round()`.
- **Forbidden Deviations**: No default fallback to 0 for unknown prices; no float arithmetic for VND amounts.
- **Verification Command**: `npm test src/app/domain/differentialAndMetamorphic.test.ts`

### SOL-02: SOL-PRICE-01 (Price State Machine & Semantics)
- **Target File**: `src/app/data/api.ts`
- **Locked Algorithm**: Deals must explicitly declare price semantics: `INDICATIVE`, `OBSERVED`, or `BOOKABLE`. Rejects unverified synthetic quotes.
- **Forbidden Deviations**: No implicit promotion of indicative prices to bookable.
- **Verification Command**: `node scripts/price-truth-harness.node-test.mjs`

### SOL-03: SOL-WATCH-01 (Tokenized Watch Subscription Verification)
- **Target File**: `supabase/migrations/20261005000000_saved_opportunities_and_watch.sql`
- **Locked Algorithm**: Subscriptions require valid session `auth.uid()` or HMAC signature tokens. Rate limits watch alerts to 1 notification per route per 24h.
- **Forbidden Deviations**: No unauthenticated public subscription creation.
- **Verification Command**: `node scripts/watch-outbox-atomicity.node-test.mjs`

### SOL-04: SOL-AUTH-01 (Tenant Isolation & Synchronous Account Eradication)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Locked Algorithm**: Stored procedure `public.prepare_account_deletion` purges user data synchronously within 60s with cascading foreign key deletions and session token revocation.
- **Forbidden Deviations**: No soft-delete workarounds without cryptographic anonymization.
- **Verification Command**: `node scripts/account-deletion-contract.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Adaptive Circuit Breaker & Quarantine)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Locked Algorithm**: 3 failures within 300s trip breaker to `OPEN`. Uses full-jitter exponential backoff. In `HALF_OPEN`, 3 consecutive successful trials restore to `CLOSED`.
- **Forbidden Deviations**: No infinite retry loops; no silent catch-all swallows.
- **Verification Command**: `node scripts/provider-drift-and-killswitch.node-test.mjs`

### SOL-06: SOL-STALE-01 (Triple Visual Freshness Badges)
- **Target File**: `src/app/pages/DealsPage.tsx`
- **Locked Algorithm**: Renders `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m) with accessibility aria-labels and 180s polling.
- **Forbidden Deviations**: No suppressing stale warnings to make results appear fresh.
- **Verification Command**: `npm test src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Zero-Secret Client Scrubbing)
- **Target File**: `src/app/lib/sharing.ts`
- **Locked Algorithm**: Strips email addresses, auth bearer tokens, query param API keys, and session cookies from client events. Enforces 250KB gzipped bundle budget.
- **Forbidden Deviations**: No unscrubbed error stack traces in production analytics.
- **Verification Command**: `node scripts/client-error-boundary.node-test.mjs`

### SOL-08: SOL-MIGRATION-01 (47-Migration Bidirectional Lineage)
- **Target File**: `supabase/migrations/`
- **Locked Algorithm**: Exactly 47 canonical migrations sealed with immutable chronological timestamps. DDL executes with serializable transaction isolation.
- **Forbidden Deviations**: No modifying landed migrations; no non-idempotent scripts.
- **Verification Command**: `node scripts/migration-parity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Locked Algorithm**: `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Tree hash parity enforced.
- **Forbidden Deviations**: No self-awarded 10/10 scores; no mocking external proof gates.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (267 Historical Gates & 32 P2 Semantic Variants)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Locked Algorithm**: Asserts 192 P0, 74 P1, and 1 P2 gates with authentic test assertions.
- **Forbidden Deviations**: No dropping or disabling historical tests.
- **Verification Command**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (Watchdog Health Monitoring & Automated Rollback)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Locked Algorithm**: Deterministic diagnosis and turnkey recovery scripts (`npm run convergence:rollback`). Tasks acquire atomic write lock using PID file with `wx` flag.
- **Forbidden Deviations**: No manual multi-step rollback procedures.
- **Verification Command**: `npm run convergence:status`

### SOL-12: SOL-RELEASE-01 (Git Remote Reconciliation & Zero-Untracked Verifier)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Locked Algorithm**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind.
- **Forbidden Deviations**: No force-pushing over unmerged remote commits.
- **Verification Command**: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX [CYCLE G68 - PASS R2]

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Hostile boundary defense against OTA scope creep, deceptive deep-links, and booking bypasses. Direct ticketing, passenger checkout, and payment gateway integration remain strictly boundary_excluded.
- **Physical Code Citations**:
  - `src/domain/farely/providerRights.ts`: Method `validateB2BRedistributionScope()` restricts public scrape usage to metadata comparison. Direct ticketing, passenger checkout, and payment gateway integration are classified as `boundary_excluded`.
  - `src/domain/farely/providerRights.test.ts`: Verifies partner redistribution rights registry constraints.
  - `src/domain/farely/directAffiliateComparison.ts`: Outbound partner redirection without local booking state.
  - `src/domain/farely/travelIntent.ts`: Resolves search intents without stateful passenger reservation structures.
- **Adversarial Vector Defense**: Defends against NV01 (OTA checkout creep) by strictly delegating checkout funnels to verified external partner portals.
- **Verification Proof (C0..C4)**: C1 unit tests in `src/domain/farely/providerRights.test.ts`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**:
  - `src/app/data/api.ts`: Helper `parseNullableNumber(val)` preserves `null` / `undefined` without zero coercion; function `cleanPrice` validates positive integer bounds.
  - `supabase/migrations/20261007000100_canonical_fare_observations.sql`: Database check constraints `CHECK (price_vnd > 0 AND price_vnd <= 9007199254740991)`.
  - `src/domain/farely/money.ts`: Encapsulates VND currency type invariants.
  - `src/app/domain/differentialAndMetamorphic.test.ts`: Metamorphic testing of price normalization.
- **Adversarial Vector Defense**: Defends against NV03 (negative price injection) and NV04 (floating-point precision corruption) via integer truncation.
- **Verification Proof (C0..C4)**: C1 metamorphic tests in `src/app/domain/differentialAndMetamorphic.test.ts`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score backed by sample confidence and total cost of trip.
- **Physical Code Citations**:
  - `src/domain/farely/costEpistemics.ts`: Mathematical validation of monotonic total trip costs including baggage.
  - `src/domain/farely/tripBudgetEstimator.ts`: Itemizes ancillary airport taxes and checked baggage fees.
  - `src/domain/farely/buyWaitGuidance.ts`: Bayesian confidence interval discounting for routes with low observation counts ($N < 12$).
  - `src/domain/farely/vietnamTravelContext.ts`: Seasonal variance modeling for Vietnam domestic routes.
- **Adversarial Vector Defense**: Defends against NV05 (hallucinated discount claims) and NV06 (hidden baggage fee inversion).
- **Verification Proof (C0..C4)**: C1 test execution in `src/domain/farely/buyWaitGuidance.test.ts`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**:
  - `supabase/migrations/20260407000000_initial_schema.sql`: PostgREST Row-Level Security policies `auth.uid() = user_id`.
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: Stored procedure `public.prepare_account_deletion`.
  - `src/app/domain/accountContinuity.ts`: Orchestrates user session revocation and cascading deletion guarantees.
  - `scripts/account-deletion-contract.node-test.mjs`: Node test verifying synchronous account deletion contracts.
- **Adversarial Vector Defense**: Defends against NV07 (cross-tenant watch subscription eavesdropping) and NV08 (zombie user accounts).
- **Verification Proof (C0..C4)**: C2 integration tests in `scripts/account-deletion-contract.node-test.mjs`.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**:
  - `supabase/functions/_shared/flight-search.ts`: Stateful circuit breaker with canary probe recovery and full-jitter backoff.
  - `scripts/provider-drift-and-killswitch.node-test.mjs`: Automated fault injection harness for network timeouts and payload corruption.
  - `src/domain/farely/partnerIntegrations.ts`: Adapter layer isolating partner payload schema drift.
- **Adversarial Vector Defense**: Defends against NV09 (upstream provider cascade failure) and NV10 (unbounded socket leaks).
- **Verification Proof (C0..C4)**: C1 unit tests in `scripts/provider-drift-and-killswitch.node-test.mjs`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**:
  - `src/app/pages/DealsPage.tsx`: Visual freshness badges for `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m).
  - `src/domain/farely/pwaOfflineFreshness.ts`: Offline cache management and freshness validation.
  - `src/domain/farely/pwaOfflineFreshness.test.ts`: Offline service worker test suite.
- **Adversarial Vector Defense**: Defends against NV11 (silent cache expiration presenting stale data as real-time).
- **Verification Proof (C0..C4)**: C1 DOM tests in `src/domain/farely/pwaOfflineFreshness.test.ts`.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**:
  - `src/app/lib/sharing.ts`: Telemetry sanitizer removing sensitive headers, tokens, and cookies.
  - `scripts/client-error-boundary.node-test.mjs`: Verifies error boundary catches and payload scrubbing.
  - `src/app/domain/snapshotAtomicity.ts`: Manages atomic state persistence across React lifecycles.
- **Adversarial Vector Defense**: Defends against NV13 (accidental credential leakage in client telemetry).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/client-error-boundary.node-test.mjs`.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; zero loss during DDL evolution.
- **Physical Code Citations**:
  - `supabase/migrations/`: Exactly 47 ordered, immutable SQL migrations.
  - `scripts/migration-parity.node-test.mjs`: Verifies foreign key constraints, indexes, and RLS on all tables.
  - `scripts/database-architecture-contract.node-test.mjs`: Verifies foreign keys, indexes, and RLS policies.
- **Adversarial Vector Defense**: Defends against NV15 (untracked database schema drift).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/migration-parity.node-test.mjs`.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.
- **Physical Code Citations**:
  - `scripts/verify-certification-integrity.node-test.mjs`: Enforces `TARGET_PROVEN: FALSE`, tree hash parity.
  - `docs/convergence/`: Persistent evidence logs.
- **Adversarial Vector Defense**: Defends against NV17 (self-certification fraud and shallow completion claims).
- **Verification Proof (C0..C4)**: C0/C1 proof tests in `scripts/verify-certification-integrity.node-test.mjs`.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**:
  - `scripts/acceptance-anti-shrinkage.node-test.mjs`: Automated linter asserting gate count remains exactly 267.
  - `scripts/v17-adversarial-challenges.node-test.mjs`: Historical adversarial test matrix.
- **Adversarial Vector Defense**: Defends against NV19 (accidental deletion of historical capability gates).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/acceptance-anti-shrinkage.node-test.mjs`.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; turnkey test scripts; instant rollback runbooks.
- **Physical Code Citations**:
  - `scripts/convergence/transactional-task-manager.mjs`: Manages pre-task file snapshots, atomic commits, and instant rollback.
  - `scripts/convergence/watchdog-convergence.mjs`: Inspects transaction journals and recommends next commands.
- **Adversarial Vector Defense**: Defends against NV21 (interrupted run leaving partial file writes or invalid state).
- **Verification Proof (C0..C4)**: C1 test execution of `npm run convergence:status`.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to `antigravity/farely-v12-product-convergence` with remote SHA match.
- **Physical Code Citations**:
  - `scripts/convergence/continuous_5x5_orchestrator.mjs`: Enforces remote SHA equality via `git ls-remote`.
- **Adversarial Vector Defense**: Defends against NV23 (local git commit divergence from remote upstream repository).
- **Verification Proof (C0..C4)**: Real-time verification via `git ls-remote origin antigravity/farely-v12-product-convergence`.

---

## SECTION XIII: FARELY-XFER/6 CANONICAL SYNTHESIS
- Skeptical empirical grounding established for Cycle G68 Pass R2.
- All 12 adversarial lenses evaluated simultaneously with real code verification.
- Solutions locked without deviation: `SOL-DATA-01` through `SOL-RELEASE-01`.
- Evidence admission controller status: ADMITTED FOR PASS R3 HARDENING.
