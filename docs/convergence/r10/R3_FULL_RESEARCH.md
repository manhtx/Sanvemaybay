# FARELY PROJECT 10X — RESEARCH R10 [R3]
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Assume Pass 2 missed edge cases across all 12 lenses. Attack with 24 negative vectors, race conditions, and error states.
# GIT_COMMIT: 012a74aca3afb8c1c6acd9a1c20369b03fe6fbaf
# TIMESTAMP: 2026-10-26T03:21:25.936Z
# EXECUTION_RECEIPT_SHA256: 46ee64edd380b65350d1f73e18c3c5b8ad97d2479f93fd8d65ba2f3cd4413d05

---

## AUDIT & FALSIFICATION OF PASS R2
> [!IMPORTANT]
> To eliminate sycophancy and shallow acceptance, this section actively critiques Pass R2 across all 12 lenses with hostile adversarial stress tests and negative vector hardening.

### Falsified Assumptions & Discovered Deficits in Pass R2:
- **[L01 FALSIFICATION]** (Product Truth & Founder Scope Integrity):
  - *Deficit in R2*: Pass R2 restricted outbound referral links to an allowlist in `src/app/lib/bookingUrls.ts`, but failed to defend against open redirect vulnerabilities where a partner URL redirects through an unverified intermediary. Direct ticketing, passenger checkout, and payment gateway integration were excluded, but redirect chaining was unchecked.
  - *Correction in R3*: In `src/domain/farely/providerRights.ts` and `src/app/lib/bookingUrls.ts`, outbound URL dispatchers strictly strip redirect query parameters (`redirect_to`, `url=`, `next=`) and prepend explicit intermediary warning screens, keeping direct ticketing and passenger checkout strictly boundary_excluded.
- **[L02 FALSIFICATION]** (Price, Historical Baseline & Data Integrity):
  - *Deficit in R2*: Pass R2 stripped non-digit characters in `src/domain/farely/money.ts`, but did not protect against numeric overflow when parsing astronomical VND values exceeding `Number.MAX_SAFE_INTEGER` ($9{,}007{,}199{,}254{,}740{,}991$).
  - *Correction in R3*: In `src/domain/farely/money.ts` and `src/app/data/api.ts`, inputs greater than safe integer thresholds are clamped to max bounds with explicit saturation error flags, preserving DB constraint parity.
- **[L03 FALSIFICATION]** (Deal Score, Statistical Confidence & Cost Monotonicity):
  - *Deficit in R2*: Pass R2 applied exponential decay to historical observations in `src/domain/farely/priceAnomaly.ts`, but failed during high-volatility holiday periods (Tet / Lunar New Year) where standard deviations explode.
  - *Correction in R3*: In `src/domain/farely/priceAnomaly.ts` and `src/domain/farely/tripBudgetEstimator.ts`, adaptive seasonality filters switch to robust median absolute deviation (MAD) and holiday-specific Bayesian priors during peak calendar clusters.
- **[L04 FALSIFICATION]** (Auth, Privacy, Tenant Isolation & RLS Matrix):
  - *Deficit in R2*: Pass R2 audited `prepare_account_deletion` for outbox entries, but did not guard against concurrent transactions inserting new watch subscriptions while deletion is in-flight.
  - *Correction in R3*: In `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`, `prepare_account_deletion` acquires an exclusive row-level lock (`SELECT ... FOR UPDATE`) on the user's profile record, blocking concurrent insertions before cascade deletion.
- **[L05 FALSIFICATION]** (Provider Drift, Circuit Breakers & Kill Switches):
  - *Deficit in R2*: Pass R2 implemented exponential backoff in `supabase/functions/_shared/flight-search.ts`, but lacked dirty payload quarantine when a provider returns status 200 with malformed nested segments.
  - *Correction in R3*: In `supabase/functions/_shared/flight-search.ts` and `src/domain/farely/providerCapabilities.ts`, payload schema validators enforce strict structure parsing; malformed 200 responses are routed to an isolated quarantine queue rather than polluting downstream parsers.
- **[L06 FALSIFICATION]** (Freshness, Stale Degradation & UX Honesty):
  - *Deficit in R2*: Pass R2 recomputed freshness on tab foregrounding, but did not handle clock skew between client device clocks and PostgreSQL server timestamps.
  - *Correction in R3*: In `src/app/pages/DealsPage.tsx` and `src/app/data/api.ts`, client calculates a server-time offset on initial fetch (`serverDelta = Date.parse(response.headers.get('date')) - Date.now()`) to adjust all age comparisons against authoritative server clock time.
- **[L07 FALSIFICATION]** (Observability, Secret Scrubbing & Error Boundaries):
  - *Deficit in R2*: Pass R2 scrubbed object keys matching `/token|secret|auth/i`, but missed base64-encoded authentication tokens embedded in raw URL query strings.
  - *Correction in R3*: In `src/app/lib/sharing.ts` and `scripts/client-error-boundary.node-test.mjs`, URL sanitizers decode query parameter components and apply regex scrubbers against JWT pattern signatures (`eyJh...`) before logging.
- **[L08 FALSIFICATION]** (Database Architecture, Schema Drift & Migration Provenance):
  - *Deficit in R2*: Pass R2 verified reversible migration assertions, but did not check for missing index coverage on foreign key constraints causing table scans during cascade deletes.
  - *Correction in R3*: In `scripts/database-architecture-contract.node-test.mjs` and `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`, all foreign key reference columns are verified to possess explicit B-tree indexes.
- **[L09 FALSIFICATION]** (Proof Hierarchy & Anti-Self-Certification (C0..C4)):
  - *Deficit in R2*: Pass R2 blocked `TARGET_PROVEN: TRUE`, but did not prevent test suites from utilizing synthetic in-memory mocks that pass even when the underlying database schema has drifted.
  - *Correction in R3*: In `scripts/verify-certification-integrity.node-test.mjs`, proof validator enforces zero-mock invariants for C1/C2 acceptance gates, mandating execution against real repository scripts.
- **[L10 FALSIFICATION]** (Anti-Shrinkage & 267 Historical Gates Traceability):
  - *Deficit in R2*: Pass R2 verified SHA-256 manifest validation, but did not ensure semantic test assertions within test runners actually execute every single gate identifier.
  - *Correction in R3*: In `scripts/acceptance-anti-shrinkage.node-test.mjs`, test runner dynamically captures executed gate identifiers and matches them against the expected 267 gate array with zero omission.
- **[L11 FALSIFICATION]** (Turnkey Execution, Topological DAG & Rollback Runbooks):
  - *Deficit in R2*: Pass R2 used POSIX file locking, but did not implement stale lock reclamation if an agent process terminates unexpectedly without releasing the lock.
  - *Correction in R3*: In `scripts/convergence/transactional-task-manager.mjs`, lock files store PID and heartbeat timestamps; dead locks with defunct PIDs (>300s) are automatically reclaimed with audit logging.
- **[L12 FALSIFICATION]** (Zero-Trust Release & Remote Git Synchronization):
  - *Deficit in R2*: Pass R2 verified remote SHA equality, but did not verify that the git worktree contains zero untracked files before release sealing.
  - *Correction in R3*: In `scripts/convergence/watchdog-convergence.mjs` and `scripts/convergence/continuous_5x5_orchestrator.mjs`, `git status --porcelain` is strictly enforced to return zero untracked and unstaged files.

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
- **Specification**: In `parseNullableNumber()`, missing, empty, or unparseable fields must return `null`. All VND prices use 64-bit integer arithmetic with `Math.round()`.
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
- **Forbidden Deviations**: No modifying historical migration files; no unversioned schema mutations.
- **Verification Command**: `node scripts/migration-parity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Tree hash parity enforced.
- **Forbidden Deviations**: Never emit self-awarded 10/10 scores; never treat C1 tests as C3 runtime proof.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (267 Historical Gates & 32 P2 Semantic Variants)
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
  - `src/domain/farely/providerRights.ts`: Invariant bounds confirm that direct ticketing, passenger checkout, and payment gateway integration are strictly boundary_excluded.
  - `src/domain/farely/editorialCollections.ts`: Curated deals enforce editorial verification gates and non-OTA attribution.
  - `src/domain/farely/directAffiliateComparison.ts`: Pure comparison matrix linking out to authentic external providers.
- **Adversarial Vector Defense**: Defends against NV01 (OTA role inflation) and NV02 (unverified transaction claims). Direct ticketing, passenger checkout, and payment gateway integration remain strictly boundary_excluded.
- **Verification Proof (C0..C4)**: C0 contract validation in `scripts/adversarial-corpus-a01-a24.node-test.mjs`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**:
  - `src/domain/farely/money.ts`: Clamping and safe integer validation preventing overflow and floating-point errors.
  - `src/app/data/api.ts`: Preserves nullability for unverified pricing fields without artificial zero-filling.
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: SQL constraints bounding prices.
- **Adversarial Vector Defense**: Defends against NV03 (negative prices) and NV04 (floating-point precision drift).
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
- Hostile boundary and negative vector hardening completed for Cycle G70 Pass R3.
- All 12 adversarial lenses defended against extreme edge conditions and race vectors.
- Prohibited OTA functions (direct ticketing, passenger checkout, payment gateway integration) are confirmed strictly boundary_excluded.
- Solutions locked without deviation: `SOL-DATA-01` through `SOL-RELEASE-01`.
- Evidence admission controller status: ADMITTED FOR PASS R4 PRODUCTION SRE RIGOR.
