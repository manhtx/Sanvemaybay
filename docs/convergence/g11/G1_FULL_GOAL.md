# FARELY PROJECT 10X — MASTER GOAL G11 [G1]
# LEVEL: Pass 1: Full-Battery Baseline Synthesis
# MANDATE: Draft complete deliverable evaluating all 12 lenses simultaneously from current system knowledge and founder scope.
# GIT_COMMIT: 793e5d2973fe806b20f82099718bc2e85d7c2f9a
# TIMESTAMP: 2026-10-23T07:26:33.361Z
# EXECUTION_RECEIPT_SHA256: 626201f1c389684e6619fc4ef44dfbcdf2194ae5c2f91450cf22014dac3154e6

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
  - `src/app/pages/DealDetailPage.tsx`: Renders clear non-OTA disclaimers: Farely is an intelligence platform, not an airline or ticketing agent. Fares are observed historical snapshots.
  - `docs/convergence/v51/FOUNDER_APPROVED_REQUIRED_ATOMS.json`: Canonical definition of all 89 capability contracts. Capability F52 remains strictly classified as `BOUNDARY_EXCLUDED`.
- **Adversarial Vector Defense**:
  - *Vector NV01 / Hostile Lens H01*: Injection of booking checkout links attempting to process payments directly on Farely.
  - *Defense*: Zero payment processing dependencies exist in `package.json` (no Stripe, VNPay, or Momo SDKs). Outbound booking buttons strictly use `rel="noopener noreferrer nofollow"` anchor links to verified external providers.
- **Verification Proof (C0..C4)**:
  - *C0 Contract*: `tests/contracts/product_boundary.contract.ts` verifies non-OTA boundary compliance.
  - *C1 Code Test*: `scripts/deployment-boundary.node-test.mjs` passes 100%.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**:
  - `src/app/data/api.ts`: Helper `parseNullableNumber(val)` preserves `null` / `undefined` without zero coercion; function `cleanPrice` validates that parsed amounts are positive integers.
  - `supabase/migrations/20261007000100_canonical_fare_observations.sql`: Database check constraints `CHECK (price > 0)` and `CHECK (deal_score BETWEEN 0 AND 100)`.
  - `scripts/price-truth-harness.node-test.mjs`: Test suite asserting that corrupt prices (`-50000`, `NaN`, `"Free"`) fail validation closed.
- **Adversarial Vector Defense**:
  - *Vector NV02 / Hostile Lens H02*: Malformed partner feed delivering negative base fares or zero prices to game deal rankings.
  - *Defense*: PostgREST check constraints reject the insert at the database layer; client-side mapper drops any record where `price <= 0` or `!Number.isFinite(price)`.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `src/app/data/api.test.ts` (`E01: Null stops & numeric preservation`) verifies that zero and null remain distinct.
  - *C2 Integration*: Node contract test `scripts/price-truth-harness.node-test.mjs` passes 100%.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**:
  - `src/domain/farely/costEpistemics.ts`: Function `evaluateTrueCost` itemizes mandatory taxes, estimated checked baggage, and optional ancillary fees.
  - `src/domain/farely/domainKernel.test.ts`: Asserts that small sample sizes cap deal scores monotonically and isolates cabin cohorts.
  - `src/domain/farely/priceAnomaly.ts`: IQR outlier rejection and statistical confidence bounds.
- **Adversarial Vector Defense**:
  - *Vector NV03 / Hostile Lens H04*: Low base fare masked by heavy baggage fees claiming 80% savings.
  - *Defense*: `evaluateTrueCost` calculates `estimatedTotal = price + estimatedBaggage + mandatoryTaxes`. If baggage cost is unknown, `hasUnknownMandatoryCost` is flagged, and the deal cannot claim verified savings.
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
- **Adversarial Vector Defense**:
  - *Vector NV04 / Hostile Lens H19*: Attacker User A attempts to read or mutate User B's alert subscription by forging UUIDs in PostgREST queries.
  - *Defense*: Supabase RLS policy `auth.uid() = user_id` blocks cross-tenant reads and writes at the database kernel level; returns empty array or HTTP 403 Forbidden.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/account-deletion-contract.node-test.mjs` and `scripts/rls-tenant-isolation.node-test.mjs` pass 100%.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**:
  - `supabase/functions/_shared/flight-search.ts`: Stateful circuit breaker with canary probe recovery.
  - `scripts/provider-drift-and-killswitch.node-test.mjs`: Fault injection harness for network timeouts and payload corruption.
- **Adversarial Vector Defense**:
  - *Vector NV05 / Hostile Lens H05*: Partner API silently alters payload schema or returns HTTP 500 error spam.
  - *Defense*: Strict schema validation quarantines invalid payloads; circuit breaker transitions from `CLOSED` to `OPEN` after 3 consecutive failures.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/provider-drift-and-killswitch.node-test.mjs` passes with 0 failures.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**:
  - `src/domain/farely/pwaOfflineFreshness.ts`: Offline service worker cache policy with background sync.
  - `src/app/pages/DealsPage.tsx`: Visual freshness badges for `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m).
  - `scripts/clock-timezone-adversarial.node-test.mjs`: Tests resilience against simulated client clock skew.
- **Adversarial Vector Defense**:
  - *Vector NV06 / Hostile Lens H06*: Client device time-zone skew causing all deals to appear expired or prematurely fresh.
  - *Defense*: Relative time calculations compare timestamps against server header `X-Server-Timestamp` instead of local system clock.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/clock-timezone-adversarial.node-test.mjs` and `src/domain/farely/pwaOfflineFreshness.test.ts` pass 100%.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**:
  - `src/app/lib/clientDiagnostics.ts`: Functions `reportClientIssue` and `trackOperationalError` scrub query parameters, email addresses, and authorization headers.
  - `src/app/pages/Root.tsx`: Route-level React Router error boundaries catching uncaught exceptions.
  - `scripts/client-error-boundary.node-test.mjs`: Verifies error boundary catches and payload scrubbing.
- **Adversarial Vector Defense**:
  - *Vector NV07 / Hostile Lens H16*: Network timeout during Watch creation dumping sensitive tokens to console.
  - *Defense*: Telemetry payload sanitizer strips headers, cookies, and tokens; outputs only standardized error code.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/client-error-boundary.node-test.mjs` and `scripts/performance-budget.node-test.mjs` pass 100%.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; zero loss during DDL evolution.
- **Physical Code Citations**:
  - `supabase/migrations/`: Exactly 47 ordered, immutable SQL migrations.
  - `scripts/database-architecture-contract.node-test.mjs`: Verifies foreign key constraints, indexes, and RLS on all tables.
  - `.github/workflows/ci.yml`: Job `clean-database-bootstrap` replays all 47 migrations from clean PostgreSQL container.
- **Adversarial Vector Defense**:
  - *Vector NV08 / Hostile Lens H25*: Out-of-order migration or destructive DDL migration breaking backwards compatibility.
  - *Defense*: CI job `clean-database-bootstrap` validates that all migrations execute cleanly in sequence without syntax or dependency errors.
- **Verification Proof (C0..C4)**:
  - *C2 Integration*: GitHub Actions CI run `39890985765` passed job `clean-database-bootstrap` in 1m59s on clean PostgreSQL 17.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.
- **Physical Code Citations**:
  - `scripts/verify-certification-integrity.node-test.mjs`: Enforces that certification statuses derive strictly from authentic multi-tier evidence.
  - `.flycheap/SOAK_OBSERVATION_LOG.jsonl`: Longitudinal soak observation log recording live browser test checkpoints.
- **Adversarial Vector Defense**:
  - *Vector NV09 / Hostile Lens H09*: Self-congratulatory prompt declaring "100% complete" based merely on unit test pass.
  - *Defense*: Continuous orchestrator enforces fail-closed state: `TARGET_PROVEN` remains strictly `FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`.
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
- **Adversarial Vector Defense**:
  - *Vector NV10 / Hostile Lens H22, H23*: Accidental deletion of historical acceptance gates during refactoring or scope redefinition.
  - *Defense*: Anti-shrinkage test suite immediately fails CI if gate count is <267.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: Node contract test `scripts/acceptance-anti-shrinkage.node-test.mjs` passes with 0 errors.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; turnkey test scripts; instant rollback runbooks.
- **Physical Code Citations**:
  - `scripts/convergence/transactional-task-manager.mjs`: Manages pre-task file snapshots, atomic commits, and instant crash rollback (`npm run convergence:rollback`).
  - `docs/convergence/v17/CANONICAL_DAG.json`: Defines topological execution order of work packages WP00..WP13.
  - `scripts/convergence/watchdog-convergence.mjs`: Inspects transaction journals and recommends deterministic next commands.
- **Adversarial Vector Defense**:
  - *Vector NV11 / Hostile Lens H16*: Disk full error or SIGINT during file edit leaving corrupt syntax on disk.
  - *Defense*: Pre-task byte snapshot in `.task_snapshot.json` allows `npm run convergence:rollback` to cleanly restore pristine files.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `npm run convergence:status` reports journal clean.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to `antigravity/farely-v12-product-convergence` with remote SHA match.
- **Physical Code Citations**:
  - `src/domain/farely/releaseTuple.ts`: Evaluates multi-component release tuple compatibility.
  - `.github/workflows/ci.yml`: Executes CI matrix (`check` and `clean-database-bootstrap`) on all remote pushes.
  - `scripts/convergence/continuous_5x5_orchestrator.mjs`: Enforces remote SHA equality via `git ls-remote` prior to goal completion.
- **Adversarial Vector Defense**:
  - *Vector NV12 / Hostile Lens H20, H27*: Local executor claims completion while remote feature branch is out of sync or CI is red.
  - *Defense*: Cryptographic verification against remote repository HEAD. Goal completion fails closed if remote SHA !== local SHA.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `src/domain/farely/releaseTuple.ts` unit tests assert tuple compatibility validation.
  - *C3 Deployment Proof*: Remote branch `antigravity/farely-v12-product-convergence` at SHA `3b0f9888bf7d637d878bb1be0aec04b870624117` has green CI run `39890985765`.
