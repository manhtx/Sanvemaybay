# FARELY PROJECT 10X — RESEARCH R10 [R4]
# LEVEL: Pass 4: Production SRE Rigor & Zero-Mock Verification
# MANDATE: Assume Pass 3 relied on mock safety across all 12 lenses. Enforce deterministic oracles, real integrations, and zero-loss rollbacks.
# GIT_COMMIT: 774b3d00f9bd9e105ba466c058e428935b211847
# TIMESTAMP: 2026-10-27T10:32:17.108Z
# EXECUTION_RECEIPT_SHA256: a6a681fa629bd718d18c279204ba9b1afcd85ce4f70eb6d061dddcb088da0969

---

## AUDIT & FALSIFICATION OF PASS N-1

Pass R3 hardened negative vector defenses. In this Pass R4, we evaluate the system under rigorous Production SRE constraints (zero-mock validation, carrier precedence hierarchies, zero-dispersion safeguards, and floating-point safety), exposing 3 critical operational edge cases:

1. **Falsification 1: Heuristic Overriding Explicit Provider Baggage Truth in `costEpistemics.ts` (L01 & L05 / SRE-01)**:
   - *Pass R3 Claim*: Pass R3 assumed `BUDGET_CARRIER_CODES` should unilaterally dictate baggage fee estimation.
   - *Falsification & Code Proof*: In `src/domain/farely/costEpistemics.ts#L100-L135`, if an external API or partner feed provides a branded fare bundle (e.g. Vietjet SkyBoss or Deluxe) where checked baggage is explicitly included (`isBaggageExplicitlyIncluded: true`), relying strictly on `BUDGET_CARRIER_CODES.has(airlineCode)` causes the system to inject a phantom 250,000₫ baggage fee! This overstates the true cost of premium budget bundles and penalizes legitimate bundled fares. Production SRE rigor mandates that explicit provider evidence (`params.isBaggageExplicitlyIncluded === true` or `params.providerVerifiedAllIn === true`) strictly takes precedence over airline-level default heuristics.

2. **Falsification 2: Zero-Dispersion Cohort Overconfidence in `comparator.ts` (L03 & L07 / SRE-02)**:
   - *Pass R3 Claim*: Pass R3 assumed standard median discount logic works across all cohorts regardless of dispersion.
   - *Falsification & Code Proof*: In `src/domain/farely/comparator.ts#L141-L154`, if a historical cohort consists of 15 identical fares (e.g. exactly 2,000,000₫ with zero dispersion, such as fixed-price state-regulated routes), and current fare is 1,950,000₫ (a 2.5% drop), the code labels it `'Thấp hơn mức thông thường'`. However, when empirical dispersion is zero, small deviations are often minor booking class differences or rounding noise. To prevent over-promising, if all historical prices in the valid cohort are identical (`validPrices[0] === validPrices[validPrices.length - 1]`), discounts below 10% must remain `'Giá tiêu chuẩn'`, requiring a genuine $\ge 10\%$ drop to trigger discount labels.

3. **Falsification 3: Floating Inconsistency in Zero-Savings Representation in `savings.ts` (L02 & L03 / SRE-03)**:
   - *Pass R3 Claim*: Pass R3 assumed simple `Math.max(0, benchmark - observed)` guarantees state consistency.
   - *Falsification & Code Proof*: In `src/domain/farely/savings.ts#L28-L37`:
     ```typescript
     const savingsAmount = Math.max(0, benchmarkPrice - observedPrice);
     const savingsPercent = Math.round((savingsAmount / benchmarkPrice) * 100);
     ```
     If `savingsAmount === 0`, `savingsPercent` can theoretically evaluate to `-0` in JavaScript if numbers were negative floats. Furthermore, `isSaving` must be strictly `false` whenever `savingsAmount <= 0`. Pass R4 establishes the explicit invariant: when `savingsAmount <= 0`, both `savingsAmount` and `savingsPercent` are normalized to `0`, and `isSaving` is guaranteed to be `false`.

---

## NON-OTA PRODUCT BOUNDARY INVARIANTS
- `NO_DIRECT_TICKETING`: Farely does not issue airline tickets, manage PNR records directly, or process ticket issuance.
- `NO_PASSENGER_CHECKOUT`: Farely never collects passenger passport numbers, never handles credit card numbers, and never operates a checkout cart. All bookings route externally via deep links with verified affiliate parameters.

---

## THE 12 ADVERSARIAL LENSES PRODUCTION SRE MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**: `src/domain/farely/costEpistemics.ts:1-75`, `src/domain/farely/comparator.ts:97-165`
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
- **Adversarial Vector Defense**: Defends against NEG-39. Discrete typed error reasons ensure full observability.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; single open episode constraint.
- **Physical Code Citations**: `supabase/migrations/20261022000001_watch_condition_episodes.sql:1-60`
- **Adversarial Vector Defense**: Defends against NEG-22.
- **Verification Proof (C0..C4)**: C2 Integration test in `scripts/database-architecture-contract.node-test.mjs`.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.
- **Physical Code Citations**: `docs/convergence/ACCEPTANCE_REGISTRY_FINAL.json:1-120`
- **Adversarial Vector Defense**: Defends against NEG-40.
- **Verification Proof (C0..C4)**: Vitest and Node native test suites.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**: `scripts/verify-certification-integrity.node-test.mjs:1-120`
- **Adversarial Vector Defense**: Defends against NEG-30 and NEG-33.
- **Verification Proof (C0..C4)**: C0 Contract proof in `scripts/verify-certification-integrity.node-test.mjs`.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; transactional ACID rollbacks.
- **Physical Code Citations**: `scripts/convergence/transactional-task-manager.mjs:1-150`
- **Adversarial Vector Defense**: Defends against mid-execution crashes.
- **Verification Proof (C0..C4)**: C1 Verification in `scripts/convergence/transactional-task-manager.mjs`.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to antigravity/farely-v12-product-convergence with remote SHA match.
- **Physical Code Citations**: `scripts/convergence/continuous_5x5_orchestrator.mjs:1-250`
- **Adversarial Vector Defense**: Defends against NEG-27.
- **Verification Proof (C0..C4)**: `git ls-remote origin antigravity/farely-v12-product-convergence` equality proof.

---

## PRODUCTION SRE HARDENED WORK PACKAGES FOR G92
1. **WP01-COMPARATOR-EVIDENCE-ROBUSTNESS**:
   - Guard `compareAgainstCohort` against non-positive (`<= 0`) or non-finite `currentPrice`.
   - Remove departure date fallback when `observedAt` is missing to enforce REQ-COMP-004.
   - Enforce zero-dispersion caveat requiring $\ge 10\%$ drop before assigning deviation label.
   - Create comprehensive unit test suite in `src/domain/farely/comparator.test.ts` [PROPOSED_NEW].

2. **WP02-COSTEPISTEMICS-TRANSPARENCY-GUARD**:
   - Guard `evaluateTrueCost` against negative base fares.
   - Add Pacific Airlines (`BL`) to `BUDGET_CARRIER_CODES`.
   - Guarantee `isBaggageExplicitlyIncluded` takes precedence over airline default heuristics.
   - Create comprehensive unit test suite in `src/domain/farely/costEpistemics.test.ts` [PROPOSED_NEW].

3. **WP03-SAVINGS-RELATIVE-VALUE-BOUNDS**:
   - Guard `calculateSavings` against non-finite inputs (`!Number.isFinite`).
   - Normalize `savingsAmount` and `savingsPercent` to `0` whenever `savingsAmount <= 0`.
   - Create comprehensive unit test suite in `src/domain/farely/savings.test.ts` [PROPOSED_NEW].
