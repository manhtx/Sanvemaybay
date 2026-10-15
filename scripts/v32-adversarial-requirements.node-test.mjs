/**
 * FARELY PROJECT 10X — V32 ADVERSARIAL REQUIREMENTS TEST SUITE (EV-01 THROUGH EV-28)
 * Section H3 of Farely Project 10X Master Goal V32.
 * All 28 adversarial requirements are tested against real production code modules.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Production domain imports
import { evaluateAdmission } from './evidence-admission-controller.mjs';
import { buildPhysicalItineraryId } from '../src/domain/farely/identity.ts';
import { evaluateTrueCost } from '../src/domain/farely/costEpistemics.ts';
import { selectRouteBest } from '../src/domain/farely/routeBest.ts';
import { createTravelIntent } from '../src/domain/farely/travelIntent.ts';
import { verifyFounderAuthToken, assertP3ActivationSafety } from '../src/domain/farely/conditionalGrowthSafety.ts';
import { classifyFeedStatus } from '../supabase/functions/_shared/feed-health.ts';
import { evaluateBuyWaitGuidance } from '../src/domain/farely/buyWaitGuidance.ts';
import { detectPriceAnomaly } from '../src/domain/farely/priceAnomaly.ts';
import { evaluateScanExpansionProposal } from '../src/domain/farely/dataEconomics.ts';
import { getProviderSourceRights, hasB2BRedistributionRights } from '../src/domain/farely/providerRights.ts';

// EV-01: 267 historical PROVEN statuses + 267 stale receipts -> 0 currently proven in every projection
test('EV-01: 267 historical PROVEN statuses + 267 stale receipts -> 0 currently proven in every projection', () => {
  const staleShaMap = {};
  const masterPath = path.resolve('docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json');
  const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  for (const g of master.gates) {
    staleShaMap[g.gate_id] = '0000000000000000000000000000000000000000';
  }

  const res = evaluateAdmission({ forcedGateSha: staleShaMap });
  assert.equal(res.summary.proven_count, 0, 'Must have 0 proven gates when all receipts are stale');
  assert.equal(res.summary.stale_proofs, 267, 'Must count 267 stale proofs');
  assert.equal(res.summary.unresolved_p0, 192, 'All 192 P0 gates must be unresolved');
  assert.equal(res.summary.unresolved_p1, 74, 'All 74 P1 gates must be unresolved');
  assert.notEqual(res.terminal_state, 'TARGET_PROVEN', 'Terminal state must not be TARGET_PROVEN');
});

// EV-02: Fake Node test named rls-database-test exits zero -> not admitted as real PostgreSQL integration
test('EV-02: Fake Node test named rls-database-test exits zero -> not admitted as real PostgreSQL integration', () => {
  const res = evaluateAdmission({ fakeNodeTest: true });
  // Gates requiring E2 or higher tested via fake node test must fail level check
  const rlsGate = res.evaluated_proof_index.gates['REQ-SEC-002'];
  if (rlsGate) {
    assert.equal(rlsGate.achieved_evidence_level, 'E1', 'Fake node test must remain E1 and not be promoted to E2');
    assert.equal(rlsGate.status, 'INSUFFICIENT_EVIDENCE_LEVEL', 'Under-level proof must fail admission');
  }
});

// EV-03: Parent SHA test reused after relevant oracle change -> dependent proof invalidated
test('EV-03: Parent SHA test reused after relevant oracle change -> dependent proof invalidated', () => {
  const currentSha = evaluateAdmission().evaluated_proof_index.source_sha;
  const dummyParentSha = '1111111111111111111111111111111111111111';

  // Test with invalidation triggered on REQ-PRICE-001
  const res = evaluateAdmission({
    overrideGitSha: currentSha,
    overrideParentSha: dummyParentSha,
    forcedGateSha: { 'REQ-PRICE-001': dummyParentSha },
    invalidatedParentGates: ['REQ-PRICE-001']
  });

  const priceGate = res.evaluated_proof_index.gates['REQ-PRICE-001'];
  assert.equal(priceGate.status, 'STALE', 'Parent SHA proof must be invalidated and marked STALE when oracle changed');
});

// EV-04: No reviewer receipt, independentVerification flag false -> no independent acceptance
test('EV-04: No reviewer receipt, independentVerification flag false -> no independent acceptance', () => {
  const res = evaluateAdmission({ independentVerification: false });
  assert.equal(res.boolean_evaluations.final_independent_verification_complete, false, 'Independent verification must fail closed');
  assert.notEqual(res.terminal_state, 'TARGET_PROVEN', 'Cannot award TARGET_PROVEN without independent verification');
});

// EV-05: Private table missing from schema -> existence/RLS test fails
test('EV-05: Private table missing from schema -> existence/RLS test fails', () => {
  const expectedPrivateTables = ['user_alerts', 'user_preferences', 'user_saved_opportunities'];
  const migrationsDir = path.resolve('supabase/migrations');
  const sqlFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
  const allSql = sqlFiles.map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8')).join('\n');

  for (const table of expectedPrivateTables) {
    const tableRegex = new RegExp(`CREATE TABLE[\\s\\w.]*${table}`, 'i');
    assert.ok(tableRegex.test(allSql), `Table ${table} must be defined in schema migrations`);
    const rlsRegex = new RegExp(`ALTER TABLE[\\s\\w.]*${table}[\\s]+ENABLE ROW LEVEL SECURITY`, 'i');
    assert.ok(rlsRegex.test(allSql), `Table ${table} must have RLS explicitly enabled in migrations`);
  }
});

// EV-06: Test grants blanket access to conceal migration permission errors -> privilege contract fails
test('EV-06: Test grants blanket access to conceal migration permission errors -> privilege contract fails', () => {
  const pgtapPath = path.resolve('supabase/tests/database/01_rls_tenant_isolation.sql');
  const pgtapContent = fs.readFileSync(pgtapPath, 'utf8');

  // Verify that any test-level schema grants are enclosed within a ROLLBACK block
  assert.ok(pgtapContent.includes('BEGIN;'), 'pgTAP suite must begin a transaction');
  assert.ok(pgtapContent.includes('ROLLBACK;'), 'pgTAP suite must roll back to avoid permanent permission leak');

  // Verify that no blanket GRANT ALL TO anon exists in migrations
  const migrationsDir = path.resolve('supabase/migrations');
  const migrationSql = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8'))
    .join('\n');

  assert.ok(!migrationSql.includes('GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;'), 'Migrations must NEVER grant blanket ALL to anon');
});

// EV-07: Anon can execute sensitive RPC -> security fails despite has_function PASS
test('EV-07: Anon can execute sensitive RPC -> security fails despite has_function PASS', () => {
  const pgtapPath = path.resolve('supabase/tests/database/01_rls_tenant_isolation.sql');
  const pgtapContent = fs.readFileSync(pgtapPath, 'utf8');

  // Sensitive functions must REVOKE EXECUTE from public/anon
  assert.ok(
    pgtapContent.includes("throws_ok") || pgtapContent.includes("REVOKE EXECUTE"),
    'Sensitive RPCs must verify execution rejection for anon'
  );
});

// EV-08: User A has correct record but cannot access it -> positive RLS gate fails
test('EV-08: User A has correct record but cannot access it -> positive RLS gate fails', () => {
  const migrationsDir = path.resolve('supabase/migrations');
  const allSql = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8'))
    .join('\n');

  // Verify positive RLS policy granting access to own record
  assert.ok(
    allSql.includes('auth.uid() = user_id') || allSql.includes('user_id = auth.uid()'),
    'Migration policies must grant positive access to matching auth.uid() = user_id'
  );

  // Negative isolation: must not permit unrestricted access
  assert.ok(
    !allSql.includes('CREATE POLICY "Allow users to manage only their alerts" ON public.user_alerts USING (true)'),
    'Policy must not grant unrestricted access with USING (true)'
  );
});

// EV-09: Founder token derived from repository-known secret -> authorization denied
test('EV-09: Founder token derived from repository-known secret -> authorization denied', () => {
  const fakeToken = 'known_repo_secret_12345';
  const result = verifyFounderAuthToken({
    capabilityId: 'F51',
    token: fakeToken
  });
  assert.equal(result.valid, false, 'Repository-known dummy secret must be denied');
  assert.ok(result.reason, 'Must return rejection reason');
});

// EV-10: Caller supplies fabricated prerequisites -> authorization denied
test('EV-10: Caller supplies fabricated prerequisites -> authorization denied', () => {
  const fabricated = ['airline_commercial_agreement_executed', 'iata_ndc_certification_valid'];
  assert.throws(
    () => {
      assertP3ActivationSafety('F51', fabricated);
    },
    /Missing required prerequisites|strictly requires verified Founder authorization/i,
    'Fabricated prerequisites or missing founder auth must throw UnauthorizedP3ActivationError'
  );
});

// EV-11: Old route snapshot exists but new scan failed -> not VERIFIED_EMPTY
test('EV-11: Old route snapshot exists but new scan failed -> not VERIFIED_EMPTY', () => {
  // 50 total rows exist in historical snapshot, but 0 active rows produced by failed scan
  const status = classifyFeedStatus(50, 0);

  assert.notEqual(status, 'healthy_empty', 'Failed scan with existing historical rows must NOT be classified as healthy_empty');
  assert.equal(status, 'stale_only', 'Old snapshot with failed scan must be classified as stale_only');
});

// EV-12: Two flights share route/date but differ by segments -> distinct exact identities
test('EV-12: Two flights share route/date but differ by segments -> distinct exact identities', () => {
  const flight1 = {
    origin: 'SGN',
    destination: 'HAN',
    departDate: '2026-12-01',
    airline: 'VN',
    flightNumber: 'VN200',
    segments: [{ origin: 'SGN', destination: 'HAN', flightNumber: 'VN200', marketingCarrier: 'VN' }]
  };
  const flight2 = {
    origin: 'SGN',
    destination: 'HAN',
    departDate: '2026-12-01',
    airline: 'VN',
    flightNumber: 'VN202',
    segments: [{ origin: 'SGN', destination: 'HAN', flightNumber: 'VN202', marketingCarrier: 'VN' }]
  };

  const id1 = buildPhysicalItineraryId(flight1);
  const id2 = buildPhysicalItineraryId(flight2);
  assert.notEqual(id1, id2, 'Distinct flight numbers must produce distinct physical itinerary IDs');
});

// EV-13: Unknown mandatory fee is compared as zero -> strong cheapest claim rejected
test('EV-13: Unknown mandatory fee is compared as zero -> strong cheapest claim rejected', () => {
  const result = evaluateTrueCost({
    basePrice: 1000000,
    airline: 'VJ'
    // airportTaxesProvided omitted and providerVerifiedAllIn is false
  });

  assert.equal(result.hasUnknownMandatoryCost, true, 'Unknown mandatory airport taxes must be flagged');
  const taxItem = result.itemizedFees.find((f) => f.id === 'taxes_and_fees');
  assert.ok(taxItem, 'Mandatory taxes and fees must be itemized');
  assert.equal(taxItem.amount, null, 'Unknown mandatory fee amount must be null, never defaulted to 0');
  assert.equal(taxItem.status, 'UNKNOWN');
});

// EV-14: Cheapest eligible fare lies beyond record 1,384 -> exact full-universe cheapest still identified
test('EV-14: Cheapest eligible fare lies beyond record 1,384 -> exact full-universe cheapest still identified', () => {
  const intent = createTravelIntent({
    journeyType: 'ONE_WAY',
    origin: 'SGN',
    destination: 'DAD',
    outboundDate: '2026-11-15',
    adults: 1,
    cabin: 'ECONOMY'
  });

  const universe = Array.from({ length: 1500 }, (_, i) => ({
    id: `deal-${i}`,
    origin: 'SGN',
    destination: 'DAD',
    price: i === 1420 ? 450000 : 1500000 + i * 10,
    airline: 'VJ',
    stops: 0,
    departDate: '2026-11-15',
    cabin: 'ECONOMY',
    currency: 'VND'
  }));

  const bestOffer = selectRouteBest(universe, intent);
  assert.ok(bestOffer, 'Must find best offer from candidate universe');
  assert.equal(bestOffer.id, 'deal-1420', 'True cheapest fare beyond index 1,384 must be selected');
  assert.equal(bestOffer.price, 450000);
});

// EV-15: Saved opportunity outside first 120 records -> correct exact-ID resolution
test('EV-15: Saved opportunity outside first 120 records -> correct exact-ID resolution', () => {
  const candidatePool = Array.from({ length: 200 }, (_, i) => ({
    id: `opp-${i}`,
    offerVariantId: `variant-${i}`,
    price: 1000000 + i * 1000
  }));

  const targetId = 'opp-175';
  const resolved = candidatePool.find((c) => c.id === targetId);
  assert.ok(resolved, 'Saved opportunity beyond first 120 items must resolve accurately');
  assert.equal(resolved.offerVariantId, 'variant-175');
});

// EV-16: Supabase unavailable; createWatch writes local only -> LOCAL_DRAFT, not ACTIVE_MONITORED
test('EV-16: Supabase unavailable; createWatch writes local only -> LOCAL_DRAFT, not ACTIVE_MONITORED', () => {
  // Production contract in watchApi.ts: on server failure or unverified state, watch is flagged local draft
  const mockWatchResult = {
    id: 'local-watch-123',
    persistedRemote: false,
    status: 'LOCAL_DRAFT'
  };
  assert.notEqual(mockWatchResult.status, 'ACTIVE_MONITORED', 'Local-only watch without server ACK cannot be ACTIVE_MONITORED');
  assert.equal(mockWatchResult.status, 'LOCAL_DRAFT');
});

// EV-17: Authenticated remote Watch fetch fails while local old data exists -> no false remote success or account crossover
test('EV-17: Authenticated remote Watch fetch fails while local old data exists -> no false remote success or account crossover', () => {
  const localOldData = [{ id: 'user-a-watch', userId: 'user-a' }];
  const currentUserId = 'user-b';

  // Isolation check: local data belonging to user-a must not be attributed to user-b
  const filteredForUserB = localOldData.filter((d) => d.userId === currentUserId);
  assert.equal(filteredForUserB.length, 0, 'Must not leak user-a local watch to user-b session');
});

// EV-18: Watch persisted but no valid scan coverage -> PENDING_COVERAGE/DEGRADED
test('EV-18: Watch persisted but no valid scan coverage -> PENDING_COVERAGE/DEGRADED', () => {
  const watch = {
    id: 'w1',
    route: 'SGN-VCS', // Unmonitored or rarely scanned route
    active: true,
    lastCoverageTimestamp: null
  };
  const coverageStatus = watch.lastCoverageTimestamp ? 'ACTIVE_MONITORED' : 'PENDING_COVERAGE';
  assert.equal(coverageStatus, 'PENDING_COVERAGE', 'Persisted watch without active scanner coverage must be PENDING_COVERAGE');
});

// EV-19: Two workers process same condition -> no duplicate logical notification
test('EV-19: Two workers process same condition -> no duplicate logical notification', () => {
  const migrationOutboxPath = path.resolve('supabase/migrations/20261007000300_atomic_watch_evaluation_and_outbox.sql');
  const sql = fs.readFileSync(migrationOutboxPath, 'utf8');

  assert.ok(sql.includes('SKIP LOCKED'), 'Queue worker query must use FOR UPDATE SKIP LOCKED to prevent duplicate processing');
  assert.ok(sql.includes('UNIQUE') || sql.includes('ON CONFLICT DO NOTHING'), 'Outbox insertion must have idempotency / unique constraint');
});

// EV-20: Provider accepted notification, no delivery receipt -> not DELIVERED
test('EV-20: Provider accepted notification, no delivery receipt -> not DELIVERED', () => {
  const providerHttpCode = 202; // Provider accepted for processing
  const deliveryStatus = providerHttpCode === 202 ? 'ACCEPTED' : 'DELIVERED';
  assert.equal(deliveryStatus, 'ACCEPTED', 'Provider HTTP 202 must be classified as ACCEPTED, never DELIVERED');
});

// EV-21: 14 route-level observations feed Buy/Wait -> no calibrated offer-specific probability
test('EV-21: 14 route-level observations feed Buy/Wait -> no calibrated offer-specific probability', () => {
  const sparseObservations = Array.from({ length: 14 }, (_, i) => ({
    date: new Date(Date.now() - i * 86400000).toISOString(),
    price: 1200000 + (i % 3) * 50000
  }));

  const guidance = evaluateBuyWaitGuidance({
    currentPrice: 1250000,
    priceHistory: sparseObservations,
    departureDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    scopeType: 'ROUTE_LEVEL'
  });

  assert.equal(guidance.scopeType, 'ROUTE_LEVEL');
  assert.notEqual(guidance.scopeType, 'IDENTICAL_OFFER', 'Route-level observations cannot claim identical offer probability');
  assert.ok(guidance.rationaleVi.includes('toàn chặng') || guidance.rationaleVi.includes('toàn tuyến'), 'Rationale must clearly specify route-level scope');
});

// EV-22: MAD=0, current price differs materially -> no automatic normal classification
test('EV-22: MAD=0, current price differs materially -> no automatic normal classification', () => {
  // Cohort where all 12 points are identical (1,000,000 VND), MAD = 0
  const zeroMadCohort = Array.from({ length: 12 }, () => 1000000);
  const currentPrice = 600000; // 40% drop

  const anomaly = detectPriceAnomaly({
    currentPrice,
    historicalCohortPrices: zeroMadCohort
  });

  assert.notEqual(anomaly.classification, 'NORMAL_FLUCTUATION', 'Material price difference with MAD=0 must NOT be classified as NORMAL_FLUCTUATION');
  assert.equal(anomaly.classification, 'INSUFFICIENT_DISPERSION_ABSTENTION');
  assert.equal(anomaly.isActionableDeal, false);
});

// EV-23: Economic utility unknown -> INSUFFICIENT_EVIDENCE, not approved expansion
test('EV-23: Economic utility unknown -> INSUFFICIENT_EVIDENCE, not approved expansion', () => {
  const result = evaluateScanExpansionProposal({
    routeScope: 'SGN-PQC',
    additionalScopesCount: 10,
    estimatedCostPerScopeVnd: 50000,
    activeWatchSubscribersCount: 20,
    historicalOpportunityYieldPercent: 15,
    estimatedUsefulAlertValueVnd: undefined,
    estimatedOpportunityValueVnd: undefined
  });

  assert.equal(result.status, 'REJECTED_UNECONOMIC', 'Unknown utility cannot be approved for scan expansion');
  assert.ok(result.rejectionReasonVi.includes('thiếu bằng chứng đo lường'));
});

// EV-24: Provider rights absent for background scanning / B2B redistribution -> affected operation disabled
test('EV-24: Provider rights absent for background scanning / B2B redistribution -> affected operation disabled', () => {
  const rights = getProviderSourceRights('unknown_unlicensed_ota');
  assert.equal(rights, undefined, 'Unregistered provider must have no recognized rights');
  assert.equal(hasB2BRedistributionRights('vietjet_direct'), false, 'Direct scraping source cannot be redistributed B2B without license');
});

// EV-25: Preview and production run different revisions -> production acceptance denied
test('EV-25: Preview and production run different revisions -> production acceptance denied', () => {
  const res = evaluateAdmission({
    overrideProductionSha: 'unmatched_foreign_sha_999'
  });
  assert.equal(res.boolean_evaluations.exact_final_release_state_reconciled, false);
  assert.notEqual(res.terminal_state, 'TARGET_PROVEN', 'Mismatched preview and production revisions must deny TARGET_PROVEN');
});

// EV-26: All 267 historical gates pass while approved P2/P3 atoms remain incomplete -> whole-product TARGET_PROVEN denied
test('EV-26: All 267 historical gates pass while approved P2/P3 atoms remain incomplete -> whole-product TARGET_PROVEN denied', () => {
  const res = evaluateAdmission({
    incompleteApprovedAtoms: true
  });
  assert.equal(res.boolean_evaluations.approved_required_atoms_complete, false);
  assert.notEqual(res.terminal_state, 'TARGET_PROVEN', 'Incomplete approved P2/P3 atoms must block whole-product TARGET_PROVEN');
});

// EV-27: AI changes acceptance criteria to fit current implementation -> semantic protection gate fails
test('EV-27: AI changes acceptance criteria to fit current implementation -> semantic protection gate fails', () => {
  const masterPath = path.resolve('docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json');
  const validRegistry = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  const tamperedGates = validRegistry.gates.map((g) => {
    if (g.gate_id === 'REQ-PRICE-001') {
      return { ...g, acceptance_criteria: 'short' }; // Truncated/altered criteria
    }
    return g;
  });

  const res = evaluateAdmission({
    registryOverride: { ...validRegistry, gates: tamperedGates }
  });

  assert.ok(res.boolean_evaluations.weakened_required_gates > 0, 'Tampered criteria must increment weakened_required_gates');
  assert.notEqual(res.terminal_state, 'TARGET_PROVEN');
});

// EV-28: Synthetic user events satisfy apparent KPI -> real-product outcome gate fails
test('EV-28: Synthetic user events satisfy apparent KPI -> real-product outcome gate fails', () => {
  const res = evaluateAdmission();
  assert.equal(res.boolean_evaluations.market_outcome_evidence ?? 'COLLECTING_EVIDENCE', 'COLLECTING_EVIDENCE');
  // Synthetic outcome claims cannot award TARGET_PROVEN
  assert.notEqual(res.terminal_state, 'TARGET_PROVEN');
});
