# FARELY CYCLE G90 — MASTER GOAL PASS G3: INDEX DEFENSE & BOUNDARY DRIFT CONTROL
## Target Modules: `src/domain/farely/pwaOfflineFreshness.ts`, `src/domain/farely/priceAnomaly.ts`, `src/domain/farely/travelIntent.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
EXECUTION_RECEIPT_SHA256: 88599b0d444b87b019aa44e9be835cc7561cec596b5098cf571358633f3c5482
GIT_HEAD: b300c3d5d796f8a6b33e8d1eee47ea1f4d6b84bc
STAGE: MASTER_GOAL_G11
PASS: G3
TIMESTAMP: 2026-10-27T10:01:00Z

---

### FALSIFICATION & AUDIT OF PASS G2 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass G3 conducts an adversarial audit of Pass G2 across lenses L01, L02, L04, L05, and L06:

1. **Falsification of L01 & L06 Proposal on Cohort Array Splicing (`priceAnomaly.ts`)**:
   - *Pass G2 Claim*: "Remove at most one matching instance of `currentPrice` from cohort."
   - *Falsification & Code Proof*: In JavaScript, `Array.prototype.indexOf(item)` returns `-1` when the element is not found. If an executor naively calls `cohort.splice(cohort.indexOf(currentPrice), 1)` without guarding `idx !== -1`, calling `splice(-1, 1)` will delete the *last element* of the array! If `currentPrice` was not present in the historical baseline, the baseline would be corrupted by removing a valid historical observation! The implementation must strictly verify:
     ```ts
     const idx = cohort.indexOf(currentPrice);
     if (idx !== -1) {
       cohort.splice(idx, 1);
     }
     ```

2. **Falsification of L04 & L10 Proposal on Exact Date vs Window Comparison (`travelIntent.ts`)**:
   - *Pass G2 Claim*: "Compare window anchors using `effectiveInboundTo < effectiveOutboundFrom`."
   - *Falsification & Code Proof*: For standard bookings with exact dates (e.g. `outboundDate = '2026-11-15'`, `returnDate = '2026-11-10'`), both `exact` dates are populated. If an algorithm only checked range extremes, it could allow inverted exact bookings if range properties were unpopulated or fallback to default values. For exact dates, the rule must be strictly deterministic: `if (outbound.exact && inbound.exact) { if (inbound.exact < outbound.exact) throw error; }`.

3. **Falsification of L02 & L05 Proposal on Null Action Guards (`pwaOfflineFreshness.ts`)**:
   - *Pass G2 Claim*: "Deduplicate by non-empty key directly."
   - *Falsification & Code Proof*: In mobile PWA contexts, corrupted service worker events or malformed IndexedDB reads can pass `newAction` as `null` or `undefined`. If `enqueueOfflineAction` does not guard `if (!newAction || typeof newAction !== 'object') return queue;`, destructuring `...newAction` will throw `TypeError: Cannot spread non-iterable-instance`, crashing the PWA background sync loop.

---

### CAGED SOLUTION CONTRACTS (LOCKED FOR EXECUTION)

#### 1. SOL-PWAOFFLINE-01: PWA Offline Freshness Calibration & Multi-Entity Queue Safety
- **Target File**: `src/domain/farely/pwaOfflineFreshness.ts`
- **Target Test File**: `src/domain/farely/pwaOfflineFreshness.test.ts`
- **Implementation**:
  - `export const LIVE_REVALIDATION_THRESHOLD_MINUTES = 45`.
  - Non-empty entity key deduplication with null safety: `Boolean(key) && key === newKey && item.actionType === newAction.actionType`.
  - Online integrity validation in `assertOfflineFreshnessIntegrity`: Reject `isLiveVerified: true` if `priceVND <= 0` or `offlineStalenessMinutes > 45`.
  - Clean up terminal hook artifacts from source and test files.

#### 2. SOL-PRICEANOMALY-01: Anomaly Detection Rigor & NEG-08 Baseline Independence
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Target Test File**: `src/domain/farely/priceAnomaly.test.ts`
- **Implementation**:
  - Safe single-instance removal: `const idx = cohort.indexOf(currentPrice); if (idx !== -1) cohort.splice(idx, 1);`.
  - Guard all numerical outputs in `AnomalyEvaluation` against `NaN` and `Infinity`.
  - Preserve `AUD-12` zero dispersion abstention.
  - `MIN_ANOMALY_SAMPLE_SIZE = 10`.

#### 3. SOL-TRAVELINTENT-01: TravelIntent Creation Rigor, Chronological Validation & Infant Safety
- **Target File**: `src/domain/farely/travelIntent.ts`
- **Target Test File**: `src/domain/farely/travelIntent.test.ts` [PROPOSED_NEW]
- **Implementation**:
  - Strict exact date ordering (`inbound.exact >= outbound.exact`) and window ordering (`effectiveInboundTo >= effectiveOutboundFrom`).
  - Passenger mix validation: Non-negative integers, `adults >= 1`, `infants <= adults`.
  - Flag `isGroupBooking: true` when `adults + children > 9`.
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
