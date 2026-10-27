# FARELY CYCLE G90 — RESEARCH PASS R1: DEEP ADVERSARIAL DISSECTION
## Target Modules: `pwaOfflineFreshness.ts`, `priceAnomaly.ts`, `travelIntent.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

EXECUTION_RECEIPT_SHA256: 88599b0d444b87b019aa44e9be835cc7561cec596b5098cf571358633f3c5482
GIT_HEAD: b300c3d5d796f8a6b33e8d1eee47ea1f4d6b84bc
STAGE: RESEARCH_R10
PASS: R1
TIMESTAMP: 2026-10-27T09:53:00Z

---

### EXECUTIVE INTENT & SCOPE BOUNDARY
This pass initiates Cycle G90 under perpetual convergence `/goal`. It conducts an exhaustive adversarial investigation into three core domain modules:
1. `src/domain/farely/pwaOfflineFreshness.ts` (F48: Mobile-first PWA offline freshness integrity, NEG-35 offline cache defense, and action queue safety).
2. `src/domain/farely/priceAnomaly.ts` (F37: Robust price anomaly detection, MAD statistics, independent sample minimums, and NEG-09 synthetic evidence defense).
3. `src/domain/farely/travelIntent.ts` (F01/F02: Canonical TravelIntent creation, chronological return date validation, passenger mix safety, and ICAO lap infant constraints).

**Product Boundary Invariant (Anti-OTA Conflation)**:
Farely is strictly an independent flight opportunity intelligence platform. Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.

---

### ADVERSARIAL SYSTEMIC AUDIT ACROSS ALL 12 LENSES

### L01: Mathematical & Algorithmic Rigor
- **Target 1 (`pwaOfflineFreshness.ts`)**: In `resolveDealsForPwaClient` (`src/domain/farely/pwaOfflineFreshness.ts#L161`), `isLive = isPriceValid && stalenessMinutes <= 120`. A 2-hour window (120 minutes) is excessively permissive for dynamic flight pricing. Airline yield management systems frequently adjust fares within 15–30 minutes. Marking a 115-minute-old cached observation as `isLiveVerified: true` and `canDirectBook: true` violates epistemic freshness honesty. The maximum live verification threshold must be tightened to 15 minutes (`LIVE_REVALIDATION_THRESHOLD_MINUTES = 15`), while observations between 15 and 120 minutes must be designated as cached/pending verification (`isLiveVerified: false`).
- **Target 2 (`priceAnomaly.ts`)**: In `detectPriceAnomaly`, when checking for extreme data glitches (`src/domain/farely/priceAnomaly.ts#L133`):
  ```ts
  if (currentPrice < median * 0.05 || currentPrice > median * 10)
  ```
  If `currentPrice` is non-integer or floats near boundary thresholds, precision issues can occur. Moreover, Bessel's corrected variance in `calculateSampleStandardDeviation` rounds variance using `Math.round(sumSquaredDiffs / (n - 1))`, which can truncate small non-zero variances to 0.
- **Target 3 (`travelIntent.ts`)**: In `createTravelIntent`, passenger numbers are assigned via `params.adults ?? 1`, `params.children ?? 0`, `params.infants ?? 0`. Non-integer inputs (e.g. `1.5` adults) or negative values for children/infants (`-1`) are never checked. Passenger counts must be validated as non-negative integers (`Number.isInteger(n) && n >= 0`).

### L02: Type-System Soundness & Invariant Enforcement
- **Target 1 (`pwaOfflineFreshness.ts`)**: In `enqueueOfflineAction` (`src/domain/farely/pwaOfflineFreshness.ts#L63-L65`), deduplication checks `item.payload?.dealId === newAction.payload?.dealId`. If the action targets a watch item (e.g. `PAUSE_WATCH` or `RESUME_WATCH`), the payload holds `watchId` rather than `dealId`! Consequently, `item.payload?.dealId` is `undefined` for both items, causing unrelated watch actions to collide and overwrite each other! Deduplication must check the entity key dynamically: `(item.payload?.dealId && item.payload.dealId === newAction.payload?.dealId) || (item.payload?.watchId && item.payload.watchId === newAction.payload?.watchId) || (item.payload?.id && item.payload.id === newAction.payload?.id)`.
- **Target 2 (`priceAnomaly.ts`)**: `historicalCohortPrices` must be strictly sanitized to ensure finite positive numbers. If `historicalCohortPrices` is empty or undefined, it should handle it without throwing runtime errors.
- **Target 3 (`travelIntent.ts`)**: In `createTravelIntent` (`src/domain/farely/travelIntent.ts#L88-L96`), for `ROUND_TRIP` journeys, the code verifies that `returnDate` is present, but NEVER verifies that `returnDate >= outboundDate`! If a user or API passes an outbound date of `2026-11-20` and a return date of `2026-11-10`, the system creates an invalid, inverted travel intent.

### L03: Epistemic Sincerity & Anti-Hallucination
- **Target 1 (`pwaOfflineFreshness.ts`)**: `NEG-35`: Offline cache shown as fresh. The system must explicitly label all offline cached items with `offlineBadgeLabelVi: 'Dữ liệu lưu tạm ngoại tuyến (Offline)'` and prevent any direct booking claim while offline.
- **Target 2 (`priceAnomaly.ts`)**: `NEG-09`: One scan creates false 12-sample STRONG evidence. Ingesting duplicate price points from the same batch without variance must not simulate a statistical sample. `MIN_ANOMALY_SAMPLE_SIZE = 10` must be enforced against distinct observations.
- **Target 3 (`travelIntent.ts`)**: Under CAAV and international aviation safety regulations (ICAO Annex 6), infants traveling on lap require at least one accompanying adult: `infants <= adults`. A travel intent with 1 adult and 3 infants is illegal in commercial aviation and must be rejected with an informative error. Furthermore, standard commercial PNR booking limits permit at most 9 passengers total (`adults + children <= 9`). Beyond 9 passengers, it must direct to group booking.

### L04: State Space Completeness & Boundary Values
- **Target 1 (`pwaOfflineFreshness.ts`)**: Handle clock skew: `evictExpiredOfflineDeals` allows up to 5 minutes of future clock drift, but what if `nowIsoString` is corrupt or missing? It must default to `new Date().toISOString()`.
- **Target 2 (`priceAnomaly.ts`)**: When all prices in the historical cohort are identical (`rawMad < 1e-6`), line 153 correctly detects homogeneous data. However, if the sample size is exactly 10, does it handle boundary checks cleanly?
- **Target 3 (`travelIntent.ts`)**: For `ONE_WAY` journeys, `inbound` must strictly remain `undefined`. If a caller passes `returnDate` for a `ONE_WAY` journey, `createTravelIntent` should ignore or sanitize it to `undefined`.

### L05: Concurrency, Latency & Async Safety
- **Target 1 (`pwaOfflineFreshness.ts`)**: Action queue operations in `enqueueOfflineAction` must be pure and return a new array without mutating the input queue.
- **Target 2 (`priceAnomaly.ts`)**: Cohort analysis slices to `MAX_COHORT_ANALYSIS_SIZE = 250` to bound sorting time to $< 0.1$ ms.
- **Target 3 (`travelIntent.ts`)**: `serializeTravelIntent` and `deserializeTravelIntent` must execute synchronously without prototype leakage.

### L06: Adversarial Robustness & Negative Vector Defense
- **Target 1 (`pwaOfflineFreshness.ts`)**: Defends `NEG-35` (offline cache shown as fresh).
- **Target 2 (`priceAnomaly.ts`)**: Defends `NEG-09` (one scan creates false 12-sample evidence) and data glitch attacks (negative, zero, 10x spike fares).
- **Target 3 (`travelIntent.ts`)**: Defends against chronological inversion, negative passenger counts, and excessive lap infants.

### L07: Production Realism & Environmental Fidelity
- Domestic Vietnam aviation context:
  - Lap infants must not exceed adult passengers.
  - Standard domestic booking limits: 9 seats.
  - PWA offline caching must reflect real network disconnection scenarios on mobile devices.

### L08: Architectural Cohesion & Clean Domain Kernel
- Pure domain functions with zero network dependencies.
- Remove stray terminal hook strings from bottom of `travelIntent.ts` and `pwaOfflineFreshness.ts`.

### L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)
- Compliance with CAAV flight safety directives regarding infant passenger supervision.
- Transparent consumer labeling when viewing cached vs live verified fares.

### L10: Observability, Diagnostics & SRE Auditability
- In `pwaOfflineFreshness.ts`, export diagnostic error class `StaleOfflineDealAsFreshError`.
- In `priceAnomaly.ts`, provide clear Vietnamese explanations for each anomaly tier.
- In `travelIntent.ts`, provide descriptive error messages: `[NC-006 InvertedDate]` and `[REQ-DOM-003 PassengerMixViolation]`.

### L11: Zero-Trust Security & Minimal Privilege
- Safe JSON parsing in `deserializeTravelIntent`.
- Bounded memory queue size `MAX_OFFLINE_ACTION_QUEUE_SIZE = 100`.

### L12: Backward Compatibility & Regression Invariance
- All existing tests in `pwaOfflineFreshness.test.ts` and `priceAnomaly.test.ts` must pass.
- Create comprehensive test suite `src/domain/farely/travelIntent.test.ts`.

---

### ACTIONABLE RESEARCH SUMMARY & TRANSITION TO PASS R2
Pass R1 establishes the concrete defects across the three modules. In Pass R2, we will initiate adversarial falsification of these proposals.
