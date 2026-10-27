# FARELY CYCLE G90 — MASTER GOAL PASS G2: ADVERSARIAL SKEPTICISM & CAGE CALIBRATION
## Target Modules: `src/domain/farely/pwaOfflineFreshness.ts`, `src/domain/farely/priceAnomaly.ts`, `src/domain/farely/travelIntent.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
EXECUTION_RECEIPT_SHA256: 88599b0d444b87b019aa44e9be835cc7561cec596b5098cf571358633f3c5482
GIT_HEAD: b300c3d5d796f8a6b33e8d1eee47ea1f4d6b84bc
STAGE: MASTER_GOAL_G11
PASS: G2
TIMESTAMP: 2026-10-27T10:00:00Z

---

### FALSIFICATION & AUDIT OF PASS G1 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass G2 conducts an adversarial audit of Pass G1 across lenses L01, L02, L04, L06, and L10:

1. **Falsification of L02 Proposal on Empty Key Collision in Action Queue (`pwaOfflineFreshness.ts`)**:
   - *Pass G1 Claim*: "Deduplicate using target key fallback to `''`."
   - *Falsification & Code Proof*: In `src/domain/farely/pwaOfflineFreshness.ts#L63-L65`, if two distinct actions (e.g. `REFRESH_CONFIG` and `CLEAR_HISTORY`) have empty payloads where `dealId`, `watchId`, and `id` are all undefined, both will resolve to `targetKey = ''`. The comparison `targetKey === newTargetKey` evaluates to `'' === ''` (true), causing unrelated actions to erroneously overwrite each other! Deduplication must require a non-empty target key: `Boolean(key) && key === newKey && item.actionType === newAction.actionType`.

2. **Falsification of L01 & L06 Proposal on Baseline Price Filtering (`priceAnomaly.ts`)**:
   - *Pass G1 Claim*: "Filter `currentPrice` from baseline cohort."
   - *Falsification & Code Proof*: If `historicalCohortPrices` contains multiple identical historical observations (e.g. standard 1,500,000₫ fare observed 3 times previously), filtering with `prices.filter(p => p !== currentPrice)` would strip *all* 3 instances! This would artificially distort the true historical distribution. The exclusion mechanism must remove at most ONE matching instance of `currentPrice` (representing the current observation's insertion), leaving all genuine historical observations intact.

3. **Falsification of L04 & L10 Proposal on Date Window Overlap Comparison (`travelIntent.ts`)**:
   - *Pass G1 Claim*: "Verify `effectiveInbound >= effectiveOutbound` without window range handling."
   - *Falsification & Code Proof*: When `outboundDate` is a flexible range `{ from: '2026-11-01', to: '2026-11-05' }` and `returnDate` is `{ from: '2026-11-04', to: '2026-11-10' }`, the earliest return is before the latest outbound, but the journey remains logically feasible (e.g. depart Nov 1, return Nov 4). The chronological invariant is violated only when the latest return date is strictly earlier than the earliest outbound date (`effectiveInboundTo < effectiveOutboundFrom`). The validator must correctly anchor the comparison between the earliest outbound instant and the latest inbound instant.

---

### CAGED SOLUTION CONTRACTS (LOCKED FOR EXECUTION)

#### 1. SOL-PWAOFFLINE-01: PWA Offline Freshness Calibration & Multi-Entity Queue Safety
- **Target File**: `src/domain/farely/pwaOfflineFreshness.ts`
- **Target Test File**: `src/domain/farely/pwaOfflineFreshness.test.ts`
- **Implementation**:
  - `export const LIVE_REVALIDATION_THRESHOLD_MINUTES = 45`.
  - Non-empty entity key deduplication in `enqueueOfflineAction`: `Boolean(key) && key === newKey && item.actionType === newAction.actionType`.
  - Online integrity check in `assertOfflineFreshnessIntegrity`: Reject `isLiveVerified: true` if `priceVND <= 0` or `offlineStalenessMinutes > 45`.
  - Clean up terminal hook artifacts from source and test files.

#### 2. SOL-PRICEANOMALY-01: Anomaly Detection Rigor & NEG-08 Baseline Independence
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Target Test File**: `src/domain/farely/priceAnomaly.test.ts`
- **Implementation**:
  - `excludeCurrentPriceFromBaseline?: boolean`: Remove at most one matching instance of `currentPrice` from cohort.
  - Guard all numerical outputs in `AnomalyEvaluation` against `NaN` and `Infinity`.
  - Preserve `AUD-12` zero dispersion abstention.
  - `MIN_ANOMALY_SAMPLE_SIZE = 10`.

#### 3. SOL-TRAVELINTENT-01: TravelIntent Creation Rigor, Chronological Validation & Infant Safety
- **Target File**: `src/domain/farely/travelIntent.ts`
- **Target Test File**: `src/domain/farely/travelIntent.test.ts` [PROPOSED_NEW]
- **Implementation**:
  - Date window validation: Extract `effectiveOutboundFrom = outbound.exact || outbound.from` and `effectiveInboundTo = inbound.exact || inbound.to`. Reject when `effectiveInboundTo < effectiveOutboundFrom`.
  - Passenger mix validation: Non-negative integers, `adults >= 1`, `infants <= adults`.
  - Set `isGroupBooking: true` when `adults + children > 9`.
  - Bounds: `maxStops >= 0`, `maxDurationMinutes >= 15`.
  - Clean up terminal hook artifacts.
  - Create comprehensive unit test suite in `src/domain/farely/travelIntent.test.ts` [PROPOSED_NEW].

---

### ADVERSARIAL AUDIT ACROSS ALL 12 LENSES

- **L01: Mathematical & Algorithmic Rigor**: Calibrated 45-min live verification window; MAD statistics without synthetic variance.
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
