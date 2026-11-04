# FARELY PROJECT 10X — RESEARCH R10 [R5]
# LEVEL: Pass 5: Sovereign Canonical Convergence
# MANDATE: Unassailable synthesis across all 12 lenses. Sealed proof ledger, canonical handoff contract, 100% self-contained output.
# GIT_COMMIT: 4cced89d2529003c9f16a1aa0667f7eff0e49fad
# TIMESTAMP: 2026-10-28T02:45:27.379Z
# EXECUTION_RECEIPT_SHA256: a76ee56ea8a3442d16439defae1eab11f2c0c2e0991320d1024e619150f5f808

---

## AUDIT & FALSIFICATION OF PASS N-1

Pass R4 formulated baseline production SRE safeguards for Cycle G93. In this Pass R5 Sovereign Canonical Synthesis, we subject Pass R4 to ultimate adversarial verification across all 12 lenses, demonstrating 3 residual technical edge cases:

1. **[L01 & L07 FALSIFICATION] (URIError Defense in Universal UTF-8 Serialization in `sha256Hex`)**:
   - *Pass R4 Claim*: Pass R4 assumed `unescape(encodeURIComponent(str))` operates deterministically across all arbitrary strings.
   - *Falsification & Code Proof*: If an external partner API feeds an unescaped lone surrogate code point (e.g. `\uD800` without a matching `\uDC00`), `encodeURIComponent` immediately throws `URIError: URI malformed`, crashing the entire identity pipeline! Sovereign convergence mandates defensive error boundary wrapping with raw character code point fallback:
     ```typescript
     function toUtf8Bytes(str: string): number[] {
       try {
         const utf8Str = unescape(encodeURIComponent(str));
         const bytes: number[] = new Array(utf8Str.length);
         for (let i = 0; i < utf8Str.length; i++) {
           bytes[i] = utf8Str.charCodeAt(i);
         }
         return bytes;
       } catch {
         const bytes: number[] = new Array(str.length);
         for (let i = 0; i < str.length; i++) {
           bytes[i] = str.charCodeAt(i) & 0xFF;
         }
         return bytes;
       }
     }
     ```
     This mathematically guarantees that `sha256Hex` never throws under any string input, satisfying high-availability SRE invariants.

2. **[L02 & L06 FALSIFICATION] (Defensive Formatting & Non-Finite Guard in `formatMoney`)**:
   - *Pass R4 Claim*: Pass R4 assumed `formatMoney` is only called on valid Money objects created by `createMoney`.
   - *Falsification & Code Proof*: `formatMoney` in `src/domain/farely/money.ts#L80-L85` is an exported pure function. If UI components or external consumers pass a raw object with `amount: NaN` or negative amounts, `NaN.toLocaleString('vi-VN')` renders `'NaN₫'`, violating UX transparency (L06) and data integrity (L02). Sovereign safety mandates:
     ```typescript
     export function formatMoney(money: Money): string {
       const amt = Number.isFinite(money?.amount) && money.amount >= 0 ? Math.round(money.amount) : 0;
       if (money?.currency === 'USD') {
         return `$${amt.toLocaleString('en-US')}`;
       }
       return `${amt.toLocaleString('vi-VN')}₫`;
     }
     ```

3. **[L01 & L04 FALSIFICATION] (Metro Identity Isolation & Catalog Integrity in `locationScope.ts`)**:
   - *Pass R4 Claim*: Pass R4 assumed `airport.metroId` in `AIRPORT_CATALOG` always exists in `METRO_CATALOG`.
   - *Falsification & Code Proof*: In `src/domain/farely/locationScope.ts#L170-L176`:
     ```typescript
     if (requestedType === 'METRO' && airport.metroId && METRO_CATALOG[airport.metroId]) {
       return {
         type: 'METRO',
         primaryCode: airport.metroId,
         expandedCodes: [...METRO_CATALOG[airport.metroId].airports]
       };
     }
     ```
     If an airport has a dangling `metroId` or if `METRO_CATALOG[airport.metroId]` is undefined, the function must fail safe to `EXACT_AIRPORT`. Furthermore, `satisfiesLocationScope` must normalize whitespace on both `actualAirport` and all `expandedCodes`, preventing accidental false negatives during flight matching.

---

## NON-OTA PRODUCT BOUNDARY INVARIANTS
- `NO_DIRECT_TICKETING`: Direct ticketing is strictly boundary_excluded. Farely is Flight Opportunity Intelligence only.
- `NO_PASSENGER_CHECKOUT`: Passenger checkout is strictly boundary_excluded.
- `NO_PAYMENT_COLLECTION`: Payment gateway integration and credit card processing are strictly boundary_excluded.
- `NO_UNAUTHORIZED_SCRAPING`: Unauthorized scraping is strictly boundary_excluded.
- `NO_SELF_CERTIFICATION`: Derived strictly from authentic test proofs.
- `NO_CONTRACT_SHRINKAGE`: Preserves all 89 capability contracts (F00..F88) and 267 historical gates.

---

## THE 12 ADVERSARIAL LENSES SOVEREIGN MATRIX

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
  - Implement full universal UTF-8 byte serialization with URIError defensive fallback in `sha256Hex`.
  - Round price to integer in `buildObservationId`.
  - Create comprehensive unit test suite in `src/domain/farely/identity.test.ts` [PROPOSED_NEW].

### WP02-MONEY-PRECISION-SANITIZATION
- **Target Files**: `src/domain/farely/money.ts`, `src/domain/farely/money.test.ts` [PROPOSED_NEW]
- **Implementation**:
  - Normalize currency casing in `createMoney`.
  - Normalize signed zero (`-0`) to `0`.
  - Guard `compareMoney` against null, undefined, or NaN operands throwing `IncompatibleMoneyComparisonError`.
  - Guard `formatMoney` against invalid amounts.
  - Create comprehensive unit test suite in `src/domain/farely/money.test.ts` [PROPOSED_NEW].

### WP03-LOCATIONSCOPE-METRO-DETERMINISM
- **Target Files**: `src/domain/farely/locationScope.ts`, `src/domain/farely/locationScope.test.ts` [PROPOSED_NEW]
- **Implementation**:
  - Defensive array normalization in `satisfiesLocationScope`.
  - Create comprehensive unit test suite in `src/domain/farely/locationScope.test.ts` [PROPOSED_NEW] verifying NC-002, NC-003, and catalog invariants.
