# FARELY PROJECT 10X — RESEARCH R10 [R2]
# LEVEL: Pass 2: Skeptical Empirical Grounding
# MANDATE: Re-examine all 12 lenses with zero-trust skepticism, falsify prior pass assumptions, and ground every claim in verifiable codebase evidence.
# GIT_COMMIT: 774b3d00f9bd9e105ba466c058e428935b211847
# TIMESTAMP: 2026-10-27T10:30:00.751Z
# EXECUTION_RECEIPT_SHA256: f0e7e465481a9a692ca49aecdde8a3a90d77e9aac04b385782ebc129e8d9a9ca

---

## AUDIT & FALSIFICATION OF PASS N-1

Pass R1 established the preliminary baseline for Cycle G92. In this Pass R2, we subject Pass R1 to adversarial skepticism across all 12 lenses and actively falsify 3 specific proposals:

1. **Falsification 1: Departure Date Fallback Violation of REQ-COMP-004 in `comparator.ts` (L06 & L02 / REQ-COMP-004)**:
   - *Pass R1 Claim*: Pass R1 proposed removing departure date fallback without addressing how observation timestamps are validated.
   - *Falsification & Code Proof*: In `src/domain/farely/comparator.ts#L117-L123`:
     ```typescript
     const days = new Set(
       validObservations
         .map(o => (o.observedAt ? o.observedAt.slice(0, 10) : o.departLocalDate))
         .filter(Boolean)
     );
     ```
     REQ-COMP-004 explicitly mandates: "Observation date must never become travel date." If a crawler scrapes 20 future flight dates in a single run without populating `observedAt`, falling back to `departLocalDate` creates 20 synthetic "distinct days" (`days.size === 20`). This causes `determineEvidenceLevel` to award false `STRONG` evidence on a single scan! In Pass R2, we mandate that only valid UTC ISO timestamps in `observedAt` are counted towards `distinctDays`:
     ```typescript
     const days = new Set(
       validObservations
         .map(o => (o.observedAt && !isNaN(Date.parse(o.observedAt))) ? o.observedAt.slice(0, 10) : null)
         .filter(Boolean)
     );
     ```
     Any observation without a valid timestamp contributes 0 distinct days.

2. **Falsification 2: Missing Pacific Airlines (`BL`) in Budget Carrier Registry in `costEpistemics.ts` (L01 & L05 / A16)**:
   - *Pass R1 Claim*: Pass R1 claimed adding Vietravel Airlines (`VU`) is sufficient.
   - *Falsification & Code Proof*: In `src/domain/farely/costEpistemics.ts#L65-L68`, `BUDGET_CARRIER_CODES` includes `['VJ', 'AK', 'FD', 'TR', '5J', 'SL', 'VU']`. However, Pacific Airlines (`BL`, formerly Jetstar Pacific) is a Vietnamese low-cost domestic carrier operating unbundled fares where checked baggage (20kg) and seat selection are not included in base tickets. Because `BL` is missing from `BUDGET_CARRIER_CODES`, `evaluateTrueCost` defaults to `LEGACY` carrier assumptions where baggage is considered included! This understates the true cost of a Pacific Airlines ticket by 250,000₫ to 350,000₫. `BL` must be added to `BUDGET_CARRIER_CODES`.

3. **Falsification 3: IEEE 754 NaN Bypass in `savings.ts` (L02 & L03 / NV04)**:
   - *Pass R1 Claim*: Pass R1 assumed checking `benchmarkPrice <= 0 || observedPrice <= 0` catches invalid prices.
   - *Falsification & Code Proof*: In JavaScript, `NaN <= 0` evaluates to `false`! If callers pass `NaN` or `undefined` (which coerces to `NaN`), the guard in `src/domain/farely/savings.ts#L18` is bypassed completely. The code executes `Math.max(0, NaN - NaN)` which produces `NaN`, returning `{ savingsAmount: NaN, savingsPercent: NaN, isSaving: false }`. Pass R2 locks explicit finite validation:
     ```typescript
     if (!Number.isFinite(benchmarkPrice) || !Number.isFinite(observedPrice) || benchmarkPrice <= 0 || observedPrice <= 0)
     ```

---

## NON-OTA PRODUCT BOUNDARY INVARIANTS
- `NO_DIRECT_TICKETING`: Farely does not issue airline tickets, manage PNR records directly, or process ticket issuance.
- `NO_PASSENGER_CHECKOUT`: Farely never collects passenger passport numbers, never handles credit card numbers, and never operates a checkout cart. All bookings route externally via deep links with verified affiliate parameters.

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:97-165`, `src/domain/farely/truthKernelV2.test.ts:96-150`
- **Adversarial Vector Defense**: Defends against NEG-01 and NEG-34. `compareAgainstCohort` preserves market truth: a deal cannot claim `Giá rất tốt` or `Giá đáng chú ý` without authentic statistical support.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**: `src/domain/farely/savings.ts:17-38`, `src/domain/farely/comparator.ts:101-107`
- **Adversarial Vector Defense**: Defends against NEG-04 and NEG-08. Input prices are sanitized to positive finite numbers in VND.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/domainKernel.test.ts:74-95`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:60-92`, `src/domain/farely/costEpistemics.ts:27-47`
- **Adversarial Vector Defense**: Defends against NEG-09. `determineEvidenceLevel` enforces discrete sample thresholds: $<3$ samples = `INSUFFICIENT`, $3..6$ = `WEAK`, $7..14$ = `MODERATE`, $\ge 15$ with $\ge 3$ distinct days = `STRONG`.
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
- **Physical Code Citations**: `src/domain/farely/costEpistemics.ts:65-75`, `src/domain/farely/providerCapabilities.ts:1-50`
- **Adversarial Vector Defense**: Defends against NEG-12. In `costEpistemics.ts`, unverified or unknown ancillary fee structures fail closed to `UNKNOWN` cost epistemic state rather than fabricating zero fees.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:8-12`, `src/domain/farely/pwaOfflineFreshness.ts:25-50`
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

## REFINED WORK PACKAGES SPECIFICATION FOR CYCLE G92
1. **WP01-COMPARATOR-EVIDENCE-ROBUSTNESS**:
   - Guard `compareAgainstCohort` against non-positive (`<= 0`) or non-finite `currentPrice`.
   - Remove departure date fallback when `observedAt` is missing to enforce REQ-COMP-004.
   - Create comprehensive unit test suite in `src/domain/farely/comparator.test.ts` [PROPOSED_NEW].

2. **WP02-COSTEPISTEMICS-TRANSPARENCY-GUARD**:
   - Guard `evaluateTrueCost` against negative base fares.
   - Add Pacific Airlines (`BL`) to `BUDGET_CARRIER_CODES`.
   - Create comprehensive unit test suite in `src/domain/farely/costEpistemics.test.ts` [PROPOSED_NEW].

3. **WP03-SAVINGS-RELATIVE-VALUE-BOUNDS**:
   - Guard `calculateSavings` against non-finite inputs (`!Number.isFinite`).
   - Create comprehensive unit test suite in `src/domain/farely/savings.test.ts` [PROPOSED_NEW].
