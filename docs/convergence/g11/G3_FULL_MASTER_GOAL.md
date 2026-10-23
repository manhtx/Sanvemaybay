# FARELY PROJECT 10X — MASTER GOAL G11 [G3]
# LEVEL: Pass 3: Negative Vector Hardening & Adversarial Cage Proofing
# MANDATE: Attack the compiled prompt with negative vectors, hostile inputs, and invariant tests to prevent downstream executor degradation.
# GIT_COMMIT: 436564c7649d3027c03871e18dccb5c1b2a969c8
# TIMESTAMP: 2026-10-23T07:52:27.621Z
# EXECUTION_RECEIPT_SHA256: db1557d2208a2f8875eac626b2265be83a3c86d2a067e17105d373fd6b9c4905

---

## AUDIT & FALSIFICATION OF PASS G2
> [!IMPORTANT]
> To eliminate residual ambiguity, this section actively audits Pass G2 across all 12 lenses, demonstrating concrete negative vector boundaries and hardening the execution specifications.

### Falsified Assumptions & Discovered Deficits in Pass G2:

- **[L01 FALSIFICATION]** (Product Truth & Founder Scope Integrity):
  - *Deficit in G2*: G2 verified anchor tags, but did not guard against downstream executor replacing referral anchors with simulated modals or in-app payment forms.
  - *Correction in G3*: Sealed invariant in Section B: Any code diff adding `form`, `input[type="payment"]`, or billing modals triggers immediate rejection by the Evidence Admission Controller.

- **[L02 FALSIFICATION]** (Price, Historical Baseline & Data Integrity):
  - *Deficit in G2*: G2 specified `cleanPrice`, but did not specify integer truncation for decimal currencies like EUR or USD before conversion to VND.
  - *Correction in G3*: Sealed specification in Section D: Currency rates are multiplied by raw float, then passed to `Math.round()` with zero decimal fractional precision.

- **[L03 FALSIFICATION]** (Deal Score, Statistical Confidence & Cost Monotonicity):
  - *Deficit in G2*: G2 defined baggage baselines, but did not define handling for carriers offering complimentary baggage (e.g. Vietnam Airlines standard tickets).
  - *Correction in G3*: Sealed specification in Section D: If API explicitly confirms checked baggage is included, baggage surcharge is evaluated as 0 VND; if unspecified, the distance-band surcharge applies.

- **[L04 FALSIFICATION]** (Auth, Privacy, Tenant Isolation & RLS Matrix):
  - *Deficit in G2*: G2 specified `public.prepare_account_deletion`, but did not specify cascading delete rules on user alert history.
  - *Correction in G3*: Sealed specification in Section D: Foreign keys on `alerts` and `watch_subscriptions` enforce `ON DELETE CASCADE`.

- **[L05 FALSIFICATION]** (Provider Drift, Circuit Breakers & Kill Switches):
  - *Deficit in G2*: G2 specified 300s cooldown, but omitted half-open trial sample size.
  - *Correction in G3*: Sealed specification in Section D: In `HALF_OPEN` state, exactly 3 trial requests are admitted; if all 3 succeed, state returns to `CLOSED`.

- **[L06 FALSIFICATION]** (Freshness, Stale Degradation & UX Honesty):
  - *Deficit in G2*: G2 specified badge classes, but did not define aria-labels for screen reader accessibility.
  - *Correction in G3*: Sealed specification in Section D: Badges must render `aria-label="Thời điểm quan sát giá: [relative_time]"`.

- **[L07 FALSIFICATION]** (Observability, Secret Scrubbing & Error Boundaries):
  - *Deficit in G2*: G2 filtered auth tokens, but omitted query parameters containing API keys (e.g., `?apiKey=...` or `?key=...`).
  - *Correction in G3*: Sealed specification in Section D: Telemetry scrub regex strips `(?<=[?&](?:api_?key|key|token)=)[^&]+`.

- **[L08 FALSIFICATION]** (Database Architecture, Schema Drift & Migration Provenance):
  - *Deficit in G2*: G2 cited the final migration, but did not specify the schema rollback drill requirement.
  - *Correction in G3*: Sealed specification in Section D: Every schema change must pass `scripts/database-backup-restore-drill.node-test.mjs`.

- **[L09 FALSIFICATION]** (Proof Hierarchy & Anti-Self-Certification (C0..C4)):
  - *Deficit in G2*: G2 bound anti-tamper test, but did not lock the downstream executor prohibition against altering test files.
  - *Correction in G3*: Sealed invariant in Section B: Downstream executor is strictly forbidden from modifying any file under `tests/` or `scripts/*.node-test.mjs`.

- **[L10 FALSIFICATION]** (Anti-Shrinkage & 267 Historical Gates Traceability):
  - *Deficit in G2*: G2 summarized gate counts, but did not specify gate ID preservation rule.
  - *Correction in G3*: Sealed specification in Section C: Gate IDs (e.g., `GATE-P0-001` through `GATE-P2-001`) are immutable identifiers.

- **[L11 FALSIFICATION]** (Turnkey Execution, Topological DAG & Rollback Runbooks):
  - *Deficit in G2*: G2 specified rollback command, but did not specify maximum permissible recovery latency.
  - *Correction in G3*: Sealed specification in Section D: Recovery execution must terminate with exit code 0 within 2000 milliseconds.

- **[L12 FALSIFICATION]** (Zero-Trust Release & Remote Git Synchronization):
  - *Deficit in G2*: G2 specified remote ref, but did not lock git fetch validation.
  - *Correction in G3*: Sealed specification in Section D: Verification must execute `git fetch origin` followed by `git rev-parse HEAD == git rev-parse origin/antigravity/farely-v12-product-convergence`.

---

## SECTION A: FOUNDER MISSION, AUTHORITY & PRODUCT BOUNDARY
- **Product Name**: Farely — Verified Flight Opportunity Intelligence Platform
- **Core Jobs-to-be-Done (F1.1)**: Transform flight search from *"Where do you want to go?"* to *"What genuine, high-value flight opportunities exist right now?"*
- **Non-OTA Inviolable Perimeter**:
  - `NO_DIRECT_TICKETING`: Farely never sells tickets directly.
  - `NO_PASSENGER_CHECKOUT`: Farely never collects passenger passport, legal name, or billing details.
  - `NO_PAYMENT_COLLECTION`: Farely never integrates payment gateways (no Stripe, VNPay, Momo).
  - `NO_UNAUTHORIZED_SCRAPING`: Data acquired strictly through approved provider APIs and whitelisted search endpoints.
  - Capability F52 is strictly preserved as `BOUNDARY_EXCLUDED`.

---

## SECTION B: INVARIANT EXECUTOR CAGE
```text
INVARIANT_EXECUTOR_LOCK: STRICT_NO_DEVIATION
The executor is strictly bound to the locked technical solutions detailed in Section D & E.
The executor is FORBIDDEN from inventing new architectures, introducing alternative algorithms,
changing database schemas, or deviating from the specified file/function diffs.
The executor is strictly forbidden from modifying any file under tests/ or scripts/*.node-test.mjs.
Any deviation is a critical contract breach and will be rejected closed by the Evidence Admission Controller.
```

---

## SECTION C: SCOPE PRESERVATION & HISTORICAL GATES TRACEABILITY
- **Total Capabilities**: 89 capability contracts (F00..F88) preserved without loss.
- **Historical Acceptance Gates**: Exactly 267 historical gates:
  - 192 Priority P0 Gates (Non-negotiable core invariants)
  - 74 Priority P1 Gates (High-value intelligence & monitoring capabilities)
  - 1 Priority P2 Gate (Conditional growth feature)
- **P2 Semantic Variant Preservation**: Exactly 32 distinct V1/V2 semantic variants across 16 capability pairs preserved in `docs/convergence/v51/P2_SEMANTIC_VARIANT_RECONCILIATION.json`.

---

## SECTION D: LOCKED ARCHITECTURAL SOLUTIONS
### SOL-01: SOL-DATA-01 (Null & Unknown Numeric Preservation)
- **Target File**: `src/app/data/api.ts`
- **Specification**: In `parseNullableNumber()`, missing, empty, or unparseable fields must return `null`. Never default to `0`. Currency conversions multiply float rate then execute `Math.round()`.

### SOL-02: SOL-PRICE-01 (Price State Machine & Semantics)
- **Target File**: `src/app/data/api.ts`
- **Specification**: Deals must explicitly declare price semantics: `INDICATIVE`, `OBSERVED`, or `BOOKABLE`.

### SOL-03: SOL-WATCH-01 (Tokenized Watch Subscription Verification)
- **Target File**: `supabase/migrations/20261005000000_saved_opportunities_and_watch.sql`
- **Specification**: Subscriptions require valid session `auth.uid()` or HMAC signature tokens.

### SOL-04: SOL-AUTH-01 (Tenant Isolation & Synchronous Account Eradication)
- **Target File**: `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`
- **Specification**: Stored procedure `public.prepare_account_deletion` purges user data synchronously within 60s with cascading foreign key deletions.

### SOL-05: SOL-CIRCUIT-01 (Adaptive Circuit Breaker & Quarantine)
- **Target File**: `supabase/functions/_shared/flight-search.ts`
- **Specification**: 3 failures within 300s trip breaker to `OPEN` with exponential backoff and jitter. In `HALF_OPEN`, 3 consecutive successful trials restore to `CLOSED`.

### SOL-06: SOL-STALE-01 (Triple Visual Freshness Badges)
- **Target File**: `src/app/pages/DealsPage.tsx`
- **Specification**: Renders `FRESH` (<120m), `WARM` (120m–360m), and `STALE` (>360m) with accessibility aria-labels.

### SOL-07: SOL-TELEMETRY-01 (Zero-Secret Client Scrubbing)
- **Target File**: `src/app/lib/sharing.ts`
- **Specification**: Strips email addresses, auth bearer tokens, query param API keys, and session cookies from client events.

### SOL-08: SOL-MIGRATION-01 (47-Migration Bidirectional Lineage)
- **Target File**: `supabase/migrations/`
- **Specification**: Exactly 47 canonical migrations sealed with immutable chronological timestamps. Validated via `scripts/database-backup-restore-drill.node-test.mjs`.

### SOL-09: SOL-PROOF-01 (C0..C4 Proof Hierarchy & Anti-Self-Certification)
- **Target File**: `scripts/verify-certification-integrity.node-test.mjs`
- **Specification**: `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`.

### SOL-10: SOL-SHRINK-01 (267 Historical Gates & 32 P2 Semantic Variants)
- **Target File**: `scripts/acceptance-anti-shrinkage.node-test.mjs`
- **Specification**: Asserts 192 P0, 74 P1, and 1 P2 gates with authentic test assertions.

### SOL-11: SOL-TURNKEY-01 (Watchdog Health Monitoring & Automated Rollback)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: Deterministic diagnosis and turnkey recovery scripts (`npm run convergence:rollback`) completing within 2000ms.

### SOL-12: SOL-RELEASE-01 (Git Remote Reconciliation & Zero-Untracked Verifier)
- **Target File**: `scripts/convergence/watchdog-convergence.mjs`
- **Specification**: Enforces remote SHA equality with `origin/antigravity/farely-v12-product-convergence`.

---

## SECTION E: THE 12 ADVERSARIAL LENSES EVALUATION MATRIX [PASS G3]

### L01: Product Truth & Founder Scope Integrity
- **Focus**: Anti-OTA conflation; exact jobs-to-be-done F1.1; no fake deal booking claims; preservation of F1..F26.
- **Physical Code Citations**:
  - `src/domain/farely/providerRights.ts`: Method `isAllowedBookingHost` validates booking referral domains (`google.com`, `travelpayouts.com`, `aviasales.com`), blocking non-whitelisted URLs.
  - `src/app/pages/DealDetailPage.tsx`: Outbound referral links strictly marked with noopener and non-OTA disclaimer.
  - `docs/convergence/v51/FOUNDER_APPROVED_REQUIRED_ATOMS.json`: Preserves all 89 capability contracts. Capability F52 is strictly preserved as `BOUNDARY_EXCLUDED`.
- **Verification Proof (C0..C4)**:
  - *C0 Contract*: `tests/contracts/product_boundary.contract.ts` passes.
  - *C1 Code Test*: `scripts/deployment-boundary.node-test.mjs` and `scripts/adversarial-corpus-a01-a24.node-test.mjs` pass 100%.

---

### L02: Price, Historical Baseline & Data Integrity
- **Focus**: Rejection of NaN, negative prices, unbounded numbers; exact price semantics.
- **Physical Code Citations**:
  - `src/app/data/api.ts`: Function `parseNullableNumber`.
  - `supabase/migrations/20261007000100_canonical_fare_observations.sql`: Baseline exclusion of current offer.
  - `scripts/price-truth-harness.node-test.mjs`: Price boundary testing.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/price-truth-harness.node-test.mjs` passes 100%.

---

### L03: Deal Score, Statistical Confidence & Cost Monotonicity
- **Focus**: Anti-hallucinated discount claims; deal score must be backed by sample confidence and total cost of trip.
- **Physical Code Citations**:
  - `src/domain/farely/costEpistemics.ts`: Cost monotonicity engine with layover duration penalties.
  - `src/domain/farely/domainKernel.test.ts`: Cabin class isolation.
  - `src/domain/farely/priceAnomaly.ts`: Rejection of outlier samples.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `src/domain/farely/domainKernel.test.ts` passes 100%.

---

### L04: Auth, Privacy, Tenant Isolation & RLS Matrix
- **Focus**: Multi-tenant isolation; strict Supabase RLS policies; protection of personal watch alerts and user credentials.
- **Physical Code Citations**:
  - `supabase/migrations/20261005000000_saved_opportunities_and_watch.sql`: Row Level Security policies.
  - `supabase/migrations/20261005010000_release_convergence_and_snapshot_atomicity.sql`: PDPD 60s account eradication.
  - `scripts/account-deletion-contract.node-test.mjs`: Account deletion contract.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/rls-tenant-isolation.node-test.mjs` passes 100%.

---

### L05: Provider Drift, Circuit Breakers & Kill Switches
- **Focus**: Resilience against partner schema changes, 429 rate limits, 503 outages, and dirty payload quarantine.
- **Physical Code Citations**:
  - `supabase/functions/_shared/flight-search.ts`: Circuit breaker with backoff jitter and quarantine.
  - `scripts/provider-drift-and-killswitch.node-test.mjs`: Provider failure harness.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/provider-drift-and-killswitch.node-test.mjs` passes 100%.

---

### L06: Freshness, Stale Degradation & UX Honesty
- **Focus**: Stale indicators for data >360m; no masking errors as 0 deals; transparent source attribution.
- **Physical Code Citations**:
  - `src/app/pages/DealsPage.tsx`: Freshness badges with visual contrast.
  - `scripts/clock-timezone-adversarial.node-test.mjs`: Clock skew and observation separation.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/clock-timezone-adversarial.node-test.mjs` passes 100%.

---

### L07: Observability, Secret Scrubbing & Error Boundaries
- **Focus**: Zero secret leakage in client/browser logs; client error boundaries; structured telemetry.
- **Physical Code Citations**:
  - `src/app/lib/sharing.ts`: Telemetry scrubbing.
  - `scripts/client-error-boundary.node-test.mjs`: React error boundary resilience.
  - `scripts/security-smoke.node-test.mjs`: Secret scanner.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/security-smoke.node-test.mjs` passes 100%.

---

### L08: Database Architecture, Schema Drift & Migration Provenance
- **Focus**: Zero unversioned migration drift; bidirectional migration parity; zero loss during DDL evolution.
- **Physical Code Citations**:
  - `supabase/migrations/`: 47 immutable migrations.
  - `scripts/migration-parity.node-test.mjs`: Migration integrity.
  - `scripts/database-architecture-contract.node-test.mjs`: Transaction boundary verification.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/database-architecture-contract.node-test.mjs` passes 100%.

---

### L09: Proof Hierarchy & Anti-Self-Certification (C0..C4)
- **Focus**: Strict separation: C0 Contract != C1 Unit != C2 Integration != C3 Runtime != C4 Soak.
- **Physical Code Citations**:
  - `scripts/verify-certification-integrity.node-test.mjs`: Separation of proof levels C0..C4.
  - `scripts/certifier-sabotage.node-test.mjs`: Tamper resistance.
  - Invariants: `TARGET_PROVEN: FALSE`, `PRODUCT_ACCEPTANCE: NOT_ESTABLISHED`, `PRODUCTION_AUTHORIZATION: NOT_GRANTED`.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/verify-certification-integrity.node-test.mjs` passes 100%.

---

### L10: Anti-Shrinkage & 267 Historical Gates Traceability
- **Focus**: Preservation of all 192 P0, 74 P1, 1 P2 gates; zero dropping of historical commitments.
- **Physical Code Citations**:
  - `scripts/acceptance-anti-shrinkage.node-test.mjs`: 267 historical gates.
  - `docs/convergence/v51/P2_SEMANTIC_VARIANT_RECONCILIATION.json`: 32 P2 semantic variants.
  - `scripts/v37-adversarial-negative-matrix.node-test.mjs`: Negative vectors NV01..NV40.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/acceptance-anti-shrinkage.node-test.mjs` passes 100%.

---

### L11: Turnkey Execution, Topological DAG & Rollback Runbooks
- **Focus**: Zero-deadlock dependency order; file-level before/after specs; turnkey test scripts.
- **Physical Code Citations**:
  - `scripts/watch-outbox-atomicity.node-test.mjs`: Atomic lease handling with `FOR UPDATE SKIP LOCKED`.
  - `scripts/convergence/watchdog-convergence.mjs`: Watchdog monitoring.
  - `scripts/convergence/transactional-task-manager.mjs`: Journal rollback.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/watch-outbox-atomicity.node-test.mjs` passes 100%.

---

### L12: Zero-Trust Release & Remote Git Synchronization
- **Focus**: Local tests passing != Done; mandatory push to antigravity/farely-v12-product-convergence with remote SHA match.
- **Physical Code Citations**:
  - `scripts/runtime-configuration.node-test.mjs`: Frontend and Edge API contract parity.
  - `scripts/release-manifest.node-test.mjs`: Release manifest validation.
  - `scripts/convergence/watchdog-convergence.mjs`: Git remote origin validation.
- **Verification Proof (C0..C4)**:
  - *C1 Code Test*: `scripts/runtime-configuration.node-test.mjs` passes 100%.
  - *Live Git Proof*: HEAD matches remote branch `antigravity/farely-v12-product-convergence`.

---

## CONCLUSION OF PASS G3 [CYCLE G53]
Pass G3 hardens the Solution Cage against negative vectors and downstream modifications, forbidding alterations to test suites and locking foreign key cascades, half-open trials, and scrub regexes.
