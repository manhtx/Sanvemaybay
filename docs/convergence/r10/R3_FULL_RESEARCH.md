# FARELY PROJECT 10X — RESEARCH R10 [R3]
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Assume Pass 2 missed edge cases across all 12 lenses. Attack with 24 negative vectors, race conditions, and error states.
# GIT_COMMIT: 774b3d00f9bd9e105ba466c058e428935b211847
# TIMESTAMP: 2026-10-27T10:31:00.066Z
# EXECUTION_RECEIPT_SHA256: b04d936cd358aca652aed2bda0cd9f29e9b5d6ce8425d286b6ee38175f1a37d7

---

## AUDIT & FALSIFICATION OF PASS N-1

Pass R2 provided empirical grounding for Cycle G92. In this Pass R3, we attack the proposals from Pass R2 with 24 Negative Vectors (NV01..NV24) and adversarial stress-testing, exposing 3 critical boundary oversights:

1. **Falsification 1: Negative Ancillary Fee Injection in `costEpistemics.ts` (L02 & L05 / NV04)**:
   - *Pass R2 Claim*: Pass R2 proposed checking `basePrice > 0` but neglected external ancillary fees.
   - *Falsification & Code Proof*: In `src/domain/farely/costEpistemics.ts#L54-L63`, `providedHiddenCosts` can be supplied as an object `{ baggageFee, paymentFee, airportTaxes }` or an array of `{ label, amount }`. If a hostile or corrupt third-party API response contains negative fees (e.g. `baggageFee: -200000`), adding this fee reduces the total cost! This artificially makes the flight appear cheaper than base fare, violating cost monotonicity and L02 price integrity. All provided hidden costs must be sanitized: `const cleanAmount = (typeof fee === 'number' && Number.isFinite(fee) && fee > 0) ? Math.round(fee) : 0;`. Negative ancillary fees must be quarantined.

2. **Falsification 2: Zero-Division & Negative Discount Inversion in `comparator.ts` (L01 & L03 / NV08)**:
   - *Pass R2 Claim*: Pass R2 assumed `computeMedian(validPrices)` always provides a valid non-zero divisor.
   - *Falsification & Code Proof*: In `src/domain/farely/comparator.ts#L144`, `const discountPercent = Math.round(((medianPrice - currentPrice) / medianPrice) * 100);`. If a malformed observation pool produces `medianPrice === 0`, dividing by `medianPrice` produces `-Infinity` or `NaN`! Furthermore, when `currentPrice > medianPrice`, `discountPercent` becomes negative (e.g. `-15%`). In line 151, `else if (discountPercent > 0) verdictLabel = 'Thấp hơn mức thông thường';` handles positive discounts, but negative discounts fall through to `'Giá tiêu chuẩn'`. For extreme surges where `currentPrice >= medianPrice * 1.5` (a 50% surge), labeling it `'Giá tiêu chuẩn'` deceives users. It must be explicitly labeled `'Cao hơn mức thông thường'`.

3. **Falsification 3: Negative Benchmark Overflow in `savings.ts` (L02 & L03 / NV01)**:
   - *Pass R2 Claim*: Pass R2 assumed checking `Number.isFinite` prevents all bad calculations.
   - *Falsification & Code Proof*: In `src/domain/farely/savings.ts#L28-L29`:
     ```typescript
     const savingsAmount = Math.max(0, benchmarkPrice - observedPrice);
     const savingsPercent = Math.round((savingsAmount / benchmarkPrice) * 100);
     ```
     If `benchmarkPrice` is extremely large (e.g. `Number.MAX_SAFE_INTEGER`), floating point loss of precision can occur. Furthermore, if `observedPrice >= benchmarkPrice`, `savingsAmount` is `0`, but what if `savingsPercent` is calculated without checking `savingsAmount === 0`? If `benchmarkPrice <= 0`, it returns 0, but if `observedPrice < 0`, it must also return zero savings. Clamping `savingsPercent` strictly to the range `[0, 100]` guarantees mathematical monotonicity.

---

## NON-OTA PRODUCT BOUNDARY INVARIANTS
- `NO_DIRECT_TICKETING`: Farely does not issue airline tickets, manage PNR records directly, or process ticket issuance.
- `NO_PASSENGER_CHECKOUT`: Farely never collects passenger passport numbers, never handles credit card numbers, and never operates a checkout cart. All bookings route externally via deep links with verified affiliate parameters.

---

## THE 12 ADVERSARIAL LENSES HOSTILE EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:97-165`, `src/domain/farely/truthKernelV2.test.ts:96-150`
- **Adversarial Vector Defense**: Defends against NV01 (lowest comparable offer on last database page) and NV34 (external click counted as booking). `compareAgainstCohort` strictly separates verified market discounts from indicative price observations.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**: `src/domain/farely/costEpistemics.ts:48-64`, `src/domain/farely/savings.ts:17-38`
- **Adversarial Vector Defense**: Defends against NV04 (unknown mandatory fee becomes 0) and NV08 (current observation included in own baseline). In `costEpistemics.ts`, all fees must be non-negative finite integers. In `savings.ts`, non-finite or non-positive prices immediately return 0 savings.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/domainKernel.test.ts`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:60-92`, `src/domain/farely/comparator.ts:36-42`
- **Adversarial Vector Defense**: Defends against NV09 (one scan creates false 12-sample strong evidence). Minimum 15 observations across $\ge 3$ distinct calendar days required for `STRONG` confidence.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**: `src/domain/farely/costEpistemics.ts:27-47`, `supabase/migrations/20261022000001_watch_condition_episodes.sql:20-55`
- **Adversarial Vector Defense**: Defends against NV19 (User A accesses User B's Watch/email) and NV20 (Paused/unsubscribed Watch receives new alert).
- **Verification Proof (C0..C4)**: C2 Integration test in `scripts/database-architecture-contract.node-test.mjs`.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**: `src/domain/farely/costEpistemics.ts:65-75`, `src/domain/farely/providerCapabilities.ts:1-50`
- **Adversarial Vector Defense**: Defends against NV12 (HTTP 503/429/parser failure becomes empty). In `costEpistemics.ts`, unknown mandatory fees fail closed to `UNKNOWN` cost epistemic state.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:8-12`, `src/domain/farely/pwaOfflineFreshness.ts:25-50`
- **Adversarial Vector Defense**: Defends against NV10 (departure date used as observation timestamp) and NV35 (offline cache shown as fresh). REQ-COMP-004 is strictly enforced: observation timestamp must never fall back to departure date.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/domainKernel.test.ts`.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:31-34`, `src/domain/farely/costEpistemics.ts:18-25`
- **Adversarial Vector Defense**: Defends against NV39 (no useful opportunities while status says healthy).
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; single open episode constraint.
- **Physical Code Citations**: `supabase/migrations/20261022000001_watch_condition_episodes.sql:1-60`
- **Adversarial Vector Defense**: Defends against NV22 (reclaimed lease triggers duplicate alert).
- **Verification Proof (C0..C4)**: C2 Integration test in `scripts/database-architecture-contract.node-test.mjs`.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.
- **Physical Code Citations**: `docs/convergence/ACCEPTANCE_REGISTRY_FINAL.json:1-120`
- **Adversarial Vector Defense**: Defends against NV40 (executor-written proof declares all 89 accepted). C1 unit tests for `comparator.ts`, `costEpistemics.ts`, and `savings.ts` certify algorithmic soundness only.
- **Verification Proof (C0..C4)**: Vitest and Node native test suites.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**: `scripts/verify-certification-integrity.node-test.mjs:1-120`
- **Adversarial Vector Defense**: Defends against NV30 and NV33.
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
- **Adversarial Vector Defense**: Defends against NV27. Local commits must match remote GitHub SHA.
- **Verification Proof (C0..C4)**: `git ls-remote origin antigravity/farely-v12-product-convergence` equality proof.

---

## LOCKED WORK PACKAGES PROPOSAL FOR CYCLE G92
1. **WP01-COMPARATOR-EVIDENCE-ROBUSTNESS**:
   - Guard `compareAgainstCohort` against non-positive (`<= 0`) or non-finite `currentPrice`.
   - Strictly enforce REQ-COMP-004: Require valid `observedAt` timestamps for distinct-day calculations.
   - Add surge pricing label `'Cao hơn mức thông thường'` for currentPrice $\ge 1.5 \times$ medianPrice.
   - Create comprehensive unit test suite in `src/domain/farely/comparator.test.ts` [PROPOSED_NEW].

2. **WP02-COSTEPISTEMICS-TRANSPARENCY-GUARD**:
   - Guard `evaluateTrueCost` against negative base fares.
   - Add Pacific Airlines (`BL`) to `BUDGET_CARRIER_CODES`.
   - Sanitize all ancillary fees to non-negative finite integers.
   - Create comprehensive unit test suite in `src/domain/farely/costEpistemics.test.ts` [PROPOSED_NEW].

3. **WP03-SAVINGS-RELATIVE-VALUE-BOUNDS**:
   - Guard `calculateSavings` against non-finite inputs (`!Number.isFinite`).
   - Clamp `savingsPercent` to $[0, 100]$.
   - Create comprehensive unit test suite in `src/domain/farely/savings.test.ts` [PROPOSED_NEW].
