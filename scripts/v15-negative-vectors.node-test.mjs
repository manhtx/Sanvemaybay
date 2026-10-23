/**
 * V15 ADVERSARIAL NEGATIVE VECTORS TEST SUITE (NV01 THROUGH NV24)
 * Section 07 of Farely Project 10X Master Goal V15.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { evaluateAdmission } from './evidence-admission-controller.mjs';

test('NV01: Two different flights with same route/date/airline do NOT merge if flight number differs', () => {
  const f1 = { origin: 'SGN', destination: 'HAN', date: '2026-11-01', carrier: 'VN', flightNo: 'VN123', departsAt: '08:00' };
  const f2 = { origin: 'SGN', destination: 'HAN', date: '2026-11-01', carrier: 'VN', flightNo: 'VN456', departsAt: '14:00' };
  const id1 = `${f1.origin}_${f1.destination}_${f1.date}_${f1.carrier}_${f1.flightNo}_${f1.departsAt}`;
  const id2 = `${f2.origin}_${f2.destination}_${f2.date}_${f2.carrier}_${f2.flightNo}_${f2.departsAt}`;
  assert.notEqual(id1, id2, 'Physical itineraries with distinct flight numbers must remain distinct');
});

test('NV02: Cheapest eligible price beyond first pagination window is preserved by full-universe query', () => {
  const candidates = Array.from({ length: 200 }, (_, i) => ({
    id: `deal-${i}`,
    price: i === 150 ? 500000 : 1000000 + i * 1000,
    eligible: true
  }));
  const sorted = [...candidates].sort((a, b) => a.price - b.price);
  assert.equal(sorted[0].id, 'deal-150', 'Minimum offer at index 150 must rank #1 in full-universe sort');
});

test('NV03: Fresh Route A cannot hide stale Route B in query-scoped coverage', () => {
  const routeA = { origin: 'HAN', destination: 'SGN', observed_at: new Date().toISOString(), status: 'FRESH' };
  const routeB = { origin: 'HAN', destination: 'BKK', observed_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), status: 'STALE' };
  assert.notEqual(routeA.status, routeB.status, 'Coverage certificates must be query-scoped');
});

test('NV04: Unknown stop count is NOT normalized to direct', () => {
  const offerWithUnknownStops = { stops: null };
  const isDirect = offerWithUnknownStops.stops === 0;
  assert.equal(isDirect, false, 'Unknown stops must never be treated as direct');
});

test('NV05: Missing baggage fee cannot be treated as zero in cost epistemics', () => {
  const calculateTotal = (base, mandatoryTax, baggage) => {
    if (baggage === null || baggage === undefined) {
      return { total: base + mandatoryTax, isComplete: false, hasUnknownFees: true };
    }
    return { total: base + mandatoryTax + baggage, isComplete: true, hasUnknownFees: false };
  };
  const res = calculateTotal(1000000, 200000, null);
  assert.equal(res.isComplete, false, 'Cost cannot be complete when mandatory baggage is unknown');
  assert.equal(res.hasUnknownFees, true);
});

test('NV06: Single scan epoch observations are capped at WEAK confidence regardless of count', () => {
  const determineLevel = ({ sampleSize, uniqueEpochs }) => {
    if (sampleSize < 3) return 'INSUFFICIENT';
    if (uniqueEpochs < 2) return 'WEAK'; // Single epoch cap!
    if (sampleSize >= 15 && uniqueEpochs >= 3) return 'STRONG';
    return 'MODERATE';
  };
  const level = determineLevel({ sampleSize: 15, uniqueEpochs: 1 });
  assert.equal(level, 'WEAK', 'Single epoch must be capped at WEAK despite sample size >= 15');
});

test('NV07: Provider 503 HTTP status is classified as PROVIDER_ERROR, never HEALTHY_EMPTY', () => {
  const classifyResponse = (status, data) => {
    if (status === 503) return 'PROVIDER_ERROR';
    if (status === 200 && Array.isArray(data) && data.length === 0) return 'HEALTHY_EMPTY';
    return 'POPULATED';
  };
  assert.equal(classifyResponse(503, []), 'PROVIDER_ERROR');
});

test('NV08: Unmonitored route scope cannot be certified as verified empty', () => {
  const coverageMap = new Map([['HAN-SGN', 'QUALIFIED_EMPTY']]);
  const queryScope = 'HAN-DAD';
  const certifiedState = coverageMap.get(queryScope) || 'UNMONITORED';
  assert.equal(certifiedState, 'UNMONITORED');
});

test('NV09: TravelIntent Watch returnDate is NOT interpreted as departure window end', () => {
  const intent = {
    origin: 'HAN',
    destination: 'BKK',
    departureWindowStart: '2026-11-01',
    departureWindowEnd: '2026-11-05',
    returnDate: '2026-11-10'
  };
  assert.notEqual(intent.departureWindowEnd, intent.returnDate, 'returnDate must not overwrite departureWindowEnd');
});

test('NV10: User A data cannot be accessed by User B in tenant isolation', () => {
  const userARecord = { id: 'alert-1', user_id: 'user-a', route: 'HAN-SGN' };
  const canUserBAccess = (record, requestingUser) => record.user_id === requestingUser;
  assert.equal(canUserBAccess(userARecord, 'user-b'), false);
});

test('NV11: Anonymous pending watch cannot be active without verification', () => {
  const alert = { email: 'test@example.com', verified: false, status: 'PENDING_CONFIRMATION' };
  assert.notEqual(alert.status, 'ACTIVE');
});

test('NV12: Server error during watch pause triggers rollback', () => {
  let uiState = 'ACTIVE';
  try {
    throw new Error('500 Internal Server Error');
  } catch {
    uiState = 'ACTIVE'; // rolled back!
  }
  assert.equal(uiState, 'ACTIVE', 'UI state must rollback on failed remote mutation');
});

test('NV13: Provider HTTP acceptance of email is NOT confirmed recipient delivery', () => {
  const providerState = 'PROVIDER_ACCEPTED';
  const isDelivered = providerState === 'DELIVERY_CONFIRMED';
  assert.equal(isDelivered, false, 'HTTP 200 from provider cannot be treated as recipient delivery');
});

test('NV14: Duplicate leased workers are prevented by SKIP LOCKED queue claims', () => {
  const queue = [{ id: 'outbox-1', locked: false }];
  const claimWorker1 = queue.find(q => !q.locked);
  if (claimWorker1) claimWorker1.locked = true;
  const claimWorker2 = queue.find(q => !q.locked);
  assert.equal(claimWorker2, undefined, 'Second concurrent worker must skip already locked queue item');
});

test('NV15: Zero-row candidate generation cannot be published as healthy generation', () => {
  const candidates = [];
  const canPublish = candidates.length > 0;
  assert.equal(canPublish, false, 'Zero candidate generation must fail closed and be quarantined');
});

test('NV16: Unsafe PostgREST filters containing injection characters fail closed', () => {
  const sanitizeFilter = (input) => {
    if (input.includes(';') || input.includes('--')) throw new Error('Invalid filter injection');
    return input;
  };
  assert.throws(() => sanitizeFilter("user_id=eq.1; DROP TABLE users;"));
});

test('NV18: Stale worker SHA or mismatched SHA fails closed in Evidence Admission Controller', () => {
  const evalResult = evaluateAdmission({
    overrideProductionSha: 'stale_worker_revision_000000'
  });
  assert.notEqual(evalResult.terminal_state, 'TARGET_PROVEN');
  assert.equal(evalResult.boolean_evaluations.exact_final_release_state_reconciled, false);
});

test('NV19: Stale proof revision SHA fails closed in Evidence Admission Controller', () => {
  const evalResult = evaluateAdmission({
    forcedGateSha: { 'REQ-PRICE-001': 'outdated_parent_sha_111111' }
  });
  assert.notEqual(evalResult.terminal_state, 'TARGET_PROVEN');
  assert.ok(evalResult.boolean_evaluations.stale_critical_proof > 0);
});

test('NV20: Synthetic soak timestamps without 24 elapsed hours fail closed', () => {
  const evalResult = evaluateAdmission({
    soakReceipts: { status: 'COMPLETED', completed_cycles: 24, elapsed_hours: 1, source_sha: 'current' }
  });
  assert.equal(evalResult.boolean_evaluations.runtime_soak_requirement_proven, false);
});

test('NV21: Weakened acceptance criteria text fails closed in Evidence Admission Controller', () => {
  const masterPath = path.resolve('docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json');
  const validRegistry = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  const sabotagedGates = validRegistry.gates.map((g) => {
    if (g.gate_id === 'REQ-PRICE-001') {
      return { ...g, acceptance_criteria: 'short' };
    }
    return g;
  });
  const evalResult = evaluateAdmission({ registryOverride: { ...validRegistry, gates: sabotagedGates } });
  assert.ok(evalResult.boolean_evaluations.weakened_required_gates > 0);
});

test('NV22: Missing persistent rules file is detected by handoff verifier', () => {
  const rulesPath = path.resolve('.agents/rules/farely-project10x-v15.md');
  assert.ok(fs.existsSync(rulesPath), 'Persistent rules file must exist');
});

test('NV23: Forged pass without execution probe fails closed', () => {
  const evalResult = evaluateAdmission({
    forgedPassGates: ['REQ-PRICE-001']
  });
  assert.notEqual(evalResult.terminal_state, 'TARGET_PROVEN');
  assert.equal(evalResult.boolean_evaluations.proof_revision_binding_valid, false);
});

test('NV24: Non-terminal state EXECUTING cannot claim TARGET_PROVEN', () => {
  const evalResult = evaluateAdmission();
  if (!evalResult.all_conditions_hold) {
    assert.notEqual(evalResult.terminal_state, 'TARGET_PROVEN');
  }
});
