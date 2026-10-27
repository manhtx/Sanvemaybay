# FARELY CYCLE G90 — MASTER GOAL PASS G5: SOVEREIGN CANONICAL LOCK & TASK AUTHORIZATION
## Target Modules: `src/domain/farely/pwaOfflineFreshness.ts`, `src/domain/farely/priceAnomaly.ts`, `src/domain/farely/travelIntent.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
EXECUTION_RECEIPT_SHA256: 88599b0d444b87b019aa44e9be835cc7561cec596b5098cf571358633f3c5482
GIT_HEAD: b300c3d5d796f8a6b33e8d1eee47ea1f4d6b84bc
STAGE: MASTER_GOAL_G11
PASS: G5
TIMESTAMP: 2026-10-27T10:03:00Z

---

### FALSIFICATION & AUDIT OF PASS G4 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass G5 performs the final adversarial audit of Pass G4 across lenses L01, L02, L05, L08, L10, and L12:

1. **Falsification of L02 Proposal on NaN Coercion in Passenger Counts (`travelIntent.ts`)**:
   - *Pass G4 Claim*: "Use `params.adults ?? 1` and check `adults < 1`."
   - *Falsification & Code Proof*: In JavaScript, `NaN ?? 1` evaluates to `NaN`. Because comparisons with `NaN` (such as `NaN < 1`) unconditionally return `false`, a corrupt payload containing `{ adults: NaN }` bypasses the check and creates an invalid `TravelIntent`! SRE rigor requires strict integer type guards: `if (!Number.isInteger(adults) || adults < 1) throw new RangeError('At least 1 adult passenger required');`. The same strict integer validation must apply to `children` and `infants`.

2. **Falsification of L01 & L10 Proposal on Post-Exclusion Sample Size Telemetry (`priceAnomaly.ts`)**:
   - *Pass G4 Claim*: "Exclude currentPrice from cohort."
   - *Falsification & Code Proof*: Pass G4 did not mandate that the returned `AnomalyEvaluation.sampleSize` property must reflect the post-exclusion length of `validCohort`. If `sampleSize` reported the raw pre-exclusion count while MAD was calculated on the post-exclusion count, telemetry logs would report conflicting sample sizes. `sampleSize` must strictly record `validCohort.length` after single-instance exclusion of `currentPrice`.

3. **Falsification of L05 & L08 Proposal on Multi-File Artifact Sanitization (`travelIntent.ts`)**:
   - *Pass G4 Claim*: "Clean hook output only from PWA files."
   - *Falsification & Code Proof*: `src/domain/farely/travelIntent.ts` also contains terminal hook output in lines 139-142 from prior interactive runs. All three domain files and test files must be systematically purged of terminal hook output to maintain 100% clean domain kernels.

---

### CANONICAL CAGED SOLUTION CONTRACTS (LOCKED FOR EXECUTION)

#### 1. SOL-PWAOFFLINE-01: PWA Offline Freshness Calibration & Multi-Entity Queue Safety
- **Target File**: `src/domain/farely/pwaOfflineFreshness.ts`
- **Target Test File**: `src/domain/farely/pwaOfflineFreshness.test.ts`
- **Implementation**:
  - `export const LIVE_REVALIDATION_THRESHOLD_MINUTES = 45`.
  - Non-empty entity key deduplication with null safety: `Boolean(key) && key === newKey && item.actionType === newAction.actionType`.
  - Expanded integrity checks in `assertOfflineFreshnessIntegrity`:
    1. If offline: require `isLiveVerified === false`, `canDirectBook === false`, and `isOfflineCached === true`.
    2. If online: reject `isLiveVerified: true` or `canDirectBook: true` if `priceVND <= 0` or `offlineStalenessMinutes > 45`.
  - Clean up terminal hook artifacts from source and test files.

#### 2. SOL-PRICEANOMALY-01: Anomaly Detection Rigor & NEG-08 Baseline Independence
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Target Test File**: `src/domain/farely/priceAnomaly.test.ts`
- **Implementation**:
  - Support `excludeCurrentPriceFromBaseline?: boolean`: Remove at most one matching instance of `currentPrice` from cohort via `const idx = cohort.indexOf(currentPrice); if (idx !== -1) cohort.splice(idx, 1);`.
  - Perform `validCohort.length < MIN_ANOMALY_SAMPLE_SIZE` (10) check *after* single-instance currentPrice exclusion, reporting post-exclusion `sampleSize`.
  - Guard all numerical outputs in `AnomalyEvaluation` against `NaN` and `Infinity`.
  - Preserve `AUD-12` zero dispersion abstention (`INSUFFICIENT_DISPERSION_ABSTENTION`).

#### 3. SOL-TRAVELINTENT-01: TravelIntent Creation Rigor, Chronological Validation & Infant Safety
- **Target File**: `src/domain/farely/travelIntent.ts`
- **Target Test File**: `src/domain/farely/travelIntent.test.ts` [PROPOSED_NEW]
- **Implementation**:
  - Exact date ordering (`inbound.exact >= outbound.exact`) and window ordering (`effectiveInboundTo >= effectiveOutboundFrom`).
  - Strict integer passenger mix validation: `Number.isInteger` for all counts, `adults >= 1`, `children >= 0`, `infants >= 0`, `infants <= adults`, total party $\le 18$.
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

### SECTION D: LOCKED WORK PACKAGES FOR TRANSACTIONAL EXECUTION

1. `WP01-PWAOFFLINE-FRESHNESS-CALIBRATION` (`src/domain/farely/pwaOfflineFreshness.ts`)
2. `WP02-PRICEANOMALY-INDEPENDENT-BASELINE` (`src/domain/farely/priceAnomaly.ts`)
3. `WP03-TRAVELINTENT-CHRONO-SAFETY` (`src/domain/farely/travelIntent.ts`)
