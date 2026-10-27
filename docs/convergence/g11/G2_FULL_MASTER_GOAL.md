# FARELY PROJECT 10X — MASTER GOAL G11 [G2]
# CYCLE: G85
# LEVEL: Pass 2: Skeptical Empirical Grounding & Threat Modeling
# MANDATE: Subject Pass G1 to rigorous threat modeling and skeptical empirical audit across all 12 Adversarial Lenses. Lock robust edge-case defenses for PWA Offline Freshness, Conditional Growth Safety, and Airport Alternatives with zero-trust verification.
# GIT_COMMIT: c0643b86c813a50a4905bf60d8d75e23a0c24af0
# TIMESTAMP: 2026-10-27T08:48:00.000Z
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

## SECTION C: SKEPTICAL AUDIT & FALSIFICATION OF PASS G1

### Falsification 1: L05 & L07 (PWA Offline Queue Stale Action Replay & Payload Invariants)
- *Deficits Identified in Pass G1*: Pass G1 introduced action deduplication by `actionType` and `dealId`, but permitted actions with arbitrary timestamps to accumulate. If a traveler remains offline across multiple weeks, queuing actions with `queuedAt` dates older than 7 days (10,080 minutes) results in zombie actions replaying against expired flight schedules upon network restoration. Furthermore, Pass G1 did not check for malformed JSON payloads in `OfflineActionQueueItem`, allowing corrupted state to crash service workers.
- *Physical Code Verification*: In `src/domain/farely/pwaOfflineFreshness.ts:40-45` and `src/domain/farely/time.ts:18`.
- *Skeptical Remedy*: Enforce action queue TTL: evict actions whose `queuedAt` timestamp exceeds 7 days (10,080 minutes) or possesses future clock skew $> 5$ minutes prior to network synchronization.

### Falsification 2: L04 & L10 (Cryptographic Timing Analysis & Candidate Key Entropy Floor)
- *Deficits Identified in Pass G1*: Pass G1 added `timingSafeEqualHex`, but only checked length $\ge 12$. A candidate key consisting of a single repeated character (e.g. `'aaaaaaaaaaaa'`) passes length checks despite containing zero algorithmic entropy ($H \approx 0$). In addition, Pass G1 did not mandate that both comparison hashes must have exactly 64 hex characters, which could allow short string inputs to trigger unhandled indexing faults.
- *Physical Code Verification*: In `src/domain/farely/conditionalGrowthSafety.ts:36-52` and `src/domain/farely/identity.ts:17`.
- *Skeptical Remedy*: Require that candidate keys possess at least 2 distinct character classes or $\ge 3$ distinct characters, and enforce strict 64-character hash length validation before invoking `timingSafeEqualHex`.

### Falsification 3: L02 & L08 (Expressway Toll & Surface Transit Ground Cost Completeness)
- *Deficits Identified in Pass G1*: Pass G1 computed alternative airport net savings using flat surface transit cost, omitting expressway tolls and bridge surcharges. For example, transit between Hai Phong (HPH) and Hanoi (HAN) incurs Expressway 5B tolls ($\approx 210,000 \text{ VND}$), and Bangkok transit (BKK $\leftrightarrow$ DMK) incurs Chaloem Maha Nakhon expressway tolls. If highway toll fees are ignored, the net savings are artificially inflated, misleading consumers into booking suboptimal alternative itineraries.
- *Physical Code Verification*: In `src/domain/farely/airportAlternatives.ts:22-60` and `src/domain/farely/dataEconomics.ts:63`.
- *Skeptical Remedy*: Ensure that all cataloged `estimatedCostVND` figures in `GROUND_TRANSFER_CATALOG` explicitly bundle statutory highway expressway tolls and public transit tariffs into total ground friction.

### Falsification 4: L06 & L12 (Decree 52/2013/ND-CP Vietnamese Timestamp Formatting Exactitude)
- *Deficits Identified in Pass G1*: Pass G1 interpolated raw ISO 8601 strings into consumer disclosure notices (`"Giá lưu ngoại tuyến lúc ${observedAt}..."`). Raw ISO timestamps with milliseconds and `Z` suffixes violate Decree 52/2013/ND-CP guidelines on consumer legibility.
- *Physical Code Verification*: In `src/domain/farely/pwaOfflineFreshness.ts:36` and `src/domain/farely/vietnamTravelContext.ts:24`.
- *Skeptical Remedy*: Format the offline observation timestamp cleanly or reference ISO string safely without confusing raw internal representations.

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
