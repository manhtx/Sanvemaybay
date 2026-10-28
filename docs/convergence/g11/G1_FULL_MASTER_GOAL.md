# FARELY PROJECT 10X — MASTER GOAL G11 [G1]
# LEVEL: Pass 1: Lossless Structural Projection A–K
# MANDATE: Project FARELY-XFER/6 into an 11-section A–K Master Goal across all 12 adversarial lenses with strict Solution Cage locking.
# GIT_COMMIT: 774b3d00f9bd9e105ba466c058e428935b211847
# TIMESTAMP: 2026-10-27T10:36:12.108Z
# EXECUTION_RECEIPT_SHA256: 81cfec59e03e191e2aaf6a90888eb4460b9b7704de3fe4ceed066dd53285ed57

---

## SECTION A: OBJECTIVE & MANDATE
This Master Goal defines the turnkey execution package for Cycle G92 of Farely Project 10X. All work packages are strictly bound to verified solutions from Research R10 (`docs/convergence/r10/R5_FULL_RESEARCH.md`). The executor is granted zero degrees of freedom to deviate, weaken, or omit any locked requirements.

Target Modules:
1. `src/domain/farely/comparator.ts` & `src/domain/farely/comparator.test.ts` [PROPOSED_NEW]
2. `src/domain/farely/costEpistemics.ts` & `src/domain/farely/costEpistemics.test.ts` [PROPOSED_NEW]
3. `src/domain/farely/savings.ts` & `src/domain/farely/savings.test.ts` [PROPOSED_NEW]

---

## SECTION B: INVARIANT EXECUTOR CAGE
- `INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION`
- `NO_DIRECT_TICKETING`: Farely does not issue airline tickets, manage PNR records directly, or process ticket issuance.
- `NO_PASSENGER_CHECKOUT`: Farely never collects passenger passport numbers, never handles credit card numbers, and never operates a checkout cart. All bookings route externally via deep links with verified affiliate parameters.
- `NO_SELF_CERTIFICATION`: All gates must be certified by independent, automated Vitest and Node native test executions.
- `NO_CONTRACT_SHRINKAGE`: All 89 capability contracts (F00..F88) and 267 historical acceptance gates remain immutable.

---

## SECTION C: TARGET MODULES & WORK PACKAGES
- **WP01-COMPARATOR-EVIDENCE-ROBUSTNESS**:
  - Target: `src/domain/farely/comparator.ts`, `src/domain/farely/comparator.test.ts` [PROPOSED_NEW]
  - Guard `compareAgainstCohort` against non-positive (`<= 0`) or non-finite `currentPrice`, failing closed to `INSUFFICIENT` evidence.
  - Remove departure date fallback when `observedAt` is missing to enforce REQ-COMP-004.
  - Validate `o.observedAt` timestamp formatting before extracting calendar day or hourly scan epoch.
  - Enforce zero-dispersion caveat: when all historical prices are identical (`validPrices[0] === validPrices[validPrices.length - 1]`), require $\ge 10\%$ drop before assigning discount labels.
  - Create comprehensive unit test suite in `src/domain/farely/comparator.test.ts` [PROPOSED_NEW].

- **WP02-COSTEPISTEMICS-TRANSPARENCY-GUARD**:
  - Target: `src/domain/farely/costEpistemics.ts`, `src/domain/farely/costEpistemics.test.ts` [PROPOSED_NEW]
  - Guard `evaluateTrueCost` against negative base fares by sanitizing `basePrice = Math.max(0, Number.isFinite(params.basePrice) ? params.basePrice : 0)`.
  - Add Pacific Airlines (`BL`) to `BUDGET_CARRIER_CODES`.
  - Guarantee `params.isBaggageExplicitlyIncluded === true` or `params.providerVerifiedAllIn === true` strictly takes precedence over airline default heuristics.
  - Create comprehensive unit test suite in `src/domain/farely/costEpistemics.test.ts` [PROPOSED_NEW] verifying REQ-COST-001 through REQ-COST-005.

- **WP03-SAVINGS-RELATIVE-VALUE-BOUNDS**:
  - Target: `src/domain/farely/savings.ts`, `src/domain/farely/savings.test.ts` [PROPOSED_NEW]
  - Filter `calculateSavings` inputs with strict `Number.isFinite` guards to eliminate IEEE 754 NaN bypasses.
  - Guarantee that when `savingsAmount <= 0`, `savingsAmount = 0`, `savingsPercent = 0`, and `isSaving = false`.
  - Create comprehensive unit test suite in `src/domain/farely/savings.test.ts` [PROPOSED_NEW] testing boundary values, zero savings, and non-finite inputs.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS
The solutions are locked directly from verified Research R10 Section XIII:
1. `comparator.ts`: In `compareAgainstCohort`, if `!Number.isFinite(currentPrice) || currentPrice <= 0`, return `INSUFFICIENT` result immediately. Eradicate `departLocalDate` fallback in distinct day computation. Enforce zero-dispersion caveat.
2. `costEpistemics.ts`: Sanitize `params.basePrice` with non-negative finite check. Register `BL` in `BUDGET_CARRIER_CODES`. Explicit bundle flags override budget carrier baggage heuristic.
3. `savings.ts`: Strict finite verification on both observed and benchmark prices. Normalize non-positive savings amount and percent to 0.

---

## SECTION E: EXECUTION TOPOLOGY & ACID PIPELINE
- Task 1: `WP01-COMPARATOR-EVIDENCE-ROBUSTNESS`
- Task 2: `WP02-COSTEPISTEMICS-TRANSPARENCY-GUARD`
- Task 3: `WP03-SAVINGS-RELATIVE-VALUE-BOUNDS`
- Execution: `scripts/convergence/transactional-task-manager.mjs` executes tasks transactionally with full rollback capability.

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:97-165`, `src/domain/farely/costEpistemics.ts:1-75`
- **Adversarial Vector Defense**: Defends against NEG-01 and NEG-34. True cost evaluation respects explicit provider inclusion over generic heuristics.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts:96-150`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**: `src/domain/farely/savings.ts:17-38`, `src/domain/farely/comparator.ts:101-107`
- **Adversarial Vector Defense**: Defends against NEG-04 and NEG-08. Input prices and fee amounts are strictly validated as positive finite numbers.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/domainKernel.test.ts:74-95`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:60-92`, `src/domain/farely/costEpistemics.ts:27-47`
- **Adversarial Vector Defense**: Defends against NEG-09. Evidence level determines verdict labels; zero-dispersion cohorts cannot claim spurious discounts.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**: `src/domain/farely/costEpistemics.ts:27-47`, `supabase/migrations/20261022000001_watch_condition_episodes.sql:20-55`
- **Adversarial Vector Defense**: Defends against NEG-19 and NEG-20. Pure domain functions do not touch user credentials or persist unvetted state.
- **Verification Proof (C0..C4)**: C2 Integration test in `scripts/database-architecture-contract.node-test.mjs`.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**: `src/domain/farely/costEpistemics.ts:65-75`, `src/domain/farely/providerCapabilities.ts:1-50`
- **Adversarial Vector Defense**: Defends against NEG-12. Unknown ancillary fees fail closed to `UNKNOWN` cost epistemic state.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:8-12`, `src/domain/farely/pwaOfflineFreshness.ts:25-50`
- **Adversarial Vector Defense**: Defends against NEG-10 and NEG-35. Observation dates must be authentic UTC timestamps and never alias departure dates.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/domainKernel.test.ts`.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:31-34`, `src/domain/farely/costEpistemics.ts:18-25`
- **Adversarial Vector Defense**: Defends against NEG-39. Discrete typed error reasons ensure auditable system observability.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; single open episode constraint.
- **Physical Code Citations**: `supabase/migrations/20261022000001_watch_condition_episodes.sql:1-60`
- **Adversarial Vector Defense**: Defends against NEG-22. Atomic transitions prevent duplicate notifications during retries.
- **Verification Proof (C0..C4)**: C2 Integration test in `scripts/database-architecture-contract.node-test.mjs`.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.
- **Physical Code Citations**: `docs/convergence/ACCEPTANCE_REGISTRY_FINAL.json:1-120`
- **Adversarial Vector Defense**: Defends against NEG-40. Code proof (C1) does not substitute for contract proof (C0) or runtime proof (C3).
- **Verification Proof (C0..C4)**: Full test execution suite (Vitest + Node test).

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**: `scripts/verify-certification-integrity.node-test.mjs:1-120`
- **Adversarial Vector Defense**: Defends against NEG-30 and NEG-33. Traceability verified across all historical gates.
- **Verification Proof (C0..C4)**: C0 Contract proof in `scripts/verify-certification-integrity.node-test.mjs`.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; transactional ACID rollbacks.
- **Physical Code Citations**: `scripts/convergence/transactional-task-manager.mjs:1-150`
- **Adversarial Vector Defense**: Defends against partial file writes. The transactional task manager guarantees clean rollbacks.
- **Verification Proof (C0..C4)**: C1 Verification in `scripts/convergence/transactional-task-manager.mjs`.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to antigravity/farely-v12-product-convergence with remote SHA match.
- **Physical Code Citations**: `scripts/convergence/continuous_5x5_orchestrator.mjs:1-250`
- **Adversarial Vector Defense**: Defends against NEG-27. Local commits must match remote GitHub SHA.
- **Verification Proof (C0..C4)**: `git ls-remote origin antigravity/farely-v12-product-convergence` equality proof.

---

## SECTION F: REGRESSION RISK MATRIX
- Risk: Breaking existing tests in `src/domain/farely/comparator.ts` or `truthKernelV2.test.ts`.
- Mitigation: All existing comparator behavior preserved; only invalid inputs (<0, NaN) fail-closed; clean test coverage added.

---

## SECTION G: ZERO-TRUST VERIFICATION PLAN
- C0 Contract: Verify schema contracts and registry.
- C1 Code: `npx vitest run src/domain/farely/comparator.test.ts`, `costEpistemics.test.ts`, `savings.test.ts`.
- C2 Integration: Full test suite `npm test`.

---

## SECTION H: IMMEDIATE DISPATCH DIRECTIVE
The executor must proceed with Task 1 through Task 3 using `scripts/convergence/transactional-task-manager.mjs`.
