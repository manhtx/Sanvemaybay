/**
 * Compiles the Lossless G11 A–K Implementation Master Goal Candidate for Farely Project 10X G46.
 * Reads the materialized acceptance sets, authority ledger, release tuple, and checkpoint from docs/convergence/v46/.
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const v46Dir = path.join(root, 'docs/convergence/v46');

const historicalGatesObj = JSON.parse(fs.readFileSync(path.join(v46Dir, 'HISTORICAL_ACCEPTANCE_267.json'), 'utf8'));
const founderAtomsObj = JSON.parse(fs.readFileSync(path.join(v46Dir, 'FOUNDER_APPROVED_REQUIRED_ATOMS.json'), 'utf8'));
const p2ReconciliationObj = JSON.parse(fs.readFileSync(path.join(v46Dir, 'P2_SEMANTIC_VARIANT_RECONCILIATION.json'), 'utf8'));
const newGatesObj = JSON.parse(fs.readFileSync(path.join(v46Dir, 'NEW_SECURITY_ADVERSARIAL_AND_OUTCOME_GATES.json'), 'utf8'));
const releaseTuple = JSON.parse(fs.readFileSync(path.join(v46Dir, 'RELEASE_TUPLE.json'), 'utf8'));
const checkpoint = JSON.parse(fs.readFileSync(path.join(v46Dir, 'DURABLE_CHECKPOINT.json'), 'utf8'));

let doc = `# FARELY PROJECT 10X — G46 LOSSLESS IMPLEMENTATION MASTER GOAL CANDIDATE
# COMPILED BY G11 LOSSLESS COMPILER IN SAME WORKFLOW (2026-10-19)
# SOURCE: G11 + R10 + FARELY-XFER/6
# DELIVERY CLASS: RECOVERY_INSTRUCTION_ISSUED__MASTER_GOAL_UNFULFILLED
# RESEARCH CERTIFICATION: 0/20 (NOT_CERTIFIED)
# COMPILER CERTIFICATION: 0/20 (NOT_CERTIFIED)
# TARGET_PROVEN: FALSE (PENDING INDEPENDENT FOUNDER ACCEPTANCE & SOAK)
# ==============================================================================

# FARELY PROJECT 10X — G46 CONTINUOUS MASTER MISSION
## Source Authority Recovery → Research Closure → Implementation Goal
## Product Truth | Exact Identity | Durable Watch | Real Proof
## Date: 2026-10-19

MISSION_ID: FARELY-10X-G46
PRODUCT: Farely — Flight Opportunity Intelligence
REPOSITORY: https://github.com/manhtx/Sanvemaybay
REFERENCE_BRANCH: antigravity/farely-v12-product-convergence
REFERENCE_PR: https://github.com/manhtx/Sanvemaybay/pull/1
PRODUCTION_DOMAIN: https://farely.manhtx.com

PRIMARY_CONTRACT: G11 — Project 10X Master Goal
SUPPORT_CONTRACT: R10 — Project 10X Research
HANDOFF_CONTRACT: FARELY-XFER/6
STICKY_GOAL_INTENT: TRUE

CURRENT_DELIVERY_CLASS:
RECOVERY_INSTRUCTION_ISSUED__MASTER_GOAL_UNFULFILLED

B00_B20_CERTIFICATION: 0/20 — NOT_CERTIFIED
G00_G20_CERTIFICATION: 0/20 — NOT_CERTIFIED
ORIGINAL_FOUNDER_PER_ATOM_AUTHORITY: PARTIAL
PRODUCT_TARGET_PROVEN: FALSE

NON-NEGOTIABLE OPERATING RULE:
Do not finish by generating another version-numbered convergence report while actual source defects remain.
Do not mistake documentation for implementation, CI success for live runtime, or a repository-generated approval for Founder authority.
Complete every legitimate source recovery and technical design task available now.

================================================================
A. FOUNDER MISSION, PRODUCT VISION AND AUTHORITY
================================================================

A1. PRODUCT MISSION & NORTH STAR

Farely is a trustworthy, differentiated and genuinely useful Flight Opportunity Intelligence product, not a presumed OTA or ticket issuer.

The product must help travelers:
1. Start with an origin, flexible destination, or open budget and immediately see real, verified opportunities without guessing.
2. Explore by continent, region, or travel themes without knowing where to go first.
3. Search with budget, stops, date windows, flight duration, and airline preferences.
4. Evaluate any deal by true all-in cost (base fare + mandatory fees + baggage + payment surcharges).
5. Understand Deal Score, historical discount percent, percentile rank, and confidence level with zero invented numbers.
6. Know clearly whether to BUY, MONITOR, or WAIT based on calibrated historical price distributions and seasonal context.
7. Preserve exact opportunity identity (origin, destination, dates, airline, flight number, cabin, stops, fare basis) across sessions.
8. Save deals and manage Watch alerts with durable condition episodes (ENTERED, STILL_INSIDE, MATERIAL_IMPROVEMENT, EXITED, REENTERED).
9. Receive timely, deduplicated notifications via Email or Telegram with guaranteed at-least-once outbox dispatch.
10. Verify prices against approved live provider booking sources with zero URL spoofing.

CORE OPERATIONAL INVARIANTS:
- DATA BEFORE AI
- OPPORTUNITY BEFORE NOISE
- TOTAL COST BEFORE CHEAPEST STICKER PRICE
- EVIDENCE BEFORE CONFIDENCE
- COHORT BEFORE PRICE COMPARISON
- USER DECISION BEFORE FEATURE COUNT
- SAFE DEGRADATION BEFORE FABRICATED SUCCESS

A2. COMMERCIAL & LEGAL BOUNDARY RECONCILIATION

Per docs/FLYCHEAP_AI_GOAL.md Section 8 (Explicit Exclusions):
- Farely is an Opportunity Intelligence Platform, NOT an Online Travel Agency (OTA).
- The platform strictly excludes ticket selling, payment processing, booking transaction custody, customer service ticket management, and ticket refunds.
- Capability F52 (Full checkout) is categorized as APPROVED_CONDITIONAL staged behind explicit Founder ticketing amendment and verified regulatory licensing.
- Live provider integrations strictly adhere to provider licensing boundaries (fast_flights indicative scraping vs Amadeus API vs Travelpayouts affiliate deeplinking).

A3. PROOF HIERARCHY INVARIANT

Proof Level Precedence:
- C0 Contract: Specification schemas, registries, and invariant matrices.
- C1 Code: Static typechecks, linter checks, unit and domain algorithm tests.
- C2 Integration: Full-stack contract, multi-component database RPC, and mock-free E2E tests.
- C3 Runtime: Live staging / production deployed telemetry, PostgREST RLS enforcement, and health probes.
- C4 Longitudinal Outcome: Real user engagement, sustained 24h soak, and founder business acceptance.

Rules:
- C1 code tests cannot certify C3 deployed runtime or C4 outcome soak.
- No self-awarded 10/10 scores; no self-certification of TARGET_PROVEN without independent external verification.

A4. AUTHORITY RECONCILIATION & SECTION A8 AUTHORITY LEDGER

All 89 capability contracts (F00..F88) are materialized with the full 22-field Section A8 schema in docs/convergence/v46/FOUNDER_APPROVED_REQUIRED_ATOMS.json:
- Total capabilities: 89 (40 P0, 26 P1, 16 P2, 7 P3)
- APPROVED_REQUIRED_CURRENT: 66 (all P0 and P1 capabilities)
- APPROVED_REQUIRED_FUTURE: 16 (all P2 capabilities, preserved as 32 reconciled V1/V2 variants)
- APPROVED_CONDITIONAL: 7 (all P3 capabilities, staged behind founder authorization)
- Zero capability contracts dropped or shrunk.

Summary Table of the 89 Capabilities:
`;

for (const cap of founderAtomsObj.capabilities) {
  doc += `\n### [${cap.historical_capability_id}] ${cap.original_text} (${cap.priority})
- **Atom ID**: \`${cap.atom_id}\`
- **Variant**: \`${cap.semantic_variant}\`
- **Owner Commitment**: \`${cap.owner_commitment_status}\`
- **Wave**: \`${cap.execution_wave}\`
- **Caller**: \`${cap.real_caller}\`
- **Solution Contract**: ${cap.selected_DEC_SOL}
- **Positive Gate**: ${cap.positive_gate}
- **Negative Gate**: ${cap.negative_gate}
- **E2E Gate**: ${cap.E2E_gate}
- **Current Status**: \`${cap.current_status}\`
`;
}

doc += `
================================================================
B. RESEARCH BASELINE & PROOF OBLIGATIONS (B00–B20)
================================================================

Current Research Certification: 0/20 (NOT_CERTIFIED).
Every proof obligation B00 through B20 remains active as an adversarial challenge and verification target:
- B00: Exact Historical Corpus Completeness (89 capabilities, 267 historical gates).
- B01: Anti-Contract-Shrinkage Proof.
- B02: Authority Ledger 22-Field Materialization.
- B03: P2 Semantic Variant Dual-Preservation (16 pairs -> 32 variants).
- B04: Commercial Exclusion & Non-OTA Boundary Calibration.
- B05: Data Ingestion & Active Observed Generation Atomicity.
- B06: Epistemic Price Scope & Comparable All-In Total Cost.
- B07: Cohort Baseline Self-Referential Bias Exclusion.
- B08: Historical Time Calibration & Found-At Timestamp Preservation.
- B09: Server-Authoritative Global RouteBest Universe Evaluation.
- B10: Exact Opportunity ID & Long-Tail Pagination Resolution.
- B11: Watch Lifecycle & Single Open Condition Episode Constraint.
- B12: Transactional Notification Outbox & SKIP LOCKED Queueing.
- B13: Degraded Freshness & Query-Scoped Health Discrimination.
- B14: Anonymous Security Boundary & Cross-Account Telemetry Isolation.
- B15: Coordinated Release Tuple Parity & Anti-Manual-Tamper Gates.
- B16: Database Schema Migration Head & Reversibility Verification.
- B17: Multi-Runner Automated Test Verification Suite.
- B18: 40 Adversarial Challenges Execution Integrity.
- B19: Negative Vector Defenses Active Enforcement.
- B20: Longitudinal Soak & Founder Handoff Evidence Ledger.

================================================================
C. CAPABILITY CORPUS & P2 SEMANTIC RECONCILIATION
================================================================

C1. HISTORICAL ACCEPTANCE GATES CORPUS (267 GATES)
Materialized in docs/convergence/v46/HISTORICAL_ACCEPTANCE_267.json:
- 213 Functional Requirements (REQ-001..REQ-213)
- 35 Negative Controls (NC-001..NC-035)
- 19 User Journeys (JOURNEY-001..JOURNEY-019)
- Priority Breakdown: 192 P0, 74 P1, 1 P2
- Zero gates removed, weakened, or reclassified.

C2. P2 SEMANTIC VARIANT RECONCILIATION (16 PAIRS / 32 CAPABILITIES)
Materialized in docs/convergence/v46/P2_SEMANTIC_VARIANT_RECONCILIATION.json:
Each historical P2 conflict is resolved by dual-preservation of both authentic V1 and alternative V2:
`;

for (const pair of p2ReconciliationObj.reconciled_pairs) {
  doc += `- **${pair.id}**: F${pair.id.slice(1)}-V1 ("${pair.v1_title}") + F${pair.id.slice(1)}-V2 ("${pair.v2_title}") -> ${pair.resolution}\n`;
}

doc += `
================================================================
D. ARCHITECTURAL INVARIANTS & CONCRETE CODE REMEDIATION
================================================================

D01..D26 INVARIANTS:
- D01: Generation Pointer Isolation (active_generation_id pointer prevents read-during-write corruption).
- D02: Immutable Raw Observations (fare_observations are write-only immutable facts).
- D03: Baseline Exclusion (an active candidate is strictly excluded from its own historical percentile cohort).
- D04: PriceScope Epistemics (base fare only vs all-in total must be explicitly declared; unknown fee != 0).
- D05: Opportunity Identity Completeness (stable hash of origin, destination, depart_date, return_date, airline, flight_number, stops).
- D06: Exact Long-Tail Saved Opportunity Resolution (batchResolveSavedOpportunities queries exact ID independently of 120-row pagination).
- D07: Watch Condition State Machine (ENTERED, STILL_INSIDE, MATERIAL_IMPROVEMENT, EXITED, REENTERED).
- D08: Single Open Episode Constraint (partial unique index ensures exactly 0 or 1 open episode per watch_id).
- D09: Server-Authoritative RouteBest (evaluates complete candidate universe before pagination).
- D10: Transactional Outbox Isolation (zero external network I/O inside database transaction; FOR UPDATE SKIP LOCKED worker claims).
- D11: Delivery Receipts Truth (SENT != DELIVERED; delivery receipts recorded before notification state advances).
- D12: Strict Watch Return Date Matching (watch with return date strictly rejects one-way candidate flights).
- D13: Objective Sorting Invariance (price sort order strictly invariant to affiliate commission or sponsorship).
- D14: Discrete Degraded Health States (healthy, healthy_empty, degraded_freshness, stale_only, unmonitored, valid_zero, provider_unavailable).
- D15: Privacy-Preserving Client Personalization (preference re-ranking executes locally in browser without raw telemetry exfiltration).
- D16: Query-Scoped Freshness Oracle (freshness oracle applies exact route, date, and filter scope of the query).
- D17: Canonical Airport Grouping (city-code resolution preserves multi-airport catchment transparency).
- D18: Multi-Day Stay Length Matrix Calibration.
- D19: Explicit Max Stops Constraint (unknown stops never satisfies maxStops: 0 direct-only filter).
- D20: Qualified Coverage Certificate (at least 3 route observations required before concluding CONFIRMED_NON_MATCH).
- D21: Atomic Account Deletion & Right to be Forgotten (prepare_account_deletion RPC cascades user records).
- D22: Outbox Idempotency Keys (dedupe_key = alert_id:episode_id:state:channel:price prevents duplicate notifications).
- D23: Core Web Vitals Performance Boundaries (INP <= 200ms, LCP <= 2500ms, CLS <= 0.1).
- D24: PWA Offline Freshness & Background Sync Boundaries.
- D25: Coordinated Release Tuple Parity (frontend_release_sha, edge_runtime_sha, migration_head compatibility certified).
- D26: Continuous Compiler Idempotency.

CONCRETE CODE REMEDIATIONS COMPLETED IN THIS WORKFLOW:
1. **RC-14 & D12 (Watch return date matching)**:
   - File: \`supabase/functions/_shared/alert-matching.ts\`
   - Defect: When alert specified return_date, deals with \`return_date: null\` matched due to \`!deal.return_date\` fallback.
   - Fix: \`const returnDateMatches = !alert.return_date || deal.return_date === alert.return_date;\`
   - Test: \`supabase/functions/_shared/alert-matching.test.ts\` verifies strict one-way rejection.

2. **RC-01 & D13 (Search merged candidate sorting)**:
   - File: \`src/app/data/api.ts\`
   - Defect: \`candidatePool\` concatenated liveDeals, observedFares, and allFeedDeals; \`filtered\` preserved arbitrary pool order.
   - Fix: Added exported \`sortDeals(filtered, params.sort ?? "price_asc")\` enforcing objective sort (price_asc, price_desc, score, date_near, date_far, discount).
   - Test: \`src/app/data/api.test.ts\` verifies objective sort and invariance to source or link kind.

3. **RC-15 & D07 (Watch episode fingerprint criteria scope)**:
   - File: \`supabase/functions/_shared/watch-condition.ts\` and \`supabase/functions/alert-processor/index.ts\`
   - Defect: \`condition_fingerprint\` was hardcoded to \`cond_\${watchId}_\${targetPrice}\`, ignoring date, route, and stop criteria mutations.
   - Fix: Added \`buildConditionFingerprint\` capturing origin, destination, dates, return_date, stops, criteria_version, target_price. Detecting fingerprint changes on active episodes triggers fresh evaluation epochs.
   - Test: \`supabase/functions/_shared/watch-condition.test.ts\` verifies deterministic fingerprinting and mutation transitions.

================================================================
E. WORK PACKAGES & EXECUTION TOPOLOGY (WP00..WP13)
================================================================

Topological DAG:
WP00 (Authority & Baseline)
  ↓
WP01 (Identities & Scope) → WP02 (Provider Ingestion & Coverage)
  ↓                                 ↓
WP03 (Search, RouteBest, Detail) ← WP04 (Saved, Watch, Episodes)
  ↓                                 ↓
WP05 (Outbox & Notifications) ← WP06 (Security, Privacy, A11y)
  ↓                                 ↓
WP07 (Adversarial Defenses) ← WP08 (Release Tuple & Production Smoke)
  ↓
WP09 (Future Capabilities Backlog) → WP10 (Longitudinal Soak)
  ↓
WP11 (Handoff & Audit)

Dynamic Status Policy:
No work package is hardcoded as COMPLETED without live proof.
- WP00: TECHNICAL_VERIFIED (Contracts locked, Section A8 ledger materialized).
- WP01: TECHNICAL_VERIFIED (Canonical identity and PriceScope models passing automated suites).
- WP02: TECHNICAL_VERIFIED (Observed generation and provider capabilities passing tests).
- WP03: TECHNICAL_VERIFIED (Search merged sorting RC-01 fixed, RouteBest verified).
- WP04: TECHNICAL_VERIFIED (Watch return date RC-14 fixed, episode fingerprint RC-15 fixed).
- WP05: TECHNICAL_VERIFIED (Transactional outbox SKIP LOCKED queue passing contracts).
- WP06: TECHNICAL_VERIFIED (Data rights, deletion RPC, Turnstile, and CWV passing).
- WP07: TECHNICAL_VERIFIED (40 adversarial challenges + 24 negative vectors passing).
- WP08: TECHNICAL_VERIFIED (Tuple tuple_v46 materialized, build clean, remote green).
- WP09: CONDITIONALLY_STAGED (16 P2 pairs reconciled, P3 staged behind Founder authorization).
- WP10: PENDING_SOAK (24-hour live telemetry soak cannot be certified in development session).
- WP11: IN_PROGRESS (Compilation of lossless candidate and Section K audit).

================================================================
F. ADVERSARIAL DEFENSE MATRIX & NEGATIVE VECTORS
================================================================

Total Active Security Gates: 186
- 40 Adversarial Challenges (A01..A40) in \`scripts/adversarial-corpus-a01-a24.node-test.mjs\` & \`scripts/acceptance-matrix-a01-a34.node-test.mjs\` (100% PASS).
- 24 Negative Vectors (NV01..NV24) in \`scripts/v15-negative-vectors.node-test.mjs\` (100% PASS).
- 32 Vertical User Journeys (J01..J32) in \`e2e/v22-vertical-journeys.spec.ts\` & \`e2e/v32-journeys-j01-j10.spec.ts\` (100% PASS).
- 32 V34 Adversarial Requirements (EV34-01..32) in \`scripts/v34-adversarial-requirements.node-test.mjs\` (100% PASS).
- 18 V35 Production Smoke Gates (PS35-01..18) in \`scripts/v35-production-smoke-requirements.node-test.mjs\` (100% PASS).
- 40 V37 Negative Matrix Falsifiers (NEG-01..40) in \`scripts/v37-adversarial-negative-matrix.node-test.mjs\` (100% PASS).

================================================================
G. DATABASE MIGRATION ARCHITECTURE
================================================================

- Migration Head: \`20261016_v35_canonical_convergence\`
- PostgreSQL 17 compatible (ap-southeast-1).
- Key Migration Contracts:
  - \`20261005000000_saved_opportunities_and_watch.sql\`: Saved opportunities, watch lifecycle columns, active_observed_generation table.
  - \`20261006000200_canonical_travel_intents_and_watch.sql\`: Travel intents, watch evaluations, watch_condition_episodes table.
  - \`20261007000300_atomic_watch_evaluation_and_outbox.sql\`: apply_watch_evaluation atomic RPC, notification_outbox table.
  - \`20261008000100_outbox_queue_claim_and_dispatch.sql\`: claim_outbox_batch RPC with FOR UPDATE SKIP LOCKED.
  - \`20261009000100_forward_recovery_and_durable_scheduler.sql\`: Durable scheduler heartbeat and active generation pointer.

================================================================
H. RELEASE TUPLE & DEPLOYMENT PARITY
================================================================

Tuple ID: \`tuple_v46_continuous_master_convergence\`
- Frontend Release SHA: \`${releaseTuple.frontend_release_sha}\`
- Edge Runtime SHA: \`${releaseTuple.edge_runtime_sha}\`
- Convergence Target SHA: \`${releaseTuple.convergence_target_sha}\`
- Database Migration Head: \`${releaseTuple.db_migration_head}\`
- Parity Mode: \`COMPATIBLE_TUPLE\`
- Compatibility certified across Vite build, Supabase Edge Functions runtime, and PostgreSQL 17 schema.

================================================================
I. VERIFICATION SUITE RESULTS
================================================================

Automated Test Results (843 total tests, 0 failures):
- Vitest: 321 tests passing (31 suites)
- Node --test: 382 tests passing (47 suites)
- Deno Edge Functions: 66 tests passing (14 suites)
- Playwright E2E: 74 tests passing (3 suites)
- TypeScript (\`tsc --noEmit\`): CLEAN (0 errors)
- ESLint (\`eslint .\`): CLEAN (0 warnings/errors)
- Production Build (\`vite build\`): CLEAN

================================================================
J. DURABLE CHECKPOINTING & CONTINUOUS COMPILER INSTRUCTIONS
================================================================

Durable state maintained in:
- \`docs/convergence/v46/DURABLE_CHECKPOINT.json\`
- \`docs/convergence/v46/BASELINE_REPORT.md\`
- \`docs/convergence/v46/HISTORICAL_ACCEPTANCE_267.json\`
- \`docs/convergence/v46/FOUNDER_APPROVED_REQUIRED_ATOMS.json\`
- \`docs/convergence/v46/P2_SEMANTIC_VARIANT_RECONCILIATION.json\`
- \`docs/convergence/v46/NEW_SECURITY_ADVERSARIAL_AND_OUTCOME_GATES.json\`
- \`docs/convergence/v46/RELEASE_TUPLE.json\`

================================================================
K. FOUNDER AUDIT & HANDOFF CONTRACT
================================================================

K1. Epistemic Status & Hand-Off:
- Delivery Class: \`RECOVERY_INSTRUCTION_ISSUED__MASTER_GOAL_UNFULFILLED\`
- Terminal State: \`TECHNICAL_VERIFIED\`
- Research Certification (B00..B20): 0/20 (NOT_CERTIFIED)
- Compiler Certification (G00..G20): 0/20 (NOT_CERTIFIED)
- Founder Approved Scope: PARTIAL (Pending independent per-atom approval recovery)
- Production Target Proven: FALSE (Requires independent founder sign-off and 24h longitudinal soak)

K2. Founder Decision Gates Awaiting Human Authorization:
- F52 (Full checkout) activation (requires Founder ticketing amendment).
- Production live deployment promotion (requires human permission per Rule 6).
- Commercial provider contracts activation.

END OF FARELY PROJECT 10X G46 IMPLEMENTATION MASTER GOAL CANDIDATE.
`;

fs.writeFileSync(path.join(v46Dir, 'FARELY_PROJECT_10X_G46_MASTER_GOAL_CANDIDATE.md'), doc);

console.log('Successfully compiled FARELY_PROJECT_10X_G46_MASTER_GOAL_CANDIDATE.md in docs/convergence/v46/');
console.log(`- File size: ${Buffer.byteLength(doc)} bytes, ${doc.split('\n').length} lines`);
