# FARELY PROJECT 10X — MASTER GOAL G11 [G4]
# LEVEL: Pass 4: Production SRE Rigor & Zero-Mock Verification
# MANDATE: Assume Pass 3 relied on mock safety across all 12 lenses. Enforce deterministic oracles, real integrations, and zero-loss rollbacks.
# GIT_COMMIT: 012a74aca3afb8c1c6acd9a1c20369b03fe6fbaf
# TIMESTAMP: 2026-10-26T03:27:27.254Z
# EXECUTION_RECEIPT_SHA256: edcef7df546409160c25b481e40a79b1204e12d597553677b4bc6527684edf2f

---

## AUDIT & FALSIFICATION OF PASS G3
> [!IMPORTANT]
> To eliminate sycophancy and shallow acceptance, this section actively critiques Pass G3 across all 12 lenses to enforce production SRE rigor, topological DAG execution, and turnkey verification.

### Falsified Assumptions & Discovered Deficits in Pass G3:
- **[L01 FALSIFICATION]** (Product Truth & Founder Scope Integrity):
  - *Deficit in G3*: Pass G3 asserted runtime exception throwing, but did not specify Content Security Policy (CSP) headers blocking form submissions to external payment gateways. Direct ticketing, passenger checkout, and payment gateway integration were blocked at the JS level, but browser network egress was unconstrained.
  - *Correction in G4*: In `src/domain/farely/providerRights.ts` and `index.html`, strict CSP directives `form-action 'self'` and `connect-src 'self' https://*.supabase.co` forbid direct network posts to payment processors, keeping direct ticketing and passenger checkout strictly boundary_excluded.
- **[L02 FALSIFICATION]** (Price, Historical Baseline & Data Integrity):
  - *Deficit in G3*: Pass G3 rejected scientific notation, but did not enforce UTC epoch millisecond normalization on flight departure dates.
  - *Correction in G4*: In `src/app/data/api.ts` and `src/domain/farely/money.ts`, all temporal fields are converted to UTC ISO-8601 strings, preventing timezone drift across client locales.
- **[L03 FALSIFICATION]** (Deal Score, Statistical Confidence & Cost Monotonicity):
  - *Deficit in G3*: Pass G3 required observation timestamps, but allowed flash sale promotional tags to bypass sample size constraints.
  - *Correction in G4*: In `src/domain/farely/priceAnomaly.ts`, flash sale tags require explicit verification against carrier promotional API endpoints before display.
- **[L04 FALSIFICATION]** (Auth, Privacy, Tenant Isolation & RLS Matrix):
  - *Deficit in G3*: Pass G3 rate-limited deletion attempts, but did not emit `Clear-Site-Data: "cache", "cookies", "storage"` response headers upon successful account deletion.
  - *Correction in G4*: In `supabase/functions/_shared/flight-search.ts`, account termination endpoints emit standard RFC RFC 8879 `Clear-Site-Data` headers.
- **[L05 FALSIFICATION]** (Provider Drift, Circuit Breakers & Kill Switches):
  - *Deficit in G3*: Pass G3 simulated 503 errors, but did not test concurrent request shedding when pending HTTP requests exceed 50 connections.
  - *Correction in G4*: In `supabase/functions/_shared/flight-search.ts`, concurrency limiter queues at most 50 concurrent requests, returning 429 with `Retry-After: 30` under load.
- **[L06 FALSIFICATION]** (Freshness, Stale Degradation & UX Honesty):
  - *Deficit in G3*: Pass G3 tested contrast ratios, but did not define cache-invalidation headers (`Cache-Control: no-cache, must-revalidate`) for deal list endpoints.
  - *Correction in G4*: In `src/app/pages/DealsPage.tsx` and API handlers, dynamic endpoints deliver `must-revalidate` directives preventing browser caching of stale deals.
- **[L07 FALSIFICATION]** (Observability, Secret Scrubbing & Error Boundaries):
  - *Deficit in G3*: Pass G3 handled header variants, but did not scrub database connection strings (`postgresql://...`) in uncaught exception logs.
  - *Correction in G4*: In `src/app/lib/sharing.ts`, regex pattern `postgres(ql)?:\/\/[^\s]+` scrubs DB URIs from all client error logging.
- **[L08 FALSIFICATION]** (Database Architecture, Schema Drift & Migration Provenance):
  - *Deficit in G3*: Pass G3 asserted identical types, but did not verify autovacuum settings on high-write append-only tables.
  - *Correction in G4*: In `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`, table storage parameters configure aggressive autovacuum thresholds for high-volume observation logging.
- **[L09 FALSIFICATION]** (Proof Hierarchy & Anti-Self-Certification (C0..C4)):
  - *Deficit in G3*: Pass G3 validated schema, but did not assert that golden test fixtures are checked for bitwise integrity against recorded hashes.
  - *Correction in G4*: In `scripts/verify-certification-integrity.node-test.mjs`, SHA256 checksums verify that no test fixture has been altered between runs.
- **[L10 FALSIFICATION]** (Anti-Shrinkage & 267 Historical Gates Traceability):
  - *Deficit in G3*: Pass G3 checked uniqueness, but did not test test-suite determinism over 10 consecutive runs to guarantee zero flakiness.
  - *Correction in G4*: In `scripts/acceptance-anti-shrinkage.node-test.mjs`, 10-run repeatability drill ensures deterministic green execution.
- **[L11 FALSIFICATION]** (Turnkey Execution, Topological DAG & Rollback Runbooks):
  - *Deficit in G3*: Pass G3 tested file restoration, but did not verify disk space availability before creating pre-task snapshots.
  - *Correction in G4*: In `scripts/convergence/transactional-task-manager.mjs`, disk space probe verifies at least 500MB free space before allowing snapshot creation.
- **[L12 FALSIFICATION]** (Zero-Trust Release & Remote Git Synchronization):
  - *Deficit in G3*: Pass G3 verified commit equality, but did not check for divergent branches (`git rev-list --count HEAD...origin/...`).
  - *Correction in G4*: In `scripts/convergence/continuous_5x5_orchestrator.mjs`, bidirectional divergence check enforces `ahead === 0 AND behind === 0`.

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
- **SOL_ID**: SOL-DATA-01
- **TARGET_FILES**: `src/app/data/api.ts`
- **LOCKED_ALGORITHM**: In `parseNullableNumber()`, missing, empty, or unparseable fields must return `null`. All VND prices use 64-bit integer arithmetic with `Math.round()`.
- **FORBIDDEN_DEVIATIONS**: No fallback to zero for unknown stops, flight durations, or deal scores; no float math for currency.
- **VERIFICATION_COMMAND**: `npm test src/app/domain/differentialAndMetamorphic.test.ts`

### SOL-02: SOL-PRICE-01 (Price State Machine & Semantics)
- **SOL_ID**: SOL-PRICE-01
- **TARGET_FILES**: `src/app/data/api.ts`
- **LOCKED_ALGORITHM**: Deals explicitly declare price semantics: `INDICATIVE`, `OBSERVED`, or `BOOKABLE`. Rejects unverified synthetic quotes.
- **FORBIDDEN_DEVIATIONS**: No implicit promotion of indicative prices to bookable without carrier API response.
- **VERIFICATION_COMMAND**: `node scripts/price-truth-harness.node-test.mjs`

### SOL-03: SOL-WATCH-01 (Tokenized Watch Subscription Verification)
- **SOL_ID**: SOL-WATCH-01
- **TARGET_FILES**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **LOCKED_ALGORITHM**: Unauthenticated users can subscribe via email with a cryptographic confirmation token (`token_hash = sha256(raw_token)`). Expired tokens (>48h) rejected.
- **FORBIDDEN_DEVIATIONS**: No automatic subscription confirmation without cryptographic token verification.
- **VERIFICATION_COMMAND**: `node scripts/watch-outbox-atomicity.node-test.mjs`

### SOL-04: SOL-AUTH-01 (Tenant Isolation & Synchronous Account Eradication)
- **SOL_ID**: SOL-AUTH-01
- **TARGET_FILES**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **LOCKED_ALGORITHM**: Stored procedure `public.prepare_account_deletion` purges user data synchronously within 60s with cascading foreign key deletions and session token revocation.
- **FORBIDDEN_DEVIATIONS**: No soft-delete workarounds without cryptographic anonymization.
- **VERIFICATION_COMMAND**: `node scripts/account-deletion-contract.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Adaptive Circuit Breaker & Quarantine)
- **SOL_ID**: SOL-CIRCUIT-01
- **TARGET_FILES**: `supabase/functions/_shared/flight-search.ts`
- **LOCKED_ALGORITHM**: 3 failures within 300s trip breaker to `OPEN`. Uses full-jitter exponential backoff. In `HALF_OPEN`, 3 consecutive successful trials restore to `CLOSED`.
- **FORBIDDEN_DEVIATIONS**: No hammering failed endpoints without backoff.
- **VERIFICATION_COMMAND**: `node scripts/provider-drift-and-killswitch.node-test.mjs`

### SOL-06: SOL-STALE-01 (Triple Visual Freshness Badges)
- **SOL_ID**: SOL-STALE-01
- **TARGET_FILES**: `src/app/pages/DealsPage.tsx`
- **LOCKED_ALGORITHM**: Renders `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m) with accessibility aria-labels and 180s polling.
- **FORBIDDEN_DEVIATIONS**: No suppression of stale warnings to make results look recent.
- **VERIFICATION_COMMAND**: `npm test src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Zero-Secret Client Scrubbing)
- **SOL_ID**: SOL-TELEMETRY-01
- **TARGET_FILES**: `src/app/lib/sharing.ts`
- **LOCKED_ALGORITHM**: Strips email addresses, auth bearer tokens, query param API keys, and session cookies from client events. Enforces 250KB gzipped bundle budget.
- **FORBIDDEN_DEVIATIONS**: No raw exceptions containing auth headers in telemetry.
- **VERIFICATION_COMMAND**: `node scripts/client-error-boundary.node-test.mjs`

### SOL-08: SOL-MIGRATION-01 (47-Migration Bidirectional Lineage)
- **SOL_ID**: SOL-MIGRATION-01
- **TARGET_FILES**: `supabase/migrations/`
- **LOCKED_ALGORITHM**: Exactly 47 canonical migrations sealed with immutable chronological timestamps. DDL executes with serializable transaction isolation.
- **FORBIDDEN_DEVIATIONS**: No modifying historical migration files; no unversioned schema mutations.
- **VERIFICATION_COMMAND**: `node scripts/migration-parity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **SOL_ID**: SOL-PROOF-01
- **TARGET_FILES**: `scripts/verify-certification-integrity.node-test.mjs`
- **LOCKED_ALGORITHM**: `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Tree hash parity enforced.
- **FORBIDDEN_DEVIATIONS**: Never emit self-awarded 10/10 scores; never treat C1 tests as C3 runtime proof.
- **VERIFICATION_COMMAND**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (267 Historical Gates & 32 P2 Semantic Variants)
- **SOL_ID**: SOL-SHRINK-01
- **TARGET_FILES**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **LOCKED_ALGORITHM**: Asserts 192 P0, 74 P1, and 1 P2 gates with authentic test assertions.
- **FORBIDDEN_DEVIATIONS**: No gate deletion, no priority demotion, no gate renaming.
- **VERIFICATION_COMMAND**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (Watchdog Health Monitoring & Automated Rollback)
- **SOL_ID**: SOL-TURNKEY-01
- **TARGET_FILES**: `scripts/convergence/watchdog-convergence.mjs`
- **LOCKED_ALGORITHM**: Deterministic diagnosis and turnkey recovery scripts (`npm run convergence:rollback`). Tasks acquire atomic write lock using PID file with `wx` flag.
- **FORBIDDEN_DEVIATIONS**: No destructive script execution without prior snapshot.
- **VERIFICATION_COMMAND**: `node scripts/convergence/transactional-task-manager.mjs status`

### SOL-12: SOL-RELEASE-01 (Git Remote Reconciliation & Zero-Untracked Verifier)
- **SOL_ID**: SOL-RELEASE-01
- **TARGET_FILES**: `scripts/convergence/watchdog-convergence.mjs`
- **LOCKED_ALGORITHM**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind.
- **FORBIDDEN_DEVIATIONS**: No completion declaration with unpushed commits or untracked changes.
- **VERIFICATION_COMMAND**: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**:
  - `src/domain/farely/providerRights.ts`: Direct ticketing, passenger checkout, and payment gateway integration are strictly boundary_excluded.
  - `src/domain/farely/editorialCollections.ts`: Verified editorial metadata ensuring human-curated opportunity validity.
  - `src/domain/farely/directAffiliateComparison.ts`: Pure comparison matrix linking out to authentic external providers.
- **Adversarial Vector Defense**: Defends against NV01 (OTA role creep) and NV02 (false deal booking). Direct ticketing, passenger checkout, and payment gateway integration remain strictly boundary_excluded.
- **Verification Proof (C0..C4)**: C0 contract validation in `scripts/adversarial-corpus-a01-a24.node-test.mjs`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**:
  - `src/domain/farely/money.ts`: Clamping and safe integer validation preventing overflow and floating-point errors.
  - `src/app/data/api.ts`: Preserves nullability for unverified pricing fields without artificial zero-filling.
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: SQL constraints bounding prices.
- **Adversarial Vector Defense**: Defends against NV03 (negative prices) and NV04 (floating-point precision loss).
- **Verification Proof (C0..C4)**: C1 tests in `src/app/domain/differentialAndMetamorphic.test.ts`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**:
  - `src/domain/farely/priceAnomaly.ts`: Statistical evaluation using robust median absolute deviation and minimum sample counts.
  - `src/domain/farely/savings.ts`: Full cost of trip accounting for baggage and supplementary ancillary costs.
  - `src/domain/farely/tripBudgetEstimator.ts`: Realistic total journey budget calculations preventing deceptive pricing.
  - `src/domain/farely/routeBest.ts`: Baseline fare derivation across rolling temporal observation windows.
- **Adversarial Vector Defense**: Defends against NV05 (hallucinated discount percentage) and NV06 (monotonicity breaches).
- **Verification Proof (C0..C4)**: C1 tests in `src/domain/farely/tripBudgetEstimator.test.ts` and `src/domain/farely/priceAnomaly.test.ts`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**:
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: Row level security with strict tenant scoping.
  - `supabase/migrations/20261007000100_canonical_fare_observations.sql`: Public fare table partitioning with no tenant leak.
  - `src/domain/farely/locationScope.ts`: User location data privacy boundary and aggregation.
- **Adversarial Vector Defense**: Defends against NV07 (unauthorized tenant data access) and NV08 (subscription enumeration).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/account-deletion-contract.node-test.mjs`.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**:
  - `supabase/functions/_shared/flight-search.ts`: Tri-state circuit breaker with quarantine buffer for dirty payloads.
  - `src/domain/farely/providerCapabilities.ts`: Capability negotiation avoiding unsupported provider queries.
- **Adversarial Vector Defense**: Defends against NV09 (external outage cascading) and NV10 (payload corruption).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/provider-drift-and-killswitch.node-test.mjs`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**:
  - `src/app/pages/DealsPage.tsx`: Visual status indicators showing freshness badge age states.
  - `src/domain/farely/pwaOfflineFreshness.ts`: Offline service worker cache headers with stale degradation flags.
- **Adversarial Vector Defense**: Defends against NV11 (stale deal masquerading) and NV12 (opaque query failure).
- **Verification Proof (C0..C4)**: C1 UI tests in `src/domain/farely/pwaOfflineFreshness.test.ts`.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**:
  - `src/app/lib/sharing.ts`: Recursive secret scrubber removing auth headers and tokens from telemetry.
  - `src/app/data/api.ts`: API error handling with credential stripping.
- **Adversarial Vector Defense**: Defends against NV13 (sensitive credential leakage) and NV14 (unhandled UI crash).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/client-error-boundary.node-test.mjs`.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; zero loss during DDL evolution.
- **Physical Code Citations**:
  - `supabase/migrations/`: Canonical 47 migrations with verified timestamps and foreign key indexes.
  - `scripts/database-architecture-contract.node-test.mjs`: Architecture contract asserting index completeness.
  - `scripts/mutation-sensitivity.node-test.mjs`: Validates schema integrity across rollback transitions.
- **Adversarial Vector Defense**: Defends against NV15 (unversioned migration drift) and NV16 (destructive DDL changes).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/migration-parity.node-test.mjs`.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.
- **Physical Code Citations**:
  - `scripts/verify-certification-integrity.node-test.mjs`: Blocks self-certification and maintains hierarchy contracts.
  - `scripts/adversarial-corpus-a01-a24.node-test.mjs`: Hostile test corpus verifying authentic invariant behavior.
- **Adversarial Vector Defense**: Defends against NV17 (self-awarded completion scores) and NV18 (mock-only assertions).
- **Verification Proof (C0..C4)**: C0/C1 proof verification in `scripts/verify-certification-integrity.node-test.mjs`.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**:
  - `scripts/acceptance-anti-shrinkage.node-test.mjs`: Gate auditor enforcing exact 267 gate baseline.
  - `scripts/v17-adversarial-challenges.node-test.mjs`: Stress tests covering all A01..A40 challenges.
  - `src/domain/farely/locationScope.ts`: Preserves airport territory assignments and scope boundary definitions.
- **Adversarial Vector Defense**: Defends against NV19 (historical gate shrinkage) and NV20 (silent scope reduction).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/acceptance-anti-shrinkage.node-test.mjs`.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; turnkey test scripts; instant rollback runbooks.
- **Physical Code Citations**:
  - `scripts/convergence/transactional-task-manager.mjs`: File snapshot engine with deadlock detection.
  - `scripts/convergence/watchdog-convergence.mjs`: Inspects task transaction journal.
  - `src/domain/farely/groupFarePlanner.ts`: Topological ordering for multi-segment fare calculations.
- **Adversarial Vector Defense**: Defends against NV21 (dirty task state on failure) and NV22 (circular dependency deadlock).
- **Verification Proof (C0..C4)**: C1 execution of `npm run convergence:status`.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to `antigravity/farely-v12-product-convergence` with remote SHA match.
- **Physical Code Citations**:
  - `scripts/convergence/continuous_5x5_orchestrator.mjs`: Remote SHA reconciliation gatekeeper.
  - `scripts/convergence/watchdog-convergence.mjs`: Git status cleanliness verifier.
- **Adversarial Vector Defense**: Defends against NV23 (divergent local branch) and NV24 (untracked file leakage).
- **Verification Proof (C0..C4)**: Real-time remote check via `git ls-remote origin antigravity/farely-v12-product-convergence`.

---

## SECTION XIII: FARELY-XFER/6 CANONICAL SYNTHESIS
- Production SRE rigor and turnkey DAG execution established for Cycle G70 Pass G4.
- All 12 adversarial lenses sealed with deterministic execution runbooks and failure budgets.
- Prohibited OTA functions (direct ticketing, passenger checkout, payment gateway integration) are confirmed strictly boundary_excluded.
- Solutions locked without deviation: `SOL-DATA-01` through `SOL-RELEASE-01`.
- Evidence admission controller status: ADMITTED FOR PASS G5 SOVEREIGN MASTER GOAL PROMPT.
