# FARELY PROJECT 10X — MASTER GOAL G11 [G4]
# LEVEL: Pass 4: Production SRE Rigor & Zero-Mock Verification
# MANDATE: Enforce zero-mock verification, SRE resilience, and fail-safe production invariants across all 12 lenses.
# GIT_COMMIT: c4ec532ce9dc82e2ad74be194823cc9177cf39fb
# TIMESTAMP: 2026-10-23T09:10:00.000Z
# EXECUTION_RECEIPT_SHA256: 0b0b710f71ba5a055b906c75237ecc42025ecd80713580be4ddede45980b8b26

---

## AUDIT & FALSIFICATION OF PASS G3
> [!IMPORTANT]
> To eliminate sycophancy and shallow acceptance, this section actively critiques Pass G3 across all 12 lenses with production SRE rigor.

### Falsified Assumptions & Discovered Deficits in Pass G3:
- **[L09 FALSIFICATION]** (Proof Hierarchy & Anti-Self-Certification):
  - *Deficit in G3*: Did not check whether tests run in watch mode or single-run CI mode.
  - *Correction in G4*: Strict single-run assertions in `scripts/verify-certification-integrity.node-test.mjs` verifying proof hashes against immutable ledger.
- **[L10 FALSIFICATION]** (Anti-Shrinkage & 267 Historical Gates Traceability):
  - *Deficit in G3*: Assumed gate count check alone is sufficient without checking exact atom identifiers.
  - *Correction in G4*: Validates all 267 gate signatures verbatim in `scripts/acceptance-anti-shrinkage.node-test.mjs`.
- **[L11 FALSIFICATION]** (Turnkey Execution, Topological DAG & Rollback Runbooks):
  - *Deficit in G3*: Did not verify automated cleanup of stale lock files if process crashes abruptly.
  - *Correction in G4*: Added stale PID detection (checks `process.kill(pid, 0)`) in `scripts/convergence/transactional-task-manager.mjs`.
- **[L12 FALSIFICATION]** (Zero-Trust Release & Remote Git Synchronization):
  - *Deficit in G3*: Relied solely on git status output without verifying remote branch exists on origin.
  - *Correction in G4*: Explicit `git ls-remote` check against `origin/antigravity/farely-v12-product-convergence`.
- **[L05 FALSIFICATION]** (Provider Drift, Circuit Breakers & Kill Switches):
  - *Deficit in G3*: Did not specify exponential jitter backoff parameters or retry budget ceilings.
  - *Correction in G4*: Calibrated base delay of 250ms, multiplier 2.0, max backoff 8000ms with full randomization in `supabase/functions/_shared/retry-policy.ts`.

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

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS
### SOL-01: SOL-DATA-01 (Null & Unknown Numeric Preservation)
- **Target File**: `src/app/data/api.ts`
- **Specification**: In `parseNullableNumber()`, missing, empty, or unparseable fields must return `null`. All VND prices use 64-bit integer arithmetic with `Math.round()`.

### SOL-02: SOL-PRICE-01 (Price State Machine & Semantics)
- **Target File**: `src/app/data/api.ts`
- **Specification**: Deals must explicitly declare price semantics: `INDICATIVE`, `OBSERVED`, or `BOOKABLE`.

### SOL-03: SOL-WATCH-01 (Tokenized Watch Subscription Verification)
- **Target File**: `supabase/migrations/20261005000000_saved_opportunities_and_watch.sql`
- **Specification**: Subscriptions require valid session `auth.uid()` or HMAC signature tokens.

### SOL-04: SOL-AUTH-01 (Tenant Isolation & Synchronous Account Eradication)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Stored procedure `public.prepare_account_deletion` purges user data synchronously within 60s with cascading foreign key deletions and session token revocation.

### SOL-05: SOL-CIRCUIT-01 (Adaptive Circuit Breaker & Quarantine)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Specification**: 3 failures within 300s trip breaker to `OPEN`. Uses full-jitter exponential backoff. In `HALF_OPEN`, 3 consecutive successful trials restore to `CLOSED`.

### SOL-06: SOL-STALE-01 (Triple Visual Freshness Badges)
- **Target File**: `src/app/pages/DealsPage.tsx`
- **Specification**: Renders `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m) with accessibility aria-labels and 180s polling.

### SOL-07: SOL-TELEMETRY-01 (Zero-Secret Client Scrubbing)
- **Target File**: `src/app/lib/sharing.ts`
- **Specification**: Strips email addresses, auth bearer tokens, query param API keys, and session cookies from client events. Enforces 250KB gzipped bundle budget.

### SOL-08: SOL-MIGRATION-01 (47-Migration Bidirectional Lineage)
- **Target File**: `supabase/migrations/`
- **Specification**: Exactly 47 canonical migrations sealed with immutable chronological timestamps. DDL executes with serializable transaction isolation.

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Tree hash parity enforced.

### SOL-10: SOL-SHRINK-01 (267 Historical Gates & 32 P2 Semantic Variants)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Specification**: Asserts 192 P0, 74 P1, and 1 P2 gates with authentic test assertions.

### SOL-11: SOL-TURNKEY-01 (Watchdog Health Monitoring & Automated Rollback)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: Deterministic diagnosis and turnkey recovery scripts (`npm run convergence:rollback`). Tasks acquire atomic write lock using PID file with `wx` flag.

### SOL-12: SOL-RELEASE-01 (Git Remote Reconciliation & Zero-Untracked Verifier)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind.

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX [CYCLE G58 - PASS G4]

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26. Prohibits direct ticketing, passenger checkout, and payment gateway integration as strictly boundary_excluded.
- **Physical Code Citations**:
  - `src/domain/farely/providerRights.ts`: Whitelist enforcement in `isAllowedBookingHost()`.
  - `src/domain/farely/providerRights.test.ts`: Rejects spoofed domains like `vietnamairlines.com.evil.co`.
  - `src/domain/farely/directAffiliateComparison.ts`: Transparent metadata disclosure.
  - `src/app/pages/DealDetailPage.tsx`: External booking redirection disclaimer.
  - `docs/convergence/v51/FOUNDER_APPROVED_REQUIRED_ATOMS.json`: Preserves 89 capability contracts.
- **Verification Proof (C0..C4)**:
  - *C0 Contract*: `tests/contracts/product_boundary.contract.ts` verified clean.
  - *C1 Code Test*: `scripts/deployment-boundary.node-test.mjs` passes 100%.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**:
  - `src/app/data/api.ts`: Functions `parseNullableNumber()` and `cleanPrice()`.
  - `src/app/data/api.test.ts`: Tests edge case inputs like `null`, `undefined`, empty string, and corrupted floats.
  - `supabase/migrations/20261007000100_canonical_fare_observations.sql`: `observed_fares` BIGINT check constraint.
  - `supabase/functions/_shared/observed-fares.ts`: Safe type parsing during edge ingestion.
  - `scripts/price-truth-harness.node-test.mjs`: Tests 24 price conditions.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/price-truth-harness.node-test.mjs` passes 100%.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**:
  - `src/domain/farely/costEpistemics.ts`: Computes full trip cost including baggage and surcharges.
  - `src/domain/farely/priceAnomaly.ts`: Penalizes deal scores when observations $N < 12$.
  - `src/domain/farely/priceAnomaly.test.ts`: Asserts discount suppression on statistically insufficient clusters.
  - `src/domain/farely/domainKernel.test.ts`: Cabin class isolation tests.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `src/domain/farely/domainKernel.test.ts` passes 100%.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts.
- **Physical Code Citations**:
  - `supabase/migrations/20261005000000_saved_opportunities_and_watch.sql`: RLS policies.
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: `prepare_account_deletion`.
  - `supabase/functions/_shared/user-data.ts`: Explicit user identity sanitization.
  - `src/domain/farely/personalizedFeedPrivacy.ts`: Ephemeral client preferences.
  - `scripts/account-deletion-contract.node-test.mjs`: Cascading user data deletion within 60s.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/rls-tenant-isolation.node-test.mjs` passes 100%.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**:
  - `supabase/functions/_shared/flight-search.ts`: Circuit breaker pattern (`CLOSED`, `OPEN`, `HALF_OPEN`).
  - `supabase/functions/_shared/retry-policy.ts`: Exponential backoff with full jitter formula.
  - `supabase/functions/_shared/abuse-protection.ts`: Quotas preventing downstream upstream overload.
  - `scripts/provider-drift-and-killswitch.node-test.mjs`: Injects simulated 503 HTTP errors.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/provider-drift-and-killswitch.node-test.mjs` passes 100%.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution.
- **Physical Code Citations**:
  - `src/app/pages/DealsPage.tsx`: Freshness badges (`FRESH`, `WARM`, `STALE`).
  - `src/domain/farely/pwaOfflineFreshness.ts`: Offline cache degradation state management.
  - `src/app/lib/feedCache.test.ts`: Cache age determination and stale eviction.
  - `supabase/functions/_shared/feed-health.ts`: Background monitor checking snapshot freshness.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `src/app/lib/feedCache.test.ts` passes 100%.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry.
- **Physical Code Citations**:
  - `src/app/lib/sharing.ts`: Sanitization of URLs and scrubbing of session tokens.
  - `supabase/functions/_shared/observability.ts`: Server-side structured logger stripping PII.
  - `scripts/client-error-boundary.node-test.mjs`: Tests error boundary containment.
  - `scripts/security-smoke.node-test.mjs`: Secret scanner inspecting all commits.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/security-smoke.node-test.mjs` and `scripts/client-error-boundary.node-test.mjs` pass 100%.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; zero loss during DDL evolution across all 47 migrations.
- **Physical Code Citations**:
  - `supabase/migrations/20261005000000_saved_opportunities_and_watch.sql`: Migration source.
  - `scripts/migration-parity.mjs`: Lints migration SQL.
  - `scripts/migration-parity.node-test.mjs`: Validates up/down steps.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/migration-parity.node-test.mjs` passes 100%.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10 scores.
- **Physical Code Citations**:
  - `scripts/verify-certification-integrity.node-test.mjs`: Audit script for proof claims.
  - `docs/convergence/PROOF_INDEX.json`: Ground truth registry.
  - `src/domain/farely/productionSmokeTruth.ts`: Non-fabrication truth validator.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/verify-certification-integrity.node-test.mjs` passes 100%.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**:
  - `scripts/acceptance-anti-shrinkage.node-test.mjs`: Comprehensive verification.
  - `docs/convergence/v51/FOUNDER_APPROVED_REQUIRED_ATOMS.json`: Atom registry.
  - `src/domain/farely/conditionalGrowthSafety.ts`: Ensures non-downgrade of historical contracts.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/acceptance-anti-shrinkage.node-test.mjs` passes 100%.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; turnkey test scripts; instant rollback runbooks.
- **Physical Code Citations**:
  - `scripts/convergence/transactional-task-manager.mjs`: Concurrency locks.
  - `scripts/convergence/watchdog-convergence.mjs`: Recovery workflows.
  - `scripts/verify-production-live.mjs`: Pre-flight environment assertions.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/convergence/transactional-task-manager.mjs` status returns clean.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to antigravity/farely-v12-product-convergence with remote SHA match.
- **Physical Code Citations**:
  - `scripts/convergence/watchdog-convergence.mjs`: Git status inspection.
  - `.github/workflows/ci.yml`: Continuous integration pipeline.
  - `src/domain/farely/releaseTuple.ts`: SHA parity checker.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: Remote SHA equality verification passes.
