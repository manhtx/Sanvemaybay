# FARELY PROJECT 10X — RESEARCH R10 [R5]
# LEVEL: Pass 5: Sovereign Canonical Convergence & Adversarial Closure
# MANDATE: Synthesize passes R1..R4 into a locked, definitive research foundation with adversarial refutation of R4 across all 12 lenses.
# GIT_COMMIT: ed53cc39e6b3eb1f96b5f66cf017032b09bd55ac
# TIMESTAMP: 2026-10-26T10:45:15.000Z
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

## REFUTATION MATRIX & FALSIFICATION OF PASS R4

### Falsification 1: L01 Symmetrical Identity Mapping in Airport Alternatives
- *Deficits Identified in Pass R4*: Pass R4 introduced identical airport code checks, but did not handle whitespace padding or case sensitivity variations prior to the identity equality check (`"han "` vs `"HAN"`).
- *Empirical Code Evidence*: In `src/domain/farely/airportAlternatives.ts`, comparing `"HAN"` and `"han "` without prior trimming and upper-casing allows self-comparisons to slip past `baseCode === altCode`.
- *Correction in R5*: In `src/domain/farely/airportAlternatives.ts`, normalize both codes strictly before identity check: `const baseCode = (params.baselineAirportCode || "").trim().toUpperCase(); const altCode = (params.alternativeAirportCode || "").trim().toUpperCase(); if (baseCode === altCode) return { verdict: "NOT_RECOMMENDED", netSavingsVND: 0, isWorthwhile: false, explanationVi: "Sân bay so sánh trùng khớp với sân bay gốc." };`. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 Negative Variance Suppression via Array Sanitization
- *Deficits Identified in Pass R4*: Pass R4 guarded against division-by-zero on empty arrays, but did not assert that negative numbers must be explicitly rejected during price filtering.
- *Empirical Code Evidence*: In `src/domain/farely/priceAnomaly.ts`, if `prices` includes negative numbers like `[-100, 200, 300]`, the negative value artificially drags down the cohort mean, creating false positive anomaly triggers for normal fares.
- *Correction in R5*: In `src/domain/farely/priceAnomaly.ts`, enforce positive finite bounds: `const validPrices = (prices || []).filter(p => typeof p === "number" && Number.isFinite(p) && p > 0);`.

### Falsification 3: L03 Compact Hours and Minutes Parsing Discrepancies
- *Deficits Identified in Pass R4*: Pass R4 suggested regex expansion for Vietnamese tokens, but did not account for pure numeric minute strings (e.g. `"90m"`, `"90 phút"`) or pure hour strings (`"2h"`, `"2 tiếng"`).
- *Empirical Code Evidence*: In `src/app/domain/dealComparison.ts`, passing `"90 phút"` without an hour token should correctly resolve to 90 minutes. A rigid sequence expectation `(\d+)h\s*(\d+)m` would fail pure minute or pure hour inputs.
- *Correction in R5*: In `src/app/domain/dealComparison.ts`, parse hours and minutes independently with non-capturing unit groups: `const hours = duration.match(/(\d+)\s*(?:h|giờ|tiếng|g)/i)?.[1]; const minutes = duration.match(/(\d+)\s*(?:m|phút|p)/i)?.[1];` and handle pure compact notation `"1h30"`. Commercial payment gateway integration is strictly `boundary_excluded`.

---

## SECTION III: 12 ADVERSARIAL LENSES DEFINITIVE SYNTHESIS

### L01: Ingestion & Live Schema Integrity
- **Final Audit**: `src/domain/farely/airportAlternatives.ts` must defensively sanitize all inputs with `(code || "").trim().toUpperCase()` and positive price checks.
- **Defensive Boundary**: Enforce complete identity validation and safe fallback defaults.

### L02: Price Anomaly & Statistical Rigor
- **Final Audit**: `src/domain/farely/priceAnomaly.ts` must reject all non-positive, non-finite cohort prices before computing sample statistics.
- **Defensive Boundary**: Bessel's sample variance $(N - 1)$ strictly applied on sanitized positive finite arrays with zero-dispersion abstention.

### L03: True-Cost & Ancillary Transparency
- **Final Audit**: `src/app/domain/dealComparison.ts` must parse multilingual duration tokens robustly.
- **Defensive Boundary**: Support English and Vietnamese flight duration strings without unverified field degradation. Credit card processing and passenger checkout are strictly `boundary_excluded`.

### L04: Authentication & Rate Limiting
- **Final Audit**: Database-level rate limiting in `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`.
- **Defensive Boundary**: Prevent abuse via row-level token verification. Unauthorized scraping is strictly `boundary_excluded`.

### L05: Concurrency & Resilience
- **Final Audit**: Tri-state circuit breaker protection in `supabase/functions/_shared/flight-search.ts`.
- **Defensive Boundary**: Protect backend microservices from cascading provider timeouts (> 8000ms).

### L06: PWA Offline Freshness
- **Final Audit**: Client cache eviction policy in `src/domain/farely/pwaOfflineFreshness.ts` and `src/app/pages/DealsPage.tsx`.
- **Defensive Boundary**: 14-day LRU purge and 6-hour snapshot staleness tags.

### L07: Observability & Production SRE
- **Final Audit**: Safe error serialization in `src/app/lib/analytics.ts`.
- **Defensive Boundary**: Recursive depth capping at `maxDepth = 3`, key bounding at `maxKeysPerLevel = 50`, and WeakSet memoization.

### L08: Zero-Downtime Database Migrations
- **Final Audit**: Schema evolution verification in `scripts/verify-certification-integrity.node-test.mjs`.
- **Defensive Boundary**: Idempotent DDL without destructive alterations.

### L09: Zero-Mock Testing & Proof Hierarchy
- **Final Audit**: 58 Vitest suites and 382 Node native tests executing real production logic.
- **Defensive Boundary**: Zero mocks for pure domain modules; distinct proof tiers (C0 -> C4).

### L10: Contract Immutability & Anti-Shrinkage
- **Final Audit**: 89 capability contracts (F00..F88) verified in `scripts/acceptance-anti-shrinkage.node-test.mjs`.
- **Defensive Boundary**: Absolute preservation of all 267 acceptance criteria.

### L11: Transactional Safety & Journal Integrity
- **Final Audit**: ACID transaction journal in `scripts/convergence/transactional-task-manager.mjs`.
- **Defensive Boundary**: Pre-image snapshots in `docs/convergence/state/transaction_journal.json`.

### L12: Autonomous Audit & Parity Watchdog
- **Final Audit**: Automated git tracking in `scripts/convergence/watchdog-convergence.mjs`.
- **Defensive Boundary**: Verification of remote SHA equality via `git ls-remote`.

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
