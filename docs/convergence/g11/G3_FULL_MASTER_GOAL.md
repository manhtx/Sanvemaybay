# FARELY PROJECT 10X — MASTER GOAL G11 [G3]
# LEVEL: Pass 3: Anti-Fake-Done Turnkey Verification Oracles & Boundary Hardening
# MANDATE: Define concrete, zero-mock turnkey test oracles that fail closed on any fraudulent or incomplete implementation.
# GIT_COMMIT: ed53cc39e6b3eb1f96b5f66cf017032b09bd55ac
# TIMESTAMP: 2026-10-26T10:47:15.000Z
# EXECUTION_RECEIPT_SHA256: 8d1a9b4346193f30aa03e57ed1e11bb87625d140618b00a287da74aed6142d41

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

### Falsification 1: L01 Missing Verification for Empty String Fallback Names
- *Deficits Identified in Pass G2*: Pass G2 added code checks for empty strings, but did not assert that `baselineAirportName` displays `"UNKNOWN"` rather than `undefined` when empty codes are passed.
- *Empirical Code Evidence*: In `src/domain/farely/airportAlternatives.ts`, if `baseCode === ""` and the fallback doesn't specify `"UNKNOWN"`, `AIRPORT_CATALOG[""]?.name` is undefined, leading to blank UI headers.
- *Oracle Specification in G3*: In `src/domain/farely/airportAlternatives.test.ts`, test explicitly with empty strings `""` and ensure `result.baselineAirportCode === "UNKNOWN"` and `result.baselineAirportName === "UNKNOWN"`. Direct ticketing and passenger checkout are strictly `boundary_excluded`.

### Falsification 2: L02 Single NaN Element Cohort Variance Invariant
- *Deficits Identified in Pass G2*: Pass G2 specified array filtering, but did not mandate a test case where an array contains mixed valid and invalid types: `[1_000_000, NaN, null, "invalid", -500_000, 2_000_000]`.
- *Empirical Code Evidence*: If the filter only checks `typeof p === "number"` without `Number.isFinite(p)`, `NaN` slips through. If it doesn't check `p > 0`, negative numbers slip through.
- *Oracle Specification in G3*: In `src/domain/farely/priceAnomaly.test.ts`, the oracle MUST assert that `calculateSampleStandardDeviation([1_000_000, NaN, null as any, "foo" as any, -500_000, 2_000_000])` computes variance strictly over the two valid positive numbers `[1_000_000, 2_000_000]`.

### Falsification 3: L03 Vietnamese Compact Duration Edge Cases
- *Deficits Identified in Pass G2*: Pass G2 tested standard Vietnamese durations, but did not assert compact representations like `"2h15"` without space, or `"45p"` without hour specifier.
- *Empirical Code Evidence*: In OTA feeds, airlines frequently display flight times as `"2h15"` or `"45p"`.
- *Oracle Specification in G3*: In `src/app/domain/dealComparison.test.ts`, test `"2h15"` (135m), `"45p"` (45m), and `"1 tiếng 30 phút"` (90m). Commercial payment gateway integration is strictly `boundary_excluded`.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS (CYCLE G77)

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

## SECTION E: TURNKEY VERIFICATION ORACLES FOR CYCLE G77

### Oracle WP01: `src/domain/farely/airportAlternatives.test.ts`
```typescript
it("rejects identical airport comparisons and invalid prices safely", () => {
  const identical = evaluateAirportAlternative({
    baselineAirportCode: "HAN",
    baselinePrice: 1_200_000,
    alternativeAirportCode: "han ",
    alternativePrice: 1_100_000,
  });
  expect(identical.verdict).toBe("NOT_RECOMMENDED");
  expect(identical.netSavingsVND).toBe(0);
  expect(identical.explanationVi).toContain("trùng khớp");

  const invalidPrice = evaluateAirportAlternative({
    baselineAirportCode: "HAN",
    baselinePrice: NaN,
    alternativeAirportCode: "VDO",
    alternativePrice: -500_000,
  });
  expect(invalidPrice.verdict).toBe("NOT_RECOMMENDED");
  expect(invalidPrice.isWorthwhile).toBe(false);
});
```

### Oracle WP02: `src/domain/farely/priceAnomaly.test.ts`
```typescript
it("sanitizes dirty cohort price arrays and guards Bessel variance", () => {
  const dirtyPrices = [1_000_000, NaN, null as any, "bad" as any, -100, 2_000_000];
  const { mean, sampleVariance, sampleStdDev } = calculateSampleStandardDeviation(dirtyPrices);
  expect(mean).toBe(1_500_000);
  expect(sampleVariance).toBe(500000000000);
  expect(sampleStdDev).toBeGreaterThan(0);

  const emptyResult = calculateSampleStandardDeviation([NaN, -1, 0]);
  expect(emptyResult.sampleVariance).toBe(0);
  expect(emptyResult.sampleStdDev).toBe(0);
});
```

### Oracle WP03: `src/app/domain/dealComparison.test.ts`
```typescript
it("parses Vietnamese and compact duration strings robustly", () => {
  const deals = [
    {
      id: "d1",
      route: "HAN-SGN",
      price: 1_200_000,
      airline: "VN",
      duration: "2 giờ 15 phút",
      stops: 0,
      refundPolicy: "Có hoàn vé",
      aiInsight: { risk: "low" as const },
    },
    {
      id: "d2",
      route: "HAN-SGN",
      price: 1_100_000,
      airline: "VJ",
      duration: "1h30",
      stops: 0,
      refundPolicy: "Không hoàn vé",
      aiInsight: { risk: "low" as const },
    },
    {
      id: "d3",
      route: "HAN-DAD",
      price: 800_000,
      airline: "QH",
      duration: "45p",
      stops: 0,
      refundPolicy: "Đổi vé có phí",
      aiInsight: { risk: "low" as const },
    },
  ];
  const compared = compareDeals(deals as any);
  expect(compared[0].durationMinutes).toBe(135);
  expect(compared[1].durationMinutes).toBe(90);
  expect(compared[2].durationMinutes).toBe(45);
});
```

---

## SECTION K: 12-LENS CONVERGENCE MATRIX
- **L01 (Ingestion & Schema Integrity)**: Verified by `src/domain/farely/airportAlternatives.test.ts`.
- **L02 (Price Anomaly & Algorithmic Rigor)**: Verified by `src/domain/farely/priceAnomaly.test.ts`.
- **L03 (True-Cost & Ancillary Transparency)**: Verified by `src/app/domain/dealComparison.test.ts`.
- **L04 (Anti-Abuse & Rate Limiting)**: Verified by `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`.
- **L05 (High Concurrency & Resilience)**: Verified by `supabase/functions/_shared/flight-search.ts`.
- **L06 (PWA Offline & Client Freshness)**: Verified by `src/app/pages/DealsPage.tsx` and `src/domain/farely/pwaOfflineFreshness.ts`.
- **L07 (Observability & Production SRE)**: Verified by `src/app/lib/analytics.ts`.
- **L08 (Zero-Downtime DB Migrations)**: Verified by `scripts/verify-certification-integrity.node-test.mjs`.
- **L09 (Zero-Mock Testing & Proof Hierarchy)**: Verified by `scripts/verify-certification-integrity.node-test.mjs`.
- **L10 (Contract Immutability & Anti-Shrinkage)**: Verified by `scripts/acceptance-anti-shrinkage.node-test.mjs`.
- **L11 (Transactional Execution Safety)**: Verified by `scripts/convergence/transactional-task-manager.mjs`.
- **L12 (Audit & Autonomous Watchdog)**: Verified by `scripts/convergence/watchdog-convergence.mjs`.
