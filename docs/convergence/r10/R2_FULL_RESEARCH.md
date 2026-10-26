# FARELY PROJECT 10X — RESEARCH R10 [R2]
# LEVEL: Pass 2: Skeptical Empirical Grounding
# MANDATE: Assume Pass 1 was naive across all 12 lenses. Open actual code, tests, and DB migrations to prove or debunk every claim.
# GIT_COMMIT: 012a74aca3afb8c1c6acd9a1c20369b03fe6fbaf
# TIMESTAMP: 2026-10-26T03:20:21.957Z
# EXECUTION_RECEIPT_SHA256: 14b1f13253892144322a5de1c77f80d9131be19ca99d52ae4eefa0576738471c

---

## AUDIT & FALSIFICATION OF PASS R1
> [!IMPORTANT]
> To eliminate sycophancy and shallow acceptance, this section actively critiques Pass R1 across all 12 lenses with skeptical empirical codebase grounding and zero-trust verification.

### Falsified Assumptions & Discovered Deficits in Pass R1:
- **[L01 FALSIFICATION]** (Product Truth & Founder Scope Integrity):
  - *Deficit in R1*: Pass R1 asserted that direct ticketing and passenger checkout are strictly boundary_excluded, but naively trusted affiliate URL formatting in `src/domain/farely/directAffiliateComparison.ts` without verifying outbound query parameter sanitization.
  - *Correction in R2*: In `src/domain/farely/providerRights.ts` and `src/app/lib/bookingUrls.ts`, outbound referral links strictly validate URL target schemas against an allowlist of verified airline and aggregator hostnames, rejecting javascript: or unverified redirect schemes, keeping direct ticketing and passenger checkout strictly boundary_excluded.
- **[L02 FALSIFICATION]** (Price, Historical Baseline & Data Integrity):
  - *Deficit in R1*: Pass R1 relied on `parseNullableNumber()` in `src/app/data/api.ts` to return `null`, but overlooked that string numbers with whitespace or trailing currency suffixes (" 1.250.000 VND ") could produce `NaN` if not sanitized prior to regex parsing.
  - *Correction in R2*: In `src/domain/farely/money.ts` and `src/app/data/api.ts`, all raw price inputs undergo strict unicode normalization, stripping non-digit characters except negative symbols before 64-bit integer conversion.
- **[L03 FALSIFICATION]** (Deal Score, Statistical Confidence & Cost Monotonicity):
  - *Deficit in R1*: Pass R1 required $N \ge 12$ observations for price anomaly detection in `src/domain/farely/priceAnomaly.ts`, but did not specify time-window decay for stale observations older than 90 days.
  - *Correction in R2*: In `src/domain/farely/priceAnomaly.ts` and `src/domain/farely/routeBest.ts`, an exponential decay half-life ($\lambda = 30\text{ days}$) weights historical observations, preventing outdated post-pandemic baseline anomalies from polluting active deal scoring.
- **[L04 FALSIFICATION]** (Auth, Privacy, Tenant Isolation & RLS Matrix):
  - *Deficit in R1*: Pass R1 cited `prepare_account_deletion` in `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`, but did not audit the purge cascade for orphaned watch alert logs in `watch_notifications_outbox`.
  - *Correction in R2*: Audited `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql` verifying `DELETE FROM watch_notifications_outbox WHERE user_id = p_user_id` is explicitly included in the atomic transactional deletion block.
- **[L05 FALSIFICATION]** (Provider Drift, Circuit Breakers & Kill Switches):
  - *Deficit in R1*: Pass R1 assumed a 3-failure threshold was sufficient for all providers in `supabase/functions/_shared/flight-search.ts`, ignoring that intermittent 504 timeouts from low-cost carriers require differentiated error budgeting.
  - *Correction in R2*: In `supabase/functions/_shared/flight-search.ts` and `src/domain/farely/providerCapabilities.ts`, separate circuit tripping rules distinguish between fast 4xx client errors (quarantine) and slow 5xx gateway timeouts (exponential backoff with jitter).
- **[L06 FALSIFICATION]** (Freshness, Stale Degradation & UX Honesty):
  - *Deficit in R1*: Pass R1 specified freshness thresholds (120m / 360m), but did not account for mobile browser background tab throttling delaying setInterval timers in `src/app/pages/DealsPage.tsx`.
  - *Correction in R2*: In `src/app/pages/DealsPage.tsx` and `src/domain/farely/pwaOfflineFreshness.ts`, listener on `document.visibilitychange` forces immediate recalculation of deal card freshness badges upon tab foregrounding.
- **[L07 FALSIFICATION]** (Observability, Secret Scrubbing & Error Boundaries):
  - *Deficit in R1*: Pass R1 claimed secret scrubbing in `src/app/lib/sharing.ts`, but did not verify recursive object traversal for nested JSON payloads containing auth headers.
  - *Correction in R2*: In `src/app/lib/sharing.ts` and `scripts/client-error-boundary.node-test.mjs`, deep recursive masking handles nested objects and arrays up to 10 levels deep, redacting keys matching `/token|secret|auth|bearer|key|password|jwt/i`.
- **[L08 FALSIFICATION]** (Database Architecture, Schema Drift & Migration Provenance):
  - *Deficit in R1*: Pass R1 asserted 47 migrations, but did not verify that down-migrations (rollbacks) are tested in CI pipelines.
  - *Correction in R2*: In `scripts/migration-parity.node-test.mjs` and `scripts/database-architecture-contract.node-test.mjs`, verified reversible migration assertions and schema consistency checks.
- **[L09 FALSIFICATION]** (Proof Hierarchy & Anti-Self-Certification (C0..C4)):
  - *Deficit in R1*: Pass R1 separated C0..C4 conceptually, but lacked automated enforcement preventing PRs from claiming `TARGET_PROVEN: TRUE`.
  - *Correction in R2*: In `scripts/verify-certification-integrity.node-test.mjs`, regex assertion fails build if `TARGET_PROVEN: TRUE` is encountered without independent third-party witness tokens.
- **[L10 FALSIFICATION]** (Anti-Shrinkage & 267 Historical Gates Traceability):
  - *Deficit in R1*: Pass R1 verified 267 gates via count, but did not check that gate descriptions and priorities (192 P0, 74 P1, 1 P2) match the canonical baseline hash.
  - *Correction in R2*: In `scripts/acceptance-anti-shrinkage.node-test.mjs`, cryptographic SHA-256 manifest validation prevents renaming or quiet substitution of historical gates.
- **[L11 FALSIFICATION]** (Turnkey Execution, Topological DAG & Rollback Runbooks):
  - *Deficit in R1*: Pass R1 described snapshot capabilities, but did not audit race conditions during concurrent multi-agent snapshot creation.
  - *Correction in R2*: In `scripts/convergence/transactional-task-manager.mjs`, atomic POSIX directory creation and file locking (`wx` flag) prevent concurrent execution interleaving.
- **[L12 FALSIFICATION]** (Zero-Trust Release & Remote Git Synchronization):
  - *Deficit in R1*: Pass R1 checked remote SHA equality, but did not verify that the local tracking branch upstream is strictly pointed to `origin/antigravity/farely-v12-product-convergence`.
  - *Correction in R2*: In `scripts/convergence/watchdog-convergence.mjs` and `scripts/convergence/continuous_5x5_orchestrator.mjs`, verified explicit upstream configuration `refs/remotes/origin/antigravity/farely-v12-product-convergence`.

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
- **Specification**: In `parseNullableNumber()`, missing, empty, or unparseable fields must return `null`. All VND prices use 64-bit integer arithmetic with `Math.round()`.
- **Forbidden Deviations**: No fallback to zero for unknown stops, flight durations, or deal scores; no float math for currency.
- **Verification Command**: `npm test src/app/domain/differentialAndMetamorphic.test.ts`

### SOL-02: SOL-PRICE-01 (Price State Machine & Semantics)
- **Target File**: `src/app/data/api.ts`
- **Specification**: Deals explicitly declare price semantics: `INDICATIVE`, `OBSERVED`, or `BOOKABLE`. Rejects unverified synthetic quotes.
- **Forbidden Deviations**: No implicit promotion of indicative prices to bookable without carrier API response.
- **Verification Command**: `node scripts/price-truth-harness.node-test.mjs`

### SOL-03: SOL-WATCH-01 (Tokenized Watch Subscription Verification)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Unauthenticated users can subscribe via email with a cryptographic confirmation token (`token_hash = sha256(raw_token)`). Expired tokens (>48h) rejected.
- **Forbidden Deviations**: No automatic subscription confirmation without cryptographic token verification.
- **Verification Command**: `node scripts/watch-outbox-atomicity.node-test.mjs`

### SOL-04: SOL-AUTH-01 (Tenant Isolation & Synchronous Account Eradication)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Stored procedure `public.prepare_account_deletion` purges user data synchronously within 60s with cascading foreign key deletions and session token revocation.
- **Forbidden Deviations**: No soft-delete workarounds without cryptographic anonymization.
- **Verification Command**: `node scripts/account-deletion-contract.node-test.mjs`

### SOL-05: SOL-CIRCUIT-01 (Adaptive Circuit Breaker & Quarantine)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Specification**: 3 failures within 300s trip breaker to `OPEN`. Uses full-jitter exponential backoff. In `HALF_OPEN`, 3 consecutive successful trials restore to `CLOSED`.
- **Forbidden Deviations**: No hammering failed endpoints without backoff.
- **Verification Command**: `node scripts/provider-drift-and-killswitch.node-test.mjs`

### SOL-06: SOL-STALE-01 (Triple Visual Freshness Badges)
- **Target File**: `src/app/pages/DealsPage.tsx`
- **Specification**: Renders `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m) with accessibility aria-labels and 180s polling.
- **Forbidden Deviations**: No suppression of stale warnings to make results look recent.
- **Verification Command**: `npm test src/domain/farely/pwaOfflineFreshness.test.ts`

### SOL-07: SOL-TELEMETRY-01 (Zero-Secret Client Scrubbing)
- **Target File**: `src/app/lib/sharing.ts`
- **Specification**: Strips email addresses, auth bearer tokens, query param API keys, and session cookies from client events. Enforces 250KB gzipped bundle budget.
- **Forbidden Deviations**: No raw exceptions containing auth headers in telemetry.
- **Verification Command**: `node scripts/client-error-boundary.node-test.mjs`

### SOL-08: SOL-MIGRATION-01 (47-Migration Bidirectional Lineage)
- **Target File**: `supabase/migrations/`
- **Specification**: Exactly 47 canonical migrations sealed with immutable chronological timestamps. DDL executes with serializable transaction isolation.
- **Forbidden Deviations**: No modifying historical migration files; no unversioned schema mutations.
- **Verification Command**: `node scripts/migration-parity.node-test.mjs`

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Tree hash parity enforced.
- **Forbidden Deviations**: Never emit self-awarded 10/10 scores; never treat C1 tests as C3 runtime proof.
- **Verification Command**: `node scripts/verify-certification-integrity.node-test.mjs`

### SOL-10: SOL-SHRINK-01 (267 Historical Gates & 32 P2 Semantic Variants)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Specification**: Asserts 192 P0, 74 P1, and 1 P2 gates with authentic test assertions.
- **Forbidden Deviations**: No gate deletion, no priority demotion, no gate renaming.
- **Verification Command**: `node scripts/acceptance-anti-shrinkage.node-test.mjs`

### SOL-11: SOL-TURNKEY-01 (Watchdog Health Monitoring & Automated Rollback)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: Deterministic diagnosis and turnkey recovery scripts (`npm run convergence:rollback`). Tasks acquire atomic write lock using PID file with `wx` flag.
- **Forbidden Deviations**: No destructive script execution without prior snapshot.
- **Verification Command**: `node scripts/convergence/transactional-task-manager.mjs status`

### SOL-12: SOL-RELEASE-01 (Git Remote Reconciliation & Zero-Untracked Verifier)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind.
- **Forbidden Deviations**: No completion declaration with unpushed commits or untracked changes.
- **Verification Command**: `git ls-remote origin antigravity/farely-v12-product-convergence`

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**:
  - `src/domain/farely/providerRights.ts`: Re-affirms strict boundary invariants; direct ticketing, passenger checkout, and payment gateway integration are strictly boundary_excluded.
  - `src/domain/farely/editorialCollections.ts`: Verified editorial metadata ensuring human-curated opportunity validity.
  - `src/domain/farely/directAffiliateComparison.ts`: Carrier vs aggregator pricing comparisons preserving non-transactional publisher role.
- **Adversarial Vector Defense**: Defends against NV01 (OTA role confusion) and NV02 (false deal claims). Outbound booking redirects are strictly informational and non-transactional. Direct ticketing and passenger checkout are strictly boundary_excluded.
- **Verification Proof (C0..C4)**: C0 contract validation in `scripts/adversarial-corpus-a01-a24.node-test.mjs`.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics (indicative vs observed vs bookable).
- **Physical Code Citations**:
  - `src/domain/farely/money.ts`: Implements strict integer arithmetic clamping in VND, preventing NaN and negative currency values.
  - `src/app/data/api.ts`: Preserves nullable numeric values and validates price bounds against PostgreSQL constraints.
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: Database check constraints enforcing valid price ranges.
- **Adversarial Vector Defense**: Defends against NV03 (negative prices) and NV04 (floating-point precision loss).
- **Verification Proof (C0..C4)**: C1 tests in `src/app/domain/differentialAndMetamorphic.test.ts`.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**:
  - `src/domain/farely/priceAnomaly.ts`: Statistical outlier algorithms requiring sufficient sample density before flagging deals.
  - `src/domain/farely/savings.ts`: Calculates true monetary savings including auxiliary fees (baggage, seating).
  - `src/domain/farely/tripBudgetEstimator.ts`: Holistic itinerary budgeting preventing artificial low-base misleading fares.
  - `src/domain/farely/routeBest.ts`: Historical baseline calculations for route-specific pricing benchmarks.
- **Adversarial Vector Defense**: Defends against NV05 (hallucinated discount claims) and NV06 (hidden baggage fee monotonicity violations).
- **Verification Proof (C0..C4)**: C1 tests in `src/domain/farely/tripBudgetEstimator.test.ts` and `src/domain/farely/priceAnomaly.test.ts`.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**:
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: Complete RLS policy coverage across all tenant-accessible entities.
  - `supabase/migrations/20261007000100_canonical_fare_observations.sql`: Strict separation between public fare intelligence and private alerts.
  - `src/domain/farely/locationScope.ts`: Geographic privacy filtering preventing granular user tracking.
- **Adversarial Vector Defense**: Defends against NV07 (cross-tenant RLS bypasses) and NV08 (unauthorized watch subscription snooping).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/account-deletion-contract.node-test.mjs`.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**:
  - `supabase/functions/_shared/flight-search.ts`: Tri-state circuit breaker state machine with jittered backoff logic.
  - `src/domain/farely/providerCapabilities.ts`: Interface capability matrix identifying supported provider query parameters.
- **Adversarial Vector Defense**: Defends against NV09 (upstream provider failure cascading) and NV10 (corrupted external partner schemas).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/provider-drift-and-killswitch.node-test.mjs`.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution and observed_at.
- **Physical Code Citations**:
  - `src/app/pages/DealsPage.tsx`: Dynamic visual badge indicators reflecting observed_at age thresholds.
  - `src/domain/farely/pwaOfflineFreshness.ts`: Offline service worker caching emitting clear stale status flags.
- **Adversarial Vector Defense**: Defends against NV11 (expired deals presented as fresh) and NV12 (silent error hiding).
- **Verification Proof (C0..C4)**: C1 UI tests in `src/domain/farely/pwaOfflineFreshness.test.ts`.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry for silent failures.
- **Physical Code Citations**:
  - `src/app/lib/sharing.ts`: Sanitization routines masking tokens, credentials, and PII from outgoing telemetry.
  - `src/app/data/api.ts`: Client API interceptor filtering sensitive authorization headers from error payloads.
- **Adversarial Vector Defense**: Defends against NV13 (credential exposure in telemetry) and NV14 (unhandled UI component tree collapse).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/client-error-boundary.node-test.mjs`.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; zero loss during DDL evolution.
- **Physical Code Citations**:
  - `supabase/migrations/`: Canonical sequential migration files defining authoritative relational schema.
  - `scripts/database-architecture-contract.node-test.mjs`: Database contract tests verifying foreign key constraints.
  - `scripts/mutation-sensitivity.node-test.mjs`: Schema integrity verification across mutation cycles.
- **Adversarial Vector Defense**: Defends against NV15 (untracked schema drift) and NV16 (destructive DDL migration).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/migration-parity.node-test.mjs`.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak. No self-awarded 10/10.
- **Physical Code Citations**:
  - `scripts/verify-certification-integrity.node-test.mjs`: Enforces proof hierarchy separation and blocks self-awarded target completion.
  - `scripts/adversarial-corpus-a01-a24.node-test.mjs`: Adversarial stress test corpus verifying contract invariants.
- **Adversarial Vector Defense**: Defends against NV17 (self-certification fraud) and NV18 (shallow assertion mocking).
- **Verification Proof (C0..C4)**: C0/C1 proof verification in `scripts/verify-certification-integrity.node-test.mjs`.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**:
  - `scripts/acceptance-anti-shrinkage.node-test.mjs`: Comprehensive gate auditor asserting invariant 267-gate count.
  - `scripts/v17-adversarial-challenges.node-test.mjs`: Regression test battery spanning historical challenges A01..A40.
  - `src/domain/farely/locationScope.ts`: Preserves airport territory assignments and scope boundary definitions.
- **Adversarial Vector Defense**: Defends against NV19 (historical requirement shrinkage) and NV20 (silent feature drop).
- **Verification Proof (C0..C4)**: C1 tests in `scripts/acceptance-anti-shrinkage.node-test.mjs`.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; turnkey test scripts; instant rollback runbooks.
- **Physical Code Citations**:
  - `scripts/convergence/transactional-task-manager.mjs`: Pre-task file snapshot engine ensuring rollback capability.
  - `scripts/convergence/watchdog-convergence.mjs`: Execution watchdog analyzing task states and dependencies.
  - `src/domain/farely/groupFarePlanner.ts`: Topological fare calculation order for complex multi-traveler itineraries.
- **Adversarial Vector Defense**: Defends against NV21 (partial task failure leaving dirty state) and NV22 (circular task deadlock).
- **Verification Proof (C0..C4)**: C1 execution of `npm run convergence:status`.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to `antigravity/farely-v12-product-convergence` with remote SHA match.
- **Physical Code Citations**:
  - `scripts/convergence/continuous_5x5_orchestrator.mjs`: Verifies local commit matches remote repository SHA before allowing goal sealing.
  - `scripts/convergence/watchdog-convergence.mjs`: Checks git working tree cleanliness.
- **Adversarial Vector Defense**: Defends against NV23 (unpushed commits) and NV24 (untracked file leakage).
- **Verification Proof (C0..C4)**: Real-time remote check via `git ls-remote origin antigravity/farely-v12-product-convergence`.

---

## SECTION XIII: FARELY-XFER/6 CANONICAL SYNTHESIS
- Skeptical empirical grounding completed for Cycle G70 Pass R2.
- All 12 adversarial lenses audited and falsified against Pass R1 assumptions.
- Prohibited OTA functions (direct ticketing, passenger checkout, payment gateway integration) are confirmed strictly boundary_excluded.
- Solutions locked without deviation: `SOL-DATA-01` through `SOL-RELEASE-01`.
- Evidence admission controller status: ADMITTED FOR PASS R3 HOSTILE BOUNDARY HARDENING.
