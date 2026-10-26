# FARELY PROJECT 10X — RESEARCH R10 [R4]
# LEVEL: Pass 4: Production SRE Rigor & Zero-Mock Verification
# MANDATE: Subject the system to real-world production site reliability engineering (SRE) scrutiny, zero-mock invariants, and OS-level telemetry verification.
# GIT_COMMIT: ed53cc39e6b3eb1f96b5f66cf017032b09bd55ac
# TIMESTAMP: 2026-10-26T10:44:30.000Z
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

## REFUTATION MATRIX & FALSIFICATION OF PASS R3

### Falsification 1: L01 Self-Comparison Identity Bypass in Airport Alternatives
- *Deficits Identified in Pass R3*: Pass R3 checked positive finite prices, but failed to address self-comparison where `baselineAirportCode === alternativeAirportCode` (e.g. evaluating SGN vs SGN).
- *Empirical Code Evidence*: In `src/domain/farely/airportAlternatives.ts`, evaluating identical airport codes triggers `findGroundTransfer('SGN', 'SGN')`, which returns undefined and falls back to a heuristic transfer estimate (50km, 60 minutes, 200k VND). This falsely deducts 200,000 VND from an identical route flight, showing a spurious 200k loss instead of a 0-delta identity match.
- *Production SRE Fix in R4*: In `src/domain/farely/airportAlternatives.ts`, check `if (baseCode === altCode) return { verdict: "NOT_RECOMMENDED", netSavingsVND: 0, isWorthwhile: false, explanationVi: "Sân bay so sánh trùng khớp với sân bay gốc." };`. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 Empty Filtered Array Panic in Cohort Price Variance
- *Deficits Identified in Pass R3*: Pass R3 added array filtering for positive numbers, but did not assert behavior when all elements in `prices` are non-positive or non-finite, yielding an empty array `[]`.
- *Empirical Code Evidence*: In `src/domain/farely/priceAnomaly.ts`, if `validPrices.length === 0`, `mean` evaluates to `0 / 0 = NaN`. The function must explicitly short-circuit when `validPrices.length <= 1`, returning `{ mean: validPrices[0] ?? 0, sampleVariance: 0, sampleStdDev: 0 }`.
- *Production SRE Fix in R4*: In `src/domain/farely/priceAnomaly.ts`, check `if (validPrices.length <= 1) return { mean: validPrices[0] ?? 0, sampleVariance: 0, sampleStdDev: 0 };`.

### Falsification 3: L03 Compound Duration Regex Backtracking & Boundary Failures
- *Deficits Identified in Pass R3*: Pass R3 proposed multilingual duration tokens, but didn't address compound duration strings where hours and minutes appear without whitespace or with compact punctuation (`"1h30"`, `"2g15p"`).
- *Empirical Code Evidence*: In `src/app/domain/dealComparison.ts`, strings like `"1h30"` fail standard word boundary regexes if the minute specifier `m` or `p` is omitted.
- *Production SRE Fix in R4*: In `src/app/domain/dealComparison.ts`, construct a robust parser matching optional hours and minutes with compact abbreviation support. Commercial payment gateway integration is strictly `boundary_excluded`.

---

## SECTION III: 12 ADVERSARIAL LENSES SRE RIGOR AUDIT

### L01: Ingestion & Live Schema Integrity
- **SRE Audit**: Validate airport self-comparison short-circuiting in `src/domain/farely/airportAlternatives.ts`.
- **System Defense**: Identity checks ensure that comparisons between identical nodes yield 0 net delta without ground transport overhead.

### L02: Price Anomaly & Statistical Rigor
- **SRE Audit**: Zero-sample array defense in `src/domain/farely/priceAnomaly.ts`.
- **System Defense**: Guarantee mathematical closure over the empty set, preventing IEEE 754 `NaN` propagation into telemetry dashboards.

### L03: True-Cost & Ancillary Transparency
- **SRE Audit**: Compound duration parsing in `src/app/domain/dealComparison.ts`.
- **System Defense**: Support localized Vietnamese travel notation across OTA search listings. Credit card processing and passenger checkout are strictly `boundary_excluded`.

### L04: Authentication & Rate Limiting
- **SRE Audit**: SRE socket connection exhaustion traps and PostgreSQL connection pool limits (`max_connections = 100`).
- **System Defense**: Transactional row claim semantics (`FOR UPDATE SKIP LOCKED`) in `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`. Unauthorized scraping is strictly `boundary_excluded`.

### L05: Concurrency & Resilience
- **SRE Audit**: Kernel-level process isolation and socket timeout limits (8000ms).
- **System Defense**: Tri-state circuit breaker protection in `supabase/functions/_shared/flight-search.ts`.

### L06: PWA Offline Freshness
- **SRE Audit**: IndexedDB and localStorage quota pressure under mobile browser constraints (50MB storage ceiling).
- **System Defense**: 14-day LRU eviction and 100-item caps in `src/domain/farely/pwaOfflineFreshness.ts` and `src/app/pages/DealsPage.tsx`.

### L07: Observability & Production SRE
- **SRE Audit**: V8 heap memory footprint and recursion depth limits (`maxDepth = 3`, `maxKeysPerLevel = 50`).
- **System Defense**: Safe circular error serialization in `src/app/lib/analytics.ts`.

### L08: Zero-Downtime Database Migrations
- **SRE Audit**: PostgreSQL lock queue delays and schema migration deadlocks.
- **System Defense**: Idempotent DDL verified via `scripts/verify-certification-integrity.node-test.mjs`.

### L09: Zero-Mock Testing & Proof Hierarchy
- **SRE Audit**: CI test execution reliability across Vitest and Node native runners.
- **System Defense**: Deterministic test suites verified via `scripts/verify-certification-integrity.node-test.mjs`.

### L10: Contract Immutability & Anti-Shrinkage
- **SRE Audit**: Traceability of all 267 historical acceptance gates.
- **System Defense**: Automated verification in `scripts/acceptance-anti-shrinkage.node-test.mjs`.

### L11: Transactional Safety & Journal Integrity
- **SRE Audit**: Process crash resilience during task execution.
- **System Defense**: Pre-image journal snapshots in `scripts/convergence/transactional-task-manager.mjs`.

### L12: Autonomous Audit & Parity Watchdog
- **SRE Audit**: Automated reconciliation against origin git commit.
- **System Defense**: Remote parity verification in `scripts/convergence/watchdog-convergence.mjs`.

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
