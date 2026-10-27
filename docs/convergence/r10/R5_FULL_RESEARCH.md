# FARELY CYCLE G90 — RESEARCH PASS R5: SOVEREIGN CANONICAL CONVERGENCE & SOLUTION CAGE
## Target Modules: `pwaOfflineFreshness.ts`, `priceAnomaly.ts`, `travelIntent.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

EXECUTION_RECEIPT_SHA256: 88599b0d444b87b019aa44e9be835cc7561cec596b5098cf571358633f3c5482
GIT_HEAD: b300c3d5d796f8a6b33e8d1eee47ea1f4d6b84bc
STAGE: RESEARCH_R10
PASS: R5
TIMESTAMP: 2026-10-27T09:58:00Z

---

### FALSIFICATION & AUDIT OF PASS R4 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass R5 conducts the final adversarial audit of Pass R4 across lenses L01, L02, L05, L08, L10, and L12:

1. **Falsification of L01 Proposal on NEG-08 Baseline Contamination (`priceAnomaly.ts`)**:
   - *Pass R4 Claim*: "Verify baseline cohort represents independent observations."
   - *Falsification & Code Proof*: Merely documenting this invariant does not stop callers or automated scrapers from accidentally including `currentPrice` in `historicalCohortPrices`. To provide ironclad automated defense against `NEG-08` ("Current observation included in own baseline"), `detectPriceAnomaly` must support an explicit `excludeCurrentPriceFromBaseline?: boolean` option (defaulting to `false` for backward compatibility, but actively filtering out one instance of `currentPrice` when `excludeCurrentPriceFromBaseline === true` or when flagged by SRE audit pipelines).

2. **Falsification of L02 & L12 Proposal on Optional Properties in TravelIntent (`travelIntent.ts`)**:
   - *Pass R4 Claim*: "Add `isGroupBooking` and validate flight constraints."
   - *Falsification & Code Proof*: If `isGroupBooking` is added as a mandatory field, existing stored JSON strings in databases or localStorage with `schemaVersion: 1` will fail strict schema validation upon deserialization. The field must be typed as `isGroupBooking?: boolean` so legacy serialized intents deserialize without breakage. Furthermore, `maxStops` validation must explicitly permit `0` (direct flights) while rejecting negative numbers (`maxStops < 0`), and `maxDurationMinutes` must be validated to ensure positive duration ($\ge 15$).

3. **Falsification of L05 & L08 Proposal on Test Artifact Cleanup (`pwaOfflineFreshness.ts`)**:
   - *Pass R4 Claim*: "Remove stray hook text only from `pwaOfflineFreshness.ts`."
   - *Falsification & Code Proof*: In `src/domain/farely/pwaOfflineFreshness.test.ts#L220-L259`, terminal hook resume strings were also appended to the test file during previous interactive sessions! If only the domain file is cleaned, running `npm test` on the test file could fail compilation with unexpected token errors. Both production modules and their corresponding test files must be cleanly sanitized of terminal hook artifacts simultaneously.

---

### CANONICAL SOLUTION SPECIFICATIONS (SOLUTION CAGE PROTOCOL)

The following three solutions are strictly locked for execution during Cycle G90:

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
  - Create dedicated unit test suite in `src/domain/farely/travelIntent.test.ts`.

---

### ADVERSARIAL SYSTEMIC AUDIT ACROSS ALL 12 LENSES

### L01: Mathematical & Algorithmic Rigor
- Bounded live verification window (45 min); integer passenger arithmetic; MAD dispersion bounds.

### L02: Type-System Soundness & Invariant Enforcement
- Strongly typed travel intent errors, multi-entity queue keys, robust date window extraction.

### L03: Epistemic Sincerity & Anti-Hallucination
- `NEG-35` defense against offline cache misrepresentation; `NEG-08` defense against self-contaminating baselines; ICAO lap infant safety enforcement.

### L04: State Space Completeness & Boundary Values
- Same-day round trips permitted; zero-stop direct flights permitted; FIFO queue capacity capped at 100.

### L05: Concurrency, Latency & Async Safety
- Pure array transformations and fast synchronous serialization.

### L06: Adversarial Robustness & Negative Vector Defense
- Defends `NEG-35`, `NEG-08`, `NEG-09`, and invalid passenger payload injection.

### L07: Production Realism & Environmental Fidelity
- Reflects real Vietnamese domestic aviation policies (CAAV lap infants, PWA mobile offline experience).
  - **Product Boundary Invariant (Anti-OTA Conflation)**: Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.

### L08: Architectural Cohesion & Clean Domain Kernel
- Pure TypeScript implementations without third-party dependencies. Clean stray hook output from source files.

### L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)
- Adherence to CAAV infant passenger safety standards and consumer protection transparency.

### L10: Observability, Diagnostics & SRE Auditability
- Structured error codes `[ERR_INVERTED_DATES]`, `[ERR_LAP_INFANT_EXCESS]`, and descriptive diagnostic explanations.

### L11: Zero-Trust Security & Minimal Privilege
- Safe JSON deserialization and bounded memory queues.

### L12: Backward Compatibility & Regression Invariance
- 100% preservation of all existing tests; addition of dedicated `travelIntent.test.ts`.

---

### FINAL CONVERGENCE ATTESTATION
Research Passes R1 through R5 for Cycle G90 are complete and cryptographically attested. The 3 locked solutions (`SOL-PWAOFFLINE-01`, `SOL-PRICEANOMALY-01`, `SOL-TRAVELINTENT-01`) are ready for direct transfer into Master Goal Compiler Passes G1 through G5.
