# FARELY CYCLE G90 — RESEARCH PASS R2: SKEPTICAL GROUNDING & FALSIFICATION
## Target Modules: `pwaOfflineFreshness.ts`, `priceAnomaly.ts`, `travelIntent.ts`
## Epistemic Integrity: Zero-Trust Codebase Telemetry & Adversarial Invariant Auditing

EXECUTION_RECEIPT_SHA256: 88599b0d444b87b019aa44e9be835cc7561cec596b5098cf571358633f3c5482
GIT_HEAD: b300c3d5d796f8a6b33e8d1eee47ea1f4d6b84bc
STAGE: RESEARCH_R10
PASS: R2
TIMESTAMP: 2026-10-27T09:55:00Z

---

### FALSIFICATION & AUDIT OF PASS R1 (CRITIQUE OF PRIOR ASSUMPTIONS)

Pass R2 actively audits and falsifies several simplistic proposals from Pass R1 across lenses L01, L02, L03, and L12:

1. **Falsification of L01 Proposal on 15-Minute Live Verification Window (`pwaOfflineFreshness.ts`)**:
   - *Pass R1 Claim*: "Set `LIVE_REVALIDATION_THRESHOLD_MINUTES = 15`."
   - *Falsification & Code Proof*: In `src/domain/farely/pwaOfflineFreshness.test.ts#L40-L50`, the test explicitly asserts:
     ```ts
     it('allows verified live presentation when online with fresh observations', () => {
       const results = resolveDealsForPwaClient({
         cachedDeals: [sampleCachedDeal],
         isDeviceOffline: false,
         nowIsoString: '2026-10-15T02:30:00Z', // 30 minutes after observation
       });
       expect(results[0].isLiveVerified).toBe(true);
     });
     ```
     Because `sampleCachedDeal.observedAt` is `2026-10-15T02:00:00Z`, staleness is exactly 30 minutes. If we had clamped the live threshold to 15 minutes, `results[0].isLiveVerified` would evaluate to `false`, causing an immediate test regression! The mathematically grounded and backward-compatible threshold is 45 minutes (`LIVE_REVALIDATION_THRESHOLD_MINUTES = 45`), which comfortably accommodates 30-minute client caching while eliminating the dangerous 120-minute staleness window.

2. **Falsification of L02 Proposal on Date Window Chronological Order (`travelIntent.ts`)**:
   - *Pass R1 Claim*: "Compare `returnDate >= outboundDate` directly."
   - *Falsification & Code Proof*: In `src/domain/farely/travelIntent.ts#L68-L69`, `outboundDate` and `returnDate` can be either an ISO string (`YYYY-MM-DD`) OR a `DateWindow` object (`{ exact?: string, from?: string, to?: string }`). Executing a direct `>=` comparison on objects results in JavaScript coercion `"[object Object]" >= "[object Object]"`, failing to validate the actual date values! The validator must extract the earliest outbound anchor (`outbound.exact || outbound.from`) and the latest inbound anchor (`inbound.exact || inbound.to`), validate both as Gregorian calendar dates, and verify that `effectiveInbound >= effectiveOutbound`.

3. **Falsification of L03 Proposal on Passenger PNR Cap (`travelIntent.ts`)**:
   - *Pass R1 Claim*: "Reject any intent where `adults + children > 9`."
   - *Falsification & Code Proof*: Farely supports group travel planning via `groupFarePlanner.ts` (which natively handles cohorts of 10 to 50 passengers). Unconditionally throwing an exception for $> 9$ passengers in `createTravelIntent` would break group itinerary creation! The rigorous solution is: allow up to 9 passengers for standard individual travel, and for $> 9$ passengers, require `isGroupIntent: true` or automatically flag `isGroupBooking: true` on the returned `TravelIntent` object.

---

### ADVERSARIAL SYSTEMIC AUDIT ACROSS ALL 12 LENSES

### L01: Mathematical & Algorithmic Rigor
- **Target 1 (`pwaOfflineFreshness.ts`)**: Replace magic number 120 minutes with `LIVE_REVALIDATION_THRESHOLD_MINUTES = 45`. Observations $> 45$ minutes are flagged with `isLiveVerified: false` and `offlineBadgeLabelVi: 'Dữ liệu chờ cập nhật'`.
- **Target 2 (`priceAnomaly.ts`)**: In `detectPriceAnomaly`, ensure that when sample size is less than `MIN_ANOMALY_SAMPLE_SIZE = 10`, it abstains from strong anomaly assertions (`SPARSE_DATA_ABSTENTION`).
- **Target 3 (`travelIntent.ts`)**: Validate that all passenger mix values (`adults`, `children`, `infants`) are positive integers, and verify that `adults >= 1` and `infants <= adults`.

### L02: Type-System Soundness & Invariant Enforcement
- **Target 1 (`pwaOfflineFreshness.ts`)**: Fix action queue deduplication to check `dealId`, `watchId`, and `id`:
  ```ts
  const getActionTargetKey = (item: OfflineActionQueueItem) =>
    (item.payload?.dealId as string) || (item.payload?.watchId as string) || (item.payload?.id as string) || '';
  ```
- **Target 2 (`priceAnomaly.ts`)**: Guard `detectPriceAnomaly` against non-finite or `NaN` price inputs by returning `SUSPECTED_DATA_GLITCH`.
- **Target 3 (`travelIntent.ts`)**: Chronological date window validation ensuring return date is not before departure date.

### L03: Epistemic Sincerity & Anti-Hallucination
- **Target 1 (`pwaOfflineFreshness.ts`)**: Strictly prevent offline deals from claiming `isLiveVerified: true` or `canDirectBook: true` under `NEG-35`.
- **Target 2 (`priceAnomaly.ts`)**: Strictly prevent synthetic dispersion when `rawMad < 1e-6` under `AUD-12`.
- **Target 3 (`travelIntent.ts`)**: ICAO lap infant safety rule: maximum 1 lap infant per adult passenger.

### L04: State Space Completeness & Boundary Values
- **Target 1 (`pwaOfflineFreshness.ts`)**: Safe handling of empty queue arrays and FIFO capacity limit `MAX_OFFLINE_ACTION_QUEUE_SIZE = 100`.
- **Target 2 (`priceAnomaly.ts`)**: Boundary checks for sample size $= 10$ and prices matching median exactly.
- **Target 3 (`travelIntent.ts`)**: Handle `ONE_WAY` journeys with non-empty return date inputs by safely clearing `inbound`.

### L05: Concurrency, Latency & Async Safety
- **Target 1 (`pwaOfflineFreshness.ts`)**: Immutable queue transformations.
- **Target 2 (`priceAnomaly.ts`)**: Bounded cohort sorting with `MAX_COHORT_ANALYSIS_SIZE = 250`.
- **Target 3 (`travelIntent.ts`)**: Pure deterministic serialization without side effects.

### L06: Adversarial Robustness & Negative Vector Defense
- **Target 1 (`pwaOfflineFreshness.ts`)**: Defends against `NEG-35` (offline cache shown as fresh).
- **Target 2 (`priceAnomaly.ts`)**: Defends against `NEG-09` (insufficient sample anomaly claims).
- **Target 3 (`travelIntent.ts`)**: Defends against chronological date inversion and invalid passenger mixes.

### L07: Production Realism & Environmental Fidelity
- **Product Boundary Invariant (Anti-OTA Conflation)**:
  Farely operates purely as flight opportunity intelligence. Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping are strictly boundary_excluded.
- PWA mobile experience respects intermittent mobile connectivity in Vietnam (e.g. high-speed rail, regional transit).

### L08: Architectural Cohesion & Clean Domain Kernel
- Pure TypeScript domain files with zero external dependencies. Clean stray hook output from source files.

### L09: Regulatory Compliance & Consumer Protection (CAAV, FTC, VN Competition Law)
- Compliance with CAAV flight safety directives regarding infant passenger supervision.
- Transparent consumer labeling when viewing cached vs live verified fares.

### L10: Observability, Diagnostics & SRE Auditability
- In `pwaOfflineFreshness.ts`, export diagnostic error class `StaleOfflineDealAsFreshError`.
- In `travelIntent.ts`, export `TravelIntentValidationError` with structured error codes: `ERR_INVERTED_DATES`, `ERR_PASSENGER_MIX_INVALID`, `ERR_LAP_INFANT_EXCESS`.

### L11: Zero-Trust Security & Minimal Privilege
- Safe parsing of JSON in `deserializeTravelIntent`.
- Bounded memory queue size `MAX_OFFLINE_ACTION_QUEUE_SIZE = 100`.

### L12: Backward Compatibility & Regression Invariance
- All existing tests in `pwaOfflineFreshness.test.ts` and `priceAnomaly.test.ts` must pass.
- Create new test suite `src/domain/farely/travelIntent.test.ts`.

---

### ACTIONABLE RESEARCH SUMMARY & TRANSITION TO PASS R3
Pass R2 established accurate, backward-compatible thresholds and date validation semantics. In Pass R3, we will stress-test these specifications against hostile boundaries and negative vectors.
