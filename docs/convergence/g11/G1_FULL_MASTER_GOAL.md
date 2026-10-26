# FARELY PROJECT 10X — MASTER GOAL G11 [G1]
# LEVEL: Pass 1: Work Packages Architecture & Scope Decomposition
# MANDATE: Synthesize research R1..R5 into a locked Master Goal plan evaluating all 12 lenses simultaneously.
# GIT_COMMIT: e96cfffbc0664f2c50fdc2aab7402aa936285022
# TIMESTAMP: 2026-10-26T10:57:15.000Z
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

## SECTION E: CONCRETE WORK PACKAGES (WP01..WP03) FOR CYCLE G78

### Work Package WP01: Multi-City Itinerary Slice Stabilization & Positive Price Guard
- **Work Package ID**: `WP01-MULTI-CITY-SLICE-STABILIZATION`
- **Target Files**:
  - `src/domain/farely/multiCityItinerary.ts`
  - `src/domain/farely/multiCityItinerary.test.ts`
- **Locked Solution**:
  In `src/domain/farely/multiCityItinerary.ts`:
  1. Filter out nullish/falsy slice elements.
  2. Normalize airport and airline codes: `(s.originCode || "").trim().toUpperCase()`.
  3. Normalize departure dates with `.slice(0, 10)` before chronological checks.
  4. Ensure slice prices are non-negative finite numbers: `const safePrice = Number.isFinite(current.price) && current.price > 0 ? current.price : 0; totalPrice += Math.round(safePrice);`.
  5. Apply secondary tie-break sort: `(a, b) => a.sliceIndex - b.sliceIndex || (a.departDate || "").localeCompare(b.departDate || "")`.
- **Turnkey Verification**:
  `npx vitest run src/domain/farely/multiCityItinerary.test.ts`

### Work Package WP02: Provider Rights B2B Scope Normalization & Deduplication
- **Work Package ID**: `WP02-PROVIDER-RIGHTS-B2B-SCOPE-DEDUP`
- **Target Files**:
  - `src/domain/farely/providerRights.ts`
  - `src/domain/farely/providerRights.test.ts`
- **Locked Solution**:
  In `src/domain/farely/providerRights.ts`:
  In `validateB2BRedistributionScope(providerIds: string[])`:
  1. Deduplicate and clean IDs: `const cleanIds = Array.from(new Set((providerIds || []).map(id => (id || "").trim().toLowerCase()).filter(Boolean)));`.
  2. Explicitly reject providers with `declarationStatus === "COMMERCIAL_STAGED_CONTRACT_REQUIRED"`.
- **Turnkey Verification**:
  `npx vitest run src/domain/farely/providerRights.test.ts`

### Work Package WP03: PWA Offline Freshness Deal Price Sanity & Timestamp Validation
- **Work Package ID**: `WP03-PWA-OFFLINE-PRICE-SANITY`
- **Target Files**:
  - `src/domain/farely/pwaOfflineFreshness.ts`
  - `src/domain/farely/pwaOfflineFreshness.test.ts`
- **Locked Solution**:
  In `src/domain/farely/pwaOfflineFreshness.ts`:
  In `resolveOfflineDealFreshness(deal, nowIso)`:
  1. Validate `deal.observedAt`: fallback to `nowIso` if missing or unparseable.
  2. Clamp `offlineStalenessMinutes = Math.max(0, Math.floor((now - observedTime) / 60000));`.
  3. Validate `priceVND`: if `!Number.isFinite(deal.priceVND) || deal.priceVND <= 0`, flag `canDirectBook = false` and set `disclosureNoticeVi = "Giá vé ngoại tuyến không hợp lệ hoặc bị lỗi dữ liệu."`.
- **Turnkey Verification**:
  `npx vitest run src/domain/farely/pwaOfflineFreshness.test.ts`

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
