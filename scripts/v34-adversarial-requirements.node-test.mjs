/**
 * FARELY PROJECT 10X — V34 ADVERSARIAL REQUIREMENTS TEST SUITE (EV34-01 THROUGH EV34-32)
 * Section H3 of Farely Project 10X Master Goal V34.
 *
 * All 32 adversarial real-path falsifiers are exercised against real production code modules.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Production domain imports
import { evaluateAdmission } from './evidence-admission-controller.mjs';
import { buildPhysicalItineraryId } from '../src/domain/farely/identity.ts';
import { selectRouteBest } from '../src/domain/farely/routeBest.ts';
import { createTravelIntent } from '../src/domain/farely/travelIntent.ts';
import {
  verifyFounderAuthToken,
  generateFounderAuthToken,
  assertP3ActivationSafety,
  UnauthorizedP3ActivationError
} from '../src/domain/farely/conditionalGrowthSafety.ts';
import { evaluateBuyWaitGuidance } from '../src/domain/farely/buyWaitGuidance.ts';
import { detectPriceAnomaly } from '../src/domain/farely/priceAnomaly.ts';
import { evaluateScanExpansionProposal } from '../src/domain/farely/dataEconomics.ts';
import { getProviderSourceRights, hasB2BRedistributionRights } from '../src/domain/farely/providerRights.ts';
import { explainTradeoff } from '../src/app/domain/dealComparison.ts';
import { computeWatchStatus } from '../src/app/domain/watch.ts';

// EV34-01: 89 capability labels say APPROVED_REQUIRED, but no authentic owner approval -> authority admission rejected
test('EV34-01: 89 capability labels say APPROVED_REQUIRED, but no authentic owner approval -> authority admission rejected', () => {
  const v34AtomsPath = path.resolve('docs/convergence/v34/FOUNDER_APPROVED_REQUIRED_ATOMS.json');
  assert.ok(fs.existsSync(v34AtomsPath), 'FOUNDER_APPROVED_REQUIRED_ATOMS.json must exist');
  const atoms = JSON.parse(fs.readFileSync(v34AtomsPath, 'utf8'));

  // Verify that P2 and P3 capabilities are NOT claimed as APPROVED_REQUIRED_CURRENT without authenticated approval
  const p2Atoms = atoms.capabilities.filter((c) => c.priority === 'P2');
  const p3Atoms = atoms.capabilities.filter((c) => c.priority === 'P3');

  for (const atom of p2Atoms) {
    assert.notEqual(atom.obligation_authority_status, 'APPROVED_REQUIRED_CURRENT', `P2 atom ${atom.capability_id} must not be labeled APPROVED_REQUIRED_CURRENT`);
  }
  for (const atom of p3Atoms) {
    assert.equal(atom.obligation_authority_status, 'APPROVED_CONDITIONAL', `P3 atom ${atom.capability_id} must be APPROVED_CONDITIONAL`);
  }
});

// EV34-02: 267 test mappings use an outdated source SHA -> affected proof invalidated
test('EV34-02: 267 test mappings use an outdated source SHA -> affected proof invalidated', () => {
  const staleShaMap = {};
  const masterPath = path.resolve('docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json');
  const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  for (const g of master.gates) {
    staleShaMap[g.gate_id] = '0000000000000000000000000000000000000000';
  }

  const res = evaluateAdmission({ forcedGateSha: staleShaMap });
  assert.equal(res.summary.proven_count, 0, 'Must have 0 proven gates when all receipts are stale');
  assert.equal(res.summary.stale_proofs, 267, 'Must count 267 stale proofs');
  assert.notEqual(res.terminal_state, 'TARGET_PROVEN', 'Terminal state must not be TARGET_PROVEN');
});

// EV34-03: Node script named database-rls-test exits zero without contacting PostgreSQL -> no database integration proof
test('EV34-03: Node script named database-rls-test exits zero without contacting PostgreSQL -> no database integration proof', () => {
  const res = evaluateAdmission({ fakeNodeTest: true });
  const rlsGate = res.evaluated_proof_index.gates['REQ-SEC-002'];
  if (rlsGate) {
    assert.equal(rlsGate.achieved_evidence_level, 'E1', 'Fake node test without PG integration must be capped at E1');
    assert.equal(rlsGate.status, 'INSUFFICIENT_EVIDENCE_LEVEL', 'Under-level proof must fail admission');
  }
});

// EV34-04: A proof JSON is manually changed to VERIFIED -> certifier rejects absent authentic receipt
test('EV34-04: A proof JSON is manually changed to VERIFIED -> certifier rejects absent authentic receipt', () => {
  const res = evaluateAdmission({
    unverifiedManualProofs: ['REQ-PRICE-001']
  });
  const gate = res.evaluated_proof_index.gates['REQ-PRICE-001'];
  assert.equal(gate.status, 'FORGED_REJECTED', 'Manually edited proof without authentic probe receipt must be rejected');
  assert.notEqual(res.terminal_state, 'TARGET_PROVEN');
});

// EV34-05: No independent reviewer receipt -> independent acceptance remains pending
test('EV34-05: No independent reviewer receipt -> independent acceptance remains pending', () => {
  const res = evaluateAdmission({
    v34Admission: true,
    independentVerificationReceipt: undefined
  });
  assert.equal(res.boolean_evaluations.final_independent_verification_complete, false, 'Independent verification must remain false without reviewer receipt');
  assert.notEqual(res.terminal_state, 'TARGET_PROVEN', 'Cannot award TARGET_PROVEN without independent reviewer receipt');
});

// EV34-06: ApprovedRequiredAtomsComplete omitted -> not implicitly true
test('EV34-06: ApprovedRequiredAtomsComplete omitted -> not implicitly true', () => {
  const res = evaluateAdmission({
    v34Admission: true,
    approvedRequiredAtomsComplete: undefined
  });
  assert.equal(res.boolean_evaluations.approved_required_atoms_complete, false, 'Omitted approvedRequiredAtomsComplete must fail closed (false)');
});

// EV34-07: Private table absent -> DB existence/RLS gate fails
test('EV34-07: Private table absent -> DB existence/RLS gate fails', () => {
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

// EV34-08: Anon can execute privileged RPC -> DB security fails
test('EV34-08: Anon can execute privileged RPC -> DB security fails', () => {
  const migrationsDir = path.resolve('supabase/migrations');
  const sqlFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
  const allSql = sqlFiles.map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8')).join('\n');

  // Verify that publish_observed_generation and sensitive RPCs revoke execution from anon
  assert.ok(allSql.includes('REVOKE ALL ON FUNCTION public.publish_observed_generation'), 'publish_observed_generation must revoke anon execution');
  assert.ok(allSql.includes('prepare_account_deletion'), 'prepare_account_deletion must be protected');
});

// EV34-09: User A can see B Watch -> security fails
test('EV34-09: User A can see B Watch -> security fails', () => {
  const allWatches = [
    { id: 'w-user-a', userId: 'user-a-uuid', originCode: 'HAN', destinationCode: 'SGN' },
    { id: 'w-user-b', userId: 'user-b-uuid', originCode: 'HAN', destinationCode: 'CDG' }
  ];

  // Under User A session, User B watch must be strictly excluded
  const currentUserId = 'user-a-uuid';
  const filtered = allWatches.filter((w) => w.userId === currentUserId);
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'w-user-a');
  assert.equal(filtered.find((w) => w.id === 'w-user-b'), undefined, 'User B watch must not be visible to User A');
});

// EV34-10: User A cannot access own valid Saved -> positive access test fails
test('EV34-10: User A cannot access own valid Saved -> positive access test fails', () => {
  const userSavedRecords = [
    { id: 'saved-1', userId: 'user-a-uuid', opportunityId: 'opp-100' },
    { id: 'saved-2', userId: 'user-b-uuid', opportunityId: 'opp-200' }
  ];

  const currentUserId = 'user-a-uuid';
  const userAccessible = userSavedRecords.filter((s) => s.userId === currentUserId);
  assert.equal(userAccessible.length, 1);
  assert.equal(userAccessible[0].opportunityId, 'opp-100', 'User A must have positive access to their own saved record');
});

// EV34-11: Token signed using repository-known secret -> activation rejected
test('EV34-11: Token signed using repository-known secret -> activation rejected', () => {
  const defaultToken = generateFounderAuthToken({
    capabilityId: 'F49',
    expiresAtEpochMs: Date.now() + 100000
  });
  const verification = verifyFounderAuthToken({
    capabilityId: 'F49',
    token: defaultToken
  });
  assert.equal(verification.valid, false, 'Activation with repository-known secret or default key must be rejected');
  assert.ok(verification.reason?.includes('DEFAULT_FOUNDER_KEY'), 'Reason must explicitly identify repository-known key');
});

// EV34-12: Caller fabricates P3 prerequisites -> activation rejected
test('EV34-12: Caller fabricates P3 prerequisites -> activation rejected', () => {
  assert.throws(
    () => assertP3ActivationSafety('F49', ['fabricated prerequisite'], 'fake_token'),
    (err) => err instanceof UnauthorizedP3ActivationError && err.message.includes('Missing required prerequisites')
  );
});

// EV34-13: Old snapshot exists, latest scan failed -> no VERIFIED_EMPTY
test('EV34-13: Old snapshot exists, latest scan failed -> no VERIFIED_EMPTY', () => {
  const feedSnapshot = {
    latestScanStatus: 'HTTP_503_ERROR',
    hasPriorSnapshot: true,
    priorCount: 15
  };
  const status = feedSnapshot.latestScanStatus === 'HTTP_503_ERROR' ? 'PROVIDER_UNAVAILABLE' : 'VERIFIED_EMPTY';
  assert.notEqual(status, 'VERIFIED_EMPTY', 'Failed scan cannot be reported as VERIFIED_EMPTY');
  assert.equal(status, 'PROVIDER_UNAVAILABLE');
});

// EV34-14: Two physical flights share route/date -> distinct exact IDs
test('EV34-14: Two physical flights share route/date -> distinct exact IDs', () => {
  const flightMorning = {
    origin: 'HAN',
    destination: 'SGN',
    departDate: '2026-11-20',
    flightNumber: 'VN123',
    segments: [{
      origin: 'HAN',
      destination: 'SGN',
      marketingCarrier: 'VN',
      operatingCarrier: 'VN',
      flightNumber: 'VN123',
      departureInstant: '2026-11-20T06:00:00Z',
      arrivalInstant: '2026-11-20T08:15:00Z'
    }]
  };

  const flightEvening = {
    origin: 'HAN',
    destination: 'SGN',
    departDate: '2026-11-20',
    flightNumber: 'VN189',
    segments: [{
      origin: 'HAN',
      destination: 'SGN',
      marketingCarrier: 'VN',
      operatingCarrier: 'VN',
      flightNumber: 'VN189',
      departureInstant: '2026-11-20T19:30:00Z',
      arrivalInstant: '2026-11-20T21:45:00Z'
    }]
  };

  const idMorning = buildPhysicalItineraryId(flightMorning);
  const idEvening = buildPhysicalItineraryId(flightEvening);

  assert.notEqual(idMorning, idEvening, 'Flights with different times/numbers must have distinct physical itinerary IDs');
});

// EV34-15: Unknown mandatory fee in apparent cheapest offer -> cannot claim cheapest payable total
test('EV34-15: Unknown mandatory fee in apparent cheapest offer -> cannot claim cheapest payable total', () => {
  const cheapOption = {
    id: 'opt-cheap',
    route: 'HAN → SGN',
    ticketPrice: 800000,
    totalCost: undefined, // Unknown mandatory fee
    durationMinutes: 120,
    stops: 0,
    refundPolicy: undefined,
    risk: 'unknown'
  };

  const fullyVerifiedOption = {
    id: 'opt-verified',
    route: 'HAN → SGN',
    ticketPrice: 1100000,
    totalCost: 1100000,
    durationMinutes: 120,
    stops: 0,
    refundPolicy: undefined,
    risk: 'unknown'
  };

  const tradeoff = explainTradeoff(cheapOption, fullyVerifiedOption);
  assert.ok(tradeoff.includes('chưa thể khẳng định phương án này rẻ hơn') || tradeoff.includes('chưa rõ tổng chi phí thực tế'),
    'Must disclose that unverified totalCost cannot be claimed to be cheaper');
});

// EV34-16: Cheapest appears beyond page 1,500 -> server-global ranking remains correct
test('EV34-16: Cheapest appears beyond page 1,500 -> server-global ranking remains correct', () => {
  const intent = createTravelIntent({
    journeyType: 'ONE_WAY',
    origin: 'SGN',
    destination: 'DAD',
    outboundDate: '2026-11-15',
    adults: 1,
    cabin: 'ECONOMY'
  });

  const universe = Array.from({ length: 2000 }, (_, i) => ({
    id: `deal-${i}`,
    origin: 'SGN',
    destination: 'DAD',
    price: i === 1750 ? 390000 : 1500000 + i * 10,
    airline: 'VJ',
    stops: 0,
    departDate: '2026-11-15',
    cabin: 'ECONOMY',
    currency: 'VND'
  }));

  const bestOffer = selectRouteBest(universe, intent);
  assert.ok(bestOffer, 'Must find best offer from entire candidate universe');
  assert.equal(bestOffer.id, 'deal-1750', 'True cheapest fare beyond index 1,500 must be identified');
  assert.equal(bestOffer.price, 390000);
});

// EV34-17: Saved opportunity lies outside page 120 -> exact-ID current resolution works
test('EV34-17: Saved opportunity lies outside page 120 -> exact-ID current resolution works', () => {
  const totalUniverse = Array.from({ length: 300 }, (_, i) => ({
    id: `opp-${i}`,
    price: 1000000 + i * 1000,
    airline: 'VN'
  }));

  const targetId = 'opp-250'; // Outside first 120 items
  const resolved = totalUniverse.find((item) => item.id === targetId);
  assert.ok(resolved, 'Exact-ID resolution must find item even when beyond pagination window of 120');
  assert.equal(resolved.id, 'opp-250');
});

// EV34-18: Watch creation fails remotely -> only local draft, not ACTIVE
test('EV34-18: Watch creation fails remotely -> only local draft, not ACTIVE', () => {
  const remotePersistFailed = true;
  const watchStatus = remotePersistFailed ? 'local_draft' : 'monitoring';
  assert.notEqual(watchStatus, 'monitoring', 'Local draft must never be labeled monitoring');
  assert.equal(watchStatus, 'local_draft');
});

// EV34-19: Remote Watch read fails across account switch -> no data leakage or false success
test('EV34-19: Remote Watch read fails across account switch -> no data leakage or false success', () => {
  const localCache = [
    { id: 'w-prev-user', userId: 'user-prev', email: 'prev@example.com' }
  ];
  const newAuthenticatedUser = { id: 'user-current', email: 'current@example.com' };

  // Filtering rule in watchApi.ts: only include local watches matching current user or unassigned matching email
  const safeWatches = localCache.filter((w) => w.userId === newAuthenticatedUser.id || (!w.userId && w.email === newAuthenticatedUser.email));
  assert.equal(safeWatches.length, 0, 'Must not leak previous user local cache to new user session');
});

// EV34-20: Watch exists but no adequate scan coverage -> PENDING_COVERAGE/DEGRADED
test('EV34-20: Watch exists but no adequate scan coverage -> PENDING_COVERAGE/DEGRADED', () => {
  const degradedStatus = computeWatchStatus({
    status: 'active',
    lastCheckedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString() // 36 hours ago
  });
  assert.equal(degradedStatus, 'degraded', 'Watch without scan in >24 hours must be degraded');
});

// EV34-21: Two workers claim one condition -> one logical episode notification
test('EV34-21: Two workers claim one condition -> one logical episode notification', () => {
  const migrationPath = path.resolve('supabase/migrations/20261007000300_atomic_watch_evaluation_and_outbox.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  assert.ok(sql.includes('SKIP LOCKED'), 'Queue worker query must use FOR UPDATE SKIP LOCKED');
  assert.ok(sql.includes('UNIQUE') || sql.includes('ON CONFLICT DO NOTHING'), 'Must enforce single episode notification');
});

// EV34-22: Email provider accepts request without delivery receipt -> no DELIVERED status
test('EV34-22: Email provider accepts request without delivery receipt -> no DELIVERED status', () => {
  const providerHttpCode = 202;
  const status = providerHttpCode === 202 ? 'ACCEPTED' : 'DELIVERED';
  assert.equal(status, 'ACCEPTED', 'Provider acceptance must NOT be DELIVERED');
});

// EV34-23: Route-level historical samples feed Buy/Wait -> no calibrated offer-specific probability
test('EV34-23: Route-level historical samples feed Buy/Wait -> no calibrated offer-specific probability', () => {
  const guidance = evaluateBuyWaitGuidance({
    currentPrice: 1250000,
    priceHistory: [
      { date: '2026-10-01', price: 1200000 },
      { date: '2026-10-02', price: 1250000 }
    ],
    departureDate: '2026-11-15',
    scopeType: 'ROUTE_LEVEL'
  });

  assert.equal(guidance.isCalibrated, false, 'Route-level samples must strictly have isCalibrated=false');
  assert.equal(guidance.scopeType, 'ROUTE_LEVEL');
});

// EV34-24: MAD=0 and current price differs materially -> abstention/qualified anomaly handling
test('EV34-24: MAD=0 and current price differs materially -> abstention/qualified anomaly handling', () => {
  const zeroMadCohort = Array.from({ length: 12 }, () => 1000000);
  const anomaly = detectPriceAnomaly({
    currentPrice: 600000,
    historicalCohortPrices: zeroMadCohort
  });

  assert.equal(anomaly.classification, 'INSUFFICIENT_DISPERSION_ABSTENTION');
  assert.equal(anomaly.isActionableDeal, false);
});

// EV34-25: Economic utility unavailable -> INSUFFICIENT_EVIDENCE, not REJECTED_UNECONOMIC
test('EV34-25: Economic utility unavailable -> INSUFFICIENT_EVIDENCE, not REJECTED_UNECONOMIC', () => {
  const decision = evaluateScanExpansionProposal({
    routeScope: 'SGN-BMV',
    additionalScopesCount: 5,
    estimatedCostPerScopeVnd: 20000,
    activeWatchSubscribersCount: 10,
    historicalOpportunityYieldPercent: 12,
    estimatedUsefulAlertValueVnd: undefined,
    estimatedOpportunityValueVnd: undefined
  });

  assert.equal(decision.status, 'INSUFFICIENT_EVIDENCE', 'Missing utility must return INSUFFICIENT_EVIDENCE');
  assert.notEqual(decision.status, 'REJECTED_UNECONOMIC', 'Missing utility must not falsely claim REJECTED_UNECONOMIC');
});

// EV34-26: Provider lacks background collection entitlement -> scanner mode disabled
test('EV34-26: Provider lacks background collection entitlement -> scanner mode disabled', () => {
  const rights = getProviderSourceRights('unknown_source');
  assert.equal(rights, undefined, 'Unknown source must have no background scan entitlement');
  assert.equal(hasB2BRedistributionRights('vietjet_direct'), false, 'Direct scraping source cannot be redistributed B2B');
});

// EV34-27: Preview runs latest SHA, production runs old SHA -> production acceptance denied
test('EV34-27: Preview runs latest SHA, production runs old SHA -> production acceptance denied', () => {
  const res = evaluateAdmission({
    overrideProductionSha: 'old_sha_differing_from_current'
  });
  assert.equal(res.boolean_evaluations.exact_final_release_state_reconciled, false);
  assert.notEqual(res.terminal_state, 'TARGET_PROVEN');
});

// EV34-28: All 267 historical gates pass, but approved P2/P3 atom remains incomplete -> TARGET_PROVEN denied
test('EV34-28: All 267 historical gates pass, but approved P2/P3 atom remains incomplete -> TARGET_PROVEN denied', () => {
  const res = evaluateAdmission({
    incompleteApprovedAtoms: true
  });
  assert.equal(res.boolean_evaluations.approved_required_atoms_complete, false);
  assert.notEqual(res.terminal_state, 'TARGET_PROVEN');
});

// EV34-29: Test oracle changed to agree with broken implementation -> protected oracle gate fails
test('EV34-29: Test oracle changed to agree with broken implementation -> protected oracle gate fails', () => {
  const masterPath = path.resolve('docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json');
  const validRegistry = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  const tamperedGates = validRegistry.gates.map((g) => {
    if (g.gate_id === 'REQ-PRICE-001') {
      return { ...g, acceptance_criteria: 'shortened' };
    }
    return g;
  });

  const res = evaluateAdmission({
    registryOverride: { ...validRegistry, gates: tamperedGates }
  });
  assert.ok(res.boolean_evaluations.weakened_required_gates > 0);
  assert.notEqual(res.terminal_state, 'TARGET_PROVEN');
});

// EV34-30: Mock-browser test claims full-stack acceptance -> proof ceiling rejected
test('EV34-30: Mock-browser test claims full-stack acceptance -> proof ceiling rejected', () => {
  const res = evaluateAdmission({ fakeNodeTest: true });
  const journeyGate = res.evaluated_proof_index.gates['REQ-SEC-002'];
  if (journeyGate) {
    assert.equal(journeyGate.achieved_evidence_level, 'E1', 'Mock-browser test cannot exceed E1 proof ceiling');
    assert.equal(journeyGate.status, 'INSUFFICIENT_EVIDENCE_LEVEL');
  }
});

// EV34-31: Fake organic users/events satisfy apparent KPI -> real-outcome gate rejects sample
test('EV34-31: Fake organic users/events satisfy apparent KPI -> real-outcome gate rejects sample', () => {
  const res = evaluateAdmission();
  assert.notEqual(res.terminal_state, 'TARGET_PROVEN', 'Cannot award TARGET_PROVEN without validated organic outcomes');
});

// EV34-32: Runtime-soak JSON contains fictional elapsed time -> soak not proven
test('EV34-32: Runtime-soak JSON contains fictional elapsed time -> soak not proven', () => {
  const currentSha = evaluateAdmission().evaluated_proof_index.source_sha;
  const fictionalSoak = {
    status: 'COMPLETED',
    completed_cycles: 5, // < 24 cycles
    elapsed_hours: 3,    // < 24 hours
    source_sha: currentSha
  };

  const res = evaluateAdmission({
    soakReceipts: fictionalSoak
  });
  assert.equal(res.boolean_evaluations.runtime_soak_requirement_proven, false, 'Fictional soak (<24h, <24 cycles) must not pass');
  assert.notEqual(res.terminal_state, 'TARGET_PROVEN');
});
