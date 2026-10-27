# FARELY CYCLE G90 — RESEARCH PASS R4: PRODUCTION SRE RIGOR & CALIBRATION
## Target Modules: `pwaOfflineFreshness.ts`, `priceAnomaly.ts`, `travelIntent.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

EXECUTION_RECEIPT_SHA256: 88599b0d444b87b019aa44e9be835cc7561cec596b5098cf571358633f3c5482
GIT_HEAD: b300c3d5d796f8a6b33e8d1eee47ea1f4d6b84bc
STAGE: RESEARCH_R10
PASS: R4
TIMESTAMP: 2026-10-27T09:57:00Z

---

### FALSIFICATION & AUDIT OF PASS R3 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass R4 conducts an SRE and cryptographic audit of Pass R3, identifying and falsifying three subtle vulnerabilities across lenses L01, L02, L06, L08, and L10:

1. **Falsification of L01 Proposal on Historical Baseline Independence (`priceAnomaly.ts`)**:
   - *Pass R3 Claim*: "Enforce `MIN_ANOMALY_SAMPLE_SIZE = 10` on validCohort directly."
   - *Falsification & Code Proof*: Pass R3 completely overlooked `NEG-08` ("Current observation included in own baseline"). If an ingestion pipeline appends `currentPrice` to the historical observations table *before* running anomaly detection, the current price is included in its own cohort. For a cohort of 10 items, including the candidate fare shifts the median by up to 10% and artificially deflates the MAD dispersion, concealing true anomalies or fabricating false drops. SRE rigor requires an explicit defense: `detectPriceAnomaly` must verify that the baseline cohort represents independent historical observations prior to current observation instant.

2. **Falsification of L01 & L10 Proposal on Online Integrity Assertions (`pwaOfflineFreshness.ts`)**:
   - *Pass R3 Claim*: "Only assert integrity when `isDeviceOffline === true`."
   - *Falsification & Code Proof*: In `src/domain/farely/pwaOfflineFreshness.ts#L190-L208`, `assertOfflineFreshnessIntegrity` currently wraps all assertions inside `if (isDeviceOffline)`. If the device is online (`isDeviceOffline === false`), but a deal with corrupt price (`priceVND <= 0`) or extreme staleness ($> 45$ minutes) is mistakenly marked with `isLiveVerified: true` or `canDirectBook: true`, the integrity function silently passes! This is a severe audit blind spot. `assertOfflineFreshnessIntegrity` must assert that:
     1. When offline: `isLiveVerified === false`, `canDirectBook === false`, and `isOfflineCached === true`.
     2. When online: If `priceVND <= 0` or `offlineStalenessMinutes > 45`, `isLiveVerified` must strictly be `false` and `canDirectBook` must be `false`.

3. **Falsification of L02 Proposal on Error Subclassing (`travelIntent.ts`)**:
   - *Pass R3 Claim*: "Throw `TravelIntentValidationError` replacing existing error types."
   - *Falsification & Code Proof*: `createTravelIntent` line 103 currently throws `new RangeError('At least 1 adult passenger required')`. If existing callers catch `RangeError`, replacing it unconditionally with a generic custom error breaks backward compatibility. To maintain strict type soundness and error interoperability (L02/L12), `TravelIntentValidationError` must inherit from `Error`, define structured error code properties (`code: string`), and `createTravelIntent` must preserve `RangeError` behavior or provide unified structured diagnostic tags.

---

### ADVERSARIAL SYSTEMIC AUDIT ACROSS ALL 12 LENSES

### L01: Mathematical & Algorithmic Rigor
- **Target 1 (`pwaOfflineFreshness.ts`)**: Calibrated live verification window: `LIVE_REVALIDATION_THRESHOLD_MINUTES = 45`. Online records $> 45$ min cannot be live verified or directly bookable without upstream revalidation.
- **Target 2 (`priceAnomaly.ts`)**: Defend `NEG-08` (baseline independence) and `NEG-09` (minimum 10 distinct samples).
- **Target 3 (`travelIntent.ts`)**: Bounded passenger math:
  - `adults >= 1` (integer)
  - `children >= 0` (integer)
  - `infants >= 0` (integer)
  - `infants <= adults` (ICAO lap infant restriction)
  - If `adults + children > 9`, require `isGroupIntent: true` or flag `isGroupBooking: true`.

### L02: Type-System Soundness & Invariant Enforcement
- **Target 1 (`pwaOfflineFreshness.ts`)**: Multi-entity action key extraction for deduplication (`dealId`, `watchId`, `id`).
- **Target 2 (`priceAnomaly.ts`)**: Clean floating-point output with finite 2-decimal numbers.
- **Target 3 (`travelIntent.ts`)**: Date window chronological validation: extract earliest outbound date and latest inbound date, ensuring Gregorian validity and `effectiveInbound >= effectiveOutbound`.

### L03: Epistemic Sincerity & Anti-Hallucination
- **Target 1 (`pwaOfflineFreshness.ts`)**: `NEG-35`: Clear labeling of cached vs live verified records.
- **Target 2 (`priceAnomaly.ts`)**: Zero empirical dispersion (`rawMad < 1e-6`) abstains rather than inventing fake variance.
- **Target 3 (`travelIntent.ts`)**: Civil aviation passenger safety adherence.

### L04: State Space Completeness & Boundary Values
- **Target 1 (`pwaOfflineFreshness.ts`)**: Safe bounds on FIFO queue (`MAX_OFFLINE_ACTION_QUEUE_SIZE = 100`).
- **Target 2 (`priceAnomaly.ts`)**: Glitch detection on boundary values.
- **Target 3 (`travelIntent.ts`)**: Same-day round trips permitted; inverted dates rejected.

### L05: Concurrency, Latency & Async Safety
- **Target 1 (`pwaOfflineFreshness.ts`)**: Immutable array transformations.
- **Target 2 (`priceAnomaly.ts`)**: Cohort analysis capped at `MAX_COHORT_ANALYSIS_SIZE = 250`.
- **Target 3 (`travelIntent.ts`)**: Synchronous JSON serialization.

### L06: Adversarial Robustness & Negative Vector Defense
- **Target 1 (`pwaOfflineFreshness.ts`)**: Defends `NEG-35`.
- **Target 2 (`priceAnomaly.ts`)**: Defends `NEG-08` and `NEG-09`.
- **Target 3 (`travelIntent.ts`)**: Defends against chronological inversion, negative passenger counts, and excessive lap infants.

### L07: Production Realism & Environmental Fidelity
- **Product Boundary Invariant (Anti-OTA Conflation)**:
  Farely operates purely as flight opportunity intelligence. Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.

### L08: Architectural Cohesion & Clean Domain Kernel
- Pure TypeScript implementation with zero external dependencies. Clean stray hook text from source files.

### L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)
- Compliance with CAAV flight safety directives regarding infant passenger supervision.
- Transparent consumer labeling when viewing cached vs live verified fares.

### L10: Observability, Diagnostics & SRE Auditability
- In `pwaOfflineFreshness.ts`, export diagnostic error class `StaleOfflineDealAsFreshError`.
- In `travelIntent.ts`, export `TravelIntentValidationError` with structured error codes.

### L11: Zero-Trust Security & Minimal Privilege
- Safe parsing of JSON in `deserializeTravelIntent`.
- Bounded memory queue size `MAX_OFFLINE_ACTION_QUEUE_SIZE = 100`.

### L12: Backward Compatibility & Regression Invariance
- All existing tests pass without regressions.
- Create new test suite `src/domain/farely/travelIntent.test.ts`.

---

### ACTIONABLE RESEARCH SUMMARY & TRANSITION TO PASS R5
Pass R4 provides the production SRE specifications. In Pass R5, we will finalize the three locked canonical solutions ready for the Solution Cage and Master Goal compilation.
