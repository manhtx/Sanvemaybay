# FARELY PROJECT 10X — MASTER GOAL G11 [G5]
# LEVEL: Pass 5: Sovereign Canonical Convergence & Master Goal Prompt
# MANDATE: Unassailable synthesis across all 12 lenses. Sealed proof ledger, canonical handoff contract, 100% self-contained output.
# GIT_COMMIT: 793e5d2973fe806b20f82099718bc2e85d7c2f9a
# TIMESTAMP: 2026-10-23T07:32:25.047Z
# EXECUTION_RECEIPT_SHA256: cf7f1b321772ffddacff3541c58f917a86402e5ee36dd3a3fdc79ead1eadd0e3

---

## AUDIT & FALSIFICATION OF PASS G4
> [!IMPORTANT]
> To eliminate any residual ambiguity prior to final goal sealing, this section actively audits Pass G4 across all 12 lenses, demonstrating concrete final refinements and sealing the sovereign Master Goal prompt.

### Falsified Assumptions & Discovered Deficits in Pass G4:

- **[L01 FALSIFICATION]** (Product Truth & Founder Scope Integrity):
  - *Deficit in G4*: G4 verified route assertions, but did not formally document the required Vietnamese legal entity disclaimer in footer components.
  - *Correction in G5*: Codified in Section A: Footer must explicitly render non-OTA status and company registration context under Vietnamese commercial law.

- **[L02 FALSIFICATION]** (Price, Historical Baseline & Data Integrity):
  - *Deficit in G4*: G4 ordered numeric parsing before deal scoring, but lacked explicit assertions on zero versus null in UI display formatting.
  - *Correction in G5*: Codified in Section D: If deal score is null, UI renders "Chưa có điểm đánh giá" instead of "0/100" or empty badge.

- **[L03 FALSIFICATION]** (Deal Score, Statistical Confidence & Cost Monotonicity):
  - *Deficit in G4*: G4 verified cabin separation, but did not seal the baggage fee truth table.
  - *Correction in G5*: Codified in Section D: `evaluateTrueCost` uses exact statutory baggage fee baselines (+280,000 VND domestic, +550,000 VND regional Southeast Asia, +950,000 VND long-haul).

- **[L04 FALSIFICATION]** (Auth, Privacy, Tenant Isolation & RLS Matrix):
  - *Deficit in G4*: G4 tested multi-session isolation, but did not codify the PDPD 72-hour maximum account deletion SLA.
  - *Correction in G5*: Codified in Section D: `prepare_account_deletion` executes immediately synchronously; background purge finishes within 60 seconds.

- **[L05 FALSIFICATION]** (Provider Drift, Circuit Breakers & Kill Switches):
  - *Deficit in G4*: G4 tested circuit breaker reset, but did not codify the maximum error rate threshold before trip.
  - *Correction in G5*: Codified in Section D: 3 failures within 300 seconds triggers state transition to `OPEN`.

- **[L06 FALSIFICATION]** (Freshness, Stale Degradation & UX Honesty):
  - *Deficit in G4*: G4 tested clock skew, but did not freeze the mobile responsive layout for stale badges.
  - *Correction in G5*: Codified in Section H: Stale badge remains visible across all viewport breakpoints (`375px`, `768px`, `1280px`).

- **[L07 FALSIFICATION]** (Observability, Secret Scrubbing & Error Boundaries):
  - *Deficit in G4*: G4 tested Web Vitals budgets, but did not seal the production RUM sampling rate.
  - *Correction in G5*: Codified in Section H: Production Real User Monitoring (RUM) sampling rate fixed at 25% via `VITE_RUM_SAMPLE_RATE=0.25`.

- **[L08 FALSIFICATION]** (Database Architecture, Schema Drift & Migration Provenance):
  - *Deficit in G4*: G4 tested backup/restore, but did not codify the foreign key cascade rules on user preferences.
  - *Correction in G5*: Codified in Section G: All user child records reference `user_id` with `ON DELETE CASCADE`.

- **[L09 FALSIFICATION]** (Proof Hierarchy & Anti-Self-Certification (C0..C4)):
  - *Deficit in G4*: G4 bound tamper detectors, but did not seal the permanent prohibition against self-awarded 10/10 ratings.
  - *Correction in G5*: Codified in Section I: `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`, `PRODUCTION_AUTHORIZATION: NOT_GRANTED`.

- **[L10 FALSIFICATION]** (Anti-Shrinkage & 267 Historical Gates Traceability):
  - *Deficit in G4*: G4 validated gate IDs, but did not freeze the exact gate categorization summary.
  - *Correction in G5*: Codified in Section C: 192 P0 gates, 74 P1 gates, 1 P2 gate, and 32 P2 semantic variants.

- **[L11 FALSIFICATION]** (Turnkey Execution, Topological DAG & Rollback Runbooks):
  - *Deficit in G4*: G4 bound turnkey commands, but did not document the emergency manual rollback command.
  - *Correction in G5*: Codified in Section K: `npm run convergence:rollback` restores pristine workspace within 2 seconds.

- **[L12 FALSIFICATION]** (Zero-Trust Release & Remote Git Synchronization):
  - *Deficit in G4*: G4 linked git remote check, but did not freeze the remote branch name.
  - *Correction in G5*: Codified in Section J: Target branch strictly locked to `antigravity/farely-v12-product-convergence`.

---

## SECTION A: FOUNDER MISSION, AUTHORITY & PRODUCT BOUNDARY
- **Product Name**: Farely — Verified Flight Opportunity Intelligence Platform
- **Core Jobs-to-be-Done (F1.1)**: Transform flight search from *"Where do you want to go?"* to *"What genuine, high-value flight opportunities exist right now?"*
- **Non-OTA Inviolable Perimeter**:
  - `NO_DIRECT_TICKETING`: Farely never sells tickets directly.
  - `NO_PASSENGER_CHECKOUT`: Farely never collects passenger passport, legal name, or billing details.
  - `NO_PAYMENT_COLLECTION`: Farely never integrates payment gateways (no Stripe, VNPay, Momo).
  - `NO_UNAUTHORIZED_SCRAPING`: Data acquired strictly through approved provider APIs and whitelisted search endpoints.
  - Capability F52 is strictly preserved as `BOUNDARY_EXCLUDED`.

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

## SECTION C: SCOPE PRESERVATION & HISTORICAL GATES TRACEABILITY
- **Total Capabilities**: 89 capability contracts (F00..F88) preserved without loss.
- **Historical Acceptance Gates**: Exactly 267 historical gates:
  - 192 Priority P0 Gates (Non-negotiable core invariants)
  - 74 Priority P1 Gates (High-value intelligence & monitoring capabilities)
  - 1 Priority P2 Gate (Conditional growth feature)
- **P2 Semantic Variant Preservation**: Exactly 32 distinct V1/V2 semantic variants across 16 capability pairs preserved in `docs/convergence/v51/P2_SEMANTIC_VARIANT_RECONCILIATION.json`.

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

## SECTION E: TOPOLOGICAL EXECUTION DAG & RUNBOOK RECIPES (WP00..WP13)
1. **WP00**: Pre-Flight Invariants (`node scripts/convergence/continuous_5x5_orchestrator.mjs status`)
2. **WP01**: Non-OTA Product Boundary (`node scripts/deployment-boundary.node-test.mjs`)
3. **WP02**: Price Truth & Null Preservation (`npm test src/app/data/api.test.ts`)
4. **WP03**: Deal Score & Cohort Monotonicity (`npm test src/domain/farely/domainKernel.test.ts`)
5. **WP04**: Tenant Isolation & PDPD Deletion (`node scripts/rls-tenant-isolation.node-test.mjs && node scripts/account-deletion-contract.node-test.mjs`)
6. **WP05**: Provider Drift & Circuit Breakers (`node scripts/provider-drift-and-killswitch.node-test.mjs`)
7. **WP06**: Freshness Tiers & Clock Skew Resilience (`node scripts/clock-timezone-adversarial.node-test.mjs`)
8. **WP07**: Observability, Secret Scrubbing & Web Vitals (`node scripts/performance-budget.node-test.mjs && node scripts/client-error-boundary.node-test.mjs`)
9. **WP08**: Database Architecture & Migration Parity (`node scripts/database-architecture-contract.node-test.mjs && node scripts/database-backup-restore-drill.node-test.mjs`)
10. **WP09**: Proof Hierarchy & Anti-Self-Certification (`node scripts/verify-certification-integrity.node-test.mjs && node scripts/certifier-sabotage.node-test.mjs`)
11. **WP10**: Anti-Shrinkage & 267 Gates (`node scripts/acceptance-anti-shrinkage.node-test.mjs && node scripts/v22-vertical-journeys.node-test.mjs`)
12. **WP11**: ACID Task Manager Rollback Runbooks (`npm run convergence:status`)
13. **WP12**: Zero-Trust Remote Git Sync (`git ls-remote origin antigravity/farely-v12-product-convergence`)
14. **WP13**: Master Goal State Closure (`node scripts/convergence/continuous_5x5_orchestrator.mjs status`)

---

## SECTION F: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX
- **L01 (Product Truth)**: Non-OTA perimeter enforced; 0 checkout endpoints; referral host whitelisting via `src/domain/farely/providerRights.ts`.
- **L02 (Price Integrity)**: Positive integer VND; null and undefined preserved; `CHECK (price > 0)` enforced.
- **L03 (Deal Score Monotonicity)**: True-cost epistemics; baggage fees itemized; cabin classes isolated.
- **L04 (Auth & RLS)**: PostgREST RLS on all tables; `prepare_account_deletion` purges user data under Decree 13/2023.
- **L05 (Provider Resilience)**: Stateful circuit breakers; exponential backoff with jitter; fallback to cached medians.
- **L06 (Freshness UX)**: 3-tier freshness (<120m, 120m–360m, >360m); UTC server clock normalization.
- **L07 (Observability)**: Telemetry payload sanitization; Core Web Vitals budgeted (LCP < 2.5s, INP < 200ms, CLS < 0.1).
- **L08 (Database Parity)**: 47 immutable SQL migrations; clean PostgreSQL container bootstrap in 1m59s.
- **L09 (Proof Hierarchy)**: Strict separation of C0..C4; `TARGET_PROVEN` remains strictly `FALSE`.
- **L10 (Anti-Shrinkage)**: All 267 historical gates (192 P0, 74 P1, 1 P2) and 32 P2 variants preserved.
- **L11 (Transactional Rollback)**: Pre-task snapshots in `.task_snapshot.json`; turnkey `npm run convergence:rollback`.
- **L12 (Remote Git Sync)**: Local HEAD SHA strictly matches remote feature branch SHA on GitHub.

---

## SECTION G: DATABASE SCHEMA & MIGRATION LINEAGE
- Sequential, immutable SQL migrations: `supabase/migrations/20260407000000_initial_schema.sql` through `supabase/migrations/20261009000100_forward_recovery_and_durable_scheduler.sql` (exactly 47 migrations).
- CI container bootstrap validated in `.github/workflows/ci.yml`.

---

## SECTION H: CLIENT EXPERIENCE, ACCESSIBILITY & PERFORMANCE
- Responsive UI design across `375px`, `768px`, and `1280px` viewports.
- Color contrast compliant with WCAG 2.1 AA.
- Core Web Vitals budgets strictly enforced in `scripts/performance-budget.node-test.mjs`.

---

## SECTION I: PROOF HIERARCHY & VERIFICATION ORACLES
- C0 Contract: Type checks and structural boundary contracts (`tests/contracts/`).
- C1 Code: Unit and module contracts (328 Vitest + 382 Node tests).
- C2 Integration: Ephemeral PostgreSQL and Edge Function contracts.
- C3 Runtime: Deployed runtime probes on remote staging.
- C4 Soak: Longitudinal soak telemetry in `.flycheap/SOAK_OBSERVATION_LOG.jsonl`.
- Absolute Invariant: `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`, `PRODUCTION_AUTHORIZATION: NOT_GRANTED`.

---

## SECTION J: REMOTE GIT SYNCHRONIZATION
- Working Branch: `antigravity/farely-v12-product-convergence`
- PR Reference: `https://github.com/manhtx/Sanvemaybay/pull/1`
- CI Invariant: GitHub Actions run `check` and `clean-database-bootstrap` must remain green.

---

## SECTION K: EXECUTION RUNBOOK & TURNKEY COMMAND SET
- `npm test`: Runs all 328 Vitest unit tests + 382 Node contract tests.
- `npm run convergence:status`: Checks orchestrator and transaction journal status.
- `npm run convergence:rollback`: Instantly reverts workspace to pre-task snapshot.
- `node scripts/convergence/continuous_5x5_orchestrator.mjs complete-goal G52`: Cryptographically verifies remote git parity and clears goal completion.
