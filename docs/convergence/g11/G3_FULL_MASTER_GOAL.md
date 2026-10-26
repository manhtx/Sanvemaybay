# FARELY PROJECT 10X — MASTER GOAL G11 [G3]
# LEVEL: Pass 3: Anti-Fake-Done Turnkey Verification Oracles & Boundary Hardening
# MANDATE: Define concrete, zero-mock turnkey test oracles that fail closed on any fraudulent or incomplete implementation.
# GIT_COMMIT: 6a688e8b0e0f481b9434211775548c87730f00b7
# TIMESTAMP: 2026-10-26T10:36:15.000Z
# EXECUTION_RECEIPT_SHA256: e83e2e267226265db841b0f2b567a498a7089c0b8c21ca9b828249bbcf941ea7

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

### Falsification 1: L01 Port Evasion via Default Port Notation Variations
- *Deficits Identified in Pass G2*: Pass G2 tested port `'443'`, but omitted testing explicit default HTTP port `'80'` when evaluating insecure HTTP protocols, or port notation with whitespace. Furthermore, G2 did not specify an oracle asserting that non-numeric ports or ports like `:0` are properly handled.
- *Empirical Code Evidence*: In Node `URL`, passing `https://vietjetair.com:443/` produces `url.port === "443"`. Passing `https://vietjetair.com/` produces `url.port === ""`. If an implementation checks `url.port === "443"`, it might falsely reject standard URLs where `url.port === ""`!
- *Oracle Specification in G3*: In `src/app/lib/bookingUrls.test.ts`, the oracle MUST explicitly test both `https://vietjetair.com/` (empty port, valid) and `https://vietjetair.com:443/` (port 443, valid), while asserting that `https://vietjetair.com:8443/` and `https://user:pass@vietjetair.com/` return strictly `false`.

### Falsification 2: L03 Surcharge Calculation Zero-Leg and Infinity Poisoning
- *Deficits Identified in Pass G2*: Pass G2 clamped flight legs with `Math.max(1, flightLegs)`, but did not consider IEEE 754 `Infinity` or negative zero `-0` in `calculateCarrierLandedSurcharges`.
- *Empirical Code Evidence*: If scraper payload passes `flightLegs: Infinity`, `Math.max(1, Infinity)` yields `Infinity`, which propagates to `ticketingFee: Infinity`, wrecking subsequent JSON serialization.
- *Oracle Specification in G3*: In `src/domain/farely/tripBudgetEstimator.test.ts`, the oracle MUST pass `Infinity`, `NaN`, `-5`, and `0` to ensure that `safePassengers` and `safeLegs` always evaluate to safe positive finite integers $\ge 1$.

### Falsification 3: L07 Array Depth Poisoning via Deeply Nested Heterogeneous Arrays
- *Deficits Identified in Pass G2*: Pass G2 verified array element recursion, but did not assert that nested arrays within arrays (e.g. `[[[1, 2, 3]]]`) terminate at `[MaxDepthExceeded]` rather than crashing or infinite looping when encountering recursive array structures.
- *Empirical Code Evidence*: If an array contains circular references to itself (`const a = []; a.push(a);`), `replacer` must register arrays in `seen` WeakSet before traversing elements, otherwise cyclic arrays trigger stack overflow.
- *Oracle Specification in G3*: In `src/app/lib/analytics.test.ts`, the test oracle MUST pass circular arrays, 5-level deeply nested arrays, and arrays with > 50 elements, verifying truncation to `maxKeysPerLevel` and `[MaxDepthExceeded]`.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G76)

### SOL-01: SOL-DATA-01 (Null Preservation & Sample Size Threshold $N \ge 5$)
- **Target File**: `src/app/data/api.ts` & `src/domain/farely/priceAnomaly.ts`
- **Specification**: In `src/app/data/api.ts`, preserve nulls without coercion. In `src/domain/farely/priceAnomaly.ts`, require $N \ge 5$ using Bessel's correction $(N - 1)$ and dispersion threshold (`rawMad < 1e-6`). Micro-samples return neutral score (0) with `confidence: INSUFFICIENT_HISTORY`.
- **Forbidden Deviations**: No zero-inflation on missing fields; no float math for integer currency; commercial passenger checkout is strictly `boundary_excluded`.
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

## SECTION E: TURNKEY VERIFICATION ORACLES FOR CYCLE G76

### Oracle WP01: `src/app/lib/bookingUrls.test.ts`
```typescript
it("rejects booking URLs containing embedded userinfo credentials", () => {
  expect(isSafeOutboundBookingUrl("https://admin:pass@vietjetair.com/flight")).toBe(false);
  expect(isSafeOutboundBookingUrl("https://user@vietnamairlines.com/search")).toBe(false);
});

it("rejects booking URLs with custom non-standard ports", () => {
  expect(isSafeOutboundBookingUrl("https://vietjetair.com:8443/flight")).toBe(false);
  expect(isSafeOutboundBookingUrl("https://vietjetair.com:443/flight")).toBe(true);
  expect(isSafeOutboundBookingUrl("https://vietjetair.com/flight")).toBe(true);
});
```

### Oracle WP02: `src/domain/farely/tripBudgetEstimator.test.ts`
```typescript
it("sanitizes passenger and leg quantities in calculateCarrierLandedSurcharges", () => {
  const surcharges = calculateCarrierLandedSurcharges("VJ", 2.8, 2);
  expect(surcharges.baggageFee).toBe(350_000 * 2 * 2);
  expect(surcharges.ticketingFee).toBe(55_000 * 2 * 2);

  const fallback = calculateCarrierLandedSurcharges("VJ", NaN, -1);
  expect(fallback.baggageFee).toBe(350_000 * 1 * 1);
  expect(fallback.ticketingFee).toBe(55_000 * 1 * 1);
});
```

### Oracle WP03: `src/app/lib/analytics.test.ts`
```typescript
it("preserves array structures and propagates recursive depth in safeSerializeError", () => {
  const payload = {
    items: [1, 2, { nested: "value" }],
    deep: [[[["too deep"]]]]
  };
  const serialized = safeSerializeError(payload, 3, 50);
  const parsed = JSON.parse(serialized);
  expect(Array.isArray(parsed.items)).toBe(true);
  expect(parsed.items[2].nested).toBe("value");
  expect(parsed.deep[0][0][0]).toBe("[MaxDepthExceeded]");
});
```

---

## SECTION K: 12-LENS CONVERGENCE MATRIX
- **L01 (Ingestion & Schema Integrity)**: Verified by `src/app/lib/bookingUrls.test.ts`.
- **L02 (Price Anomaly & Algorithmic Rigor)**: Verified by `src/domain/farely/priceAnomaly.test.ts`.
- **L03 (True-Cost & Ancillary Transparency)**: Verified by `src/domain/farely/tripBudgetEstimator.test.ts`.
- **L04 (Anti-Abuse & Rate Limiting)**: Verified by `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`.
- **L05 (High Concurrency & Resilience)**: Verified by `supabase/functions/_shared/flight-search.ts`.
- **L06 (PWA Offline & Client Freshness)**: Verified by `src/app/pages/DealsPage.tsx` and `src/domain/farely/pwaOfflineFreshness.ts`.
- **L07 (Observability & Production SRE)**: Verified by `src/app/lib/analytics.test.ts`.
- **L08 (Zero-Downtime DB Migrations)**: Verified by `scripts/verify-certification-integrity.node-test.mjs`.
- **L09 (Zero-Mock Testing & Proof Hierarchy)**: Verified by `scripts/verify-certification-integrity.node-test.mjs`.
- **L10 (Contract Immutability & Anti-Shrinkage)**: Verified by `scripts/acceptance-anti-shrinkage.node-test.mjs`.
- **L11 (Transactional Execution Safety)**: Verified by `scripts/convergence/transactional-task-manager.mjs`.
- **L12 (Audit & Autonomous Watchdog)**: Verified by `scripts/convergence/watchdog-convergence.mjs`.
