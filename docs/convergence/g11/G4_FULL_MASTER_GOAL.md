# FARELY PROJECT 10X — MASTER GOAL G11 [G4]
# LEVEL: Pass 4: Proof Hierarchy & Anti-Self-Certification
# MANDATE: Subject G3 to strict Proof Hierarchy (C0..C4) separation, eliminate all self-certification loopholes, and enforce adversarial type bounds across all 12 lenses.
# GIT_COMMIT: 4cced89d2529003c9f16a1aa0667f7eff0e49fad
# TIMESTAMP: 2026-10-28T02:49:14.570Z
# EXECUTION_RECEIPT_SHA256: 94a1309b28d9dae70ca90f6e5a067ff9f4f936f46d5e8cda0d2fdcd784c44dd8

---

## AUDIT & FALSIFICATION OF PASS G3

Pass G3 established Production SRE runtime bounds. In Pass G4, we subject G3 to strict Proof Hierarchy (C0..C4) and bitwise arithmetic inspection across all 12 lenses, falsifying 3 subtle assumptions:

1. **[L01 & L02 FALSIFICATION] (Signed 32-Bit Overflow & Unsigned Right Shift in `sha256Hex`)**:
   - *G3 Deficit*: G3 relied on standard bitwise OR `words[i >> 2] |= ...`.
   - *G4 Proof Hierarchy Correction*: In ECMAScript, bitwise operators (`|`, `&`, `^`, `<<`) coerce operands to signed 32-bit integers in two's complement representation ($\mathbb{Z}_{2^{32}}$). If the most significant byte of a word has bit 7 set ($B \ge 128$), the word evaluates to a negative number. When calculating message length or intermediate word rotations, arithmetic right shift (`>>`) sign-extends, whereas unsigned right shift (`>>>`) correctly shifts in zeros:
     $$ \text{RotR}(x, n) = (x \ggg n) \lor (x \ll (32 - n)) $$
     G4 proves that `>>> 0` must be enforced to coerce all internal state variables to unsigned 32-bit integers, preventing signed arithmetic corruption across hashing iterations.

2. **[L02 & L09 FALSIFICATION] (Non-Linear Infant Fare Pricing in `normalizeToPerTraveler`)**:
   - *G3 Deficit*: G3 checked for integer traveler counts but did not formalize non-linear passenger fare mixing.
   - *G4 Proof Hierarchy Correction*: On Vietnamese domestic carriers (Vietnam Airlines, Vietjet Air, Bamboo Airways), infant fares are not priced identically to adult fares; infants under 2 years travel at flat administrative tariffs (e.g. 110,000₫ on Vietjet, or 10% of adult base fare on Vietnam Airlines). Consequently, a total party booking of 2 Adults + 1 Infant cannot be mathematically normalized by dividing total cost by 3:
     $$ P_{\text{party}} \neq 3 \times P_{\text{per\_adult}} \implies \text{Division is invalid} $$
     Under Proof Hierarchy gate D14 / NC-005, `normalizeToPerTraveler` must refuse flat party normalization when children or infants are present without discrete per-passenger fare itemization, strictly throwing `IncompatibleMoneyComparisonError`.

3. **[L01 & L04 FALSIFICATION] (IATA 3-Letter Syntax Validation in `locationScope.ts`)**:
   - *G3 Deficit*: G3 permitted arbitrary non-empty strings to pass through `resolveLocationScope`.
   - *G4 Proof Hierarchy Correction*: Flight search engines frequently encounter corrupted inputs such as 4-letter ICAO codes (e.g. `VVTS` for SGN, `VVNB` for HAN) or messy tracking tokens. Under Proof Hierarchy C0 contract rules, airport codes must conform to standard 3-character alphanumeric IATA identifiers:
     $$ \text{validAirportCode}(C) \iff C \in \{A..Z\}^3 $$
     If an uncataloged string does not conform to the 3-letter syntax, `resolveLocationScope` should validate and handle syntax deterministically.

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

## SECTION C: TARGET WORK PACKAGES SPECIFICATION
- **WP01-IDENTITY-UNICODE-CANONICALIZATION**:
  - Implement full universal UTF-8 byte serialization with URIError defensive fallback in `sha256Hex`.
  - Unsigned 32-bit big-endian word packing: `words[i >> 2] |= (bytes[i] << ((3 - (i % 4)) * 8)) >>> 0`.
  - Null-safe string guards in `buildPhysicalItineraryId`, `buildOfferVariantId`, and `buildObservationId`.
  - Round price to integer VND in `buildObservationId`.
  - Create comprehensive unit test suite in `src/domain/farely/identity.test.ts` [PROPOSED_NEW].

- **WP02-MONEY-PRECISION-SANITIZATION**:
  - Runtime validation for supported currencies ('VND' | 'USD') in `createMoney`.
  - Normalize signed zero (`-0`) to `0`.
  - Guard `compareMoney` against null, undefined, or NaN operands throwing `IncompatibleMoneyComparisonError`.
  - Enforce D14 passenger composition refusal in `normalizeToPerTraveler`.
  - Guard `formatMoney` against invalid amounts.
  - Create comprehensive unit test suite in `src/domain/farely/money.test.ts` [PROPOSED_NEW].

- **WP03-LOCATIONSCOPE-METRO-DETERMINISM**:
  - Guard `resolveLocationScope` against empty strings.
  - Defensive array normalization in `satisfiesLocationScope`.
  - Create comprehensive unit test suite in `src/domain/farely/locationScope.test.ts` [PROPOSED_NEW] verifying NC-002, NC-003, and catalog invariants.

---

## THE 12 ADVERSARIAL LENSES PROOF HIERARCHY MATRIX

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
