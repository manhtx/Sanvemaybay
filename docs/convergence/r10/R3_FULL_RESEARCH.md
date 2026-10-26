# FARELY PROJECT 10X — RESEARCH R10 [R3]
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Subject system architecture to extreme negative vectors, edge cases, and adversarial input attacks across all 12 lenses.
# GIT_COMMIT: e96cfffbc0664f2c50fdc2aab7402aa936285022
# TIMESTAMP: 2026-10-26T10:55:00.000Z
# EXECUTION_RECEIPT_SHA256: 5b111a7169abc6ae778ffe2e481b439f837a060e1e1beac660c26a8b6cf64fb6

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

### Falsification 1: L01 Untrimmed and Mixed-Case Open-Jaw Segment Detection
- *Deficits Identified in Pass R2*: Pass R2 solved slice index collisions, but ignored mixed-case and untrimmed airport code comparisons during open-jaw detection (`"han "` vs `"HAN"`).
- *Empirical Code Evidence*: In `src/domain/farely/multiCityItinerary.ts`, `prev.destinationCode.toUpperCase() !== current.originCode.toUpperCase()` fails if leading or trailing whitespace exists, generating phantom surface segment warnings.
- *Hardened Contract in R3*: In `src/domain/farely/multiCityItinerary.ts`, enforce `const prevDest = (prev.destinationCode || "").trim().toUpperCase(); const currOrig = (current.originCode || "").trim().toUpperCase(); if (prevDest !== currOrig) ...`. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 Staged Commercial Contract Leaks in B2B Syndication
- *Deficits Identified in Pass R2*: Pass R2 focused on ID casing, but failed to assert that providers marked as `COMMERCIAL_STAGED_CONTRACT_REQUIRED` must be explicitly rejected from B2B export until executed commercial agreements exist.
- *Empirical Code Evidence*: In `src/domain/farely/providerRights.ts`, if a staged commercial provider happens to list `B2B_SYNDICATION` in its staging template, `validateB2BRedistributionScope` would approve it without an active agreement.
- *Hardened Contract in R3*: In `src/domain/farely/providerRights.ts`, assert `if (rights.declarationStatus === "COMMERCIAL_STAGED_CONTRACT_REQUIRED")` must be added to `denied` with explicit contract disclaimer.

### Falsification 3: L03 Future Observation Timestamp Manipulation in PWA Freshness
- *Deficits Identified in Pass R2*: Pass R2 sanitized prices, but did not handle corrupted `observedAt` timestamps with future dates (clock drift or malicious client injection).
- *Empirical Code Evidence*: In `src/domain/farely/pwaOfflineFreshness.ts`, computing `(now - observedTime) / 60000` on a future date yields negative staleness minutes, breaking cache ordering.
- *Hardened Contract in R3*: In `src/domain/farely/pwaOfflineFreshness.ts`, clamp `offlineStalenessMinutes = Math.max(0, Math.floor((now - observedTime) / 60000))` and reject unparseable timestamps. Commercial payment gateway integration is strictly `boundary_excluded`.

---

## SECTION III: 12 ADVERSARIAL LENSES NEGATIVE VECTOR AUDIT

### L01: Ingestion & Live Schema Integrity
- **Negative Vector**: Whitespace padding and mixed-case open-jaw airport codes.
- **Defensive Boundary**: Trim and uppercase normalization in `src/domain/farely/multiCityItinerary.ts`.

### L02: Price Anomaly & Statistical Rigor
- **Negative Vector**: Staged commercial contracts inadvertently syndicated without legal clearance.
- **Defensive Boundary**: Gate verification in `src/domain/farely/providerRights.ts`.

### L03: True-Cost & Ancillary Transparency
- **Negative Vector**: Negative staleness minutes and unparseable ISO strings in client storage.
- **Defensive Boundary**: Bounded timestamp calculations in `src/domain/farely/pwaOfflineFreshness.ts`. Credit card processing and passenger checkout are strictly `boundary_excluded`.

### L04: Authentication & Rate Limiting
- **Negative Vector**: Distributed alert scraping flooding webhook dispatchers.
- **Defensive Boundary**: Database rate-limiting triggers in `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`. Unauthorized scraping is strictly `boundary_excluded`.

### L05: Concurrency & Resilience
- **Negative Vector**: Upstream microservice socket hangs under high load.
- **Defensive Boundary**: Circuit breaker failure isolation in `supabase/functions/_shared/flight-search.ts`.

### L06: PWA Offline Freshness
- **Negative Vector**: Malformed deal records resurrecting dead IndexedDB nodes.
- **Defensive Boundary**: 14-day eviction in `src/domain/farely/pwaOfflineFreshness.ts` and monotonic sorting in `src/app/pages/DealsPage.tsx`.

### L07: Observability & Production SRE
- **Negative Vector**: Deeply nested composite error payloads triggering node crash.
- **Defensive Boundary**: Bounded serializer depth in `src/app/lib/analytics.ts`.

### L08: Zero-Downtime Database Migrations
- **Negative Vector**: DDL locks blocking production reads during table migration.
- **Defensive Boundary**: Concurrent index verification in `scripts/verify-certification-integrity.node-test.mjs`.

### L09: Zero-Mock Testing & Proof Hierarchy
- **Negative Vector**: Fictitious mock assertions masquerading as production readiness.
- **Defensive Boundary**: Real domain execution verified via `scripts/verify-certification-integrity.node-test.mjs`.

### L10: Contract Immutability & Anti-Shrinkage
- **Negative Vector**: Deletion or softening of foundational P0/P1 capabilities.
- **Defensive Boundary**: Gate verification in `scripts/acceptance-anti-shrinkage.node-test.mjs`.

### L11: Transactional Safety & Journal Integrity
- **Negative Vector**: Partial task updates leading to out-of-sync git indexes.
- **Defensive Boundary**: Pre-image state snapshots in `scripts/convergence/transactional-task-manager.mjs`.

### L12: Autonomous Audit & Parity Watchdog
- **Negative Vector**: Silent local divergence from remote origin feature branch.
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
