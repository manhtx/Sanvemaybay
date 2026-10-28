# FARELY PROJECT 10X — MASTER GOAL G11 [G4]
# LEVEL: Pass 4: Proof Hierarchy & Anti-Self-Certification
# MANDATE: Subject G3 to strict Proof Hierarchy (C0..C4) separation, eliminate all self-certification loopholes, and enforce adversarial type bounds across all 12 lenses.
# GIT_COMMIT: 774b3d00f9bd9e105ba466c058e428935b211847
# TIMESTAMP: 2026-10-28T02:34:49.482Z
# EXECUTION_RECEIPT_SHA256: 7e79d897dea132c295bd6a010a885cc8aa95a27cba96e3b3d8c0fc942eede5f2

---

## AUDIT & FALSIFICATION OF PASS G3
Pass G3 established Production SRE runtime bounds. In Pass G4, we subject G3 to strict Proof Hierarchy (C0..C4) and adversarial data type inspection across all 12 lenses, falsifying 3 subtle assumptions:

1. **[L02 & L09 FALSIFICATION] (Lexicographical String Price Ingestion & IEEE 754 Ordering Fallacy in `comparator.ts`)**:
   - *G3 Deficit*: G3 relied on `Number.isFinite(o.price) && o.price > 0`. In untyped JavaScript runtime environments, if a loose JSON parser passes numeric strings (e.g., `"2000000"`), standard sorting without mathematical comparator causes lexicographical collation errors where `"10000000"` precedes `"2000000"`.
   - *G4 Proof Hierarchy Correction*: G4 mandates strict mathematical predicate checking:
     $$ \forall o \in \mathcal{O}, \quad \text{valid}(o) \iff (\text{typeof}(o.\text{price}) \equiv \text{'number'}) \land \text{isFinite}(o.\text{price}) \land (o.\text{price} > 0) $$
     Furthermore, in `computeMedian`, `validPrices.sort((a, b) => a - b)` ensures deterministic mathematical ordering across all real numbers $\mathbb{R}^+$. Verification requires C1 unit tests explicitly passing string/object payloads to prove fail-closed rejection.

2. **[L01 & L05 FALSIFICATION] (Array-Based Hidden Cost NaN Leakage & Epistemic Corruption in `costEpistemics.ts`)**:
   - *G3 Deficit*: G3 clamped object-based fees but omitted array-based payload validation.
   - *G4 Proof Hierarchy Correction*: In `src/domain/farely/costEpistemics.ts#L93-L102`, if `params.providedHiddenCosts` is an array of items and an upstream crawler injects `{ label: 'Hành lý', amount: NaN }`, `baggageFeeProvided` becomes `NaN`, contaminating the epistemic state:
     $$ C_{\text{total}} = C_{\text{base}} + \sum C_{\text{mandatory}} + \sum C_{\text{optional}} $$
     If any addend is `NaN`, IEEE 754 arithmetic propagates `NaN` across all summation folds. G4 enforces deep array item validation: `typeof item.amount === 'number' && Number.isFinite(item.amount) && item.amount >= 0 ? Math.round(item.amount) : undefined`.

3. **[L09 & L10 FALSIFICATION] (C1 Unit Isolation vs C2 Pipeline Integration Confusion)**:
   - *G3 Deficit*: G3 assumed that passing local C1 unit tests suffices to guarantee zero regression on the integrated platform.
   - *G4 Proof Hierarchy Correction*: Under Proof Hierarchy rules (C0 Contract $\to$ C1 Code $\to$ C2 Integration $\to$ C3 Runtime $\to$ C4 Longitudinal Soak), C1 unit tests certify local module contracts only. They cannot certify C2 multi-module pipeline execution (e.g. `comparator` + `costEpistemics` + `savings` feeding into `routeBest`). G4 mandates full suite regression execution (`npm test` -> 852+ tests) before any commit can be verified.

---

## MATHEMATICAL FORMALISMS & DEGENERATE COHORT HANDLING
In statistical evaluation of fare cohorts, empirical distributions can collapse into degenerate point masses:
$$ \sigma^2 = \frac{1}{N-1} \sum_{i=1}^N (x_i - \bar{x})^2 = 0 \iff x_1 = x_2 = \dots = x_N $$
When $\sigma^2 = 0$, any positive deviation $x_{\text{curr}} < \bar{x}$ represents a delta against a uniform fixed tariff (such as state-capped public domestic routes). To prevent misleading consumers with sensational discount badges on micro-fluctuations, G4 proves that the discount threshold function must be damped:
$$ \text{verdict}(P, \text{cohort}) = \begin{cases}
\text{'Giá rất tốt'} & \text{if } \text{discount} \ge 20\% \land \text{evidence} = \text{STRONG} \\
\text{'Giá đáng chú ý'} & \text{if } \text{discount} \ge 10\% \land \text{evidence} \in \{\text{STRONG}, \text{MODERATE}\} \\
\text{'Giá tiêu chuẩn'} & \text{if } \sigma^2 = 0 \land \text{discount} < 10\% \\
\text{'Thấp hơn mức thông thường'} & \text{if } \sigma^2 > 0 \land \text{discount} > 0
\end{cases} $$

---

## SECTION B: INVARIANT EXECUTOR CAGE
- `INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION`
- `NO_DIRECT_TICKETING`: Direct ticketing is strictly boundary_excluded. Farely does not issue tickets or hold PNRs.
- `NO_PASSENGER_CHECKOUT`: Passenger checkout is strictly boundary_excluded. Farely never collects passenger passport numbers or credit cards.
- `NO_PAYMENT_COLLECTION`: Payment gateway integration and credit card processing are strictly boundary_excluded.
- `NO_UNAUTHORIZED_SCRAPING`: Unauthorized scraping is strictly boundary_excluded. All data ingested via verified partner APIs.
- `NO_SELF_CERTIFICATION`: Derived strictly from authentic test proofs; C1 != C2 != C3.
- `NO_CONTRACT_SHRINKAGE`: Preserves all 89 capability contracts (F00..F88) and 267 historical gates.

---

## SECTION C: TARGET WORK PACKAGES SPECIFICATION
- **WP01-COMPARATOR-EVIDENCE-ROBUSTNESS**:
  - Filter `typeof o.price === 'number' && Number.isFinite(o.price) && o.price > 0`.
  - Guard `compareAgainstCohort` with `if (!Number.isFinite(currentPrice) || currentPrice <= 0)` failing closed to `INSUFFICIENT`.
  - Handle `sampleSize === 0` with complete null safety and `verdictLabel: 'Giá quan sát'`.
  - Eradicate `departLocalDate` fallback to enforce REQ-COMP-004.
  - Zero-dispersion caveat requiring $\ge 10\%$ drop for discount verdict when historical variance is zero.
  - Comprehensive unit test in `src/domain/farely/comparator.test.ts` [PROPOSED_NEW].

- **WP02-COSTEPISTEMICS-TRANSPARENCY-GUARD**:
  - Sanitize `params.basePrice` with non-negative finite check.
  - Sanitize both object-based and array-based hidden fee amounts with non-negative finite clamping.
  - Register Pacific Airlines (`BL`) in `BUDGET_CARRIER_CODES`.
  - Enforce explicit bundle flags taking precedence over budget heuristics.
  - Comprehensive unit test in `src/domain/farely/costEpistemics.test.ts` [PROPOSED_NEW].

- **WP03-SAVINGS-RELATIVE-VALUE-BOUNDS**:
  - Strict finiteness validation on `observedPrice` and `benchmarkPrice`.
  - Clean integer clamping eliminating signed zero (`-0`):
    $$ \Delta P = P_{\text{benchmark}} - P_{\text{observed}}, \quad S = \begin{cases} \lfloor \Delta P \rceil & \text{if } \Delta P > 0 \\ 0 & \text{otherwise} \end{cases} $$
  - Comprehensive unit test in `src/domain/farely/savings.test.ts` [PROPOSED_NEW].

---

## THE 12 ADVERSARIAL LENSES PROOF HIERARCHY MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:97-165`, `src/domain/farely/costEpistemics.ts:1-75`
- **Adversarial Vector Defense**: Defends against NEG-01 and NEG-34. True cost evaluation respects explicit provider inclusion over generic heuristics.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/truthKernelV2.test.ts:96-150`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**: `src/domain/farely/savings.ts:17-38`, `src/domain/farely/comparator.ts:101-107`, `src/domain/farely/priceAnomaly.ts:40-75`
- **Adversarial Vector Defense**: Defends against NEG-04 and NEG-08. Input prices and fee amounts are strictly validated as positive finite numbers.
- **Verification Proof (C0..C4)**: C1 Unit test in `src/domain/farely/domainKernel.test.ts:74-95`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**: `src/domain/farely/comparator.ts:60-92`, `src/domain/farely/costEpistemics.ts:27-47`, `src/domain/farely/buyWaitGuidance.ts:80-120`
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

## SECTION J: EXECUTION RUNBOOK
Execute tasks transactionally using `scripts/convergence/transactional-task-manager.mjs`.
