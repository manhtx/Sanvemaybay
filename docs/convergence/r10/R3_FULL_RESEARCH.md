# FARELY PROJECT 10X — RESEARCH R10 [R3]
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Subject system architecture to extreme negative vectors, edge cases, and adversarial input attacks across all 12 lenses.
# GIT_COMMIT: ed53cc39e6b3eb1f96b5f66cf017032b09bd55ac
# TIMESTAMP: 2026-10-26T10:43:35.000Z
# EXECUTION_RECEIPT_SHA256: 8d1a9b4346193f30aa03e57ed1e11bb87625d140618b00a287da74aed6142d41

---

## SECTION II: INVARIANT EXECUTOR CAGE
```text
INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
The executor is strictly bound to the locked technical solutions detailed in Section D & E.
The executor is FORBIDDEN from inventing new architectures, introducing alternative algorithms,
changing database schemas, or deviating from the specified file/function diffs.
Any deviation is a critical contract breach and will be rejected closed by the Evidence Admission Controller.
```

---

## REFUTATION MATRIX & FALSIFICATION OF PASS R2

### Falsification 1: L01 Negative Price Inversion Exploitation in Airport Savings
- *Deficits Identified in Pass R2*: Pass R2 clamped prices with `Math.max(0, ...)`, but overlooked negative price payloads from corrupted scraper outputs (`alternativePrice: -500000`).
- *Empirical Code Evidence*: In `src/domain/farely/airportAlternatives.ts`, subtracting a negative alternative price mathematically increases net savings (`baselinePrice - (-500000) = baselinePrice + 500000`). This produces synthetic phantom savings, misleading users into booking invalid offers.
- *Hardened Contract in R3*: In `src/domain/farely/airportAlternatives.ts`, prices $\le 0$ or non-finite numbers must trigger an immediate invalid evaluation with `verdict: "NOT_RECOMMENDED"`, `netSavingsVND: 0`, and `isWorthwhile: false`. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 Subnormal Variance Under Identical Price Flooding
- *Deficits Identified in Pass R2*: Pass R2 filtered non-finite cohort prices, but did not address cohorts containing identical prices (e.g. 50 samples of exactly 1,200,000 VND).
- *Empirical Code Evidence*: In `src/domain/farely/priceAnomaly.ts`, calculating sample variance on identical prices yields exact 0. If a small floating-point rounding artifact occurs (`1e-18`), dividing by `sampleStdDev` triggers catastrophic float instability.
- *Hardened Contract in R3*: In `src/domain/farely/priceAnomaly.ts`, `hasZeroDispersion(prices)` explicitly abstains when `sampleVariance < 1e-6`, guaranteeing zero division-by-zero occurrences.

### Falsification 3: L03 Vietnamese Localized Duration String Parsing Blindspots
- *Deficits Identified in Pass R2*: Pass R2 analyzed numerical transfer durations, but overlooked duration text parsing in `src/app/domain/dealComparison.ts`.
- *Empirical Code Evidence*: In `src/app/domain/dealComparison.ts`, regex matches English patterns `(\d+)\s*h` and `(\d+)\s*m`. For Vietnamese domestic OTA strings such as `"2 giờ 15 phút"` or `"1 tiếng 45p"`, the regex returns `undefined`, misclassifying the deal duration as unverified.
- *Hardened Contract in R3*: In `src/app/domain/dealComparison.ts`, extend duration parser regex to support Vietnamese tokens: `(\d+)\s*(?:h|giờ|tiếng)` and `(\d+)\s*(?:m|phút|p)`. Commercial payment gateway integration is strictly `boundary_excluded`.

---

## SECTION III: 12 ADVERSARIAL LENSES NEGATIVE VECTOR AUDIT

### L01: Ingestion & Live Schema Integrity
- **Negative Vector**: Negative price inversion and undefined airport codes.
- **Defensive Boundary**: Enforce positive finite price constraints in `src/domain/farely/airportAlternatives.ts`.

### L02: Price Anomaly & Statistical Rigor
- **Negative Vector**: Zero-variance flat cohorts and subnormal floating-point divisions.
- **Defensive Boundary**: Enforce sample dispersion thresholding (`rawMad < 1e-6`) in `src/domain/farely/priceAnomaly.ts`.

### L03: True-Cost & Ancillary Transparency
- **Negative Vector**: Non-English flight duration parsing omissions creating phantom unverified field warnings.
- **Defensive Boundary**: Support multilingual duration tokens in `src/app/domain/dealComparison.ts`. Credit card processing and passenger checkout are strictly `boundary_excluded`.

### L04: Authentication & Rate Limiting
- **Negative Vector**: High-frequency IP rotation attempting to overwhelm watch notification queues.
- **Defensive Boundary**: Database-level rate limiting (`check_watch_rate_limit`) in `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`. Unauthorized scraping is strictly `boundary_excluded`.

### L05: Concurrency & Resilience
- **Negative Vector**: Cascading partner timeout storms during flight searches.
- **Defensive Boundary**: Strict circuit breaker state management in `supabase/functions/_shared/flight-search.ts`.

### L06: PWA Offline Freshness
- **Negative Vector**: Stale flight cache resurrection after network reconnection.
- **Defensive Boundary**: 14-day eviction and 6-hour snapshot staleness flags in `src/domain/farely/pwaOfflineFreshness.ts` and `src/app/pages/DealsPage.tsx`.

### L07: Observability & Production SRE
- **Negative Vector**: Massive circular error objects exhausting isolate heap memory during telemetry ingestion.
- **Defensive Boundary**: Enforce WeakSet object memoization and depth limiting in `src/app/lib/analytics.ts`.

### L08: Zero-Downtime Database Migrations
- **Negative Vector**: DDL locks blocking concurrent table reads.
- **Defensive Boundary**: Require `CONCURRENTLY` index creation and non-destructive columns in `scripts/verify-certification-integrity.node-test.mjs`.

### L09: Zero-Mock Testing & Proof Hierarchy
- **Negative Vector**: Test suite pollution via synthetic mock bypasses.
- **Defensive Boundary**: Pure domain verification in `scripts/verify-certification-integrity.node-test.mjs`.

### L10: Contract Immutability & Anti-Shrinkage
- **Negative Vector**: Silent deprecation or shrinkage of legacy P0/P1 acceptance gates.
- **Defensive Boundary**: Automated gate count assertions in `scripts/acceptance-anti-shrinkage.node-test.mjs`.

### L11: Transactional Safety & Journal Integrity
- **Negative Vector**: Uncommitted filesystem modifications left in a dirty state.
- **Defensive Boundary**: Strict atomic boundaries in `scripts/convergence/transactional-task-manager.mjs`.

### L12: Autonomous Audit & Parity Watchdog
- **Negative Vector**: Git local/remote drift on `antigravity/farely-v12-product-convergence`.
- **Defensive Boundary**: Autonomous verification in `scripts/convergence/watchdog-convergence.mjs`.

---

## SECTION IV: LOCKED SOLUTIONS CAGE (SOL-01..SOL-12)

### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/app/data/api.ts`, preserve nulls without coercion. In `src/domain/farely/priceAnomaly.ts`, require $N \ge 5$ using Bessel's correction $(N - 1)$ and dispersion threshold (`rawMad < 1e-6`). Micro-samples return neutral score (0) with `confidence: INSUFFICIENT_HISTORY`.
- **Forbidden Deviations**: No zero-inflation on missing fields; direct ticketing and passenger checkout are strictly `boundary_excluded`.
- **Verification Command**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### SOL-02: SOL-PRICE-01 (Deterministic Tet Window Lookup & Dynamic Prior)
- **Target File**: `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/domain/farely/priceAnomaly.ts`, define static Lunar Tet windows for 2025, 2026, and 2027 with $2.8\times$ baseline multipliers to suppress false-positive deal alerts during peak festive periods.
- **Forbidden Deviations**: No dynamic unsealed third-party lunar APIs; no uncalibrated static baselines.
- **Verification Command**: `npx vitest run src/domain/farely/priceAnomaly.test.ts`

### SOL-03: SOL-COST-01 (Carrier Landed Surcharges & Self-Transfer Validation)
- **Target File**: `src/domain/farely/tripBudgetEstimator.ts` & `src/domain/farely/multiCityItinerary.ts`
- **Specification**: In `src/domain/farely/tripBudgetEstimator.ts`, compute carrier surcharges scaled by whole-integer passenger counts (`Math.floor(Math.max(1, passengers))`). In `src/domain/farely/multiCityItinerary.ts`, enforce 150m domestic, 240m international, and 210m metropolitan inter-airport transfers.
- **Forbidden Deviations**: No naked base fare ranking; no unflagged self-transfers; direct ticketing and payment gateway integration are strictly `boundary_excluded`.
- **Verification Command**: `npx vitest run src/domain/farely/tripBudgetEstimator.test.ts`

### SOL-04: SOL-AUTH-01 (Rate-Limited Tokenized Watch Outbox & Row-Level Locking)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: In `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`, enforce rate limiting via `check_watch_rate_limit()` and transactional outbox row locking (`FOR UPDATE SKIP LOCKED`).
- **Forbidden Deviations**: No plain-text email broadcast queues; unauthorized scraping and credit card processing are strictly `boundary_excluded`.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Tri-State Provider Circuit Breakers & Fallback Degrade)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Specification**: In `supabase/functions/_shared/flight-search.ts`, implement tri-state circuit breaker (`CLOSED`, `OPEN`, `HALF_OPEN`) tracking consecutive 5xx errors and timeouts (> 8000ms), failing fast to cached snapshots.
- **Forbidden Deviations**: No unthrottled outbound retries; no hard crashes on upstream provider timeout.
- **Verification Command**: `npx vitest run src/domain/farely/providerRights.test.ts`

### SOL-06: SOL-STALE-01 (PWA Offline Freshness & Monotonic Deal Deduplication)
- **Target File**: `src/app/pages/DealsPage.tsx` & `src/domain/farely/pwaOfflineFreshness.ts`
- **Specification**: In `src/app/pages/DealsPage.tsx`, deduplicate deal feeds monotonically. In `src/domain/farely/pwaOfflineFreshness.ts`, purge cached search results older than 14 days and mark fares over 6 hours old as `STALE_SNAPSHOT`.
- **Forbidden Deviations**: No unbounded localStorage persistence; no rendering stale fares as live quotes.
- **Verification Command**: `npx vitest run src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Safe Recursive Error Serialization & Depth Guard)
- **Target File**: `src/app/lib/analytics.ts`
- **Specification**: In `src/app/lib/analytics.ts`, implement bounded recursive serialization in `safeSerializeError` capping recursion at `maxDepth = 3`, truncating object keys at `maxKeysPerLevel = 50`, and preserving array types.
- **Forbidden Deviations**: No naive JSON.stringify; no unbounded key extraction; no unredacted logging of PII.
- **Verification Command**: `npx vitest run src/app/lib/analytics.test.ts`

### SOL-08: SOL-MIGRATION-01 (Zero-Downtime Migration Invariants & Schema Verification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: In `scripts/verify-certification-integrity.node-test.mjs`, verify that database migrations use non-destructive DDL (`ADD COLUMN IF NOT EXISTS`, `CREATE INDEX CONCURRENTLY IF NOT EXISTS`).
- **Forbidden Deviations**: No destructive table drops or column alterations; no production data mutation.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (Hierarchical Verification Gating C0 -> C4)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: In `scripts/verify-certification-integrity.node-test.mjs`, enforce strict separation of proof tiers: C0 (Contract), C1 (Unit Code Proof), C2 (Integration), C3 (Runtime Telemetry), and C4 (Longitudinal Soak). Unit tests cannot certify C3/C4 milestones.
- **Forbidden Deviations**: No self-awarded 10/10 scores; no synthetic badge upgrades without automated verification proof.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (Acceptance Anti-Shrinkage & Gate Immutability)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Specification**: In `scripts/acceptance-anti-shrinkage.node-test.mjs`, assert all 89 capability contracts (F00..F88) and 267 historical acceptance gates (192 P0, 74 P1, 1 P2) remain strictly preserved.
- **Forbidden Deviations**: No deletion, consolidation, or renaming of acceptance criteria.
- **Verification Command**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (ACID Transactional Task Lifecycle & Rollback Journal)
- **Target File**: `scripts/convergence/transactional-task-manager.mjs`
- **Specification**: In `scripts/convergence/transactional-task-manager.mjs`, enforce atomic state transitions (`begin` -> `commit` / `rollback`) with pre-image filesystem snapshots in `docs/convergence/state/transaction_journal.json`.
- **Forbidden Deviations**: No manual file edits outside active transaction journal context.
- **Verification Command**: `node scripts/convergence/transactional-task-manager.mjs status`

### SOL-12: SOL-RELEASE-01 (Automated Watchdog Convergence & Remote SHA Parity)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: In `scripts/convergence/watchdog-convergence.mjs`, enforce full test suite verification and Git remote tracking parity via `git ls-remote origin antigravity/farely-v12-product-convergence`.
- **Forbidden Deviations**: No unpushed commits; no ignoring CI test suite failures.
- **Verification Command**: `node scripts/convergence/watchdog-convergence.mjs`
