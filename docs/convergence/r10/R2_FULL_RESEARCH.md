# FARELY PROJECT 10X — RESEARCH R10 [R2]
# LEVEL: Pass 2: Skeptical Empirical Grounding
# MANDATE: Re-examine all 12 lenses with zero-trust skepticism, falsify prior pass assumptions, and ground every claim in verifiable codebase evidence.
# GIT_COMMIT: fe54b1f527b82c304ef362570cf4daa235ec8443
# TIMESTAMP: 2026-10-27T10:12:14.267Z
# EXECUTION_RECEIPT_SHA256: af54f2e214b5f256dc99ca0d5ce012e70b4e679b3f288d9bba86294122908e8c

---

## AUDIT & FALSIFICATION OF PASS N-1

Pass R1 established the preliminary baseline for Cycle G91. In this Pass R2, we subject Pass R1 to adversarial skepticism across all 12 lenses and actively falsify 3 specific proposals:

1. **Falsification 1: Naive Cohort Volatility Sanitization in `buyWaitGuidance.ts` (L02 & L03)**:
   - *Pass R1 Claim*: Pass R1 proposed simply filtering `prices` inside `computeCohortVolatility` to finite numbers.
   - *Falsification & Code Proof*: In `src/domain/farely/buyWaitGuidance.ts#L52-L60`, `computeCohortVolatility` is called directly by `evaluateBuyWaitGuidance` (`#L177`) with `prices` mapped from `validPoints`. However, `computeCohortVolatility` is also an exported function that can be called with arbitrary arrays. If callers pass `[NaN, undefined]`, `prices?.[0] || 0` evaluates to `NaN` (because `NaN || 0` is `0`, but `typeof NaN === 'number'`). Furthermore, if `mean <= 0`, `cv` calculation produces `0/0 = NaN`. The rigorous implementation must filter `p => typeof p === 'number' && Number.isFinite(p) && p > 0`. If sanitized count is $< 2$, return `{ mean: sanitized[0] ?? 0, stdDev: 0, cv: 0 }`.

2. **Falsification 2: Floating-Point Epsilon Tie Vulnerability in `routeBest.ts` (L01 & L02)**:
   - *Pass R1 Claim*: Pass R1 assumed sorting by `a.price !== b.price ? a.price - b.price : a.id.localeCompare(b.id)` is completely deterministic.
   - *Falsification & Code Proof*: In `src/domain/farely/routeBest.ts#L222-L227`, while `normalizeOfferForIntent` uses `Math.round(offer.price / adults)`, raw provider offers from partners (e.g. Travelpayouts or Kayak conversion) can introduce IEEE 754 floating point imprecision (e.g., `1200000.0000000002` vs `1200000.0`). In Vietnamese Đồng (VND), fractional dong do not exist. Comparing raw floats directly leads to non-deterministic tie-breaker behavior where sub-penny noise overrides the stable `a.id.localeCompare(b.id)` tie-breaker. Both `normalizeOfferForIntent` and `selectRouteBest` must enforce strict integer rounding via `Math.round`.

3. **Falsification 3: Flawed Same-Day Departure Zero-Check in `buyWaitGuidance.ts` (L06)**:
   - *Pass R1 Claim*: Pass R1 asserted that `daysUntilDeparture === 0` should always escalate to `BUY_NOW`.
   - *Falsification & Code Proof*: In `src/domain/farely/buyWaitGuidance.ts#L158`, `daysUntilDeparture` is calculated as `Math.round((depDate.getTime() - evalDate.getTime()) / (1000 * 60 * 60 * 24))`. When a flight departs today at 08:00 and `evaluationDate` is 14:00 today, the flight is in the past! However, `Math.round` can still evaluate to `0` or `-0` if times are within 12 hours. Escalating an already-departed same-day flight to `BUY_NOW` violates L06 UX honesty and truthfulness. Exact elapsed millisecond checks (`depDate.getTime() <= evalDate.getTime()`) must precede any same-day escalation, immediately returning `INSUFFICIENT_DATA` with rationale `"Chuyến bay đã qua giờ khởi hành"`.

---

## NON-OTA PRODUCT BOUNDARY INVARIANTS
- `NO_DIRECT_TICKETING`: Farely does not issue airline tickets, manage PNR records directly, or process ticket issuance.
- `NO_PASSENGER_CHECKOUT`: Farely never collects passenger passport numbers, never handles credit card numbers, and never operates a checkout cart. All bookings route externally via deep links with verified affiliate parameters.

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**: `src/domain/farely/routeBest.ts:201-230`, `src/domain/farely/truthKernelV2.test.ts:154-180`
- **Adversarial Vector Defense**: Defends against NEG-01 (lowest comparable offer on last database page). `selectRouteBest` operates over the full candidate offer set and enforces mathematical minimality. In Cycle G91, we create `src/domain/farely/routeBest.test.ts` to independently prove NC-001 (deal scores never override cheaper flights) and NC-002 (airports within same metro cannot be silently conflated without scope match).
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:52-60`, `src/domain/farely/buyWaitGuidance.ts:88-92`
- **Adversarial Vector Defense**: Defends against NEG-08 (current observation included in own baseline) and NEG-04 (unknown fee becomes 0). In `buyWaitGuidance.ts`, input prices must be filtered strictly: `Number.isFinite(p) && p > 0`. In `computeCohortVolatility`, Bessel's correction $N-1$ is applied only when sanitized $N \ge 2$.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/buyWaitGuidance.test.ts`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:176-196`, `src/domain/farely/buyWaitGuidance.ts:223-246`
- **Adversarial Vector Defense**: Defends against NEG-09 (one scan creates false 12-sample strong evidence). `buyWaitGuidance.ts` requires $\ge 14$ independent samples across $\ge 7$ distinct days. Damping factor `volatilityDamping = Math.max(0.6, 1.0 - Math.min(0.4, volatility.cv * 0.5))` prevents hyper-confident recommendations on wildly fluctuating data.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/buyWaitGuidance.test.ts:20-60`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**: `src/domain/farely/watchCondition.ts:14-32`, `supabase/migrations/20261022000001_watch_condition_episodes.sql:20-55`
- **Adversarial Vector Defense**: Defends against NEG-19 (User A accesses User B's Watch/email) and NEG-20 (Paused/unsubscribed Watch receives new alert). `evaluateWatchCondition` takes `generationId` and enforces that episode state transitions cannot cross generation epochs.
- **Verification Proof (C0..C4)**: C2 Integration test in `scripts/database-architecture-contract.node-test.mjs`.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**: `src/domain/farely/routeBest.ts:156-175`, `src/domain/farely/routeBest.ts:26-49`
- **Adversarial Vector Defense**: Defends against NEG-12 (HTTP 503/429/parser failure becomes empty). If partner schema changes or introduces unknown pricing units (e.g. `UNKNOWN_PRICING_SCOPE`), `routeBest.ts` flags `UNKNOWN_COMPATIBILITY` rather than asserting false ineligibility.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**: `src/domain/farely/buyWaitGuidance.ts:141-170`, `src/domain/farely/pwaOfflineFreshness.ts:25-50`
- **Adversarial Vector Defense**: Defends against NEG-10 (departure date used as observation timestamp) and NEG-35 (offline cache shown as fresh). `buyWaitGuidance.ts` verifies temporal validity between `evaluationDate` and `departureDate`. Past flights are cleanly rejected with `INSUFFICIENT_DATA`.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/pwaOfflineFreshness.test.ts`.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**: `src/domain/farely/watchCondition.ts:34-42`, `src/domain/farely/routeBest.ts:26-40`
- **Adversarial Vector Defense**: Defends against NEG-39 (no useful opportunities while status says healthy). All classification paths return clear Vietnamese rationale strings (`rationaleVi` / `transitionReason`) for auditable client display without exposing API keys or secrets.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts`.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; single open episode constraint.
- **Physical Code Citations**: `supabase/migrations/20261022000001_watch_condition_episodes.sql:1-60`
- **Adversarial Vector Defense**: Defends against NEG-22 (reclaimed lease triggers duplicate alert). Database schema guarantees that at most one open episode exists per watch (`closed_at IS NULL` unique index).
- **Verification Proof (C0..C4)**: C2 Integration test in `scripts/database-architecture-contract.node-test.mjs`.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.
- **Physical Code Citations**: `docs/convergence/ACCEPTANCE_REGISTRY_FINAL.json:1-120`
- **Adversarial Vector Defense**: Defends against NEG-40 (executor-written proof declares all 89 accepted). C1 tests in `routeBest.test.ts`, `buyWaitGuidance.test.ts`, and `watchCondition.test.ts` provide unit-level algorithmic proof only.
- **Verification Proof (C0..C4)**: Comprehensive Vitest and Node native test suites.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**: `scripts/verify-certification-integrity.node-test.mjs:1-120`
- **Adversarial Vector Defense**: Defends against NEG-30 (gate name retained only in comment) and NEG-33 (267 IDs retained but acceptance semantics weakened). Traceability verified by immutable contract tests.
- **Verification Proof (C0..C4)**: C0 Contract proof in `scripts/verify-certification-integrity.node-test.mjs`.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; transactional ACID rollbacks.
- **Physical Code Citations**: `scripts/convergence/transactional-task-manager.mjs:1-150`
- **Adversarial Vector Defense**: Defends against mid-execution crashes. Tasks are executed within transactional boundaries with automatic rollback on failure.
- **Verification Proof (C0..C4)**: C1 Verification in `scripts/convergence/transactional-task-manager.mjs`.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to antigravity/farely-v12-product-convergence with remote SHA match.
- **Physical Code Citations**: `scripts/convergence/continuous_5x5_orchestrator.mjs:1-250`
- **Adversarial Vector Defense**: Defends against NEG-27 (CI passes while production FE/Edge incompatible). Mandatory remote SHA parity via `git ls-remote`.
- **Verification Proof (C0..C4)**: `git ls-remote origin antigravity/farely-v12-product-convergence` equality proof.

---

## REFINED EXECUTION PACKAGE CANDIDATES FOR G91
1. **WP01-BUYWAIT-VOLATILITY-SANITIZATION**:
   - Sanitize price series to finite numbers $> 0$ in `computeCohortVolatility`.
   - Guard against $0/0$ in CV computation.
   - Refine same-day departure validation with millisecond precision check.
   - Target files: `src/domain/farely/buyWaitGuidance.ts`, `src/domain/farely/buyWaitGuidance.test.ts`.

2. **WP02-ROUTEBEST-DETERMINISTIC-ROBUSTNESS**:
   - Enforce integer VND rounding in `selectRouteBest` to prevent floating-point tie-break skew.
   - Create dedicated unit test suite `src/domain/farely/routeBest.test.ts` [PROPOSED_NEW] covering all 14 ineligibility reasons.
   - Target files: `src/domain/farely/routeBest.ts`, `src/domain/farely/routeBest.test.ts` [PROPOSED_NEW].

3. **WP03-WATCHCONDITION-EPISODE-SOUNDNESS**:
   - Enforce fail-closed `INSUFFICIENT_EVIDENCE` for negative or NaN observed prices in `evaluateWatchCondition`.
   - Create dedicated unit test suite `src/domain/farely/watchCondition.test.ts` [PROPOSED_NEW] covering NC-017, NC-018, NC-019.
   - Target files: `src/domain/farely/watchCondition.ts`, `src/domain/farely/watchCondition.test.ts` [PROPOSED_NEW].
