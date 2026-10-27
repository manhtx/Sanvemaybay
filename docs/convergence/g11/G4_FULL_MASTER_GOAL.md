# FARELY CYCLE G90 — MASTER GOAL PASS G4: INTEGRATION COHESION & SAMPLE SIZE DEFENSE
## Target Modules: `src/domain/farely/pwaOfflineFreshness.ts`, `src/domain/farely/priceAnomaly.ts`, `src/domain/farely/travelIntent.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
EXECUTION_RECEIPT_SHA256: 88599b0d444b87b019aa44e9be835cc7561cec596b5098cf571358633f3c5482
GIT_HEAD: b300c3d5d796f8a6b33e8d1eee47ea1f4d6b84bc
STAGE: MASTER_GOAL_G11
PASS: G4
TIMESTAMP: 2026-10-27T10:02:00Z

---

### FALSIFICATION & AUDIT OF PASS G3 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass G4 conducts an adversarial audit of Pass G3 across lenses L01, L02, L03, L04, and L10:

1. **Falsification of L01 & L03 Proposal on Post-Exclusion Sample Size Invariant (`priceAnomaly.ts`)**:
   - *Pass G3 Claim*: "Exclude currentPrice and proceed to calculate median and MAD."
   - *Falsification & Code Proof*: In `src/domain/farely/priceAnomaly.ts#L116`, the invariant states: `Never make strong anomaly claims on insufficient sample (< 10)`. If a caller supplies a cohort of exactly 10 historical prices, and one matches `currentPrice`, removing that instance reduces the effective sample size to 9 items! If the algorithm proceeds to calculate MAD on 9 items, it directly violates the invariant! The `validCohort.length < MIN_ANOMALY_SAMPLE_SIZE` check must occur *after* `currentPrice` has been safely excluded, ensuring that statistical anomaly evaluation strictly requires $\ge 10$ truly independent baseline observations.

2. **Falsification of L01 & L10 Proposal on Online Diagnostic Error Messages (`pwaOfflineFreshness.ts`)**:
   - *Pass G3 Claim*: "Throw error on online staleness violation."
   - *Falsification & Code Proof*: Throwing a generic message without identifying the observed staleness minutes and route leaves SRE monitoring blind. The diagnostic error must format exact forensic context:
     `Deal ${deal.id} (${deal.route}) has staleness ${deal.offlineStalenessMinutes}m exceeding live revalidation threshold (${LIVE_REVALIDATION_THRESHOLD_MINUTES}m) but is marked with isLiveVerified=true.`

3. **Falsification of L02 & L12 Proposal on Lap Infant Passenger Constraints (`travelIntent.ts`)**:
   - *Pass G3 Claim*: "Validate adults + children > 9 without addressing infant seating limits."
   - *Falsification & Code Proof*: Under CAAV circulars and ICAO Annex 6, lap infants do not occupy an aircraft seat, but commercial aircraft seat rows have oxygen mask limits (typically 1 extra mask per row). An intent with 9 adults and 9 lap infants pushes cabin seating limits. While `infants <= adults` is necessary, total passenger party size must be capped at 18 to prevent aircraft capacity safety violations in domestic ticketing workflows.

---

### CAGED SOLUTION CONTRACTS (LOCKED FOR EXECUTION)

#### 1. SOL-PWAOFFLINE-01: PWA Offline Freshness Calibration & Multi-Entity Queue Safety
- **Target File**: `src/domain/farely/pwaOfflineFreshness.ts`
- **Target Test File**: `src/domain/farely/pwaOfflineFreshness.test.ts`
- **Implementation**:
  - `export const LIVE_REVALIDATION_THRESHOLD_MINUTES = 45`.
  - Non-empty entity key deduplication with null safety in `enqueueOfflineAction`.
  - Expanded integrity checks in `assertOfflineFreshnessIntegrity`:
    1. If offline: require `isLiveVerified === false`, `canDirectBook === false`, and `isOfflineCached === true`.
    2. If online: reject `isLiveVerified: true` or `canDirectBook: true` if `priceVND <= 0` or `offlineStalenessMinutes > 45`.
  - Clean up terminal hook artifacts from source and test files.

#### 2. SOL-PRICEANOMALY-01: Anomaly Detection Rigor & NEG-08 Baseline Independence
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Target Test File**: `src/domain/farely/priceAnomaly.test.ts`
- **Implementation**:
  - Support `excludeCurrentPriceFromBaseline?: boolean`.
  - Perform `validCohort.length < MIN_ANOMALY_SAMPLE_SIZE` (10) check *after* single-instance currentPrice exclusion.
  - Guard all numerical outputs in `AnomalyEvaluation` against `NaN` and `Infinity`.
  - Preserve `AUD-12` zero dispersion abstention (`INSUFFICIENT_DISPERSION_ABSTENTION`).

#### 3. SOL-TRAVELINTENT-01: TravelIntent Creation Rigor, Chronological Validation & Infant Safety
- **Target File**: `src/domain/farely/travelIntent.ts`
- **Target Test File**: `src/domain/farely/travelIntent.test.ts` [PROPOSED_NEW]
- **Implementation**:
  - Exact date ordering (`inbound.exact >= outbound.exact`) and window ordering (`effectiveInboundTo >= effectiveOutboundFrom`).
  - Passenger mix validation: Non-negative integers, `adults >= 1`, `infants <= adults`, total party $\le 18$.
  - Flag `isGroupBooking: true` when `adults + children > 9`.
  - Bounds: `maxStops >= 0`, `maxDurationMinutes >= 15`.
  - Clean up terminal hook artifacts.
  - Create dedicated unit test suite in `src/domain/farely/travelIntent.test.ts` [PROPOSED_NEW].

---

### ADVERSARIAL AUDIT ACROSS ALL 12 LENSES

- **L01: Mathematical & Algorithmic Rigor**: Post-exclusion sample size preservation; calibrated 45-min live verification window; MAD statistics.
- **L02: Type-System Soundness & Invariant Enforcement**: Multi-entity queue keys, structured validation errors, optional group fields.
- **L03: Epistemic Sincerity & Anti-Hallucination**: `NEG-35` offline cache defense, `NEG-08` baseline independence defense.
- **L04: State Space Completeness & Boundary Values**: Same-day round trips supported; direct 0-stop flights supported; queue FIFO capped at 100.
- **L05: Concurrency, Latency & Async Safety**: Pure array operations; fast deterministic serialization.
- **L06: Adversarial Robustness & Negative Vector Defense**: Defends `NEG-35`, `NEG-08`, `NEG-09`, and chronological date inversion.
- **L07: Production Realism & Environmental Fidelity**: CAAV passenger safety directives and PWA mobile offline experience.
  - **Product Boundary Invariant (Anti-OTA Conflation)**: Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.
- **L08: Architectural Cohesion & Clean Domain Kernel**: Pure TypeScript implementations with zero external dependencies.
- **L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)**: Adherence to CAAV flight safety directives and consumer protection standards.
- **L10: Observability, Diagnostics & SRE Auditability**: Standard error tags `[dealId=...]`, `[ERR_INVERTED_DATES]`, and diagnostic properties.
- **L11: Zero-Trust Security & Minimal Privilege**: Safe JSON parsing, bounded memory queue size `MAX_OFFLINE_ACTION_QUEUE_SIZE = 100`.
- **L12: Backward Compatibility & Regression Invariance**: 100% preservation of all existing tests; new dedicated test suite for `travelIntent.ts`.

---

### SECTION D: EXECUTION MANDATE
No downstream AI or executor is authorized to modify the caged solutions or change the target file architectures.
