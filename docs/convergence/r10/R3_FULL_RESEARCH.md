# FARELY CYCLE G90 — RESEARCH PASS R3: HOSTILE BOUNDARY & NEGATIVE VECTOR DEFENSE
## Target Modules: `pwaOfflineFreshness.ts`, `priceAnomaly.ts`, `travelIntent.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

EXECUTION_RECEIPT_SHA256: 88599b0d444b87b019aa44e9be835cc7561cec596b5098cf571358633f3c5482
GIT_HEAD: b300c3d5d796f8a6b33e8d1eee47ea1f4d6b84bc
STAGE: RESEARCH_R10
PASS: R3
TIMESTAMP: 2026-10-27T09:56:00Z

---

### FALSIFICATION & AUDIT OF PASS R2 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass R3 subjects Pass R2 to hostile boundary stress-testing and falsifies three critical oversights across lenses L01, L02, L04, L06, and L10:

1. **Falsification of L04 & L06 Proposal on Same-Day Round Trips (`travelIntent.ts`)**:
   - *Pass R2 Claim*: "Verify `effectiveInbound >= effectiveOutbound` without testing same-day boundaries."
   - *Falsification & Code Proof*: In business travel (e.g. SGN-HAN morning flight returning SGN evening), `outboundDate` and `returnDate` share the exact same calendar day (`2026-11-01`). If a naive validator requires `effectiveInbound > effectiveOutbound`, same-day round-trips are erroneously blocked! The condition must strictly be `effectiveInbound >= effectiveOutbound`. Furthermore, if `outboundDate` contains an invalid Gregorian date (e.g. `2026-02-30`), string comparison alone could pass invalid strings without catching calendar corruption. Validation must verify calendar date authenticity before ordering.

2. **Falsification of L01 & L10 Proposal on Online Stale Cache Transparency (`pwaOfflineFreshness.ts`)**:
   - *Pass R2 Claim*: "When online, mark `isOfflineCached: false` unconditionally."
   - *Falsification & Code Proof*: In `src/domain/farely/pwaOfflineFreshness.ts#L168`, when `isDeviceOffline === false`, the code sets `isOfflineCached: false` even if the record was retrieved directly from local IndexedDB cache and has not yet completed background HTTP revalidation. Under `NEG-35` ("Offline cache shown as fresh"), if a deal is 60 minutes old and served from local disk, claiming it is not cached misrepresents provenance. The record must indicate `isServedFromCache: true` and `isLiveVerified: false` until active network roundtrip re-verification completes.

3. **Falsification of L02 & L10 Proposal on Anomaly Metric Precision (`priceAnomaly.ts`)**:
   - *Pass R2 Claim*: "Return raw calculations in `AnomalyEvaluation`."
   - *Falsification & Code Proof*: If `rawZScore` evaluates to non-finite or `NaN` (e.g. if `mad === 0` in an unhandled branch), `toFixed(2)` or JSON serialization will produce corrupted strings. All numerical fields (`modifiedZScore`, `discountVsMedianPercent`, `medianPrice`, `mad`) must be clamped and validated as finite numbers before serialization.

---

### ADVERSARIAL SYSTEMIC AUDIT ACROSS ALL 12 LENSES

### L01: Mathematical & Algorithmic Rigor
- **Target 1 (`pwaOfflineFreshness.ts`)**: Set `LIVE_REVALIDATION_THRESHOLD_MINUTES = 45`. Observations $\le 45$ min in online mode are `isLiveVerified: true`; observations $> 45$ min are `isLiveVerified: false` with label `'Dữ liệu chờ cập nhật'`.
- **Target 2 (`priceAnomaly.ts`)**: Enforce `MIN_ANOMALY_SAMPLE_SIZE = 10`. Require minimum sample count before executing MAD calculations.
- **Target 3 (`travelIntent.ts`)**: Passenger count constraints:
  - `adults >= 1` (integer)
  - `children >= 0` (integer)
  - `infants >= 0` (integer)
  - `infants <= adults` (ICAO lap infant restriction)
  - `totalPassengers = adults + children + infants`

### L02: Type-System Soundness & Invariant Enforcement
- **Target 1 (`pwaOfflineFreshness.ts`)**: Robust multi-entity action key extraction:
  ```ts
  const targetKey = item.payload?.dealId || item.payload?.watchId || item.payload?.id || '';
  ```
- **Target 2 (`priceAnomaly.ts`)**: Strict typing for anomaly classifications:
  `STRONG_DROP_ANOMALY` | `MODERATE_DROP_ANOMALY` | `NORMAL_FLUCTUATION` | `SUSPECTED_DATA_GLITCH` | `SPARSE_DATA_ABSTENTION` | `INSUFFICIENT_DISPERSION_ABSTENTION`.
- **Target 3 (`travelIntent.ts`)**: Export `TravelIntentValidationError` with diagnostic error codes:
  - `ERR_INVERTED_DATES`
  - `ERR_INVALID_PASSENGER_COUNT`
  - `ERR_EXCESSIVE_LAP_INFANTS`
  - `ERR_GROUP_CAPACITY_EXCEEDED`

### L03: Epistemic Sincerity & Anti-Hallucination
- **Target 1 (`pwaOfflineFreshness.ts`)**: `NEG-35`: Defend against presenting offline data as live or verified.
- **Target 2 (`priceAnomaly.ts`)**: `AUD-12`: Zero empirical dispersion must never fabricate synthetic MAD variance.
- **Target 3 (`travelIntent.ts`)**: Accurate representation of civil aviation passenger safety constraints.

### L04: State Space Completeness & Boundary Values
- **Target 1 (`pwaOfflineFreshness.ts`)**: FIFO bounds on `MAX_OFFLINE_ACTION_QUEUE_SIZE = 100`.
- **Target 2 (`priceAnomaly.ts`)**: Extremes: zero price, negative price, price $> 10\times$ median handled as `SUSPECTED_DATA_GLITCH`.
- **Target 3 (`travelIntent.ts`)**: Same-day round trips (`outbound === inbound`) accepted; inverted trips rejected.

### L05: Concurrency, Latency & Async Safety
- **Target 1 (`pwaOfflineFreshness.ts`)**: Pure functional queue enqueueing without array mutation.
- **Target 2 (`priceAnomaly.ts`)**: Sliced cohort analysis with `MAX_COHORT_ANALYSIS_SIZE = 250`.
- **Target 3 (`travelIntent.ts`)**: Fast synchronous serialization and deserialization.

### L06: Adversarial Robustness & Negative Vector Defense
- **Target 1 (`pwaOfflineFreshness.ts`)**: Defends `NEG-35` (offline cache shown as fresh).
- **Target 2 (`priceAnomaly.ts`)**: Defends `NEG-09` (insufficient sample anomaly claims).
- **Target 3 (`travelIntent.ts`)**: Defends against chronological date inversion and passenger safety violations.

### L07: Production Realism & Environmental Fidelity
- **Product Boundary Invariant (Anti-OTA Conflation)**:
  Farely operates purely as flight opportunity intelligence. Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.
- Real-world mobile network transitions in Vietnam.

### L08: Architectural Cohesion & Clean Domain Kernel
- Pure TypeScript implementation with zero third-party dependencies. Clean stray hook text from domain files.

### L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)
- Compliance with CAAV flight safety directives regarding infant passenger supervision.
- Transparent consumer labeling when viewing cached vs live verified fares.

### L10: Observability, Diagnostics & SRE Auditability
- In `pwaOfflineFreshness.ts`, export diagnostic error class `StaleOfflineDealAsFreshError`.
- In `priceAnomaly.ts`, provide clear Vietnamese explanations for each anomaly tier.
- In `travelIntent.ts`, export `TravelIntentValidationError` with structured error codes.

### L11: Zero-Trust Security & Minimal Privilege
- Safe parsing of JSON in `deserializeTravelIntent`.
- Bounded memory queue size `MAX_OFFLINE_ACTION_QUEUE_SIZE = 100`.

### L12: Backward Compatibility & Regression Invariance
- All existing tests in `pwaOfflineFreshness.test.ts` and `priceAnomaly.test.ts` must pass.
- Create new test suite `src/domain/farely/travelIntent.test.ts`.

---

### ACTIONABLE RESEARCH SUMMARY & TRANSITION TO PASS R4
Pass R3 hardened the specifications against hostile boundaries and negative vectors. In Pass R4, we will develop complete SRE specifications and precise code diffs.
