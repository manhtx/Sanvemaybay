# FARELY PROJECT 10X — MASTER GOAL G11 [G4]
# LEVEL: Pass 4: Production SRE Rigor & Zero-Mock Verification
# MANDATE: Assume Pass 3 relied on mock safety across all 12 lenses. Enforce deterministic oracles, real integrations, and zero-loss rollbacks.
# GIT_COMMIT: 5bb4d0b020e727e4b7cd779d2d5aeeaf7ecaf62a
# TIMESTAMP: 2026-10-26T11:16:30.000Z
# EXECUTION_RECEIPT_SHA256: 1f5b48e7ace6b05c6cff63384090800bc1bb014741e493e5cecc127f3797f671

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

## REFUTATION MATRIX & FALSIFICATION OF PASS G3

### Falsification 1: L01 Outbound Booking Domain Whitelist Port Stripping & Userinfo Defense
- *Deficits Identified in Pass G3*: Pass G3 enforced 3-letter IATA code sanitization, but failed to assert that `isSafeOutboundBookingUrl` must strip trailing dot notations and disallow embedded userinfo authentication credentials.
- *Empirical Code Evidence*: In `src/app/lib/bookingUrls.ts`:
  ```typescript
  export function isSafeOutboundBookingUrl(urlStr: string): boolean {
    if (!urlStr || typeof urlStr !== "string") return false;
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== "https:") return false;
      if (parsed.username || parsed.password) return false;
      if (parsed.port && parsed.port !== "443") return false;
      const hostname = parsed.hostname.toLowerCase().replace(/\.$/, "");
      return Array.from(APPROVED_BOOKING_DOMAINS).some(
        (domain) => hostname === domain || hostname.endsWith("." + domain)
      );
    } catch {
      return false;
    }
  }
  ```
  An attacker crafting `https://admin:secret@vietjetair.com:8080/path` attempts to exploit partner redirects. If userinfo and port are not rejected, credentials leak in Referer headers to external analytics endpoints.
- *Locked Invariant in G4*: In `src/app/lib/bookingUrls.ts`, assert `!parsed.username && !parsed.password && (!parsed.port || parsed.port === '443')`. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 Division by Zero Elimination in Unit Economic Rates & Infinite Percentages
- *Deficits Identified in Pass G3*: Pass G3 hardened `evaluateScanExpansionProposal`, but overlooked rate metrics `eligibleOfferRatePercent` and `verifiedOpportunityYieldPercent` in `calculateUnitEconomics`.
- *Empirical Code Evidence*: In `src/domain/farely/dataEconomics.ts`:
  ```typescript
  export function calculateUnitEconomics(metrics: ScopeEconomicMetrics): UnitEconomicsSummary {
    const scans = Math.floor(Math.max(1, Number.isFinite(metrics.scannedScopesCount) ? metrics.scannedScopesCount : 1));
    const cost = Math.max(0, Number.isFinite(metrics.totalScanCostVnd) ? metrics.totalScanCostVnd : 0);
    const offers = Math.max(0, Number.isFinite(metrics.eligibleOffersFound) ? metrics.eligibleOffersFound : 0);
    const opps = Math.max(0, Number.isFinite(metrics.verifiedOpportunitiesFound) ? metrics.verifiedOpportunitiesFound : 0);
    const alerts = Math.max(0, Number.isFinite(metrics.usefulWatchEventsDispatched) ? metrics.usefulWatchEventsDispatched : 0);

    return {
      costPerScannedScopeVnd: Math.round(cost / scans),
      costPerEligibleOfferVnd: offers > 0 ? Math.round(cost / offers) : cost,
      costPerVerifiedOpportunityVnd: opps > 0 ? Math.round(cost / opps) : cost,
      costPerUsefulWatchEventVnd: alerts > 0 ? Math.round(cost / alerts) : cost,
      eligibleOfferRatePercent: Math.round((offers / scans) * 100),
      verifiedOpportunityYieldPercent: Math.round((opps / scans) * 100),
    };
  }
  ```
  If `metrics.scannedScopesCount` is NaN or 0 without `Math.max(1, ...)`, division by zero evaluates to `Infinity%`, crashing JSON serializers.
- *Locked Invariant in G4*: In `src/domain/farely/dataEconomics.ts`, clamp `scans` and all metric inputs to non-negative whole numbers before performing divisions.

### Falsification 3: L03 Buy/Wait Rationale Localization Under Identical Offer Scope & Surge Pricing
- *Deficits Identified in Pass G3*: Pass G3 added surge price detection, but did not assert that when `scopeType === "IDENTICAL_OFFER"`, the rationale must explicitly state "chính chuyến bay này" to maintain epistemic truth (AUD-04 & EV34-23).
- *Empirical Code Evidence*: In `src/domain/farely/buyWaitGuidance.ts`:
  ```typescript
  const isCalibrated = scopeType === "IDENTICAL_OFFER" || scopeType === "COHORT";
  ```
  Route-level aggregates cannot be cited when evaluating a specific flight number with identical cabin attributes. Furthermore, if `currentPrice >= medianPrice * 1.35`, advice must switch to `WAIT_AND_WATCH` with 0.85 confidence to protect users from buying at the top of price surges.
- *Locked Invariant in G4*: In `src/domain/farely/buyWaitGuidance.ts`, ensure all rationales branch on `scopeType` and handle surge thresholds. Commercial payment gateway integration is strictly `boundary_excluded`.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G79)

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

---

## SECTION E: HERMETIC WORK PACKAGES (WP01..WP03)

### WP01: `WP01-DATA-ECONOMICS-MARGINAL-BOUNDS`
- **Files**: `src/domain/farely/dataEconomics.ts`, `src/domain/farely/dataEconomics.test.ts`
- **Action**: Enforce whole-integer divisor clamping, integer scope clamping, non-negative cost clamping, integer subscribers, and rounded whole VND marginal valuations.
- **Command**: `npx vitest run src/domain/farely/dataEconomics.test.ts`

### WP02: `WP02-BUY-WAIT-DATE-PARSING-SANITY`
- **Files**: `src/domain/farely/buyWaitGuidance.ts`, `src/domain/farely/buyWaitGuidance.test.ts`
- **Action**: Sanitize departure and evaluation date timestamps, reject past flights (`daysUntilDeparture < 0`), and handle flat price cohorts (`isFlatPrice`) safely.
- **Command**: `npx vitest run src/domain/farely/buyWaitGuidance.test.ts`

### WP03: `WP03-BOOKING-URL-IATA-CODE-SANITIZATION`
- **Files**: `src/app/lib/bookingUrls.ts`, `src/app/lib/bookingUrls.test.ts`
- **Action**: Sanitize 3-letter IATA alphanumeric airport codes, enforce integer passenger decomposition (`Math.floor(Math.max(1, adults))`), numeric date sanitization (`replace(/\D/g, '')`), and chronological round-trip date assertion.
- **Command**: `npx vitest run src/app/lib/bookingUrls.test.ts`

---

## SECTION K: 12-LENS CONVERGENCE MATRIX
- **L01 (Ingestion & Schema Integrity)**: Enforced via `src/app/lib/bookingUrls.ts`.
- **L02 (Price Anomaly & Algorithmic Rigor)**: Enforced via `src/domain/farely/dataEconomics.ts`.
- **L03 (True-Cost & Ancillary Transparency)**: Enforced via `src/domain/farely/buyWaitGuidance.ts`.
- **L04 (Anti-Abuse & Rate Limiting)**: Enforced via `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`.
- **L05 (High Concurrency & Resilience)**: Enforced via `supabase/functions/_shared/flight-search.ts`.
- **L06 (PWA Offline & Client Freshness)**: Enforced via `src/app/pages/DealsPage.tsx` and `src/domain/farely/pwaOfflineFreshness.ts`.
- **L07 (Observability & Production SRE)**: Enforced via `src/app/lib/analytics.ts`.
- **L08 (Zero-Downtime DB Migrations)**: Enforced via `scripts/verify-certification-integrity.node-test.mjs`.
- **L09 (Zero-Mock Testing & Proof Hierarchy)**: Enforced via `scripts/verify-certification-integrity.node-test.mjs`.
- **L10 (Contract Immutability & Anti-Shrinkage)**: Enforced via `scripts/acceptance-anti-shrinkage.node-test.mjs`.
- **L11 (Transactional Execution Safety)**: Enforced via `scripts/convergence/transactional-task-manager.mjs`.
- **L12 (Audit & Autonomous Watchdog)**: Enforced via `scripts/convergence/watchdog-convergence.mjs`.
