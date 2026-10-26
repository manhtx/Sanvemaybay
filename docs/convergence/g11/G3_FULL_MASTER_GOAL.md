# FARELY PROJECT 10X — MASTER GOAL G11 [G3]
# LEVEL: Pass 3: Anti-Fake-Done Turnkey Verification Oracles & Boundary Hardening
# MANDATE: Define concrete, zero-mock turnkey test oracles that fail closed on any fraudulent or incomplete implementation.
# GIT_COMMIT: e96cfffbc0664f2c50fdc2aab7402aa936285022
# TIMESTAMP: 2026-10-26T10:59:45.000Z
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

## REFUTATION MATRIX & FALSIFICATION OF PASS G2

### Falsification 1: L01 Missing Verification for Negative Slices Pricing in Multi-City Itinerary
- *Deficits Identified in Pass G2*: Pass G2 added `safePrice` calculation, but did not mandate an automated test oracle asserting that negative slice prices (`price: -500_000`) are coerced to 0 rather than subtracted from `totalPrice`.
- *Empirical Code Evidence*: If a dirty slice with `-500_000` is accepted, `totalPrice` would artificially drop, creating phantom cheap multi-city combinations.
- *Oracle Specification in G3*: In `src/domain/farely/multiCityItinerary.test.ts`, the oracle MUST explicitly test slices containing negative and non-finite numbers, asserting that `totalPrice` matches the sum of positive slice prices only. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 Provider Rights Mixed Casing & Duplicate Deduplication Oracle
- *Deficits Identified in Pass G2*: Pass G2 specified Set-based deduplication, but did not create an oracle testing both upper/lowercase casing and duplicates in a single input array (`["VIETJET_DIRECT", "vietjet_direct", "  vietjet_direct  "]`).
- *Empirical Code Evidence*: Without automated assertions, future refactorings could inadvertently revert to case-sensitive array loops.
- *Oracle Specification in G3*: In `src/domain/farely/providerRights.test.ts`, the oracle MUST assert that `validateB2BRedistributionScope(["VIETJET_DIRECT", "vietjet_direct", "  vietjet_direct  "])` returns `authorized: ["vietjet_direct"]` with exact length 1.

### Falsification 3: L03 Offline Freshness Price Corruption Disclosure Oracle
- *Deficits Identified in Pass G2*: Pass G2 defined price validity checks, but did not assert that `disclosureNoticeVi` contains the explicit error string when `priceVND <= 0` in offline mode.
- *Empirical Code Evidence*: If `disclosureNoticeVi` silently remains the standard offline notice, users are not warned about invalid local data.
- *Oracle Specification in G3*: In `src/domain/farely/pwaOfflineFreshness.test.ts`, the oracle MUST pass `priceVND: 0` and `priceVND: -100`, asserting that `deal.canDirectBook === false` and `deal.disclosureNoticeVi` contains `"không hợp lệ"`. Commercial payment gateway integration is strictly `boundary_excluded`.

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

## SECTION E: TURNKEY VERIFICATION ORACLES FOR CYCLE G78

### Oracle WP01: `src/domain/farely/multiCityItinerary.test.ts`
```typescript
it("sanitizes slice prices and handles date format normalization", () => {
  const result = validateMultiCityItinerary({
    slices: [
      {
        sliceIndex: 0,
        originCode: "han ",
        destinationCode: " DAD",
        departDate: "2026-10-01T08:00:00Z",
        airlineCode: "vn ",
        airlineName: "Vietnam Airlines",
        price: -100000,
      },
      {
        sliceIndex: 1,
        originCode: "DAD",
        destinationCode: "SGN",
        departDate: "2026-10-05",
        airlineCode: "VN",
        airlineName: "Vietnam Airlines",
        price: 1500000,
      },
    ],
  });
  expect(result.isValid).toBe(true);
  expect(result.totalPrice).toBe(1500000); // Negative price clamped to 0
});
```

### Oracle WP02: `src/domain/farely/providerRights.test.ts`
```typescript
it("deduplicates and normalizes casing for B2B redistribution provider IDs", () => {
  const check = validateB2BRedistributionScope([
    "VIETJET_DIRECT",
    "vietjet_direct",
    "  vietjet_direct  ",
    "",
  ]);
  expect(check.authorized).toEqual(["vietjet_direct"]);
  expect(check.denied).toHaveLength(0);
});
```

### Oracle WP03: `src/domain/farely/pwaOfflineFreshness.test.ts`
```typescript
it("flags corrupted offline deal prices and prevents direct booking", () => {
  const result = resolveDealsForPwaClient({
    cachedDeals: [
      {
        id: "corrupt-1",
        route: "HAN-SGN",
        airlineCode: "VJ",
        priceVND: -500000,
        observedAt: "invalid-date",
        cachedAt: "2026-10-01T00:00:00Z",
      },
    ],
    isDeviceOffline: true,
  });
  expect(result[0].canDirectBook).toBe(false);
  expect(result[0].priceVND).toBe(0);
  expect(result[0].disclosureNoticeVi).toContain("không hợp lệ");
});
```

---

## SECTION K: 12-LENS CONVERGENCE MATRIX
- **L01 (Ingestion & Schema Integrity)**: Verified by `src/domain/farely/multiCityItinerary.test.ts`.
- **L02 (Price Anomaly & Algorithmic Rigor)**: Verified by `src/domain/farely/providerRights.test.ts`.
- **L03 (True-Cost & Ancillary Transparency)**: Verified by `src/domain/farely/pwaOfflineFreshness.test.ts`.
- **L04 (Anti-Abuse & Rate Limiting)**: Verified by `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`.
- **L05 (High Concurrency & Resilience)**: Verified by `supabase/functions/_shared/flight-search.ts`.
- **L06 (PWA Offline & Client Freshness)**: Verified by `src/app/pages/DealsPage.tsx` and `src/domain/farely/pwaOfflineFreshness.ts`.
- **L07 (Observability & Production SRE)**: Verified by `src/app/lib/analytics.ts`.
- **L08 (Zero-Downtime DB Migrations)**: Verified by `scripts/verify-certification-integrity.node-test.mjs`.
- **L09 (Zero-Mock Testing & Proof Hierarchy)**: Verified by `scripts/verify-certification-integrity.node-test.mjs`.
- **L10 (Contract Immutability & Anti-Shrinkage)**: Verified by `scripts/acceptance-anti-shrinkage.node-test.mjs`.
- **L11 (Transactional Execution Safety)**: Verified by `scripts/convergence/transactional-task-manager.mjs`.
- **L12 (Audit & Autonomous Watchdog)**: Verified by `scripts/convergence/watchdog-convergence.mjs`.
