# FARELY CYCLE G90 — MASTER GOAL PASS G1: EXECUTION DIRECTIVE & SOLUTION CAGE
## Target Modules: `src/domain/farely/pwaOfflineFreshness.ts`, `src/domain/farely/priceAnomaly.ts`, `src/domain/farely/travelIntent.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
EXECUTION_RECEIPT_SHA256: 88599b0d444b87b019aa44e9be835cc7561cec596b5098cf571358633f3c5482
GIT_HEAD: b300c3d5d796f8a6b33e8d1eee47ea1f4d6b84bc
STAGE: MASTER_GOAL_G11
PASS: G1
TIMESTAMP: 2026-10-27T09:59:00Z

---

### SECTION A: MISSION ARCHITECTURE & PRODUCT BOUNDARY
Farely is strictly an independent flight opportunity intelligence platform. Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.
The executor must implement the exact, locked work packages below with zero deviation.

---

### SECTION B: CAGED SOLUTION CONTRACTS (FROM RESEARCH R5)

#### 1. SOL-PWAOFFLINE-01: PWA Offline Freshness Calibration & Multi-Entity Queue Safety
- **Target File**: `src/domain/farely/pwaOfflineFreshness.ts`
- **Target Test File**: `src/domain/farely/pwaOfflineFreshness.test.ts`
- **Specification**:
  - Calibrate live verification threshold: Define `export const LIVE_REVALIDATION_THRESHOLD_MINUTES = 45`. Observations $> 45$ min in online mode are `isLiveVerified: false` with label `'Dữ liệu chờ cập nhật'`.
  - Fix action queue deduplication in `enqueueOfflineAction`: Extract target entity key using `(item.payload?.dealId as string) || (item.payload?.watchId as string) || (item.payload?.id as string) || ''`.
  - In `assertOfflineFreshnessIntegrity`, expand validation: If online (`isDeviceOffline === false`), assert that deals with invalid prices (`priceVND <= 0`) or extreme staleness ($> 45$ min) cannot have `isLiveVerified: true` or `canDirectBook: true`.
  - Clean up stray terminal hook output from both `pwaOfflineFreshness.ts` and `pwaOfflineFreshness.test.ts`.

#### 2. SOL-PRICEANOMALY-01: Anomaly Detection Rigor & NEG-08 Baseline Independence
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Target Test File**: `src/domain/farely/priceAnomaly.test.ts`
- **Specification**:
  - Provide `excludeCurrentPriceFromBaseline?: boolean` in `detectPriceAnomaly` to defend against `NEG-08`.
  - Guard all numerical outputs in `AnomalyEvaluation` against `NaN`, `Infinity`, or precision loss.
  - Retain `AUD-12` zero empirical dispersion abstention (`INSUFFICIENT_DISPERSION_ABSTENTION`).
  - Enforce `MIN_ANOMALY_SAMPLE_SIZE = 10` before declaring statistical anomalies.

#### 3. SOL-TRAVELINTENT-01: TravelIntent Creation Rigor, Chronological Validation & Infant Safety
- **Target File**: `src/domain/farely/travelIntent.ts`
- **Target Test File**: `src/domain/farely/travelIntent.test.ts` [PROPOSED_NEW]
- **Specification**:
  - Export `TravelIntentValidationError` with structured error codes (`ERR_INVERTED_DATES`, `ERR_PASSENGER_MIX_INVALID`, `ERR_LAP_INFANT_EXCESS`, `ERR_INVALID_CONSTRAINTS`).
  - Chronological date validation: extract effective departure date and effective return date, verifying `effectiveInbound >= effectiveOutbound` (supporting same-day round trips while rejecting inverted dates).
  - Passenger mix validation: `adults >= 1`, `children >= 0`, `infants >= 0`, all integers.
  - ICAO lap infant safety: `infants <= adults`.
  - Group capacity handling: If `adults + children > 9`, set `isGroupBooking: true`.
  - Flight constraint bounds: `maxStops >= 0`, `maxDurationMinutes >= 15`.
  - Clean up stray terminal hook strings from bottom of `travelIntent.ts`.
  - Create dedicated unit test suite in `src/domain/farely/travelIntent.test.ts` [PROPOSED_NEW].

---

### SECTION C: ADVERSARIAL AUDIT ACROSS ALL 12 LENSES

- **L01: Mathematical & Algorithmic Rigor**: Calibrated 45-min live verification window; MAD statistics without synthetic variance.
- **L02: Type-System Soundness & Invariant Enforcement**: Multi-entity queue keys, structured validation errors, optional group fields.
- **L03: Epistemic Sincerity & Anti-Hallucination**: `NEG-35` offline cache defense, `NEG-08` baseline independence defense.
- **L04: State Space Completeness & Boundary Values**: Same-day round trips supported; direct 0-stop flights supported; queue FIFO capped at 100.
- **L05: Concurrency, Latency & Async Safety**: Pure array operations; fast deterministic serialization.
- **L06: Adversarial Robustness & Negative Vector Defense**: Defends `NEG-35`, `NEG-08`, `NEG-09`, and chronological date inversion.
- **L07: Production Realism & Environmental Fidelity**: CAAV passenger safety directives and PWA mobile offline experience.
- **L08: Architectural Cohesion & Clean Domain Kernel**: Pure TypeScript implementations with zero external dependencies.
- **L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)**: Adherence to CAAV flight safety directives and consumer protection standards.
- **L10: Observability, Diagnostics & SRE Auditability**: Standard error tags `[dealId=...]`, `[ERR_INVERTED_DATES]`, and diagnostic properties.
- **L11: Zero-Trust Security & Minimal Privilege**: Safe JSON parsing, bounded memory queue size `MAX_OFFLINE_ACTION_QUEUE_SIZE = 100`.
- **L12: Backward Compatibility & Regression Invariance**: 100% preservation of all existing tests; new dedicated test suite for `travelIntent.ts`.

---

### SECTION D: LOCKED WORK PACKAGES FOR TRANSACTIONAL EXECUTION

#### WP01: `WP01-PWAOFFLINE-FRESHNESS-CALIBRATION`
- **Target File**: `src/domain/farely/pwaOfflineFreshness.ts`
- **Target Test File**: `src/domain/farely/pwaOfflineFreshness.test.ts`
- **Implementation**: 45-min live verification threshold, multi-entity queue deduplication, online stale deal assertions, hook cleanup.

#### WP02: `WP02-PRICEANOMALY-INDEPENDENT-BASELINE`
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Target Test File**: `src/domain/farely/priceAnomaly.test.ts`
- **Implementation**: Baseline independence (NEG-08 defense), robust numerical clamping, zero-dispersion handling.

#### WP03: `WP03-TRAVELINTENT-CHRONO-SAFETY`
- **Target File**: `src/domain/farely/travelIntent.ts`
- **Target Test File**: `src/domain/farely/travelIntent.test.ts` [PROPOSED_NEW]
- **Implementation**: Chronological date window validation (effectiveInbound >= effectiveOutbound), passenger mix constraints, lap infant safety (infants <= adults), dedicated test suite.
