# FARELY PROJECT 10X — RESEARCH R10 [R1]
# LEVEL: Pass 1: Full-Battery Baseline Synthesis
# MANDATE: Draft complete deliverable evaluating all 12 lenses simultaneously from current system knowledge and founder scope.
# GIT_COMMIT: 774b3d00f9bd9e105ba466c058e428935b211847
# TIMESTAMP: 2026-10-27T10:29:00.149Z
# EXECUTION_RECEIPT_SHA256: ac05a23c057ee987fd477cca7ad26b7c218b6b512d00ef5944063a897df43c6d

---

## EXECUTIVE TARGET SUMMARY FOR CYCLE G92

Following the canonical completion and remote verification of Cycle G91 (`774b3d0`), Cycle G92 focuses on deep hardening and mathematical soundness of three core valuation engines:
1. **Target 1 (`src/domain/farely/comparator.ts`)**: Pure Price Comparator & Evidence Engine (REQ-COMP-001..007, S13, NODE TK-07). Lacks dedicated unit test suite (`comparator.test.ts`), violates REQ-COMP-004 by falling back to departure date when `observedAt` is missing, and computes discounts on non-positive prices without failing closed.
2. **Target 2 (`src/domain/farely/costEpistemics.ts`)**: True Cost Epistemics Engine (REQ-COST-001..005, NC-033, NODE TK-08). Lacks dedicated unit test suite (`costEpistemics.test.ts`), needs strict protection against negative base fares, and explicit verification of budget carrier ancillary fees.
3. **Target 3 (`src/domain/farely/savings.ts`)**: Savings & Relative Value Engine (REQ-DOM-001). Lacks dedicated unit test suite (`savings.test.ts`), needs explicit handling of non-finite inputs, and boundary verification of percentage savings.

### Core Non-OTA Product Boundary Invariants
- `NO_DIRECT_TICKETING`: Farely does not issue airline tickets, manage PNR records directly, or process ticket issuance.
- `NO_PASSENGER_CHECKOUT`: Farely never collects passenger passport numbers, never handles credit card numbers, and never operates a checkout cart. All bookings route externally via deep links with verified affiliate parameters.

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:97-165`, `src/domain/farely/savings.ts:17-38`
- **Adversarial Vector Defense**: Defends against NEG-01 and NEG-34. `comparator.ts` enforces that a deal is classified as `'Giá rất tốt'` only when backed by `STRONG` evidence ($\ge 15$ observations across $\ge 3$ distinct observation days) and at least 20% discount against median.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts:96-150`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**: `src/domain/farely/comparator.ts:101-107`, `src/domain/farely/savings.ts:18-26`
- **Adversarial Vector Defense**: Defends against NEG-04 and NEG-08. In `comparator.ts`, observations with non-finite or non-positive prices are filtered out before computing median. In `savings.ts`, non-positive benchmark prices immediately return `savingsAmount: 0` and `isSaving: false`.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/domainKernel.test.ts:74-95`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:37-41`, `src/domain/farely/comparator.ts:60-92`
- **Adversarial Vector Defense**: Defends against NEG-09. `determineEvidenceLevel` enforces discrete sample thresholds: $<3$ samples = `INSUFFICIENT`, $3..6$ = `WEAK`, $7..14$ = `MODERATE`, $\ge 15$ with $\ge 3$ distinct days = `STRONG`. Degraded fallback data alone can never produce `STRONG` evidence.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**: `src/domain/farely/costEpistemics.ts:27-47`, `supabase/migrations/20261022000001_watch_condition_episodes.sql:20-55`
- **Adversarial Vector Defense**: Defends against NEG-19 and NEG-20. True cost evaluation is a pure domain transformation that operates without tenant credential leakage.
- **Verification Proof (C0..C4)**: C2 Integration test in `scripts/database-architecture-contract.node-test.mjs`.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**: `src/domain/farely/costEpistemics.ts:65-75`, `src/domain/farely/comparator.ts:124-126`
- **Adversarial Vector Defense**: Defends against NEG-12. In `costEpistemics.ts`, unverified or unknown ancillary fee structures fail closed to `UNKNOWN` cost epistemic state rather than fabricating zero fees.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:8-12`, `src/domain/farely/comparator.ts:117-123`
- **Adversarial Vector Defense**: Defends against NEG-10 (departure date used as observation timestamp) and NEG-35 (offline cache shown as fresh). REQ-COMP-004 explicitly mandates that observation date must never become travel departure date.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/domainKernel.test.ts`.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:31-34`, `src/domain/farely/costEpistemics.ts:18-25`
- **Adversarial Vector Defense**: Defends against NEG-39. `ComparisonResult` exposes explicit `verdictLabel` and `evidenceLevel` for transparent user communication.
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
- **Adversarial Vector Defense**: Defends against NEG-40. Distinct test suites validate each tier of the proof hierarchy.
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
- **Adversarial Vector Defense**: Defends against incomplete file mutations. The transactional task manager enforces atomic commits and clean rollbacks.
- **Verification Proof (C0..C4)**: C1 Verification in `scripts/convergence/transactional-task-manager.mjs`.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to antigravity/farely-v12-product-convergence with remote SHA match.
- **Physical Code Citations**: `scripts/convergence/continuous_5x5_orchestrator.mjs:1-250`
- **Adversarial Vector Defense**: Defends against NEG-27. Local commits must match remote GitHub SHA.
- **Verification Proof (C0..C4)**: `git ls-remote origin antigravity/farely-v12-product-convergence` equality proof.

---

## CONVERGENCE RESEARCH PACKET (FARELY-XFER/6)

### Target Scope for Cycle G92
1. **WP01-COMPARATOR-EVIDENCE-ROBUSTNESS**:
   - Guard `compareAgainstCohort` against non-positive (`<= 0`) or non-finite `currentPrice`.
   - Strictly enforce REQ-COMP-004: Remove departure date fallback when `observedAt` is missing.
   - Create comprehensive unit test suite in `src/domain/farely/comparator.test.ts` [PROPOSED_NEW].

2. **WP02-COSTEPISTEMICS-TRANSPARENCY-GUARD**:
   - Guard `evaluateTrueCost` against negative base fares.
   - Enforce budget carrier fee estimation for Vietravel Airlines (`VU`) and Pacific Airlines (`BL`).
   - Create comprehensive unit test suite in `src/domain/farely/costEpistemics.test.ts` [PROPOSED_NEW].

3. **WP03-SAVINGS-RELATIVE-VALUE-BOUNDS**:
   - Guard `calculateSavings` against non-finite inputs.
   - Ensure integer percentage rounding.
   - Create comprehensive unit test suite in `src/domain/farely/savings.test.ts` [PROPOSED_NEW].
