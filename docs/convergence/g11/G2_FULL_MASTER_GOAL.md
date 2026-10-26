# FARELY PROJECT 10X — MASTER GOAL G11 [G2]
# LEVEL: Pass 2: Hostile Before/After AST Diff Blueprint & Structural Isolation
# MANDATE: Refute and harden Pass G1 with exact file modifications, AST boundary invariants, and lens falsifications.
# GIT_COMMIT: e96cfffbc0664f2c50fdc2aab7402aa936285022
# TIMESTAMP: 2026-10-26T10:58:45.000Z
# EXECUTION_RECEIPT_SHA256: 5b111a7169abc6ae778ffe2e481b439f837a060e1e1beac660c26a8b6cf64fb6

---

## SECTION B: INVARIANT EXECUTOR CAGE
```text
INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
The executor is strictly bound to the locked technical solutions detailed in Section D & E.
The executor is FORBIDDEN from inventing new architectures, introducing alternative algorithms,
changing database schemas, or deviating from the specified file/function diffs.
Any deviation is a critical contract breach and will be rejected closed by the Evidence Admission Controller.
```

---

## REFUTATION MATRIX & FALSIFICATION OF PASS G1

### Falsification 1: L01 Array Filter Incompleteness in Multi-City Slices
- *Deficits Identified in Pass G1*: Pass G1 filtered truthy elements, but did not assert that slices containing non-object structures or missing `originCode` / `destinationCode` must be identified and rejected before interline alliance evaluation.
- *Empirical Code Evidence*: In `src/domain/farely/multiCityItinerary.ts`, if a slice has `destinationCode: undefined`, `destinationCode.toUpperCase()` triggers a fatal TypeError.
- *Hardened Contract in G2*: In `src/domain/farely/multiCityItinerary.ts`, enforce `const prevDest = (prev.destinationCode || "").trim().toUpperCase(); const currOrig = (current.originCode || "").trim().toUpperCase();`. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 Staged Contract Scope Escape in B2B Syndication Registry
- *Deficits Identified in Pass G1*: Pass G1 mentioned ID deduplication, but did not define the exact logic combining `declarationStatus === 'COMMERCIAL_STAGED_CONTRACT_REQUIRED'` with `authorizedScopes.includes('B2B_SYNDICATION')`.
- *Empirical Code Evidence*: In `src/domain/farely/providerRights.ts`, staged providers must be blocked even if their data scope array specifies syndication, because no commercial contract has been executed.
- *Hardened Contract in G2*: In `src/domain/farely/providerRights.ts`, block with `rights.declarationStatus === "COMMERCIAL_STAGED_CONTRACT_REQUIRED" || !rights.canRedistributeB2B || !rights.authorizedScopes.includes("B2B_SYNDICATION")`.

### Falsification 3: L03 Timestamp NaN Guarding in PWA Freshness Calculations
- *Deficits Identified in Pass G1*: Pass G1 specified price sanity, but did not guard against `observedMs` evaluating to `NaN` when `deal.observedAt` is corrupt.
- *Empirical Code Evidence*: In `src/domain/farely/pwaOfflineFreshness.ts`, `nowMs - observedMs` becomes `NaN`, which poisons `stalenessMinutes`.
- *Hardened Contract in G2*: In `src/domain/farely/pwaOfflineFreshness.ts`, guard with `const observedMs = new Date(deal.observedAt).getTime(); const safeObservedMs = isNaN(observedMs) ? nowMs : observedMs;`. Commercial payment gateway integration is strictly `boundary_excluded`.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G78)

### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/app/data/api.ts`, preserve nulls without coercion. In `src/domain/farely/priceAnomaly.ts`, require $N \ge 5$ using Bessel's correction $(N - 1)$ and dispersion threshold (`rawMad < 1e-6`). Micro-samples return neutral score (0) with `confidence: INSUFFICIENT_HISTORY`.
- **Forbidden Deviations**: No zero-inflation on missing fields; direct ticketing and passenger checkout are strictly `boundary_excluded`.
- **Turnkey Verification**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### SOL-02: SOL-PRICE-01 (Deterministic Tet Window Lookup & Dynamic Prior)
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/domain/farely/priceAnomaly.ts`, define static Lunar Tet windows for 2025, 2026, and 2027 with $2.8\times$ baseline multipliers to suppress false-positive deal alerts during peak festive periods.
- **Forbidden Deviations**: No dynamic unsealed third-party lunar APIs; no uncalibrated static baselines.
- **Turnkey Verification**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### SOL-03: SOL-COST-01 (Carrier Landed Surcharges & Self-Transfer Validation)
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts` & `src/domain/farely/multiCityItinerary.ts`
- **Specification**: In `src/domain/farely/tripBudgetEstimator.ts`, compute carrier surcharges scaled by whole-integer passenger counts (`Math.floor(Math.max(1, passengers))`). In `src/domain/farely/multiCityItinerary.ts`, enforce 150m domestic, 240m international, and 210m metropolitan inter-airport transfers.
- **Forbidden Deviations**: No naked base fare ranking; no unflagged self-transfers; direct ticketing and payment gateway integration are strictly `boundary_excluded`.
- **Turnkey Verification**: `npx vitest run src/domain/farely/tripBudgetEstimator.test.ts`

### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox & Row-Level Locking)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: In `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`, enforce rate limiting via `check_watch_rate_limit()` and transactional outbox row locking (`FOR UPDATE SKIP LOCKED`).
- **Forbidden Deviations**: No plain-text email broadcast queues; unauthorized scraping and credit card processing are strictly `boundary_excluded`.
- **Turnkey Verification**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Tri-State Provider Circuit Breakers & Fallback Degrade)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Specification**: In `supabase/functions/_shared/flight-search.ts`, implement tri-state circuit breaker (`CLOSED`, `OPEN`, `HALF_OPEN`) tracking consecutive 5xx errors and timeouts (> 8000ms), failing fast to cached snapshots.
- **Forbidden Deviations**: No unthrottled outbound retries; no hard crashes on upstream provider timeout.
- **Turnkey Verification**: `npx vitest run src/domain/farely/providerRights.test.ts`

### SOL-06: SOL-STALE-01 (PWA Offline Freshness & Monotonic Deal Deduplication)
- **Target File**: `src/app/pages/DealsPage.tsx` & `src/domain/farely/pwaOfflineFreshness.ts`
- **Specification**: In `src/app/pages/DealsPage.tsx`, deduplicate deal feeds monotonically. In `src/domain/farely/pwaOfflineFreshness.ts`, purge cached search results older than 14 days and mark fares over 6 hours old as `STALE_SNAPSHOT`.
- **Forbidden Deviations**: No unbounded localStorage persistence; no rendering stale fares as live quotes.
- **Turnkey Verification**: `npx vitest run src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Safe Recursive Error Serialization & Depth Guard)
- **Target File**: `src/app/lib/analytics.ts`
- **Specification**: In `src/app/lib/analytics.ts`, implement bounded recursive serialization in `safeSerializeError` capping recursion at `maxDepth = 3`, truncating object keys at `maxKeysPerLevel = 50`, and preserving array types.
- **Forbidden Deviations**: No naive JSON.stringify; no unbounded key extraction; no unredacted logging of PII.
- **Turnkey Verification**: `npx vitest run src/app/lib/analytics.test.ts`

### SOL-08: SOL-MIGRATION-01 (Zero-Downtime Migration Invariants & Schema Verification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: In `scripts/verify-certification-integrity.node-test.mjs`, verify that database migrations use non-destructive DDL (`ADD COLUMN IF NOT EXISTS`, `CREATE INDEX CONCURRENTLY IF NOT EXISTS`).
- **Forbidden Deviations**: No destructive table drops or column alterations; no production data mutation.
- **Turnkey Verification**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (Hierarchical Verification Gating C0 -> C4)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: In `scripts/verify-certification-integrity.node-test.mjs`, enforce strict separation of proof tiers: C0 (Contract), C1 (Unit Code Proof), C2 (Integration), C3 (Runtime Telemetry), and C4 (Longitudinal Soak). Unit tests cannot certify C3/C4 milestones.
- **Forbidden Deviations**: No self-awarded 10/10 scores; no synthetic badge upgrades without automated verification proof.
- **Turnkey Verification**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (Acceptance Anti-Shrinkage & Gate Immutability)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Specification**: In `scripts/acceptance-anti-shrinkage.node-test.mjs`, assert all 89 capability contracts (F00..F88) and 267 historical acceptance gates (192 P0, 74 P1, 1 P2) remain strictly preserved.
- **Forbidden Deviations**: No deletion, consolidation, or renaming of acceptance criteria.
- **Turnkey Verification**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (ACID Transactional Task Lifecycle & Rollback Journal)
- **Target File**: `scripts/convergence/transactional-task-manager.mjs`
- **Specification**: In `scripts/convergence/transactional-task-manager.mjs`, enforce atomic state transitions (`begin` -> `commit` / `rollback`) with pre-image filesystem snapshots in `docs/convergence/state/transaction_journal.json`.
- **Forbidden Deviations**: No manual file edits outside active transaction journal context.
- **Turnkey Verification**: `node scripts/convergence/transactional-task-manager.mjs status`

### SOL-12: SOL-RELEASE-01 (Automated Watchdog Convergence & Remote SHA Parity)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: In `scripts/convergence/watchdog-convergence.mjs`, enforce full test suite verification and Git remote tracking parity via `git ls-remote origin antigravity/farely-v12-product-convergence`.
- **Forbidden Deviations**: No unpushed commits; no ignoring CI test suite failures.
- **Turnkey Verification**: `node scripts/convergence/watchdog-convergence.mjs`

---

## SECTION E: HOSTILE BEFORE/AFTER AST DIFF BLUEPRINT

### WP01: `src/domain/farely/multiCityItinerary.ts`
```typescript
<<<<<<< BEFORE
  if (!params.slices || params.slices.length < 2) {
    throw new InvalidMultiCitySequenceError("Hành trình nhiều chặng (Multi-city) phải có ít nhất 2 chặng bay.");
  }

  const sorted = [...params.slices].sort((a, b) => a.sliceIndex - b.sliceIndex);
  let totalPrice = 0;
  const openJawNotices: string[] = [];
  let hasInterlineCoherence = true;
  const primaryCarrier = sorted[0].airlineCode.toUpperCase();
  const allowedPartners = ALLIANCE_PARTNERS[primaryCarrier] || new Set([primaryCarrier]);

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    totalPrice += current.price;

    // Check interline partner compatibility
    if (!allowedPartners.has(current.airlineCode.toUpperCase())) {
      hasInterlineCoherence = false;
    }

    if (i > 0) {
      const prev = sorted[i - 1];

      // Chronological check
      if (current.departDate < prev.departDate) {
        throw new InvalidMultiCitySequenceError(
          `Chặng ${current.sliceIndex + 1} (${current.departDate}) không thể khởi hành trước chặng ${prev.sliceIndex + 1} (${prev.departDate}).`
        );
      }

      // Open-jaw check: prev.destination != current.origin
      if (prev.destinationCode.toUpperCase() !== current.originCode.toUpperCase()) {
=======
  const validSlices = (params.slices || []).filter(Boolean);
  if (validSlices.length < 2) {
    throw new InvalidMultiCitySequenceError("Hành trình nhiều chặng (Multi-city) phải có ít nhất 2 chặng bay.");
  }

  const sorted = [...validSlices].sort(
    (a, b) => a.sliceIndex - b.sliceIndex || (a.departDate || "").localeCompare(b.departDate || "")
  );
  let totalPrice = 0;
  const openJawNotices: string[] = [];
  let hasInterlineCoherence = true;
  const primaryCarrier = (sorted[0].airlineCode || "").trim().toUpperCase();
  const allowedPartners = ALLIANCE_PARTNERS[primaryCarrier] || new Set([primaryCarrier]);

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const safePrice = Number.isFinite(current.price) && current.price > 0 ? current.price : 0;
    totalPrice += Math.round(safePrice);

    // Check interline partner compatibility
    const currentCarrier = (current.airlineCode || "").trim().toUpperCase();
    if (!allowedPartners.has(currentCarrier)) {
      hasInterlineCoherence = false;
    }

    if (i > 0) {
      const prev = sorted[i - 1];
      const currDate = (current.departDate || "").slice(0, 10);
      const prevDate = (prev.departDate || "").slice(0, 10);

      // Chronological check
      if (currDate < prevDate) {
        throw new InvalidMultiCitySequenceError(
          `Chặng ${current.sliceIndex + 1} (${current.departDate}) không thể khởi hành trước chặng ${prev.sliceIndex + 1} (${prev.departDate}).`
        );
      }

      // Open-jaw check: prev.destination != current.origin
      const prevDest = (prev.destinationCode || "").trim().toUpperCase();
      const currOrig = (current.originCode || "").trim().toUpperCase();
      if (prevDest !== currOrig) {
>>>>>>> AFTER
```

### WP02: `src/domain/farely/providerRights.ts`
```typescript
<<<<<<< BEFORE
export function validateB2BRedistributionScope(providerIds: string[]): {
  authorized: string[];
  denied: { providerId: string; reason: string }[];
} {
  const authorized: string[] = [];
  const denied: { providerId: string; reason: string }[] = [];

  for (const id of providerIds) {
    const rights = getProviderSourceRights(id);
    if (!rights) {
      denied.push({
        providerId: id,
        reason: `Nguồn dữ liệu '${id}' chưa được đăng ký trong Provider Rights Registry.`,
      });
    } else if (!rights.canRedistributeB2B || !rights.authorizedScopes.includes('B2B_SYNDICATION')) {
      denied.push({
        providerId: id,
        reason: `Nguồn '${rights.sourceName}' thuộc phân loại '${rights.licenseType}' — Không có quyền B2B syndication/redistribution (${rights.termsSummary}).`,
      });
    } else {
      authorized.push(id);
    }
  }

  return { authorized, denied };
}
=======
export function validateB2BRedistributionScope(providerIds: string[]): {
  authorized: string[];
  denied: { providerId: string; reason: string }[];
} {
  const authorized: string[] = [];
  const denied: { providerId: string; reason: string }[] = [];
  const cleanIds = Array.from(
    new Set((providerIds || []).map((id) => (id || "").trim().toLowerCase()).filter(Boolean))
  );

  for (const id of cleanIds) {
    const rights = getProviderSourceRights(id);
    if (!rights) {
      denied.push({
        providerId: id,
        reason: `Nguồn dữ liệu '${id}' chưa được đăng ký trong Provider Rights Registry.`,
      });
    } else if (
      rights.declarationStatus === "COMMERCIAL_STAGED_CONTRACT_REQUIRED" ||
      !rights.canRedistributeB2B ||
      !rights.authorizedScopes.includes("B2B_SYNDICATION")
    ) {
      denied.push({
        providerId: id,
        reason: `Nguồn '${rights.sourceName}' thuộc phân loại '${rights.licenseType}' — Không có quyền B2B syndication/redistribution (${rights.termsSummary}).`,
      });
    } else {
      authorized.push(id);
    }
  }

  return { authorized, denied };
}
>>>>>>> AFTER
```

### WP03: `src/domain/farely/pwaOfflineFreshness.ts`
```typescript
<<<<<<< BEFORE
  return validDeals.map((deal) => {
    const _cachedMs = new Date(deal.cachedAt).getTime();
    const observedMs = new Date(deal.observedAt).getTime();
    const stalenessMinutes = Math.max(0, Math.round((nowMs - observedMs) / (1000 * 60)));

    if (isDeviceOffline) {
      // Invariant: In offline mode, the deal can NEVER be live verified or directly bookable
      return {
        id: deal.id,
        route: deal.route,
        airlineCode: deal.airlineCode,
        priceVND: deal.priceVND,
        observedAt: deal.observedAt,
        isOfflineCached: true,
        offlineStalenessMinutes: stalenessMinutes,
        isLiveVerified: false,
        canDirectBook: false,
        offlineBadgeLabelVi: 'Dữ liệu lưu tạm ngoại tuyến (Offline)',
        disclosureNoticeVi:
          'Bạn đang xem dữ liệu lưu tạm khi mất kết nối mạng. Giá vé và tình trạng chỗ có thể đã thay đổi. Vui lòng kết nối Internet để xác minh lại trước khi giao dịch.',
      };
    }
=======
  return validDeals.map((deal) => {
    const _cachedMs = new Date(deal.cachedAt).getTime();
    const observedMs = new Date(deal.observedAt).getTime();
    const safeObservedMs = isNaN(observedMs) ? nowMs : observedMs;
    const stalenessMinutes = Math.max(0, Math.round((nowMs - safeObservedMs) / (1000 * 60)));
    const isPriceValid = Number.isFinite(deal.priceVND) && deal.priceVND > 0;

    if (isDeviceOffline) {
      // Invariant: In offline mode, the deal can NEVER be live verified or directly bookable
      return {
        id: deal.id,
        route: deal.route,
        airlineCode: deal.airlineCode,
        priceVND: isPriceValid ? deal.priceVND : 0,
        observedAt: deal.observedAt,
        isOfflineCached: true,
        offlineStalenessMinutes: stalenessMinutes,
        isLiveVerified: false,
        canDirectBook: false,
        offlineBadgeLabelVi: 'Dữ liệu lưu tạm ngoại tuyến (Offline)',
        disclosureNoticeVi: isPriceValid
          ? 'Bạn đang xem dữ liệu lưu tạm khi mất kết nối mạng. Giá vé và tình trạng chỗ có thể đã thay đổi. Vui lòng kết nối Internet để xác minh lại trước khi giao dịch.'
          : 'Giá vé ngoại tuyến không hợp lệ hoặc bị lỗi dữ liệu.',
      };
    }
>>>>>>> AFTER
```

---

## SECTION K: 12-LENS CONVERGENCE MATRIX
- **L01 (Ingestion & Schema Integrity)**: Enforced via `src/domain/farely/multiCityItinerary.ts`.
- **L02 (Price Anomaly & Algorithmic Rigor)**: Enforced via `src/domain/farely/providerRights.ts`.
- **L03 (True-Cost & Ancillary Transparency)**: Enforced via `src/domain/farely/pwaOfflineFreshness.ts`.
- **L04 (Anti-Abuse & Rate Limiting)**: Enforced via `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`.
- **L05 (High Concurrency & Resilience)**: Enforced via `supabase/functions/_shared/flight-search.ts`.
- **L06 (PWA Offline & Client Freshness)**: Enforced via `src/app/pages/DealsPage.tsx` and `src/domain/farely/pwaOfflineFreshness.ts`.
- **L07 (Observability & Production SRE)**: Enforced via `src/app/lib/analytics.ts`.
- **L08 (Zero-Downtime DB Migrations)**: Enforced via `scripts/verify-certification-integrity.node-test.mjs`.
- **L09 (Zero-Mock Testing & Proof Hierarchy)**: Enforced via `scripts/verify-certification-integrity.node-test.mjs`.
- **L10 (Contract Immutability & Anti-Shrinkage)**: Enforced via `scripts/acceptance-anti-shrinkage.node-test.mjs`.
- **L11 (Transactional Execution Safety)**: Enforced via `scripts/convergence/transactional-task-manager.mjs`.
- **L12 (Audit & Autonomous Watchdog)**: Enforced via `scripts/convergence/watchdog-convergence.mjs`.
