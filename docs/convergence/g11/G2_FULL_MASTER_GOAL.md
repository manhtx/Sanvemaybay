# FARELY PROJECT 10X — MASTER GOAL G11 [G2]
# LEVEL: Pass 2: Skeptical Empirical Grounding
# MANDATE: Subject G1 specifications to hostile negative vector analysis, zero-trust boundary validation, and empirical edge-case falsification across all 12 lenses.
# GIT_COMMIT: 774b3d00f9bd9e105ba466c058e428935b211847
# TIMESTAMP: 2026-10-27T10:37:18.580Z
# EXECUTION_RECEIPT_SHA256: 11d9b070a4d7f4780184180d106dd3e369f3aa90ea27d418b3530e9f284cf7e0

---

## AUDIT & FALSIFICATION OF PASS G1
Pass G1 established the structural baseline for Cycle G92. In Pass G2, we conduct skeptical adversarial review across the 12 lenses, demonstrating 3 naive assumptions in G1 that require empirical fortification:

1. **Hostile Lens 2 & 6 Falsification: Non-String Timestamp Deserialization Crash in `comparator.ts`**:
   - *G1 Deficit*: G1 assumed `o.observedAt` is always a sanitized string and called `.slice(0, 10)` directly.
   - *G2 Empirical Correction*: If partner scrapers or JSON deserializers produce an integer Unix epoch timestamp (`1730000000000`) or a Date object, calling `.slice(0, 10)` throws `TypeError: o.observedAt.slice is not a function`, completely halting the comparator engine. G2 enforces defensive type checking: `typeof o.observedAt === 'string' && o.observedAt.length >= 10 && !isNaN(Date.parse(o.observedAt))`. If the type check fails, the observation is omitted from temporal cohorts without throwing.

2. **Hostile Lens 1 & 3 Falsification: Ambiguous `isBaggageExplicitlyIncluded: false` in `costEpistemics.ts`**:
   - *G1 Deficit*: G1 checked `if (params.isBaggageExplicitlyIncluded)` but omitted handling for explicit false values.
   - *G2 Empirical Correction*: On unbundled carriers or Basic Economy fares where a provider explicitly states `isBaggageExplicitlyIncluded: false`, legacy carrier heuristics could still mark baggage as `UNKNOWN`. G2 proves that when `isBaggageExplicitlyIncluded === false`, baggage must be classified as `ESTIMATED` with standard unbundled ancillary fees regardless of whether the carrier is legacy or budget, warning users that the ticket excludes luggage.

3. **Hostile Lens 2 & 9 Falsification: Sub-Dong Floating Residue in `savings.ts`**:
   - *G1 Deficit*: G1 checked for non-negative numbers but did not enforce integer currency quantization.
   - *G2 Empirical Correction*: Vietnam Dong (VND) does not permit fractional currency units. Floating-point subtraction can generate `0.00000000001` or `1.1` dong. G2 mandates integer quantization: `savingsAmount = Math.max(0, Math.round(benchmarkPrice - observedPrice))`, guaranteeing exact integer currency alignment.

---

## SECTION B: INVARIANT EXECUTOR CAGE
- `INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION`
- `NO_DIRECT_TICKETING`: Direct airline ticketing, reservation booking, PNR management strictly boundary excluded.
- `NO_PASSENGER_CHECKOUT`: Direct passenger data handling, credit card input, checkout carts strictly boundary excluded.
- `NO_SELF_CERTIFICATION`: Every fix must pass automated Vitest and Node native test suites.
- `NO_CONTRACT_SHRINKAGE`: Preserves all 89 capability contracts (F00..F88) and 267 historical gates.

---

## SECTION C: TARGET WORK PACKAGES SPECIFICATION
- **WP01-COMPARATOR-EVIDENCE-ROBUSTNESS**:
  - Guard `compareAgainstCohort` with `if (!Number.isFinite(currentPrice) || currentPrice <= 0)` -> fail-closed to `INSUFFICIENT` evidence.
  - Remove departure date fallback when `observedAt` is missing to enforce REQ-COMP-004.
  - Guard timestamp operations against non-string or malformed inputs.
  - Zero-dispersion cohort defense: if all cohort prices are identical, discounts $< 10\%$ yield `Giá tiêu chuẩn`.
  - Comprehensive unit test in `src/domain/farely/comparator.test.ts` [PROPOSED_NEW].

- **WP02-COSTEPISTEMICS-TRANSPARENCY-GUARD**:
  - Sanitize `params.basePrice = Number.isFinite(params.basePrice) && params.basePrice >= 0 ? params.basePrice : 0`.
  - Register Pacific Airlines (`BL`) in `BUDGET_CARRIER_CODES`.
  - Enforce `params.isBaggageExplicitlyIncluded === true || params.providerVerifiedAllIn === true` precedence.
  - Comprehensive unit test in `src/domain/farely/costEpistemics.test.ts` [PROPOSED_NEW].

- **WP03-SAVINGS-RELATIVE-VALUE-BOUNDS**:
  - Validate `!Number.isFinite(observedPrice) || !Number.isFinite(benchmarkPrice) || observedPrice <= 0 || benchmarkPrice <= 0`.
  - Enforce integer VND rounding on `savingsAmount = Math.max(0, Math.round(benchmarkPrice - observedPrice))`.
  - Normalize non-positive savings to `{ savingsAmount: 0, savingsPercent: 0, isSaving: false }`.
  - Comprehensive unit test in `src/domain/farely/savings.test.ts` [PROPOSED_NEW].

---

## THE 12 ADVERSARIAL LENSES EMPIRICAL MATRIX

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

## SECTION J: EXECUTION RUNBOOK & ACID COMMITS
1. Task 1: `WP01-COMPARATOR-EVIDENCE-ROBUSTNESS` -> run `npx vitest run src/domain/farely/comparator.test.ts`.
2. Task 2: `WP02-COSTEPISTEMICS-TRANSPARENCY-GUARD` -> run `npx vitest run src/domain/farely/costEpistemics.test.ts`.
3. Task 3: `WP03-SAVINGS-RELATIVE-VALUE-BOUNDS` -> run `npx vitest run src/domain/farely/savings.test.ts`.
4. Full regression check -> `npm test`.
