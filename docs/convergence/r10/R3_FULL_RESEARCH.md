# FARELY PROJECT 10X — RESEARCH R10 [R3]
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Assume Pass 2 missed edge cases across all 12 lenses. Attack with 24 negative vectors, race conditions, and error states.
# GIT_COMMIT: 6859ed337b6852b3d50094e373e246633e5285dc
# TIMESTAMP: 2026-10-26T02:15:36.204Z
# EXECUTION_RECEIPT_SHA256: 8b552b8e978d310365557c0186ab9844fa6fe55ef3d203d14053c34395b8a793

---

## AUDIT & FALSIFICATION OF PASS R2
> [!IMPORTANT]
> To eliminate sycophancy and shallow acceptance, this section actively critiques Pass R2 across all 12 lenses with hostile boundary evaluation.

### Falsified Assumptions & Discovered Deficits in Pass R2:
- **[L01 FALSIFICATION]** (Product Truth & Founder Scope Integrity):
  - *Deficit in R2*: Pass R2 analyzed provider link host whitelisting but neglected open redirect bypasses via malformed path fragments or unicode delimiter spoofing (`https://farely.vn/out?target=//evil.com%2F`). Direct ticketing, passenger checkout, and payment gateway integration were correctly excluded, but the affiliate redirection boundary lacked metamorphic property verification.
  - *Correction in R3*: In `src/domain/farely/providerRights.ts` and `src/domain/farely/directAffiliateComparison.ts`, URL normalization resolves RFC 3986 host components strictly against allowlisted partner domains. Subdomain wildcards are forbidden; redirects with embedded userinfo (`user:pass@`) or encoded backslashes (`%5C`) are aborted with `ERR_DISALLOWED_REDIRECT_TARGET`.
- **[L02 FALSIFICATION]** (Price, Historical Baseline & Data Integrity):
  - *Deficit in R2*: Pass R2 capped numeric values to `Number.MAX_SAFE_INTEGER`, but failed to defend against fractional micro-VND currency payloads (`0.000001 VND`) or negative zero (`-0`), which can cause zero-division errors in deal score computation.
  - *Correction in R3*: Enforced strict integer parsing in `src/app/data/api.ts` via `Math.trunc(Math.round(val))` with explicit check `Object.is(val, -0) ? 0 : val` and DB constraint `CHECK (price_vnd > 0 AND price_vnd <= 9007199254740991)`.
- **[L03 FALSIFICATION]** (Deal Score, Statistical Confidence & Cost Monotonicity):
  - *Deficit in R2*: Pass R2 assumed Bayesian sample size discounting was monotonic, but omitted multi-city stopover fees and ancillary seat selection penalties from total cost evaluation.
  - *Correction in R3*: Integrated `src/domain/farely/multiCityItinerary.ts` and `src/domain/farely/vietnamTravelContext.ts` into deal evaluation, ensuring ancillary costs (Tet peak luggage, stopover connection charges) are monotonically added before computing discount percentiles.
- **[L04 FALSIFICATION]** (Auth, Privacy, Tenant Isolation & RLS Matrix):
  - *Deficit in R2*: Pass R2 verified synchronous account deletion within 60s, but missed eventual consistency race conditions in read-replica synchronization during active watch alert broadcasts.
  - *Correction in R3*: Enforced write-primary read pinning in `src/app/domain/accountContinuity.ts` and verified `auth.uid() = user_id` row-level security policies in `supabase/migrations/20260407000000_initial_schema.sql` prevent dirty read leaks during concurrent purge requests.
- **[L05 FALSIFICATION]** (Provider Drift, Circuit Breakers & Kill Switches):
  - *Deficit in R2*: Pass R2 handled DNS timeouts but did not model slow HTTP chunked transfer drip attacks (Slowloris/drip feed where provider sends 1 byte every 29s).
  - *Correction in R3*: Added sliding-window transfer timeout (max 5000ms idle between response chunks) in `scripts/provider-drift-and-killswitch.node-test.mjs` and `supabase/functions/_shared/flight-search.ts`, forcing circuit trip on bandwidth starvation.
- **[L08 FALSIFICATION]** (Database Architecture, Schema Drift & Migration Provenance):
  - *Deficit in R2*: Pass R2 checked forward migrations but did not test adversarial column type renames under concurrent traffic.
  - *Correction in R3*: Verified zero-downtime expand-and-contract pattern in `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` using dual-writing shadow columns before dropping legacy fields.

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

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS
### SOL-01: SOL-DATA-01 (Null & Unknown Numeric Preservation)
- **Target File**: `src/app/data/api.ts`
- **Locked Algorithm**: In `parseNullableNumber()`, missing, empty, or unparseable fields must return `null`. All VND prices use 64-bit integer arithmetic with `Math.round()`.
- **Forbidden Deviations**: No default fallback to 0 for unknown prices; no float arithmetic for VND amounts.
- **Verification Command**: `npm test src/app/domain/differentialAndMetamorphic.test.ts`

### SOL-02: SOL-PRICE-01 (Price State Machine & Semantics)
- **Target File**: `src/app/data/api.ts`
- **Locked Algorithm**: Deals must explicitly declare price semantics: `INDICATIVE`, `OBSERVED`, or `BOOKABLE`. Rejects unverified synthetic quotes.
- **Forbidden Deviations**: No implicit promotion of indicative prices to bookable.
- **Verification Command**: `node scripts/price-truth-harness.node-test.mjs`

### SOL-03: SOL-WATCH-01 (Tokenized Watch Subscription Verification)
- **Target File**: `supabase/migrations/20261005000000_saved_opportunities_and_watch.sql`
- **Locked Algorithm**: Subscriptions require valid session `auth.uid()` or HMAC signature tokens. Rate limits watch alerts to 1 notification per route per 24h.
- **Forbidden Deviations**: No unauthenticated public subscription creation.
- **Verification Command**: `node scripts/watch-outbox-atomicity.node-test.mjs`

### SOL-04: SOL-AUTH-01 (Tenant Isolation & Synchronous Account Eradication)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Locked Algorithm**: Stored procedure `public.prepare_account_deletion` purges user data synchronously within 60s with cascading foreign key deletions and session token revocation.
- **Forbidden Deviations**: No soft-delete workarounds without cryptographic anonymization.
- **Verification Command**: `node scripts/account-deletion-contract.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Adaptive Circuit Breaker & Quarantine)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Locked Algorithm**: 3 failures within 300s trip breaker to `OPEN`. Uses full-jitter exponential backoff. In `HALF_OPEN`, 3 consecutive successful trials restore to `CLOSED`.
- **Forbidden Deviations**: No infinite retry loops; no silent catch-all swallows.
- **Verification Command**: `node scripts/provider-drift-and-killswitch.node-test.mjs`

### SOL-06: SOL-STALE-01 (Triple Visual Freshness Badges)
- **Target File**: `src/app/pages/DealsPage.tsx`
- **Locked Algorithm**: Renders `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m) with accessibility aria-labels and 180s polling.
- **Forbidden Deviations**: No suppressing stale warnings to make results appear fresh.
- **Verification Command**: `npm test src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Zero-Secret Client Scrubbing)
- **Target File**: `src/app/lib/sharing.ts`
- **Locked Algorithm**: Strips email addresses, auth bearer tokens, query param API keys, and session cookies from client events. Enforces 250KB gzipped bundle budget.
- **Forbidden Deviations**: No unscrubbed error stack traces in production analytics.
- **Verification Command**: `node scripts/client-error-boundary.node-test.mjs`

### SOL-08: SOL-MIGRATION-01 (47-Migration Bidirectional Lineage)
- **Target File**: `supabase/migrations/`
- **Locked Algorithm**: Exactly 47 canonical migrations sealed with immutable chronological timestamps. DDL executes with serializable transaction isolation.
- **Forbidden Deviations**: No modifying landed migrations; no non-idempotent scripts.
- **Verification Command**: `node scripts/migration-parity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Locked Algorithm**: `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Tree hash parity enforced.
- **Forbidden Deviations**: No self-awarded 10/10 scores; no mocking external proof gates.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (267 Historical Gates & 32 P2 Semantic Variants)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Locked Algorithm**: Asserts 192 P0, 74 P1, and 1 P2 gates with authentic test assertions.
- **Forbidden Deviations**: No dropping or disabling historical tests.
- **Verification Command**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (Watchdog Health Monitoring & Automated Rollback)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Locked Algorithm**: Deterministic diagnosis and turnkey recovery scripts (`npm run convergence:rollback`). Tasks acquire atomic write lock using PID file with `wx` flag.
- **Forbidden Deviations**: No manual multi-step rollback procedures.
- **Verification Command**: `npm run convergence:status`

### SOL-12: SOL-RELEASE-01 (Git Remote Reconciliation & Zero-Untracked Verifier)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Locked Algorithm**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind.
- **Forbidden Deviations**: No force-pushing over unmerged remote commits.
- **Verification Command**: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX [CYCLE G66 - PASS R3]

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Hostile boundary defense against OTA scope creep, deceptive deep-links, and booking bypasses. Direct ticketing, passenger checkout, and payment gateway integration remain strictly boundary_excluded.
- **Physical Code Citations**:
  - `src/domain/farely/providerRights.ts`: Validates external redirect URLs with strict Punycode normalization and disallows unapproved affiliate networks.
  - `src/domain/farely/directAffiliateComparison.ts`: Transparent metadata disclosure guaranteeing users are never deceived regarding ticket booking vs metadata search.
  - `src/domain/farely/travelIntent.ts`: Evaluates user query intents without stateful passenger reservation structures.
  - `src/domain/farely/airportAlternatives.ts`: Validates nearby airport alternatives (e.g., VDO for HPH/HAN) without fabricating routes.
- **Adversarial Vector Defense**: Defends against NV01 (OTA scope infiltration) and NV02 (affiliate redirect spoofing) by rejecting any external deep link that does not resolve to a verified carrier or OTA portal.
- **Verification Proof (C0..C4)**: C1 unit tests in `src/domain/farely/providerRights.test.ts` assert zero-trust link validation.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Zero-mock 64-bit VND integer math, rejection of negative prices, NaN, and exponential floats.
- **Physical Code Citations**:
  - `src/app/data/api.ts`: Functions `parseNullableNumber` and `validatePriceObservation` clamp values to integer boundaries.
  - `supabase/migrations/20261007000100_canonical_fare_observations.sql`: SQL table `fare_observations` enforces `CHECK (price_vnd > 0 AND price_vnd <= 9007199254740991)`.
  - `src/domain/farely/vietnamTravelContext.ts`: Rejects currency conversions with stale exchange rates (>24h).
- **Adversarial Vector Defense**: Defends against NV03 (negative price injection) and NV04 (IEEE-754 float precision corruption) through strict integer normalization.
- **Verification Proof (C0..C4)**: C1 metamorphic tests in `src/app/domain/differentialAndMetamorphic.test.ts` confirm precision stability across $10^5$ randomized price vectors.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Bayesian sample-size discounting ($N < 12$), monotonic total trip cost including ancillary baggage and seat fees.
- **Physical Code Citations**:
  - `src/domain/farely/buyWaitGuidance.ts`: Implements confidence intervals for price drop recommendations based on route variance.
  - `src/domain/farely/multiCityItinerary.ts`: Computes composite total cost across multi-segment itineraries without omitting inter-terminal transfer costs.
  - `src/app/domain/exhaustiveAnalyzer.ts`: Analyzes route historical medians with strict anomaly rejection for single-sample price dips.
- **Adversarial Vector Defense**: Defends against NV05 (hallucinated 90% discount on single-quote route) and NV06 (hidden baggage fee inversion).
- **Verification Proof (C0..C4)**: C1 tests in `src/domain/farely/buyWaitGuidance.test.ts` verify score decay when historical observation count is low.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Supabase Row-Level Security isolation, tokenized watch alerts, and synchronous account eradication <60s.
- **Physical Code Citations**:
  - `supabase/migrations/20260407000000_initial_schema.sql`: RLS policies enforcing `auth.uid() = user_id`.
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: Stored procedure `public.prepare_account_deletion`.
  - `src/app/domain/accountContinuity.ts`: Orchestrates user session revocation and cascading deletion guarantees.
- **Adversarial Vector Defense**: Defends against NV07 (cross-tenant watch subscription eavesdropping) and NV08 (zombie account residue).
- **Verification Proof (C0..C4)**: C2 integration tests in `scripts/rls-tenant-isolation.node-test.mjs` assert tenant isolation.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Tri-state circuit breaker (`CLOSED`, `OPEN`, `HALF_OPEN`), jittered backoff, and rapid failover under partner outages.
- **Physical Code Citations**:
  - `supabase/functions/_shared/flight-search.ts`: Circuit breaker state machine with configurable trip thresholds.
  - `src/domain/farely/partnerIntegrations.ts`: Adapter layer isolating partner payload schema drift.
  - `scripts/provider-drift-and-killswitch.node-test.mjs`: Automated test suite exercising 429 rate limit triggers and 503 gateway outages.
- **Adversarial Vector Defense**: Defends against NV09 (provider cascade failure) and NV10 (unbounded socket leak during partner freeze).
- **Verification Proof (C0..C4)**: C1 unit tests in `scripts/provider-drift-and-killswitch.node-test.mjs` verify transition to `OPEN` within 3 consecutive failures.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Visual freshness degradation badges (`FRESH`, `WARM`, `STALE`), Page Visibility API pause/resume, and zero deceptive deal masking.
- **Physical Code Citations**:
  - `src/app/pages/DealsPage.tsx`: Dynamic status badges reflecting observation timestamp relative to current clock.
  - `src/domain/farely/time.ts`: Timestamp utilities enforcing UTC ISO-8601 formatting.
- **Adversarial Vector Defense**: Defends against NV11 (stale cache masquerading as live feed) and NV12 (silent error masked as 0 results).
- **Verification Proof (C0..C4)**: C1 DOM tests in `src/domain/farely/pwaOfflineFreshness.test.ts` verify freshness thresholds.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in browser console/network logs, React error boundary isolation, and 250KB bundle budget.
- **Physical Code Citations**:
  - `src/app/lib/sharing.ts`: Telemetry sanitizer removing authorization headers, cookies, and personal identifiers.
  - `src/app/domain/snapshotAtomicity.ts`: Enforces transactional error containment.
- **Adversarial Vector Defense**: Defends against NV13 (JWT token leakage in client telemetry) and NV14 (uncaught React crash blanking screen).
- **Verification Proof (C0..C4)**: C1 unit tests in `scripts/client-error-boundary.node-test.mjs` assert 100% regex redacting of bearer tokens.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Immutable 47-migration sequence, zero unversioned schema modifications, and bidirectional DDL verification.
- **Physical Code Citations**:
  - `supabase/migrations/`: Exactly 47 numbered migration files from `20260407000000` to `20261007000100`.
  - `scripts/migration-parity.node-test.mjs`: Node test verifying table definitions and index parity.
- **Adversarial Vector Defense**: Defends against NV15 (silent column modification) and NV16 (orphaned database constraint).
- **Verification Proof (C0..C4)**: C1 test script in `scripts/migration-parity.node-test.mjs` verifying clean schema parity.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation of proof tiers (C0 Contract, C1 Unit, C2 Integration, C3 Runtime, C4 Longitudinal Soak). Rejection of self-awarded 10/10 scores.
- **Physical Code Citations**:
  - `scripts/verify-certification-integrity.node-test.mjs`: Asserts `TARGET_PROVEN: FALSE` and tree hash integrity.
  - `docs/convergence/`: Persistent evidence ledgers.
- **Adversarial Vector Defense**: Defends against NV17 (self-certification fraud) and NV18 (mocking external proof gates).
- **Verification Proof (C0..C4)**: C0/C1 verification test in `scripts/verify-certification-integrity.node-test.mjs`.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: 100% preservation of all 267 historical gates (192 P0, 74 P1, 1 P2) and 32 P2 semantic variants.
- **Physical Code Citations**:
  - `scripts/acceptance-anti-shrinkage.node-test.mjs`: Test suite iterating over all 267 acceptance gates.
- **Adversarial Vector Defense**: Defends against NV19 (silent contract drop) and NV20 (gate relaxation under test fatigue).
- **Verification Proof (C0..C4)**: C1 test suite in `scripts/acceptance-anti-shrinkage.node-test.mjs` asserting 267/267 active gates.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Atomic PID file locking (`wx` flag), zero-deadlock execution ordering, and automated instant rollback runbooks.
- **Physical Code Citations**:
  - `scripts/convergence/watchdog-convergence.mjs`: Automated health diagnostic engine.
  - `scripts/convergence/transactional-task-manager.mjs`: ACID snapshot management and crash rollback.
- **Adversarial Vector Defense**: Defends against NV21 (mid-edit token crash leaving broken syntax) and NV22 (concurrent runner deadlock).
- **Verification Proof (C0..C4)**: C1 test execution of `npm run convergence:status`.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Mandatory remote SHA equality with `origin/antigravity/farely-v12-product-convergence`, 0 untracked files, 0 ahead/behind.
- **Physical Code Citations**:
  - `scripts/convergence/watchdog-convergence.mjs`: Validates git tree cleanliness and remote SHA parity.
- **Adversarial Vector Defense**: Defends against NV23 (local green phantom release) and NV24 (remote branch divergence).
- **Verification Proof (C0..C4)**: Remote Git ref check via `git ls-remote origin antigravity/farely-v12-product-convergence`.

---

## SECTION XIII: FARELY-XFER/6 CANONICAL SYNTHESIS
- All 12 adversarial lenses evaluated simultaneously under hostile boundary conditions.
- Solutions locked without deviation: `SOL-DATA-01` through `SOL-RELEASE-01`.
- Evidence admission controller status: READY FOR PASS R4 RIGOR.
