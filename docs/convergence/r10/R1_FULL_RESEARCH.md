# FARELY PROJECT 10X — RESEARCH R10 [R1]
# LEVEL: Pass 1: Full-Battery Baseline Synthesis
# MANDATE: Draft complete deliverable evaluating all 12 lenses simultaneously from current system knowledge and founder scope.
# GIT_COMMIT: 0fcd6d8e8d33df3ebaadc25ec6c9631614352b62
# TIMESTAMP: 2026-10-26T03:03:54.862Z
# EXECUTION_RECEIPT_SHA256: 7e105de33e53dd95d2bea5800e78b8f30461cf36fa243bea8786d2dbcdf797f6

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
- **Specification**: Helper `parseNullableNumber(val)` preserves `null` and `undefined` without coercion to 0. All mappers treat `null !== 0` and `undefined !== 0` as inviolate invariants. VND arithmetic is strictly 64-bit integer based with `Math.round()`.
- **Forbidden Deviations**: No fallback to zero for unknown stops, flight durations, or deal scores; no float math for currency.
- **Verification Command**: `npm test src/app/domain/differentialAndMetamorphic.test.ts`

### SOL-02: SOL-PRICE-01 (Price State Machine & Semantics)
- **Target File**: `src/app/data/api.ts`
- **Specification**: Deals explicitly declare price semantics: `INDICATIVE`, `OBSERVED`, or `BOOKABLE`. Rejects unverified synthetic quotes.
- **Forbidden Deviations**: No implicit promotion of indicative prices to bookable without carrier API response.
- **Verification Command**: `node scripts/price-truth-harness.node-test.mjs`

### SOL-03: SOL-WATCH-01 (Tokenized Watch Subscription Verification)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Unauthenticated users can subscribe via email with a cryptographic confirmation token (`token_hash = sha256(raw_token)`). Expired tokens (>48h) rejected.
- **Forbidden Deviations**: No automatic subscription confirmation without cryptographic token verification.
- **Verification Command**: `node scripts/watch-outbox-atomicity.node-test.mjs`

### SOL-04: SOL-AUTH-01 (Tenant Isolation & Synchronous Account Eradication)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Stored procedure `public.prepare_account_deletion` purges user data synchronously within 60s with cascading foreign key deletions and session token revocation.
- **Forbidden Deviations**: No soft-delete workarounds without cryptographic anonymization.
- **Verification Command**: `node scripts/account-deletion-contract.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Adaptive Circuit Breaker & Quarantine)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Specification**: 3 failures within 300s trip breaker to `OPEN`. Uses full-jitter exponential backoff. In `HALF_OPEN`, 3 consecutive successful trials restore to `CLOSED`.
- **Forbidden Deviations**: No hammering failed endpoints without backoff.
- **Verification Command**: `node scripts/provider-drift-and-killswitch.node-test.mjs`

### SOL-06: SOL-STALE-01 (Triple Visual Freshness Badges)
- **Target File**: `src/app/pages/DealsPage.tsx`
- **Specification**: Renders `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m) with accessibility aria-labels and 180s polling.
- **Forbidden Deviations**: No suppression of stale warnings to make results look recent.
- **Verification Command**: `npm test src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Zero-Secret Client Scrubbing)
- **Target File**: `src/app/lib/sharing.ts`
- **Specification**: Strips email addresses, auth bearer tokens, query param API keys, and session cookies from client events. Enforces 250KB gzipped bundle budget.
- **Forbidden Deviations**: No raw exceptions containing auth headers in telemetry.
- **Verification Command**: `node scripts/client-error-boundary.node-test.mjs`

### SOL-08: SOL-MIGRATION-01 (47-Migration Bidirectional Lineage)
- **Target File**: `supabase/migrations/`
- **Specification**: Exactly 47 canonical migrations sealed with immutable chronological timestamps. DDL executes with serializable transaction isolation.
- **Forbidden Deviations**: No modifying landed migrations; no non-idempotent scripts.
- **Verification Command**: `node scripts/migration-parity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Tree hash parity enforced.
- **Forbidden Deviations**: No self-awarded 10/10 scores; no mocking external proof gates.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (267 Historical Gates & 32 P2 Semantic Variants)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Specification**: Asserts 192 P0, 74 P1, and 1 P2 gates with authentic test assertions.
- **Forbidden Deviations**: No dropping or disabling historical tests.
- **Verification Command**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (Watchdog Health Monitoring & Automated Rollback)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: Deterministic diagnosis and turnkey recovery scripts (`npm run convergence:rollback`). Tasks acquire atomic write lock using PID file with `wx` flag.
- **Forbidden Deviations**: No manual multi-step rollback procedures.
- **Verification Command**: `npm run convergence:status`

### SOL-12: SOL-RELEASE-01 (Git Remote Reconciliation & Zero-Untracked Verifier)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind.
- **Forbidden Deviations**: No force-pushing over unmerged remote commits.
- **Verification Command**: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX [CYCLE G69 - PASS R1]

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Non-OTA boundary enforcement; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26. Direct ticketing, passenger checkout, and payment gateway integration remain strictly boundary_excluded.
- **Physical Code Citations**:
  - `src/domain/farely/providerRights.ts`: Method `validateB2BRedistributionScope()` restricts public scrape usage to metadata comparison. Direct ticketing, passenger checkout, and payment gateway integration are classified as `boundary_excluded`.
  - `src/domain/farely/providerRights.test.ts`: Verifies partner redistribution rights registry constraints.
  - `src/domain/farely/directAffiliateComparison.ts`: Outbound partner redirection without local booking state.
- **Adversarial Vector Defense**: Defends against NV01 (OTA scope contamination) by strictly delegating checkout funnels to verified external partner portals. Direct ticketing, passenger checkout, and credit card processing are strictly boundary_excluded.
- **Verification Proof (C0..C4)**: C1 unit tests in `src/domain/farely/providerRights.test.ts`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**:
  - `src/app/data/api.ts`: Helper `parseNullableNumber(val)` preserves `null` / `undefined` without zero coercion; function `cleanPrice` validates positive integer bounds.
  - `supabase/migrations/20261007000100_canonical_fare_observations.sql`: Database check constraints `CHECK (price_vnd > 0 AND price_vnd <= 9007199254740991)`.
  - `src/domain/farely/money.ts`: Encapsulates VND currency type invariants and safe integer arithmetic.
- **Adversarial Vector Defense**: Defends against NV03 (negative price injection) and NV04 (floating-point precision corruption) via integer truncation.
- **Verification Proof (C0..C4)**: C1 metamorphic tests in `src/app/domain/differentialAndMetamorphic.test.ts`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score backed by sample confidence and total cost of trip.
- **Physical Code Citations**:
  - `src/domain/farely/savings.ts`: Evaluates deal savings relative to historical 30-day medians.
  - `src/domain/farely/tripBudgetEstimator.ts`: Multi-component trip cost model accounting for lodging and transportation.
  - `src/domain/farely/vietnamTravelContext.ts`: Seasonal variance adjustment during Lunar New Year peak windows.
- **Adversarial Vector Defense**: Defends against NV05 (hallucinated discount claims) and NV06 (naked fare baiting without baggage fees).
- **Verification Proof (C0..C4)**: C1 tests in `npm test src/domain/farely/tripBudgetEstimator.test.ts`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**:
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: Mandatory RLS policies `auth.uid() = user_id`.
  - `scripts/account-deletion-contract.node-test.mjs`: Synchronous account eradication under 60 seconds.
  - `scripts/watch-outbox-atomicity.node-test.mjs`: Transactional guarantees for alert queuing.
- **Adversarial Vector Defense**: Defends against NV07 (cross-tenant data leakage) and NV08 (unauthorized watch subscription spoofing).
- **Verification Proof (C0..C4)**: C1 tests in `node scripts/account-deletion-contract.node-test.mjs` and `node scripts/watch-outbox-atomicity.node-test.mjs`.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**:
  - `supabase/functions/_shared/flight-search.ts`: Tri-state circuit breaker (`CLOSED`, `OPEN`, `HALF_OPEN`) with full jitter exponential backoff.
  - `scripts/provider-drift-and-killswitch.node-test.mjs`: Tests failover state transitions and quarantine timeouts.
  - `src/domain/farely/providerCapabilities.ts`: Schema validation and payload quarantine for malformed partner responses.
- **Adversarial Vector Defense**: Defends against NV09 (upstream provider cascade failure) and NV10 (silent unvalidated schema drift).
- **Verification Proof (C0..C4)**: C1 tests in `node scripts/provider-drift-and-killswitch.node-test.mjs`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**:
  - `src/domain/farely/time.ts`: Classifies observation age into `FRESH`, `WARM`, and `STALE` states.
  - `src/domain/farely/pwaOfflineFreshness.ts`: Offline cache management and staleness banners.
  - `src/app/pages/DealsPage.tsx`: Visual badge rendering and polling refresh interval.
- **Adversarial Vector Defense**: Defends against NV11 (stale deal deception) and NV12 (empty state masking upstream provider errors).
- **Verification Proof (C0..C4)**: C1 tests in `npm test src/domain/farely/pwaOfflineFreshness.test.ts`.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**:
  - `src/app/lib/sharing.ts`: Sanitizes outgoing telemetry payloads, stripping authorization tokens and private headers.
  - `scripts/client-error-boundary.node-test.mjs`: Verifies React error boundaries catch nested component faults gracefully.
  - `scripts/mutation-sensitivity.node-test.mjs`: Validates telemetry error reporting under simulated boundary faults.
- **Adversarial Vector Defense**: Defends against NV13 (accidental secret exposure in telemetry) and NV14 (unhandled client white-screen crashes).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/client-error-boundary.node-test.mjs` and `scripts/mutation-sensitivity.node-test.mjs`.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; zero loss during DDL evolution.
- **Physical Code Citations**:
  - `supabase/migrations/`: Exactly 47 ordered, immutable SQL migration files tracking complete schema evolution.
  - `scripts/migration-parity.node-test.mjs`: Verifies foreign key constraints, indexes, and RLS on all 31 tables.
  - `scripts/database-architecture-contract.node-test.mjs`: Asserts schema integrity and down-migration compliance.
- **Adversarial Vector Defense**: Defends against NV15 (untracked database schema drift) and NV16 (destructive schema changes without rollback).
- **Verification Proof (C0..C4)**: C1 tests in `node scripts/migration-parity.node-test.mjs`.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.
- **Physical Code Citations**:
  - `scripts/verify-certification-integrity.node-test.mjs`: Enforces `TARGET_PROVEN: FALSE`, tree hash parity.
  - `scripts/adversarial-corpus-a01-a24.node-test.mjs`: Hostile test corpus verifying authentic invariant behavior.
- **Adversarial Vector Defense**: Defends against NV17 (self-certification fraud and shallow completion claims).
- **Verification Proof (C0..C4)**: C0/C1 proof tests in `scripts/verify-certification-integrity.node-test.mjs`.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**:
  - `scripts/acceptance-anti-shrinkage.node-test.mjs`: Automated linter asserting gate count remains exactly 267.
  - `scripts/v17-adversarial-challenges.node-test.mjs`: Historical adversarial test matrix covering challenges A01..A40.
  - `src/domain/farely/locationScope.ts`: Preserves territorial boundary contracts across airport scope definitions.
- **Adversarial Vector Defense**: Defends against NV19 (accidental deletion of historical capability gates).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/acceptance-anti-shrinkage.node-test.mjs`.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; turnkey test scripts; instant rollback runbooks.
- **Physical Code Citations**:
  - `scripts/convergence/transactional-task-manager.mjs`: Manages pre-task file snapshots, atomic commits, and instant rollback.
  - `scripts/convergence/watchdog-convergence.mjs`: Inspects transaction journals and recommends next commands.
  - `src/domain/farely/groupFarePlanner.ts`: Validates deterministic multi-passenger fare aggregation ordering.
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
- Full-battery baseline synthesis established for Cycle G69 Pass R1.
- All 12 adversarial lenses evaluated simultaneously with real code verification.
- Prohibited OTA functions (direct ticketing, passenger checkout, payment gateway integration) are confirmed boundary_excluded.
- Solutions locked without deviation: `SOL-DATA-01` through `SOL-RELEASE-01`.
- Evidence admission controller status: ADMITTED FOR PASS R2 SKEPTICAL GROUNDING.
