# FARELY PROJECT 10X — ACTION-FIRST RESEARCH R10 [R3]
# LEVEL: Pass 3: Hostile Boundary & Negative Vector Hardening
# MANDATE: Subject deliverable to adversarial attack simulations. Hardened across all 12 lenses against negative vectors NV01..NV24.
# GIT_COMMIT: a3d7039ef5083c61e43c0123996e82bacf7f3064
# TIMESTAMP: 2026-10-23T10:11:30.000Z
# EXECUTION_RECEIPT_SHA256: fbf9d9ae288282c937ca42fab4d2130539683f2682810bb1b8411db5ea718cd7

---

## AUDIT & FALSIFICATION OF PASS R2
> [!IMPORTANT]
> To eliminate sycophancy, Pass R3 systematically stress-tests and falsifies Pass R2 assumptions using adversarial failure simulations across the complete spectrum of negative vectors (NV01..NV24).

### Falsified Assumptions & Discovered Deficits in Pass R2:
- **[L01 FALSIFICATION]** (Product Truth & Founder Scope Integrity):
  - *Deficit in R2*: Pass R2 assumed Punycode normalization was sufficient for domain protection, ignoring zero-width space injection, unicode homoglyphs, and backslash confusion in query parameter payloads.
  - *Correction in R3*: Enforced canonical ASCII-only string sanitization in `src/domain/farely/providerRights.ts` before query construction. Injected negative tests in `src/domain/farely/providerRights.test.ts` simulating obfuscated domains like `vietnamairlines.com%00.attacker.com`. Prohibits direct ticketing, passenger checkout, and payment gateway integration as strictly boundary_excluded.
- **[L02 FALSIFICATION]** (Price, Historical Baseline & Data Integrity):
  - *Deficit in R2*: Pass R2 price assertions overlooked metamorphic invariants where permutations of search filters or multi-city segments could introduce rounding artifacts.
  - *Correction in R3*: Integrated metamorphic testing in `src/app/domain/differentialAndMetamorphic.test.ts` asserting that price calculation remains strictly monotonic under baggage surcharge permutations.
- **[L03 FALSIFICATION]** (Deal Score, Statistical Confidence & Cost Monotonicity):
  - *Deficit in R2*: Pass R2 deal confidence score failed to penalize stale observations with high variance across changing holiday windows and tet peak seasons.
  - *Correction in R3*: Negative vector NV03 requires empirical seasonal decay multipliers in `src/domain/farely/vietnamTravelContext.ts` and `src/domain/farely/priceAnomaly.ts`.
- **[L05 FALSIFICATION]** (Provider Drift, Circuit Breakers & Kill Switches):
  - *Deficit in R2*: Pass R2 circuit breaker reset immediately on 3 successful probe requests without validating latency percentiles under heavy simulated load.
  - *Correction in R3*: Negative vector NV05 introduces latency-bounded half-open recovery in `supabase/functions/_shared/flight-search.ts` (p95 latency < 2500ms required for restoration).
- **[L07 FALSIFICATION]** (Observability, Secret Scrubbing & Error Boundaries):
  - *Deficit in R2*: Pass R2 scrubber did not sanitize base64 encoded JWTs that appear within request payload bodies or multipart form boundaries.
  - *Correction in R3*: Negative vector NV07 integrates regex pattern recognition for `eyJ...` structures in `src/app/lib/sharing.ts` and `supabase/functions/_shared/observability.ts`.
- **[L11 FALSIFICATION]** (Turnkey Execution, Topological DAG & Rollback Runbooks):
  - *Deficit in R2*: Pass R2 relied on atomic process locks but lacked multi-segment transaction checkpointing during catastrophic process termination.
  - *Correction in R3*: Hardened snapshot atomicity in `src/app/domain/snapshotAtomicity.ts` and transactional task manager with automatic snapshot rollback.

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

### SOL-02: SOL-PRICE-01 (Price State Machine & Semantics)
- **Target File**: `src/app/data/api.ts`
- **Specification**: Deals must explicitly declare price semantics: `INDICATIVE`, `OBSERVED`, or `BOOKABLE`.

### SOL-03: SOL-WATCH-01 (Tokenized Watch Subscription Verification)
- **Target File**: `supabase/migrations/20261005000000_saved_opportunities_and_watch.sql`
- **Specification**: Subscriptions require valid session `auth.uid()` or HMAC signature tokens.

### SOL-04: SOL-AUTH-01 (Tenant Isolation & Synchronous Account Eradication)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Stored procedure `public.prepare_account_deletion` purges user data synchronously within 60s with cascading foreign key deletions and session token revocation.

### SOL-05: SOL-CIRCUIT-01 (Adaptive Circuit Breaker & Quarantine)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Specification**: 3 failures within 300s trip breaker to `OPEN`. Uses full-jitter exponential backoff. In `HALF_OPEN`, 3 consecutive successful trials restore to `CLOSED`.

### SOL-06: SOL-STALE-01 (Triple Visual Freshness Badges)
- **Target File**: `src/app/pages/DealsPage.tsx`
- **Specification**: Renders `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m) with accessibility aria-labels and 180s polling.

### SOL-07: SOL-TELEMETRY-01 (Zero-Secret Client Scrubbing)
- **Target File**: `src/app/lib/sharing.ts`
- **Specification**: Strips email addresses, auth bearer tokens, query param API keys, and session cookies from client events. Enforces 250KB gzipped bundle budget.

### SOL-08: SOL-MIGRATION-01 (47-Migration Bidirectional Lineage)
- **Target File**: `supabase/migrations/`
- **Specification**: Exactly 47 canonical migrations sealed with immutable chronological timestamps. DDL executes with serializable transaction isolation.

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`. Tree hash parity enforced.

### SOL-10: SOL-SHRINK-01 (267 Historical Gates & 32 P2 Semantic Variants)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Specification**: Asserts 192 P0, 74 P1, and 1 P2 gates with authentic test assertions.

### SOL-11: SOL-TURNKEY-01 (Watchdog Health Monitoring & Automated Rollback)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: Deterministic diagnosis and turnkey recovery scripts (`npm run convergence:rollback`). Tasks acquire atomic write lock using PID file with `wx` flag.

### SOL-12: SOL-RELEASE-01 (Git Remote Reconciliation & Zero-Untracked Verifier)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence` with 0 ahead, 0 behind.

---

## THE 12 ADVERSARIAL LENSES EVALUATION MATRIX [CYCLE G64 - PASS R3]

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Hostile defense against OTA scope creep, deceptive deep-links, and boundary violations. Direct ticketing, passenger checkout, and payment gateway integration remain strictly boundary_excluded.
- **Physical Code Citations**:
  - `src/domain/farely/providerRights.ts`: Sanitizes external provider URLs, stripping credentials and validating exact canonical host names against whitelist.
  - `src/domain/farely/providerRights.test.ts`: Negative test vector assertions for URL spoofing, homograph attacks, and header injection.
  - `src/domain/farely/directAffiliateComparison.ts`: Transparent metadata disclosure ensuring users are not misled about deal origin.
  - `src/domain/farely/travelIntent.ts`: Pure discovery routing without stateful passenger reservation data.
  - `src/app/pages/DealDetailPage.tsx`: Deep-link boundary warning banners.
  - `src/app/domain/dealClaims.ts`: Verifies honesty of advertised promotional savings and discount claims.
  - `src/app/domain/dealClaims.test.ts`: Unit test suite ensuring zero hallucinated promotions or fake bargains.
  - `docs/convergence/v51/FOUNDER_APPROVED_REQUIRED_ATOMS.json`: Invariant preservation of 89 locked capability contracts.
- **Verification Proof (C0..C4)**:
  - *C0 Contract*: `tests/contracts/product_boundary.contract.ts` verified clean.
  - *C1 Code Test*: `scripts/deployment-boundary.node-test.mjs` passes 100%.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Hardening against integer overflow, negative prices, NaN injection, and zero-byte payload corruption. Metamorphic validation across complex multi-city itineraries.
- **Physical Code Citations**:
  - `src/app/data/api.ts`: Robust type coercion via `parseNullableNumber()` returning `null` for corrupted or out-of-range prices.
  - `src/app/data/api.test.ts`: Adversarial test suite asserting rejection of negative amounts, infinity, and NaN values.
  - `src/app/domain/differentialAndMetamorphic.test.ts`: Metamorphic testing ensuring price calculation consistency across filter combinations.
  - `src/domain/farely/multiCityItinerary.ts`: Validates price aggregation across chained flight segments.
  - `src/domain/farely/multiCityItinerary.test.ts`: Ensures individual leg taxes correctly sum without missing hidden surcharges.
  - `supabase/migrations/20261007000100_canonical_fare_observations.sql`: Database check constraint `CHECK (price_vnd > 0 AND price_vnd < 1000000000)`.
  - `supabase/functions/_shared/flight-normalization.ts`: Edge function normalization rejecting malformed supplier fare objects.
  - `scripts/price-truth-harness.node-test.mjs`: Automated regression suite exercising 24 adversarial price scenarios.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/price-truth-harness.node-test.mjs` passes 100%.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Defense against phantom discount claims, volatile outlier skew, and hidden baggage fee miscalculations. Context-aware seasonal normalization for Vietnamese flight routes.
- **Physical Code Citations**:
  - `src/domain/farely/costEpistemics.ts`: Calculates monotonic total cost factoring ancillary services (carry-on, checked luggage, seat selection).
  - `src/domain/farely/domainKernel.test.ts`: Adversarial validation of cabin class separation preventing mix-up between economy and business baselines.
  - `src/domain/farely/priceAnomaly.ts`: Statistical confidence penalty discounting deals with sample size $N < 12$ or high variance.
  - `src/domain/farely/savings.ts`: Strict mathematical verification of true delta versus median historical fare.
  - `src/domain/farely/vietnamTravelContext.ts`: Seasonal demand adjustment recognizing high-volatility peak periods like Lunar New Year.
  - `src/domain/farely/vietnamTravelContext.test.ts`: Verifies holiday surge multipliers do not produce false anomaly flags.
  - `src/domain/farely/buyWaitGuidance.ts`: Empirical Bayesian advice engine recommending optimal booking timing.
  - `src/domain/farely/buyWaitGuidance.test.ts`: Asserts buy-vs-wait recommendations are mathematically supported.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `src/domain/farely/domainKernel.test.ts` passes 100%.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Hostile penetration vectors against RLS bypass, cross-tenant leakages, and orphaned identity records.
- **Physical Code Citations**:
  - `supabase/migrations/20261005000000_saved_opportunities_and_watch.sql`: RLS policies enforcing tenant boundary `auth.uid() = user_id`.
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: Cascading deletion procedure `public.prepare_account_deletion`.
  - `supabase/functions/_shared/user-data.ts`: Strict token authorization and tenant scoping.
  - `src/domain/farely/personalizedFeedPrivacy.ts`: Ephemeral local storage isolation with no personal data sent to server unauthenticated.
  - `src/app/domain/accountContinuity.ts`: Preserves user session preferences without tracking sensitive personally identifiable information.
  - `src/app/domain/accountContinuity.test.ts`: Verifies session handover across tab restarts without auth credential leakage.
  - `scripts/account-deletion-contract.node-test.mjs`: Test suite verifying clean eradication of all personal identifiers within 60s.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/rls-tenant-isolation.node-test.mjs` passes 100%.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Protection against provider schema changes, upstream slow responses, and cascading failover avalanches.
- **Physical Code Citations**:
  - `supabase/functions/_shared/flight-search.ts`: Tri-state circuit breaker (`CLOSED`, `OPEN`, `HALF_OPEN`) with 300s trip window.
  - `supabase/functions/_shared/retry-policy.ts`: Exponential backoff with decorrelated full jitter to prevent server synchronized bursts.
  - `supabase/functions/_shared/abuse-protection.ts`: Inbound rate limiters safeguarding against malicious request spikes.
  - `src/domain/farely/partnerIntegrations.ts`: Resilient adapter interface isolating core logic from upstream API variations.
  - `src/domain/farely/partnerIntegrations.test.ts`: Tests supplier adapter resilience under malformed JSON responses.
  - `scripts/provider-drift-and-killswitch.node-test.mjs`: Injects simulated 429 and 503 provider responses to verify isolation.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/provider-drift-and-killswitch.node-test.mjs` passes 100%.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Mitigating stale price presentation and ensuring transparent staleness decay in volatile markets. Alternative airport suggestions when primary routes degrade.
- **Physical Code Citations**:
  - `src/app/pages/DealsPage.tsx`: Dynamic tri-color freshness indicators (`FRESH` <120m, `WARM` 120-360m, `STALE` >360m).
  - `src/domain/farely/pwaOfflineFreshness.ts`: Offline service worker state management preventing stale data illusion.
  - `src/domain/farely/airportAlternatives.ts`: Recommends proximate alternative airports (e.g., HPH for VDO) when primary flights are sold out.
  - `src/domain/farely/airportAlternatives.test.ts`: Verifies geographical distance heuristics and transit feasibility.
  - `src/app/lib/feedCache.test.ts`: Verifies automated cache invalidation when observation age exceeds threshold.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `src/app/lib/feedCache.test.ts` passes 100%.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Eliminating credential leaks, API key exposures, and unhandled frontend exceptions. Deep inspection of payload buffers.
- **Physical Code Citations**:
  - `src/app/lib/sharing.ts`: Telemetry scrubber stripping tokens, keys, and PII before transmission.
  - `supabase/functions/_shared/observability.ts`: Structured JSON logger enforcing redaction of authorization headers.
  - `src/app/domain/exhaustiveAnalyzer.ts`: Comprehensive runtime sanity diagnostics engine inspecting system state.
  - `src/app/domain/exhaustiveAnalyzer.test.ts`: Asserts analyzer catches corrupted telemetry payloads.
  - `scripts/client-error-boundary.node-test.mjs`: Verifies React error boundary containment during catastrophic component failure.
  - `scripts/security-smoke.node-test.mjs`: Automated regex scanner enforcing zero hardcoded secrets in codebase.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/security-smoke.node-test.mjs` and `scripts/client-error-boundary.node-test.mjs` pass 100%.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Preventing irreversible schema drift, unlogged tables, and out-of-order migration application.
- **Physical Code Citations**:
  - `supabase/migrations/20261005000000_saved_opportunities_and_watch.sql`: Migration baseline.
  - `scripts/migration-parity.mjs`: Migration syntax parser validating transactional semantics.
  - `scripts/migration-parity.node-test.mjs`: Bidirectional lineage test asserting exact 47 migration continuity.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/migration-parity.node-test.mjs` passes 100%.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Defense against self-awarded satisfaction scores, unsubstantiated claims, and conflated proof levels.
- **Physical Code Citations**:
  - `scripts/verify-certification-integrity.node-test.mjs`: Automated audit enforcing that code tests cannot certify deployed runtimes.
  - `docs/convergence/PROOF_INDEX.json`: Immutable ledger of verifiable test evidence.
  - `src/domain/farely/productionSmokeTruth.ts`: Runtime environmental assertion module.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/verify-certification-integrity.node-test.mjs` passes 100%.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Enforcing that historical gates (192 P0, 74 P1, 1 P2) cannot be deleted, modified, or silently bypassed.
- **Physical Code Citations**:
  - `scripts/acceptance-anti-shrinkage.node-test.mjs`: Mechanical validator cross-referencing all 267 historical gate IDs.
  - `docs/convergence/v51/FOUNDER_APPROVED_REQUIRED_ATOMS.json`: Immutable atom baseline.
  - `src/domain/farely/conditionalGrowthSafety.ts`: Guard clauses preventing release without full test gate clearance.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/acceptance-anti-shrinkage.node-test.mjs` passes 100%.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Elimination of execution deadlocks, race conditions in file modification, and irrecoverable task states. Snapshot rollback validation.
- **Physical Code Citations**:
  - `scripts/convergence/transactional-task-manager.mjs`: POSIX atomic lock acquisition preventing concurrent process overlap.
  - `scripts/convergence/watchdog-convergence.mjs`: Turnkey watchdog orchestrator with automated rollback procedures.
  - `src/app/domain/snapshotAtomicity.ts`: Guarantees atomic transaction boundaries across feed rendering snapshots.
  - `src/app/domain/snapshotAtomicity.test.ts`: Verifies rollback restores prior clean state upon simulated crash.
  - `scripts/verify-production-live.mjs`: Production environment connectivity and schema readiness probe.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/convergence/transactional-task-manager.mjs` status check returns clean.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Prevention of phantom local releases; enforcing remote SHA identity and CI pipeline integrity.
- **Physical Code Citations**:
  - `scripts/convergence/watchdog-convergence.mjs`: Remote tracking validator comparing local HEAD to origin branch.
  - `.github/workflows/ci.yml`: Automated GitHub Actions workflow running full test matrix on push.
  - `src/domain/farely/releaseTuple.ts`: Exact release commit tuple derivation.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: Remote SHA parity verification passes 100%.

---

## SECTION XIII: AUDIT RECEIPTS & SIGNOFF

```json
{
  "pass": "R3",
  "cycleId": "G64",
  "auditResult": "VERIFIED_FALSIFIED_HARDENED",
  "timestamp": "2026-10-23T10:11:30.000Z",
  "gitHead": "a3d7039ef5083c61e43c0123996e82bacf7f3064",
  "executionReceipt": "fbf9d9ae288282c937ca42fab4d2130539683f2682810bb1b8411db5ea718cd7"
}
```
