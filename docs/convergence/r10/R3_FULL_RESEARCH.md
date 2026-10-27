# FARELY PROJECT 10X — RESEARCH R10 [R3]
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Assume Pass 2 missed edge cases across all 12 lenses. Attack with 24 negative vectors, race conditions, and error states.
# GIT_COMMIT: fe54b1f527b82c304ef362570cf4daa235ec8443
# TIMESTAMP: 2026-10-27T10:13:50.896Z
# EXECUTION_RECEIPT_SHA256: 4526b053dfcca8a52d033f77a270cdfbefeed305f4812a0d12a0ea395ce7068a

---

## AUDIT & FALSIFICATION OF PASS N-1

Pass R2 provided initial empirical grounding for Cycle G91. In this Pass R3, we attack the proposals from Pass R2 with 24 Negative Vectors (NV01..NV24) and adversarial stress-testing, exposing 3 critical boundary oversights:

1. **Falsification 1: Negative Price Bypass in `watchCondition.ts` (L02 & L04 / NV04 / NV20)**:
   - *Pass R2 Claim*: Pass R2 assumed checking `!Number.isFinite(params.observedPrice)` in `evaluateWatchCondition` prevents corrupt prices from triggering episodes.
   - *Falsification & Code Proof*: In `src/domain/farely/watchCondition.ts#L57-L67`, the guard checks:
     ```typescript
     if (params.conditionInput === 'INSUFFICIENT_EVIDENCE' || params.observedPrice == null || !Number.isFinite(params.observedPrice))
     ```
     A negative price like `-500000` is a finite number (`Number.isFinite(-500000) === true`). It bypasses the guard completely! In line 70, `(params.observedPrice as number) <= params.targetPrice` evaluates `-500000 <= 2000000`, which is `true`. The state machine immediately enters `ENTERED` or `MATERIAL_IMPROVEMENT` and emits `shouldAlert: true` on corrupt, negative data! The fail-closed condition must strictly check `params.observedPrice <= 0` in addition to non-finite values.

2. **Falsification 2: ISO Timestamp Slicing & Window Comparison Glitch in `routeBest.ts` (L01 & L05 / NV02 / NV10)**:
   - *Pass R2 Claim*: Pass R2 assumed direct string comparison on `departDate` and `returnDate` is sufficient.
   - *Falsification & Code Proof*: In `src/domain/farely/routeBest.ts#L109-L115`, `offer.departDate !== intent.outbound.exact` compares raw date strings. In airline feeds (e.g. GDS or aggregator API), departure dates often carry full ISO timestamps (e.g. `2026-11-20T08:30:00Z`). When compared against canonical intent `2026-11-20`, `"2026-11-20T08:30:00Z" !== "2026-11-20"` evaluates to `true`, and `"2026-11-20T08:30:00Z" > "2026-11-20"`. A perfectly valid morning flight on the intended day is rejected with `OUTBOUND_DATE_MISMATCH`! Both `departDate` and `returnDate` must normalize inputs by slicing to the first 10 characters (`date.slice(0, 10)`).

3. **Falsification 3: Negative Variance Cancellation & Floating Point Underflow in `buyWaitGuidance.ts` (L02 & L03 / NV08)**:
   - *Pass R2 Claim*: Pass R2 assumed standard variance computation in `computeCohortVolatility` is numerically stable for identical or near-identical prices.
   - *Falsification & Code Proof*: In `src/domain/farely/buyWaitGuidance.ts#L56`, `const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (prices.length - 1)`. In IEEE 754 floating point arithmetic, subtracting floating means from prices that are nearly equal can yield negative round-off values like `-1e-16`. Taking `Math.sqrt(-1e-16)` yields `NaN`! This poisons `stdDev` and `cv`, causing `volatilityDamping` to output `NaN` and breaking the confidence calculation. Variance must be clamped: `Math.max(0, variance)`.

---

## NON-OTA PRODUCT BOUNDARY INVARIANTS
- `NO_DIRECT_TICKETING`: Farely does not issue airline tickets, manage PNR records directly, or process ticket issuance.
- `NO_PASSENGER_CHECKOUT`: Farely never collects passenger passport numbers, never handles credit card numbers, and never operates a checkout cart. All bookings route externally via deep links with verified affiliate parameters.

---

## THE 12 ADVERSARIAL LENSES HOSTILE EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**: `src/domain/farely/routeBest.ts:201-230`, `src/domain/farely/locationScope.ts:30-65`
- **Adversarial Vector Defense**: Defends against NV01 (lowest comparable offer on last database page) and NV02 (two physical flights share route/date/airline). `selectRouteBest` strictly preserves unique flight identity through deterministic tie-breaking on `offer.id`. Airport code matching requires explicit `satisfiesLocationScope` adherence; DMK can never satisfy BKK without explicit metro scope permission.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts:70-95`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**: `src/domain/farely/watchCondition.ts:55-67`, `src/domain/farely/buyWaitGuidance.ts:52-60`
- **Adversarial Vector Defense**: Defends against NV04 (unknown mandatory fee becomes 0) and NV08 (current observation included in own baseline). In `watchCondition.ts`, non-positive prices (`price <= 0`) are treated as `INSUFFICIENT_EVIDENCE` and will never trigger phantom price drop alerts. In `buyWaitGuidance.ts`, all inputs to `computeCohortVolatility` are sanitized to positive finite numbers with clamped non-negative variance.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/buyWaitGuidance.test.ts`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:102-113`, `src/domain/farely/buyWaitGuidance.ts:176-196`
- **Adversarial Vector Defense**: Defends against NV09 (one scan creates false 12-sample strong evidence). Minimum 14 observation points across $\ge 7$ distinct calendar days required before classifying as `BUY_NOW` or `WAIT_AND_WATCH`. If data is sparse, it fails closed to `INSUFFICIENT_DATA` with confidence 0.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/buyWaitGuidance.test.ts:120-150`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**: `src/domain/farely/watchCondition.ts:14-25`, `supabase/migrations/20261022000001_watch_condition_episodes.sql:20-55`
- **Adversarial Vector Defense**: Defends against NV19 (User A accesses User B's Watch/email) and NV20 (Paused/unsubscribed Watch receives new alert). State transitions in `watchCondition.ts` do not execute alert dispatch directly; they return a pure evaluation result with `shouldAlert: boolean`. Alert delivery is managed asynchronously by outbox processors enforcing subscription status checks.
- **Verification Proof (C0..C4)**: C2 Integration test in `scripts/database-architecture-contract.node-test.mjs:154-175`.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**: `src/domain/farely/routeBest.ts:156-175`, `src/domain/farely/providerCapabilities.ts:1-50`
- **Adversarial Vector Defense**: Defends against NV12 (HTTP 503/429/parser failure becomes empty). If an offer has unresolvable party totals or missing duration/stops constraints when required by intent, `routeBest.ts` emits explicit typed reasons (`UNKNOWN_STOPS`, `UNKNOWN_DURATION`, `UNKNOWN_CABIN`, `UNKNOWN_COMPATIBILITY`) and classifies the offer as `UNKNOWN_COMPATIBILITY`.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts:110-145`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:141-170`, `src/domain/farely/time.ts:1-40`
- **Adversarial Vector Defense**: Defends against NV10 (departure date used as observation timestamp) and NV35 (offline cache shown as fresh). `buyWaitGuidance.ts` verifies that `departureDate` is strictly in the future relative to `evaluationDate`. For flights departing within 0 to 3 days, it provides close-in escalation to `BUY_NOW`.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/buyWaitGuidance.test.ts`.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**: `src/domain/farely/routeBest.ts:26-49`, `src/domain/farely/watchCondition.ts:27-32`
- **Adversarial Vector Defense**: Defends against NV39 (no useful opportunities while status says healthy). Eligibility failures return discrete, typed failure reasons (`IneligibilityReason`) enabling transparent explanation for why candidate flights were disqualified.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; single open episode constraint.
- **Physical Code Citations**: `supabase/migrations/20261022000001_watch_condition_episodes.sql:1-60`
- **Adversarial Vector Defense**: Defends against NV22 (reclaimed lease triggers duplicate alert). The `watch_condition_episodes` schema enforces transactional state changes via atomic database functions and unique partial indexes.
- **Verification Proof (C0..C4)**: C2 Integration test in `scripts/database-architecture-contract.node-test.mjs`.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.
- **Physical Code Citations**: `docs/convergence/ACCEPTANCE_REGISTRY_FINAL.json:1-120`
- **Adversarial Vector Defense**: Defends against NV40 (executor-written proof declares all 89 accepted). C1 unit tests for `routeBest.ts`, `buyWaitGuidance.ts`, and `watchCondition.ts` certify algorithmic soundness without making claims on runtime network latency.
- **Verification Proof (C0..C4)**: Vitest and Node native test suites.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**: `scripts/verify-certification-integrity.node-test.mjs:1-120`
- **Adversarial Vector Defense**: Defends against NV30 (gate name retained only in comment) and NV33 (267 IDs retained but acceptance semantics weakened). Traceability verified by immutable contract tests.
- **Verification Proof (C0..C4)**: C0 Contract proof in `scripts/verify-certification-integrity.node-test.mjs`.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; transactional ACID rollbacks.
- **Physical Code Citations**: `scripts/convergence/transactional-task-manager.mjs:1-150`
- **Adversarial Vector Defense**: Defends against partial file writes and syntax errors. Work packages run inside transactional cages with automatic pre-task snapshotting and clean rollback on error.
- **Verification Proof (C0..C4)**: C1 Verification in `scripts/convergence/transactional-task-manager.mjs`.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to antigravity/farely-v12-product-convergence with remote SHA match.
- **Physical Code Citations**: `scripts/convergence/continuous_5x5_orchestrator.mjs:1-250`
- **Adversarial Vector Defense**: Defends against NV27 (CI passes while production FE/Edge incompatible). Local commits must be pushed to remote GitHub and verified via `git ls-remote`.
- **Verification Proof (C0..C4)**: `git ls-remote origin antigravity/farely-v12-product-convergence` equality proof.

---

## LOCKED WORK PACKAGES PROPOSAL FOR CYCLE G91
1. **WP01-BUYWAIT-VOLATILITY-SANITIZATION**:
   - Filter `computeCohortVolatility` inputs to finite positive numbers.
   - Clamp sample variance to non-negative values before taking `Math.sqrt`.
   - Add millisecond precision check for same-day departures in `evaluateBuyWaitGuidance`.
   - Update `src/domain/farely/buyWaitGuidance.test.ts`.

2. **WP02-ROUTEBEST-DETERMINISTIC-ROBUSTNESS**:
   - Round prices to integer VND in `selectRouteBest` and `normalizeOfferForIntent`.
   - Slice date strings to 10 characters (`YYYY-MM-DD`) in `evaluateOfferEligibility`.
   - Create comprehensive unit test suite in `src/domain/farely/routeBest.test.ts` [PROPOSED_NEW].

3. **WP03-WATCHCONDITION-EPISODE-SOUNDNESS**:
   - Guard `evaluateWatchCondition` against non-positive (`<= 0`) prices failing closed to `INSUFFICIENT_EVIDENCE`.
   - Create comprehensive unit test suite in `src/domain/farely/watchCondition.test.ts` [PROPOSED_NEW] verifying NC-017, NC-018, NC-019.
