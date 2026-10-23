# FARELY PROJECT 10X — MASTER GOAL G11 [G4]
# LEVEL: Pass 4: Topological Task Ordering & Automated Verification Commands
# MANDATE: Enforce strict topological execution DAG (WP00..WP13), turnkey test commands, and fail-closed verification oracles across all 12 lenses.
# GIT_COMMIT: 793e5d2973fe806b20f82099718bc2e85d7c2f9a
# TIMESTAMP: 2026-10-23T07:30:33.193Z
# EXECUTION_RECEIPT_SHA256: d5607e23ae210b7315edf3b3565b653170197b5e072916122b811613979aabd6

---

## AUDIT & FALSIFICATION OF PASS G3
> [!IMPORTANT]
> To eliminate execution deadlocks, ungrounded task ordering, and manual intervention, this section actively audits Pass G3 across all 12 lenses, demonstrating concrete topological deficits and establishing automated execution verification commands in Pass G4.

### Falsified Assumptions & Discovered Deficits in Pass G3:

- **[L01 FALSIFICATION]** (Product Truth & Founder Scope Integrity):
  - *Deficit in G3*: G3 specified route checks, but did not define the automated assertion command to execute in CI.
  - *Correction in G4*: Bound WP01 to turnkey command `node scripts/deployment-boundary.node-test.mjs`, asserting that the route tree contains 0 payment or checkout routes.

- **[L02 FALSIFICATION]** (Price, Historical Baseline & Data Integrity):
  - *Deficit in G3*: G3 tested numeric null preservation, but lacked an automated topological dependency ordering (numeric parsing must land before deal score calculation).
  - *Correction in G4*: Positioned WP02 (`SOL-DATA-01`, `SOL-PRICE-01`) as a strict prerequisite to WP03 (`SOL-ALERT-01`), verified by `npm test src/app/data/api.test.ts`.

- **[L03 FALSIFICATION]** (Deal Score, Statistical Confidence & Cost Monotonicity):
  - *Deficit in G3*: G3 required monotonic penalties, but did not define the automated test command exercising cabin cohort isolation.
  - *Correction in G4*: Bound WP03 to command `npm test src/domain/farely/domainKernel.test.ts`, asserting that economy and business cohorts never cross-pollinate.

- **[L04 FALSIFICATION]** (Auth, Privacy, Tenant Isolation & RLS Matrix):
  - *Deficit in G3*: G3 ran concurrent session tests, but did not topologically order RLS migration execution before alert API testing.
  - *Correction in G4*: Positioned WP04 after schema verification; verified by `node scripts/rls-tenant-isolation.node-test.mjs` and `node scripts/account-deletion-contract.node-test.mjs`.

- **[L05 FALSIFICATION]** (Provider Drift, Circuit Breakers & Kill Switches):
  - *Deficit in G3*: G3 simulated provider failures, but lacked automated circuit reset testing in the test harness.
  - *Correction in G4*: Bound WP05 to `node scripts/provider-drift-and-killswitch.node-test.mjs`, verifying complete transition cycle (`CLOSED` -> `OPEN` -> `HALF_OPEN` -> `CLOSED`).

- **[L06 FALSIFICATION]** (Freshness, Stale Degradation & UX Honesty):
  - *Deficit in G3*: G3 filtered stale email deals, but did not define the automated clock skew test command.
  - *Correction in G4*: Bound WP06 to `node scripts/clock-timezone-adversarial.node-test.mjs`, asserting timestamp comparison validity across extreme timezone shifts.

- **[L07 FALSIFICATION]** (Observability, Secret Scrubbing & Error Boundaries):
  - *Deficit in G3*: G3 tested modal render errors, but did not bind Core Web Vitals assertions to CI commands.
  - *Correction in G4*: Bound WP07 to `node scripts/performance-budget.node-test.mjs` and `node scripts/client-error-boundary.node-test.mjs`.

- **[L08 FALSIFICATION]** (Database Architecture, Schema Drift & Migration Provenance):
  - *Deficit in G3*: G3 checked foreign keys, but lacked a topological lock preventing migration edits after bootstrap.
  - *Correction in G4*: Bound WP08 to `node scripts/database-architecture-contract.node-test.mjs` and `node scripts/database-backup-restore-drill.node-test.mjs`.

- **[L09 FALSIFICATION]** (Proof Hierarchy & Anti-Self-Certification (C0..C4)):
  - *Deficit in G3*: G3 had a tamper detector, but did not bind verification status derivation to the primary CI pipeline.
  - *Correction in G4*: Bound WP09 to `node scripts/verify-certification-integrity.node-test.mjs` and `node scripts/certifier-sabotage.node-test.mjs`.

- **[L10 FALSIFICATION]** (Anti-Shrinkage & 267 Historical Gates Traceability):
  - *Deficit in G3*: G3 checked P2 growth features, but lacked an automated command validating all 267 gate IDs simultaneously.
  - *Correction in G4*: Bound WP10 to `node scripts/acceptance-anti-shrinkage.node-test.mjs` and `node scripts/v22-vertical-journeys.node-test.mjs`.

- **[L11 FALSIFICATION]** (Turnkey Execution, Topological DAG & Rollback Runbooks):
  - *Deficit in G3*: G3 verified task rollback, but did not provide turnkey npm scripts in `package.json`.
  - *Correction in G4*: Bound WP11 to `npm run convergence:status` and `npm run convergence:rollback`.

- **[L12 FALSIFICATION]** (Zero-Trust Release & Remote Git Synchronization):
  - *Deficit in G3*: G3 checked working tree cleanliness, but did not link local commit verification directly to GitHub remote branch tracking.
  - *Correction in G4*: Bound WP12 to `node scripts/convergence/continuous_5x5_orchestrator.mjs complete-goal G52`.

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
- **SOL_ID**: SOL-01 / SOL-DATA-01
- **TARGET_FILES**: `src/app/data/api.ts`
- **LOCKED_ALGORITHM**: `parseNullableNumber(val)` preserves `null` and `undefined` without coercion to 0. All mappers treat `null !== 0` and `undefined !== 0` as inviolate invariants.
- **FORBIDDEN_DEVIATIONS**: No fallback to zero for unknown stops, flight durations, or deal scores; no signature modification.
- **VERIFICATION_COMMAND**: `npm test src/app/data/api.test.ts`

### SOL-DATA-01: Null & Unknown Numeric Preservation
- **SOL_ID**: SOL-DATA-01
- **TARGET_FILES**: `src/app/data/api.ts`
- **LOCKED_ALGORITHM**: `parseNullableNumber(val)` preserves `null` and `undefined` without coercion to 0. All mappers treat `null !== 0` and `undefined !== 0` as inviolate invariants.
- **FORBIDDEN_DEVIATIONS**: No fallback to zero for unknown stops, flight durations, or deal scores; no signature modification.
- **VERIFICATION_COMMAND**: `npm test src/app/data/api.test.ts`

### SOL-PRICE-01: True-Cost Epistemic Separation
- **SOL_ID**: SOL-PRICE-01
- **TARGET_FILES**: `src/app/data/api.ts`
- **LOCKED_ALGORITHM**: Decouples `costBreakdown` from deal objects. Evaluates true cost by itemizing base fare, mandatory airport taxes, and estimated checked baggage without overwriting `advertisedTotal`.
- **FORBIDDEN_DEVIATIONS**: No combining advertised fare with estimated baggage without clear visual separation in UI.
- **VERIFICATION_COMMAND**: `npm test src/app/data/api.test.ts`

### SOL-IDENT-01: Exact Deal ID Query Resolution
- **SOL_ID**: SOL-IDENT-01
- **TARGET_FILES**: `src/app/data/api.ts`
- **LOCKED_ALGORITHM**: `getDealById(id)` matches requested ID exactly against cache and database; eliminates unverified singleton fallbacks.
- **FORBIDDEN_DEVIATIONS**: No returning first deal in array when requested deal ID is not found; must throw or return null.
- **VERIFICATION_COMMAND**: `npm test src/app/data/api.test.ts`

### SOL-WATCH-01: Anonymous Alert ID Verification
- **SOL_ID**: SOL-WATCH-01
- **TARGET_FILES**: `src/app/data/watchApi.ts`
- **LOCKED_ALGORITHM**: `getWatchSnapshot(alertId)` validates server-returned alert ID before returning snapshot data to client.
- **FORBIDDEN_DEVIATIONS**: No returning unvalidated alert snapshots across mismatched alert IDs.
- **VERIFICATION_COMMAND**: `npm test src/app/data/api.test.ts`

### SOL-ALERT-01: Strict Route Intent Matching
- **SOL_ID**: SOL-ALERT-01
- **TARGET_FILES**: `supabase/functions/alert-processor/index.ts`
- **LOCKED_ALGORITHM**: Enforces stop constraints and route intent matching (`matchesAlertRouteIntent`) in alert evaluation pipelines.
- **FORBIDDEN_DEVIATIONS**: No notifying non-stop subscribers with 1-stop or 2-stop flight observations.
- **VERIFICATION_COMMAND**: `npm test`

### SOL-AUTH-01: PostgREST RLS Multi-Tenant Isolation
- **SOL_ID**: SOL-AUTH-01
- **TARGET_FILES**: `supabase/migrations/20261005000000_saved_opportunities_and_watch.sql`
- **LOCKED_ALGORITHM**: PostgREST Row Level Security (RLS) enforcing `auth.uid() = user_id` on all user-owned tables.
- **FORBIDDEN_DEVIATIONS**: No disabling RLS on user tables; no creating bypass policies for anonymous users.
- **VERIFICATION_COMMAND**: `node scripts/rls-tenant-isolation.node-test.mjs`

### SOL-CLEAN-01: Idempotent PDPD Account Deletion
- **SOL_ID**: SOL-CLEAN-01
- **TARGET_FILES**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **LOCKED_ALGORITHM**: Atomic security function `prepare_account_deletion(target_user_id)` completely wipes personal alerts, saved opportunities, and preference data under Decree 13/2023.
- **FORBIDDEN_DEVIATIONS**: No soft-deleting personal records when deletion is requested; must purge completely.
- **VERIFICATION_COMMAND**: `node scripts/account-deletion-contract.node-test.mjs`

### SOL-SHRINK-01: Anti-Shrinkage Historical Preservation
- **SOL_ID**: SOL-SHRINK-01
- **TARGET_FILES**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **LOCKED_ALGORITHM**: Enforces presence and traceability of all 267 historical acceptance gates (192 P0, 74 P1, 1 P2) and 32 P2 semantic variants.
- **FORBIDDEN_DEVIATIONS**: No dropping, renumbering, or deleting historical gates.
- **VERIFICATION_COMMAND**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-DAG-01: ACID Transactional Task Manager
- **SOL_ID**: SOL-DAG-01
- **TARGET_FILES**: `scripts/convergence/transactional-task-manager.mjs`
- **LOCKED_ALGORITHM**: Manages atomic file pre-task snapshots with SHA-256 pre-image hashes and instant rollback runbooks (`npm run convergence:rollback`).
- **FORBIDDEN_DEVIATIONS**: No editing files without active snapshot; no partial multi-file mutations.
- **VERIFICATION_COMMAND**: `npm run convergence:status`

### SOL-10: SOL-REL-01 (Remote Git Synchronization & SHA Equality)
- **SOL_ID**: SOL-10 / SOL-REL-01
- **TARGET_FILES**: `scripts/convergence/continuous_5x5_orchestrator.mjs`
- **LOCKED_ALGORITHM**: Enforces remote SHA equality via `git ls-remote` before goal clearance. Local HEAD SHA must match remote feature branch SHA.
- **FORBIDDEN_DEVIATIONS**: No closing goal on local commits; no force pushes bypassing CI.
- **VERIFICATION_COMMAND**: `npm test`

### SOL-REL-01: Remote Git Synchronization & SHA Equality
- **SOL_ID**: SOL-REL-01
- **TARGET_FILES**: `scripts/convergence/continuous_5x5_orchestrator.mjs`
- **LOCKED_ALGORITHM**: Enforces remote SHA equality via `git ls-remote` before goal clearance. Local HEAD SHA must match remote feature branch SHA.
- **FORBIDDEN_DEVIATIONS**: No closing goal on local commits; no force pushes bypassing CI.
- **VERIFICATION_COMMAND**: `npm test`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**:
  - `src/domain/farely/providerRights.ts`: Method `isAllowedBookingHost` validates booking referral domains (`google.com`, `travelpayouts.com`, `aviasales.com`), blocking non-whitelisted URLs.
  - `src/app/pages/DealDetailPage.tsx`: Outbound referral links rendered with `rel="noopener noreferrer nofollow"`.
  - `docs/convergence/v51/FOUNDER_APPROVED_REQUIRED_ATOMS.json`: Canonical definition of all 89 capability contracts. Capability F52 is strictly preserved as `BOUNDARY_EXCLUDED`.
- **Verification Proof (C0..C4)**:
  - *C0 Contract*: `tests/contracts/product_boundary.contract.ts` verifies non-OTA boundary compliance.
  - *C1 Code Test*: `scripts/deployment-boundary.node-test.mjs` passes 100%.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**:
  - `src/app/data/api.ts`: Functions `parseNullableNumber` and `cleanPrice` strictly sanitize incoming numeric values.
  - `supabase/migrations/20261007000100_canonical_fare_observations.sql`: Database check constraints `CHECK (price > 0)` and `CHECK (deal_score BETWEEN 0 AND 100)`.
  - `scripts/price-truth-harness.node-test.mjs`: Test suite asserting that corrupt prices (`-50000`, `NaN`, `"Free"`) fail validation closed.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `src/app/data/api.test.ts` (`E01: Null stops & numeric preservation`) verifies that zero and null remain distinct.
  - *C2 Integration*: Node contract test `scripts/price-truth-harness.node-test.mjs` passes 100%.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**:
  - `src/domain/farely/costEpistemics.ts`: Function `evaluateTrueCost` itemizes mandatory taxes, estimated checked baggage, and optional ancillary fees.
  - `src/domain/farely/domainKernel.test.ts`: Cabin class isolation and sample size bounds.
  - `src/domain/farely/priceAnomaly.ts`: IQR outlier rejection and statistical confidence bounds.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `src/domain/farely/domainKernel.test.ts` asserts that small sample sizes cap deal scores.
  - *C1 Code Test*: `src/app/data/api.test.ts` verifies `costBreakdown` attachment and separation of advertised vs estimated total.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**:
  - `supabase/migrations/20261005000000_saved_opportunities_and_watch.sql`: Enables PostgREST Row Level Security (RLS) on all user-facing tables (`user_alerts`, `user_saved_opportunities`, `watch_condition_episodes`).
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: Provides atomic security function `prepare_account_deletion(target_user_id)` for Vietnam PDPD (Decree 13/2023) compliance.
  - `src/app/data/watchApi.ts`: Enforces tenant isolation; queries `user_alerts` strictly by `eq("user_id", user.id)` for authenticated users.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/account-deletion-contract.node-test.mjs` and `scripts/rls-tenant-isolation.node-test.mjs` pass 100%.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**:
  - `supabase/functions/_shared/flight-search.ts`: Stateful circuit breaker with canary probe recovery.
  - `scripts/provider-drift-and-killswitch.node-test.mjs`: Fault injection harness for network timeouts and payload corruption.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/provider-drift-and-killswitch.node-test.mjs` passes with 0 failures.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**:
  - `src/domain/farely/pwaOfflineFreshness.ts`: Offline service worker cache policy with background sync.
  - `src/app/pages/DealsPage.tsx`: Visual freshness badges for `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m).
  - `scripts/clock-timezone-adversarial.node-test.mjs`: Tests resilience against simulated client clock skew.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/clock-timezone-adversarial.node-test.mjs` and `src/domain/farely/pwaOfflineFreshness.test.ts` pass 100%.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**:
  - `src/app/lib/clientDiagnostics.ts`: Functions `reportClientIssue` and `trackOperationalError` scrub query parameters, email addresses, and authorization headers.
  - `src/app/pages/Root.tsx`: Route-level React Router error boundaries catching uncaught exceptions.
  - `scripts/client-error-boundary.node-test.mjs`: Verifies error boundary catches and payload scrubbing.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/client-error-boundary.node-test.mjs` and `scripts/performance-budget.node-test.mjs` pass 100%.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; zero loss during DDL evolution.
- **Physical Code Citations**:
  - `supabase/migrations/`: Exactly 47 ordered, immutable SQL migrations.
  - `scripts/database-architecture-contract.node-test.mjs`: Verifies foreign key constraints, indexes, and RLS on all tables.
  - `.github/workflows/ci.yml`: Job `clean-database-bootstrap` replays all 47 migrations from clean PostgreSQL container.
- **Verification Proof (C0..C4)**:
  - *C2 Integration*: GitHub Actions CI run `39890985765` passed job `clean-database-bootstrap` in 1m59s on clean PostgreSQL 17.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.
- **Physical Code Citations**:
  - `scripts/verify-certification-integrity.node-test.mjs`: Enforces that certification statuses derive strictly from authentic multi-tier evidence.
  - `.flycheap/SOAK_OBSERVATION_LOG.jsonl`: Longitudinal soak observation log recording live browser test checkpoints.
- **Verification Proof (C0..C4)**:
  - *C0 Contract*: `tests/contracts/anti_self_certification.contract.ts` passes.
  - *C1 Code Test*: Vitest suite (328 tests) passes with 0 failures.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**:
  - `docs/convergence/v51/HISTORICAL_ACCEPTANCE_267.json`: Master registry of all 267 historical gates (192 P0, 74 P1, 1 P2).
  - `docs/convergence/v51/P2_SEMANTIC_VARIANT_RECONCILIATION.json`: Preserves 32 distinct V1/V2 semantic variants across 16 capability pairs.
  - `scripts/acceptance-anti-shrinkage.node-test.mjs`: Automated linter asserting that gate count never decreases.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: Node contract test `scripts/acceptance-anti-shrinkage.node-test.mjs` passes with 0 errors.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; turnkey test scripts; instant rollback runbooks.
- **Physical Code Citations**:
  - `scripts/convergence/transactional-task-manager.mjs`: Manages pre-task file snapshots, atomic commits, and instant crash rollback (`npm run convergence:rollback`).
  - `docs/convergence/v17/CANONICAL_DAG.json`: Defines topological execution order of work packages WP00..WP13.
  - `scripts/convergence/watchdog-convergence.mjs`: Inspects transaction journals and recommends deterministic next commands.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `npm run convergence:status` reports journal clean.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to `antigravity/farely-v12-product-convergence` with remote SHA match.
- **Physical Code Citations**:
  - `src/domain/farely/releaseTuple.ts`: Evaluates multi-component release tuple compatibility.
  - `.github/workflows/ci.yml`: Executes CI matrix (`check` and `clean-database-bootstrap`) on all remote pushes.
  - `scripts/convergence/continuous_5x5_orchestrator.mjs`: Enforces remote SHA equality via `git ls-remote` prior to goal completion.
---

## SECTION E: TOPOLOGICAL EXECUTION DAG & RUNBOOK RECIPES (WP00..WP13)

### WP00: Canonical Invariants, Submodule Locks & Pre-Flight Receipt
- **Prerequisites**: Clean working tree on `antigravity/farely-v12-product-convergence`.
- **Target Files**: `docs/convergence/state/CURRENT_EXECUTION_RECEIPT.json`, `docs/convergence/v17/CANONICAL_DAG.json`
- **Execution Command**: `node scripts/convergence/continuous_5x5_orchestrator.mjs status`
- **Verification Criteria**: Cryptographic receipt age < 60 minutes; git tree clean; 0 unresolved merge conflicts.

### WP01: Product Truth, Non-OTA Boundary & Clean Referral Anchors
- **Prerequisites**: WP00
- **Target Files**: `src/domain/farely/providerRights.ts`, `src/app/pages/DealDetailPage.tsx`
- **Execution Command**: `node scripts/deployment-boundary.node-test.mjs`
- **Verification Criteria**: Zero checkout endpoints; all booking referral URLs strictly validated via `isAllowedBookingHost`.

### WP02: Price Truth, Null Preservation & Numeric Epistemics
- **Prerequisites**: WP00, WP01
- **Target Files**: `src/app/data/api.ts` (`SOL-DATA-01`, `SOL-PRICE-01`)
- **Execution Command**: `npm test src/app/data/api.test.ts`
- **Verification Criteria**: `parseNullableNumber` preserves `null` / `undefined`; `cleanPrice` validates positive integer VND.

### WP03: Deal Score, Statistical Cohorts & Monotonicity Enforcers
- **Prerequisites**: WP02
- **Target Files**: `src/domain/farely/costEpistemics.ts`, `src/domain/farely/domainKernel.test.ts`
- **Execution Command**: `npm test src/domain/farely/domainKernel.test.ts`
- **Verification Criteria**: Monotonic deal score penalty for small cohorts ($N < 12$); cabin classes strictly separated.

### WP04: Auth, Tenant Isolation & Idempotent PDPD Account Deletion
- **Prerequisites**: WP02
- **Target Files**: `supabase/migrations/20261005000000_saved_opportunities_and_watch.sql`, `src/app/data/watchApi.ts` (`SOL-AUTH-01`, `SOL-CLEAN-01`)
- **Execution Command**: `node scripts/rls-tenant-isolation.node-test.mjs && node scripts/account-deletion-contract.node-test.mjs`
- **Verification Criteria**: PostgREST RLS blocks cross-tenant reads; `prepare_account_deletion` purges personal records under Decree 13/2023.

### WP05: Provider Drift, Circuit Breakers & Ingestion Quota Handling
- **Prerequisites**: WP02
- **Target Files**: `supabase/functions/_shared/flight-search.ts`, `scripts/provider-drift-and-killswitch.node-test.mjs`
- **Execution Command**: `node scripts/provider-drift-and-killswitch.node-test.mjs`
- **Verification Criteria**: Circuit breaker transitions cleanly across `CLOSED`, `OPEN`, `HALF_OPEN`; fallback to cached medians on 503.

### WP06: Freshness Degradation, UTC Time Normalization & Offline PWA
- **Prerequisites**: WP02
- **Target Files**: `src/domain/farely/pwaOfflineFreshness.ts`, `src/app/pages/DealsPage.tsx`
- **Execution Command**: `node scripts/clock-timezone-adversarial.node-test.mjs && npm test src/domain/farely/pwaOfflineFreshness.test.ts`
- **Verification Criteria**: Deals >360m display zinc warning badges; relative times calculated against server UTC header `X-Server-Timestamp`.

### WP07: Observability, Error Boundaries & Core Web Vitals
- **Prerequisites**: WP01, WP04
- **Target Files**: `src/app/lib/clientDiagnostics.ts`, `src/app/pages/Root.tsx`
- **Execution Command**: `node scripts/performance-budget.node-test.mjs && node scripts/client-error-boundary.node-test.mjs`
- **Verification Criteria**: Telemetry scrubs PII and auth tokens; LCP < 2500ms, INP < 200ms, CLS < 0.1 budget met.

### WP08: Database Bootstrap, Migration Lineage & Clean Parity
- **Prerequisites**: WP00
- **Target Files**: `supabase/migrations/` (all 47 files)
- **Execution Command**: `node scripts/database-architecture-contract.node-test.mjs && node scripts/database-backup-restore-drill.node-test.mjs`
- **Verification Criteria**: All 47 migrations execute cleanly in sequence without drift; full backup and restore drill passes with 100% table parity.

### WP09: Proof Hierarchy, Multi-Tier Contracts & Anti-Self-Certification
- **Prerequisites**: WP01..WP08
- **Target Files**: `scripts/verify-certification-integrity.node-test.mjs`, `scripts/certifier-sabotage.node-test.mjs`
- **Execution Command**: `node scripts/verify-certification-integrity.node-test.mjs && node scripts/certifier-sabotage.node-test.mjs`
- **Verification Criteria**: Certification levels derive dynamically; tampering detector blocks self-certification attempts.

### WP10: Anti-Shrinkage, 267 Historical Gates & P2 Semantic Variants
- **Prerequisites**: WP09
- **Target Files**: `docs/convergence/v51/HISTORICAL_ACCEPTANCE_267.json`, `docs/convergence/v51/P2_SEMANTIC_VARIANT_RECONCILIATION.json`
- **Execution Command**: `node scripts/acceptance-anti-shrinkage.node-test.mjs && node scripts/v22-vertical-journeys.node-test.mjs`
- **Verification Criteria**: All 267 historical gates (192 P0, 74 P1, 1 P2) and 32 P2 semantic variants verified intact.

### WP11: ACID Transactional Execution, Task Manager & Rollback Runbooks
- **Prerequisites**: WP00..WP10
- **Target Files**: `scripts/convergence/transactional-task-manager.mjs` (`SOL-DAG-01`)
- **Execution Command**: `npm run convergence:status`
- **Verification Criteria**: Transaction journal clean; pre-task snapshots verify deterministic rollback runbook.

### WP12: Sovereign Zero-Trust Synchronization, Git Parity & CI Green
- **Prerequisites**: WP11
- **Target Files**: `scripts/convergence/continuous_5x5_orchestrator.mjs` (`SOL-REL-01`)
- **Execution Command**: `git ls-remote origin antigravity/farely-v12-product-convergence`
- **Verification Criteria**: Local HEAD SHA strictly equals remote feature branch SHA; GitHub Actions CI run green.

### WP13: Final Audit Verification & Canonical Checkpoint Closure
- **Prerequisites**: WP00..WP12
- **Target Files**: `docs/convergence/state/loop_state.json`, `docs/convergence/state/12_LENS_EVOLUTION_LEDGER.json`
- **Execution Command**: `node scripts/convergence/continuous_5x5_orchestrator.mjs status`
- **Verification Criteria**: All 10 passes (R1..R5, G1..G5) completed and cryptographically attested in durable ledger.
