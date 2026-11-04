# FARELY PROJECT 10X — MASTER GOAL G11 [G1]
# LEVEL: Pass 1: Lossless Structural Projection A–K
# MANDATE: Project FARELY-XFER/6 into an 11-section A–K Master Goal across all 12 adversarial lenses with strict Solution Cage locking.
# GIT_COMMIT: 4cced89d2529003c9f16a1aa0667f7eff0e49fad
# TIMESTAMP: 2026-10-28T02:46:29.762Z
# EXECUTION_RECEIPT_SHA256: 8ad2c0abad4483539220b8083aa65945ca8c6ff74b99dc30119ee88a026f13ec

---

## SECTION A: OBJECTIVE & MANDATE
This Master Goal defines the turnkey execution package for Cycle G93 of Farely Project 10X. All work packages are strictly bound to verified solutions from Research R10 (`docs/convergence/r10/R5_FULL_RESEARCH.md`). The executor is granted zero degrees of freedom to deviate, weaken, or omit any locked requirements.

Target Modules:
1. `src/domain/farely/identity.ts` & `src/domain/farely/identity.test.ts` [PROPOSED_NEW]
2. `src/domain/farely/money.ts` & `src/domain/farely/money.test.ts` [PROPOSED_NEW]
3. `src/domain/farely/locationScope.ts` & `src/domain/farely/locationScope.test.ts` [PROPOSED_NEW]

---

## SECTION B: INVARIANT EXECUTOR CAGE
- `INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION`
- `NO_DIRECT_TICKETING`: Direct ticketing is strictly boundary_excluded. Farely is Flight Opportunity Intelligence only.
- `NO_PASSENGER_CHECKOUT`: Passenger checkout is strictly boundary_excluded.
- `NO_PAYMENT_COLLECTION`: Payment gateway integration and credit card processing are strictly boundary_excluded.
- `NO_UNAUTHORIZED_SCRAPING`: Unauthorized scraping is strictly boundary_excluded.
- `NO_SELF_CERTIFICATION`: Derived strictly from authentic test proofs.
- `NO_CONTRACT_SHRINKAGE`: Preserves all 89 capability contracts (F00..F88) and 267 historical gates.

---

## SECTION C: TARGET MODULES & WORK PACKAGES
- **WP01-IDENTITY-UNICODE-CANONICALIZATION**:
  - Target: `src/domain/farely/identity.ts`, `src/domain/farely/identity.test.ts` [PROPOSED_NEW]
  - Upgrade `sha256Hex` with pure zero-dependency UTF-8 byte serialization (`unescape(encodeURIComponent(str))`) and URIError defensive fallback.
  - Round price to integer VND in `buildObservationId` (`Math.round(params.price)`).
  - Create comprehensive unit test suite in `src/domain/farely/identity.test.ts` [PROPOSED_NEW].

- **WP02-MONEY-PRECISION-SANITIZATION**:
  - Target: `src/domain/farely/money.ts`, `src/domain/farely/money.test.ts` [PROPOSED_NEW]
  - Normalize currency casing in `createMoney`.
  - Normalize signed zero (`-0`) to `0`.
  - Guard `compareMoney` against null, undefined, or NaN operands throwing `IncompatibleMoneyComparisonError`.
  - Guard `formatMoney` against invalid amounts.
  - Create comprehensive unit test suite in `src/domain/farely/money.test.ts` [PROPOSED_NEW].

- **WP03-LOCATIONSCOPE-METRO-DETERMINISM**:
  - Target: `src/domain/farely/locationScope.ts`, `src/domain/farely/locationScope.test.ts` [PROPOSED_NEW]
  - Defensive array normalization in `satisfiesLocationScope`.
  - Create comprehensive unit test suite in `src/domain/farely/locationScope.test.ts` [PROPOSED_NEW] verifying NC-002, NC-003, and catalog invariants.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS
The solutions are locked directly from verified Research R10 Section XIII:
1. `identity.ts`: Pure UTF-8 byte conversion in `sha256Hex` with fallback; integer VND price normalization in `buildObservationId`.
2. `money.ts`: Uppercase currency trim, signed-zero elimination, null/NaN operand guard throwing `IncompatibleMoneyComparisonError`.
3. `locationScope.ts`: Case-insensitive whitespace normalization in `satisfiesLocationScope`.

---

## SECTION E: EXECUTION TOPOLOGY & ACID PIPELINE
- Task 1: `WP01-IDENTITY-UNICODE-CANONICALIZATION`
- Task 2: `WP02-MONEY-PRECISION-SANITIZATION`
- Task 3: `WP03-LOCATIONSCOPE-METRO-DETERMINISM`
- Execution: `scripts/convergence/transactional-task-manager.mjs` executes tasks transactionally with full rollback capability.

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**: `src/domain/farely/identity.ts:175-205`, `src/domain/farely/locationScope.ts:34-80`
- **Adversarial Vector Defense**: Defends against NEG-01 and NEG-34. OfferVariantId never contains price (REQ-DOM-011), preserving identical flight identity across price fluctuations.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts:96-150`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**: `src/domain/farely/money.ts:25-30`, `src/domain/farely/identity.ts:211-224`
- **Adversarial Vector Defense**: Defends against NEG-04 and NEG-08. Input prices in `createMoney` and `buildObservationId` are strictly validated as positive finite numbers.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/domainKernel.test.ts:74-95`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**: `src/domain/farely/money.ts:67-75`, `src/domain/farely/priceScope.ts:1-50`
- **Adversarial Vector Defense**: Defends against NEG-09. Money comparison prevents silent 1-person pricing vs 2-person party total comparisons (NC-005).
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**: `src/domain/farely/identity.ts:1-60`, `supabase/migrations/20261022000001_watch_condition_episodes.sql:20-55`
- **Adversarial Vector Defense**: Defends against NEG-19 and NEG-20. Pure domain functions do not touch user credentials or persist unvetted state.
- **Verification Proof (C0..C4)**: C2 Integration test in `scripts/database-architecture-contract.node-test.mjs`.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**: `src/domain/farely/money.ts:44-54`, `src/domain/farely/providerCapabilities.ts:1-50`
- **Adversarial Vector Defense**: Defends against NEG-12. Unknown pricing units throw explicit `IncompatibleMoneyComparisonError`.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**: `src/domain/farely/identity.ts:208-224`, `src/domain/farely/time.ts:1-60`
- **Adversarial Vector Defense**: Defends against NEG-10 and NEG-35. Observation timestamps are cryptographically bound into ObservationId.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/domainKernel.test.ts`.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**: `src/domain/farely/money.ts:15-20`, `src/domain/farely/identity.ts:100-139`
- **Adversarial Vector Defense**: Defends against NEG-39. Discrete typed error classes ensure auditable system observability.
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

## SECTION J: EXECUTION RUNBOOK
Execute tasks transactionally using `scripts/convergence/transactional-task-manager.mjs`.
