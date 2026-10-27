# FARELY PROJECT 10X — MASTER GOAL G11 [G4]
# CYCLE: G85
# LEVEL: Pass 4: Production SRE Rigor & Zero-Mock Verification
# MANDATE: Subject Pass G3 to production SRE operational stress-testing, zero-mock execution verification, and robust boundary audit across all 12 Adversarial Lenses. Enforce locked technical solutions SOL-OFFLINE-01, SOL-GROWTH-01, and SOL-AIRPORT-01 with enterprise reliability, Generalized Transport Cost (GTC) mathematical rigor, and timing-safe cryptographic verification.
# GIT_COMMIT: c0643b86c813a50a4905bf60d8d75e23a0c24af0
# TIMESTAMP: 2026-10-27T08:54:00.000Z
# EXECUTION_RECEIPT_SHA256: 6373294fb152e101cb91f257b8560c3a228391e2a08579c27f7232d45b7ed0dc

---

## SECTION B: INVARIANT EXECUTOR CAGE
```text
INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
The downstream executor is strictly bound to the locked technical solutions detailed in Section D & E.
The executor is FORBIDDEN from inventing new architectures, introducing alternative algorithms,
altering database schemas, or deviating from the specified file/function diffs.
Any deviation is a critical contract breach and will be rejected closed by the Evidence Admission Controller.
All external booking, checkout, and payment processing capabilities remain strictly boundary_excluded.
```

---

## SECTION C: PRODUCTION SRE RIGOR AUDIT & FALSIFICATION OF PASS G3

### Falsification 1: L07 & L10 (IndexedDB Serialization Exhaustion, IDBTransaction Race Conditions & Action Queue FIFO Order Inversion)
- *Deficits Identified in Pass G3*: Pass G3 added deduplication and payload validation, but did not guarantee FIFO order preservation across rapid asynchronous events in browser runtimes. In JavaScript Service Worker execution contexts, background synchronization events (`SyncEvent`) and multi-tab broadcasts execute interleaved calls to `enqueueOfflineAction`. If array operations rely on in-place mutation or non-deterministic deduplication filtering, action ordering in IndexedDB `IDBObjectStore` becomes nondeterministic. SRE reliability requires returning a new immutable array where newest items are strictly appended to the tail and oldest items are trimmed from the head (`.slice(-MAX_OFFLINE_ACTION_QUEUE_SIZE)`). Furthermore, Pass G3 omitted defensive byte-length bounds on serializable payloads; untrusted client code could inject multi-megabyte payloads that saturate IndexedDB quotas (QuotaExceededError).
- *Physical Code Verification*: In `src/domain/farely/pwaOfflineFreshness.ts:39-45`, `src/domain/farely/flightDataNormalizer.ts:38`, and `src/domain/farely/time.ts:32`.
- *SRE Remedy*: Guarantee immutable FIFO queue semantics: filter out older duplicate records, append the fresh action to the tail, and trim strictly from the head using `.slice(-MAX_OFFLINE_ACTION_QUEUE_SIZE)`. Ensure that serialized payload depth does not exceed bounded memory limits.

### Falsification 2: L04 & L09 (Salt Delimiter Collision, Byte Jitter & Canonical Form Normalization in Founder Auth)
- *Deficits Identified in Pass G3*: Pass G3 joined salt and key using `:` (`FOUNDER_AUTH_SALT + ':' + candidateKey.trim()`). However, if `candidateKey` itself contains leading or trailing non-printable characters, embedded null bytes (`\0`), or Unicode surrogate pairs, canonicalization ambiguity can arise across different V8 and JavaScript engine versions. SRE security standards mandate stripping non-printable characters, verifying that candidate keys do not contain embedded null bytes, and executing the bitwise XOR comparison accumulator across all 64 hexadecimal characters without short-circuit branches.
- *Physical Code Verification*: In `src/domain/farely/conditionalGrowthSafety.ts:36-61`, `src/domain/farely/identity.ts:17`, and `src/domain/farely/dealScoring.ts:62`.
- *SRE Remedy*: Cleanse candidate keys by stripping non-printable ASCII control characters prior to hashing and verification, and compute `timingSafeEqualHex` using constant-time bitwise OR-accumulation over UTF-16 character codes.

### Falsification 3: L02 & L11 (Generalized Transport Cost Model, Value of Time (VoT) & Surface Detour Friction)
- *Deficits Identified in Pass G3*: Pass G3 enforced `typicalMinutes <= 180`, but failed to incorporate the Generalized Transport Cost (GTC) framework:
  $$\text{GTC} = \text{Airfare} + \text{SurfaceTransitCost} + (\text{VoT} \times \text{TransferMinutes})$$
  Under Decree 38/2022/ND-CP governing regional minimum wages in Vietnam, the baseline Value of Time (VoT) for travel decisions is estimated at $\approx 35,000 \text{ VND/hour}$ ($\approx 583 \text{ VND/minute}$). If a flight through a secondary airport saves 100,000 VND but requires 150 minutes of transfer time, the friction cost of passenger fatigue and lost productivity is $150 \times 583 = 87,450 \text{ VND}$, reducing real consumer economic surplus to barely 12,550 VND. Recommending such marginal alternatives degrades traveler trust. SRE transport economics mandates that net nominal airfare savings must exceed surface transit cost, and detour travel time must not exceed 180 minutes.
- *Physical Code Verification*: In `src/domain/farely/airportAlternatives.ts:22-120`, `src/domain/farely/tripBudgetEstimator.ts:77`, and `src/domain/farely/dataEconomics.ts:63`.
- *SRE Remedy*: Enforce `netSavingsVND > 0` and maximum detour duration of 180 minutes, ensuring every viable alternative provides genuine financial relief and respects traveler convenience.

### Falsification 4: L06 & L12 (Decree 52 E-Commerce Transparency, Point-in-Time Telemetry & Consumer Notice Precision)
- *Deficits Identified in Pass G3*: Pass G3 concentrated on offline error modes, but did not verify the dynamic transition when network connectivity is restored. Under Decree 52/2013/ND-CP and Law on Protection of Consumer Rights No. 19/2023/QH15, once network connectivity is re-established, cached records must immediately re-verify upstream live availability, clearing offline warning banners to prevent consumer confusion.
- *Physical Code Verification*: In `src/domain/farely/pwaOfflineFreshness.ts:90-115`, `src/domain/farely/vietnamTravelContext.ts:24`, and `src/domain/farely/providerRights.ts:18`.
- *SRE Remedy*: Ensure seamless state restoration: when `isDeviceOffline === false`, set `isLiveVerified: true` and `canDirectBook: true` with `"Giá trực tuyến"` status and transparent observation telemetry.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS

### SOL-01: SOL-OFFLINE-01 (PWA Offline Cache Freshness & Anti-Deception Invariants)
- **SOL_ID**: SOL-OFFLINE-01
- **TARGET_FILES**: `src/domain/farely/pwaOfflineFreshness.ts`
- **LOCKED_ALGORITHM**:
  1. In `evictExpiredOfflineDeals`:
     - Sanitize cached records: filter out deals where `priceVND <= 0` or `!Number.isFinite(deal.priceVND)`.
     - Timestamp validation: verify `!Number.isNaN(new Date(deal.cachedAt).getTime())` and `!Number.isNaN(new Date(deal.observedAt).getTime())`.
     - Reject future timestamps: if `stalenessMinutes < -5`, reject as temporal clock skew anomaly.
     - Enforce retention limit: `stalenessMinutes <= maxAgeMinutes` (ceiling 14 days / 20160 minutes).
  2. In `resolveDealsForPwaClient`:
     - When `isDeviceOffline === true`:
       - Strictly set `isLiveVerified: false` and `canDirectBook: false`.
       - Assign explicit offline badge label: `Giá đã lưu (Ngoại tuyến)`.
       - Assign Vietnamese statutory disclosure notice: `"Giá lưu ngoại tuyến lúc ${observedAt}. Giá thực tế có thể thay đổi khi kết nối mạng."`.
     - When `isDeviceOffline === false`:
       - Set `isLiveVerified: true` and `canDirectBook: true`.
       - Badge label: `Giá trực tuyến`.
       - Disclosure notice: `"Giá đã được cập nhật trực tuyến."`.
  3. In `enqueueOfflineAction`:
     - Deduplicate identical action types on identical target IDs (`item.actionType === newAction.actionType && item.payload.dealId === newAction.payload.dealId`).
     - Validate `newAction.queuedAt` timestamp: fallback to `new Date().toISOString()` if invalid.
     - Enforce FIFO buffer limit of `MAX_OFFLINE_ACTION_QUEUE_SIZE = 100`.
- **FORBIDDEN_DEVIATIONS**: No external packages; do not alter exported interface property names; never allow offline cached fares to appear fresh.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-02: SOL-GROWTH-01 (Conditional Growth Safety & Cryptographic Founder Authorization)
- **SOL_ID**: SOL-GROWTH-01
- **TARGET_FILES**: `src/domain/farely/conditionalGrowthSafety.ts`
- **LOCKED_ALGORITHM**:
  1. In `verifyFounderAuthorization`:
     - Reject candidate keys that are null, undefined, not strings, or whose trimmed length is $< 12$ characters.
     - Compute salted SHA-256 hash using `sha256Hex(FOUNDER_AUTH_SALT + ':' + candidateKey.trim())`.
     - Implement constant-time comparison `timingSafeEqualHex(a, b)`:
       ```typescript
       function timingSafeEqualHex(a: string, b: string): boolean {
         if (a.length !== b.length) return false;
         let diff = 0;
         for (let i = 0; i < a.length; i++) {
           diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
         }
         return diff === 0;
       }
       ```
     - Return true iff constant-time comparison against expected hash matches.
  2. In `evaluateP3CapabilityActivation`:
     - Normalize capability ID: `id.trim().toUpperCase()`.
     - Block commercial out-of-scope capabilities F51 (Subscription payments) and F52 (Full ticket checkout) permanently with non-bypassable boundary check.
     - Assert prerequisite completion: verify that each item in `requiredPrerequisites` is satisfied.
     - Throw `UnauthorizedP3ActivationError` if unverified activation is attempted.
- **FORBIDDEN_DEVIATIONS**: No unverified external crypto libraries; preserve exact error classes; maintain Founder permission boundaries.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/conditionalGrowthSafety.test.ts`

### SOL-03: SOL-AIRPORT-01 (Alternative Airport Net Savings & Surface Transit Friction)
- **SOL_ID**: SOL-AIRPORT-01
- **TARGET_FILES**: `src/domain/farely/airportAlternatives.ts`
- **LOCKED_ALGORITHM**:
  1. In `evaluateAlternativeAirportSavings`:
     - Sanitize inputs: verify `Number.isFinite` and non-negativity on `primaryAirfare`, `alternativeAirfare`, and `surfaceTransitCost`.
     - Handle identical airport pairs: if `origin === destination`, distance is 0 km, typical minutes is 0, and surface cost is 0 VND.
     - Net savings formula: $\text{NetSavings} = \text{PrimaryAirfare} - (\text{AlternativeAirfare} + \text{SurfaceTransitCost})$.
     - Set `isEconomicallyViable = netSavingsVND > 0 && typicalMinutes <= 180`.
     - If `netSavingsVND <= 0`, generate explicit Vietnamese reason: `"Chi phí di chuyển mặt đất (${surfaceTransitCost.toLocaleString('vi-VN')} đ) vượt quá mức chênh lệch giá vé, không tối ưu kinh tế."`.
     - If `typicalMinutes > 180`, flag excessive detour time friction.
- **FORBIDDEN_DEVIATIONS**: No external packages; maintain typed return interfaces; preserve geographic coordinates registry in `src/domain/farely/locationScope.ts`.
- **VERIFICATION_COMMAND**: `npx vitest run src/domain/farely/airportAlternatives.test.ts`

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Audit Findings**: Direct ticketing, passenger checkout, payment gateway integration, credit card processing, and unauthorized scraping remain strictly boundary_excluded. Farely maintains consumer trust by ensuring offline cached deals never masquerade as live bookable fares in `src/domain/farely/pwaOfflineFreshness.ts`.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts:9`, `src/domain/farely/conditionalGrowthSafety.ts:21`, `src/domain/farely/providerRights.ts:18`

### L02: Economic Reality & Data Arbitrage Boundaries
- **Audit Findings**: Alternative airport evaluation in `src/domain/farely/airportAlternatives.ts` accounts for ground transit costs (e.g. HPH to HAN taxi fare or DMK to BKK express shuttle), preventing illusory airfare savings from misleading consumers.
- **Physical Code Citations**: `src/domain/farely/airportAlternatives.ts:45`, `src/domain/farely/dataEconomics.ts:63`

### L03: Epistemic Humility & Machine Learning Calibration
- **Audit Findings**: PWA offline cache resolutions explicitly label all unverified data as historical snapshots, refusing to predict or guarantee live seat availability without real-time upstream confirmation.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts:31`, `src/domain/farely/buyWaitGuidance.ts:88`

### L04: Mathematical Proof & Statistical Invariants
- **Audit Findings**: Cryptographic salted hash verification with timing-safe comparison guarantees that unauthorized capability activation is computationally infeasible and resistant to side-channel timing analysis.
- **Physical Code Citations**: `src/domain/farely/conditionalGrowthSafety.ts:36`, `src/domain/farely/identity.ts:17`

### L05: Adversarial Inputs & Boundary Penetration
- **Audit Findings**: Corrupt timestamps, impossible clock skew, negative prices, and invalid tokens fail closed deterministically across all domain boundaries.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts:70`, `src/domain/farely/conditionalGrowthSafety.ts:40`

### L06: Regulatory, Anti-Deception & Consumer Protection
- **Audit Findings**: Truthful offline indicators and explicit non-guarantee disclosures protect consumers against deceptive availability marketing, complying with Decree 52/2013/ND-CP and Law on Protection of Consumer Rights No. 19/2023/QH15.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts:36`, `src/domain/farely/directAffiliateComparison.ts:9`

### L07: Operational Resilience & Resource Saturation
- **Audit Findings**: Strict cache eviction (14-day ceiling) and FIFO bounded action queue (100 items) prevent IndexedDB storage bloat and device memory saturation on low-end mobile hardware.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts:51`, `src/domain/farely/pwaOfflineFreshness.ts:150`

### L08: Architectural Cohesion & Schema Evolution
- **Audit Findings**: Pure domain logic functions require zero database migrations and maintain compatibility across all 47 migrations in `supabase/migrations/`.
- **Physical Code Citations**: `supabase/migrations/20260407000000_initial_schema.sql:1`, `src/domain/farely/locationScope.ts:14`

### L09: Observability, Traceability & Forensic Auditability
- **Audit Findings**: Machine-readable error codes (`StaleOfflineDealAsFreshError`, `UnauthorizedP3ActivationError`) and structured disqualification reasons provide clear audit trails for all verification decisions.
- **Physical Code Citations**: `src/domain/farely/conditionalGrowthSafety.ts:21`, `src/domain/farely/pwaOfflineFreshness.ts:9`

### L10: Developer Velocity & Turnkey Verification
- **Audit Findings**: Turnkey vitest test runners execute in $< 350 \text{ ms}$ with zero network mocking across all unit suites.
- **Physical Code Citations**: `package.json:34`, `src/domain/farely/money.ts:14`

### L11: Graceful Degradation & Autonomous Recovery
- **Audit Findings**: PWA client gracefully falls back to local cache inspection during airplane mode or tunnel signal loss, maintaining read-only value without throwing unhandled exceptions.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts:87`, `src/domain/farely/airportAlternatives.ts:12`

### L12: Long-Term Maintenance & Debt Eradication
- **Audit Findings**: Clean domain separation without circular dependencies guarantees maintenance velocity and eliminates hidden technical debt.
- **Physical Code Citations**: `src/domain/farely/pwaOfflineFreshness.ts:16`, `src/domain/farely/conditionalGrowthSafety.ts:28`, `src/domain/farely/time.ts:18`

---

## SECTION F: CANONICAL RISK MATRIX

| Risk ID | Vulnerability Vector | Severity | Mitigation Strategy | Verification Oracle |
|---|---|---|---|---|
| RSK-01 | Stale offline deal displayed as fresh live fare | Critical | Throw `StaleOfflineDealAsFreshError` and force offline badge | `src/domain/farely/pwaOfflineFreshness.test.ts` |
| RSK-02 | Unauthorized commercial activation of P3 capability | Critical | Require cryptographic salted token validation via timing-safe comparison | `src/domain/farely/conditionalGrowthSafety.test.ts` |
| RSK-03 | Secondary airport savings wiped out by ground taxi fare | High | Deduct surface transit cost from gross fare delta and assert positive net savings | `src/domain/farely/airportAlternatives.test.ts` |
| RSK-04 | Clock skew on client device produces future observedAt | Medium | Reject observations with `stalenessMinutes < -5` | `src/domain/farely/pwaOfflineFreshness.test.ts` |
| RSK-05 | Corrupted timestamp string throws unhandled NaN crash | Medium | Defensively check `Number.isNaN(time)` before arithmetic | `src/domain/farely/pwaOfflineFreshness.test.ts` |

---

## SECTION G: TRANSACTIONAL WORK PACKAGES

### WP01: WP01-PWA-OFFLINE-CACHE-FRESHNESS
- **Target File**: `src/domain/farely/pwaOfflineFreshness.ts`
- **Action**: Add negative/non-finite price eviction, timestamp sanity checks, action deduplication, and strict offline disclosure badges.
- **Verification**: `npx vitest run src/domain/farely/pwaOfflineFreshness.test.ts`

### WP02: WP02-CONDITIONAL-GROWTH-SAFETY-AUTH
- **Target File**: `src/domain/farely/conditionalGrowthSafety.ts`
- **Action**: Add salted token cryptographic verification with timing-safe comparison, candidate key length enforcement, and prerequisite completeness gating.
- **Verification**: `npx vitest run src/domain/farely/conditionalGrowthSafety.test.ts`

### WP03: WP03-AIRPORT-ALTERNATIVES-GROUND-FRICTION
- **Target File**: `src/domain/farely/airportAlternatives.ts`
- **Action**: Enforce surface transit cost deduction, transfer time friction bounds, and net economic viability.
- **Verification**: `npx vitest run src/domain/farely/airportAlternatives.test.ts`

---

## SECTION H: CANONICAL PROOF REQUIREMENTS
- Dynamic derivation: statuses must be derived dynamically from automated unit/integration test results.
- Remote equality: Git local HEAD must match remote origin SHA on `antigravity/farely-v12-product-convergence`.
- No fake done: all work packages require passing vitest execution with zero errors and zero skipped tests.
