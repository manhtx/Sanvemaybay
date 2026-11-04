# FARELY PROJECT 10X — RESEARCH R10 [R2]
# LEVEL: Pass 2: Skeptical Empirical Grounding
# MANDATE: Deepen research from Pass 1. Challenge all assumptions, verify every edge case, and expose latent deficits across all 12 lenses.
# GIT_COMMIT: 4cced89d2529003c9f16a1aa0667f7eff0e49fad
# TIMESTAMP: 2026-10-28T02:42:17.809Z
# EXECUTION_RECEIPT_SHA256: 9cc2bebadb89d11b9b87efa018692621d21cd809520e52ceaf21edc430d63b54

---

## AUDIT & FALSIFICATION OF PASS N-1

Pass R1 established the baseline specifications for Cycle G93. In Pass R2, we subject Pass R1 to empirical adversarial review across all 12 lenses, demonstrating 3 naive assumptions requiring technical correction:

1. **[L01 & L02 FALSIFICATION] (UTF-8 Bit Length Invariant in `sha256Hex`)**:
   - *Pass R1 Claim*: Pass R1 assumed simply converting characters to UTF-8 bytes solves unicode hashing.
   - *Falsification & Code Proof*: In `src/domain/farely/identity.ts#L22-L43`, `asciiBitLength = ascii.length * 8`. If a string containing multibyte UTF-8 characters (such as Vietnamese `Đà Nẵng` where `Đ` is 2 bytes `0xC4 0x90` and `ẵ` is 3 bytes `0xE1 0xBA 0xAF`) is encoded into a byte array, the number of bytes $M > \text{ascii.length}$! If the bit length appended to the 64-bit length trailer uses character count rather than actual byte count, the resulting SHA-256 digest is cryptographically corrupted and incompatible with standard NIST FIPS 180-4 implementations! Pass R2 mandates calculating bit length strictly over the post-encoding UTF-8 byte buffer:
     $$ L_{\text{bits}} = N_{\text{bytes}} \times 8 $$

2. **[L02 & L03 FALSIFICATION] (Currency Casing & Truncation Skew in `normalizeToPerTraveler`)**:
   - *Pass R1 Claim*: Pass R1 assumed dividing by `travelerCount` and taking `Math.round` is always reversible.
   - *Falsification & Code Proof*: In `src/domain/farely/money.ts#L55-L60`:
     ```typescript
     return {
       amount: Math.round(money.amount / travelerCount),
       currency: money.currency,
       pricingUnit: 'PER_TRAVELER'
     };
     ```
     If `money.amount = 1000000` and `travelerCount = 3`, `1000000 / 3 = 333333.333...`, which rounds to `333333`. Multiplying back yields `999999`, losing 1₫. While rounding to integer VND is mandatory, downstream comparator aggregations must be aware that per-traveler normalization is a lossy projection. Furthermore, `money.currency` must be strictly sanitized to prevent mismatched comparison keys (e.g. `'vnd'` vs `'VND'`).

3. **[L01 & L04 FALSIFICATION] (Airport Code Aliasing & Whitespace in `locationScope.ts`)**:
   - *Pass R1 Claim*: Pass R1 assumed airport codes passed to `expandLocationScope` are already clean 3-letter IATA codes.
   - *Falsification & Code Proof*: In `src/domain/farely/locationScope.ts#L100-L125`, external URL search queries often pass codes with leading/trailing spaces or lowercase characters (e.g. `'sgn '` or `' bkk'`). Direct dictionary lookup `AIRPORT_CATALOG[code]` or `METRO_CATALOG[code]` fails silently, causing valid airports to be treated as unknown locations. Pass R2 mandates universal key sanitization: `code.trim().toUpperCase()`.

---

## NON-OTA PRODUCT BOUNDARY INVARIANTS
- `NO_DIRECT_TICKETING`: Direct ticketing is strictly boundary_excluded. Farely is Flight Opportunity Intelligence only.
- `NO_PASSENGER_CHECKOUT`: Passenger checkout is strictly boundary_excluded.
- `NO_PAYMENT_COLLECTION`: Payment gateway integration and credit card processing are strictly boundary_excluded.
- `NO_UNAUTHORIZED_SCRAPING`: Unauthorized scraping is strictly boundary_excluded.
- `NO_SELF_CERTIFICATION`: Derived strictly from authentic test proofs.
- `NO_CONTRACT_SHRINKAGE`: Preserves all 89 capability contracts (F00..F88) and 267 historical gates.

---

## THE 12 ADVERSARIAL LENSES EMPIRICAL MATRIX

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

## CANONICAL WORK PACKAGES SPECIFICATION (FARELY-XFER/6)

### WP01-IDENTITY-UNICODE-CANONICALIZATION
- **Target Files**: `src/domain/farely/identity.ts`, `src/domain/farely/identity.test.ts` [PROPOSED_NEW]
- **Implementation**:
  - Implement standard UTF-8 byte conversion in `sha256Hex` before padding and hashing.
  - Round price to integer in `buildObservationId`.
  - Create `src/domain/farely/identity.test.ts` [PROPOSED_NEW].

### WP02-MONEY-PRECISION-SANITIZATION
- **Target Files**: `src/domain/farely/money.ts`, `src/domain/farely/money.test.ts` [PROPOSED_NEW]
- **Implementation**:
  - Normalize currency casing in `createMoney`.
  - Guard `compareMoney` against null or invalid Money objects.
  - Guard `formatMoney` against invalid amounts.
  - Create `src/domain/farely/money.test.ts` [PROPOSED_NEW].

### WP03-LOCATIONSCOPE-METRO-DETERMINISM
- **Target Files**: `src/domain/farely/locationScope.ts`, `src/domain/farely/locationScope.test.ts` [PROPOSED_NEW]
- **Implementation**:
  - Normalize lookup keys in location resolution.
  - Create `src/domain/farely/locationScope.test.ts` [PROPOSED_NEW] verifying NC-002, NC-003, and `deriveMarketScopeFromLocation`.
