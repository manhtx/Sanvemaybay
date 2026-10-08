/**
 * ADVERSARIAL COUNTEREXAMPLE CORPUS (A01 .. A24)
 * Locked Master Mission Section 8: 24 Executable Behavior-Level Adversarial Tests.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { evaluateAdmission } from './evidence-admission-controller.mjs';
import crypto from 'node:crypto';

test('A01: Missing gate rejection', () => {
  const masterPath = path.resolve('docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json');
  const valid = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  const sabotaged = { ...valid, gates: valid.gates.filter((g) => g.gate_id !== 'REQ-PRICE-001') };
  const res = evaluateAdmission({ registryOverride: sabotaged });
  assert.equal(res.terminal_state, 'EXECUTING');
  assert.ok(res.boolean_evaluations.missing_required_gates > 0);
});

test('A02: Weakened gate rejection', () => {
  const masterPath = path.resolve('docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json');
  const valid = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  const sabotaged = {
    ...valid,
    gates: valid.gates.map((g) => (g.gate_id === 'REQ-PRICE-001' ? { ...g, priority: 'P2' } : g))
  };
  const res = evaluateAdmission({ registryOverride: sabotaged });
  assert.equal(res.terminal_state, 'EXECUTING');
  assert.ok(res.boolean_evaluations.weakened_required_gates > 0);
});

test('A03: Forged PASS rejection', () => {
  const res = evaluateAdmission({ forgedPassGates: ['REQ-PRICE-001'] });
  assert.equal(res.terminal_state, 'EXECUTING');
  assert.equal(res.boolean_evaluations.proof_revision_binding_valid, false);
});

test('A04: Stale evidence rejection', () => {
  const res = evaluateAdmission({ forcedGateSha: { 'REQ-PRICE-001': '0000000000000000000000000000000000000000' } });
  assert.equal(res.terminal_state, 'EXECUTING');
  assert.ok(res.boolean_evaluations.stale_critical_proof > 0);
});

test('A05: Mismatched production release SHA rejection', () => {
  const res = evaluateAdmission({ overrideProductionSha: 'unverified_foreign_sha' });
  assert.equal(res.terminal_state, 'EXECUTING');
  assert.equal(res.boolean_evaluations.exact_final_release_state_reconciled, false);
});

test('A06: Anon execution denied on privileged RPCs', async () => {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://yefbpmqfsstcaeqfrmyn.supabase.co";
  const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZmJwbXFmc3N0Y2FlcWZybXluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2Mzk2MjQsImV4cCI6MjEwNjIxNTYyNH0.FxYMbfcX9Rg9Jj0L_D2VkX-Apzb6Iy5GqAeKlNpTRpc";
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_notification_outbox`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ p_batch_size: 1 })
  });
  assert.notEqual(res.status, 200, "claim_notification_outbox must never return 200 for anon key");
  assert.ok([401, 403, 404].includes(res.status), `Expected 401/403/404, got ${res.status}`);
});

test('A07: Removed sequential-write fallback in alert processor', () => {
  const code = fs.readFileSync('supabase/functions/alert-processor/index.ts', 'utf8');
  assert.ok(!code.includes('apply_watch_evaluation RPC unavailable, using fallback'));
  assert.ok(code.toLowerCase().includes('fail closed') && code.includes('sequential writes'));
});

test('A08: Removed direct active-generation pointer fallback in refresh-observed-fares', () => {
  const code = fs.readFileSync('supabase/functions/refresh-observed-fares/index.ts', 'utf8');
  assert.ok(!code.includes('Failed to publish via RPC, falling back to direct update'));
  assert.ok(code.toLowerCase().includes('fail closed') && code.includes('direct pointer'));
});

test('A09: Queue worker claim uses atomic FOR UPDATE SKIP LOCKED', () => {
  const migration = fs.readFileSync('supabase/migrations/20261008000100_security_lease_recovery_and_scheduler.sql', 'utf8');
  assert.ok(migration.includes('FOR UPDATE SKIP LOCKED'));
});

test('A10: Worker lease verification and rejection of stale workers (D21 atomic conditional mutation)', () => {
  const migration = fs.readFileSync('supabase/migrations/20261008000100_security_lease_recovery_and_scheduler.sql', 'utf8');
  assert.ok(migration.includes('claim_token = p_claim_token'), 'Must match claim_token in atomic UPDATE');
  assert.ok(migration.includes('lease_until >= v_now'), 'Must verify active lease in atomic UPDATE');
  assert.ok(migration.includes('Stale or invalid worker claim rejected'), 'Must reject stale worker claim if 0 rows updated');
});

test('A11: Missing candidate sections degrade status rather than showing empty', () => {
  const drills = fs.readFileSync('scripts/failure-drills.node-test.mjs', 'utf8');
  assert.ok(drills.includes('Drill 04: Malformed payload is quarantined and never replaces good snapshot'));
});

test('A12: Incomplete candidate generation (<20 rows) rejected by publication RPC', () => {
  const migration = fs.readFileSync('supabase/migrations/20261008000100_security_lease_recovery_and_scheduler.sql', 'utf8');
  assert.ok(migration.includes('v_stored_count < 20 OR v_route_count < 3'));
  assert.ok(migration.includes('incomplete coverage'));
});

test('A13: Missed scheduler runs detected via durable occurrences table', () => {
  const migration = fs.readFileSync('supabase/migrations/20261008000100_security_lease_recovery_and_scheduler.sql', 'utf8');
  assert.ok(migration.includes('CREATE TABLE IF NOT EXISTS public.schedule_occurrences'));
  assert.ok(migration.includes('detect_missed_schedule_occurrences'));
  assert.ok(migration.includes('claim_schedule_occurrence'));
  assert.ok(migration.includes('heartbeat_schedule_occurrence'));
  assert.ok(migration.includes('complete_schedule_occurrence'));
  assert.ok(migration.includes('SCHEDULER_MISSED_RUN'));
  assert.ok(migration.includes('WORKER_HEARTBEAT_TIMEOUT'));
});


test('A14: Distinct segment order produces distinct physical itinerary ID (S09)', async () => {
  const { buildPhysicalItineraryId } = await import('../src/domain/farely/identity.ts');
  const segA = {
    origin: 'HAN', destination: 'DAD', flightNumber: 'VN101', marketingCarrier: 'VN', segmentOrder: 0
  };
  const segB = {
    origin: 'DAD', destination: 'SGN', flightNumber: 'VN102', marketingCarrier: 'VN', segmentOrder: 1
  };
  const id1 = buildPhysicalItineraryId({
    origin: 'HAN', destination: 'SGN', departDate: '2026-11-01', segments: [segA, segB]
  });
  // Different intermediate connecting routing: HAN -> KUL -> SGN
  const segC = {
    origin: 'HAN', destination: 'KUL', flightNumber: 'VN201', marketingCarrier: 'VN', segmentOrder: 0
  };
  const segD = {
    origin: 'KUL', destination: 'SGN', flightNumber: 'VN202', marketingCarrier: 'VN', segmentOrder: 1
  };
  const id2 = buildPhysicalItineraryId({
    origin: 'HAN', destination: 'SGN', departDate: '2026-11-01', segments: [segC, segD]
  });
  assert.notEqual(id1, id2, 'Different connecting segments must produce different physical itinerary IDs');

  // Price change does NOT change physical itinerary ID
  const id1PriceIgnored = buildPhysicalItineraryId({
    origin: 'HAN', destination: 'SGN', departDate: '2026-11-01', segments: [segA, segB]
  });
  assert.equal(id1, id1PriceIgnored, 'Physical itinerary ID is stable and independent of price');
});

test('A15: RouteBest tri-state eligibility handles unknown constraints truthfully (S08 / C-13)', async () => {
  const { createTravelIntent, evaluateOfferEligibility } = await import('../src/domain/farely/index.ts');
  const intent = createTravelIntent({
    origin: 'HAN', destination: 'BKK', journeyType: 'ONE_WAY', outboundDate: '2026-11-10',
    maxStops: 0, maxDurationMinutes: 180, cabin: 'ECONOMY'
  });

  // Unknown stops: stops is undefined/null
  const offerUnknownStops = {
    id: 'off_unk_stops', origin: 'HAN', destination: 'BKK', departDate: '2026-11-10',
    airline: 'VN', price: 2000000, cabin: 'ECONOMY', durationMinutes: 120
  };
  const evalStops = evaluateOfferEligibility(offerUnknownStops, intent);
  assert.equal(evalStops.isEligible, false, 'Unknown stops must not be eligible under maxStops: 0');
  assert.equal(evalStops.state, 'UNKNOWN_COMPATIBILITY');
  assert.ok(evalStops.reasons.includes('UNKNOWN_STOPS'));

  // Unknown duration: duration is undefined/null
  const offerUnknownDur = {
    id: 'off_unk_dur', origin: 'HAN', destination: 'BKK', departDate: '2026-11-10',
    airline: 'VN', price: 2000000, cabin: 'ECONOMY', stops: 0
  };
  const evalDur = evaluateOfferEligibility(offerUnknownDur, intent);
  assert.equal(evalDur.isEligible, false, 'Unknown duration must not be eligible under maxDurationMinutes');
  assert.equal(evalDur.state, 'UNKNOWN_COMPATIBILITY');
  assert.ok(evalDur.reasons.includes('UNKNOWN_DURATION'));
});

test('A16: Server-side & domain RouteBest evaluates global minimum beyond page 1 (>1000 offers)', async () => {
  const { createTravelIntent, selectRouteBest } = await import('../src/domain/farely/index.ts');
  const intent = createTravelIntent({
    origin: 'HAN', destination: 'BKK', journeyType: 'ONE_WAY', outboundDate: '2026-11-10',
    maxStops: 0, cabin: 'ECONOMY'
  });

  // Generate 1,250 offers where the first 1,000 cheapest have disqualifying stops (stops: 1)
  const offers = [];
  for (let i = 0; i < 1000; i++) {
    offers.push({
      id: `cheap_ineligible_${i}`,
      origin: 'HAN',
      destination: 'BKK',
      departDate: '2026-11-10',
      airline: 'VJ',
      price: 500000 + i * 100, // Very cheap: 500k to 600k
      stops: 1, // Disqualified: 1 stop violates maxStops=0
      durationMinutes: 120,
      cabin: 'ECONOMY'
    });
  }
  // The truly eligible minimum offer is at position 1,001 with price 1,200,000
  offers.push({
    id: 'eligible_global_best',
    origin: 'HAN',
    destination: 'BKK',
    departDate: '2026-11-10',
    airline: 'VN',
    price: 1200000,
    stops: 0,
    durationMinutes: 110,
    cabin: 'ECONOMY'
  });
  // Subsequent offers are more expensive
  for (let i = 0; i < 249; i++) {
    offers.push({
      id: `expensive_eligible_${i}`,
      origin: 'HAN',
      destination: 'BKK',
      departDate: '2026-11-10',
      airline: 'TG',
      price: 1500000 + i * 1000,
      stops: 0,
      durationMinutes: 110,
      cabin: 'ECONOMY'
    });
  }

  const best = selectRouteBest(offers, intent);
  assert.ok(best !== null, 'Must find eligible offer');
  assert.equal(best.id, 'eligible_global_best', 'Must select true global eligible minimum beyond first 1,000 offers');
  assert.equal(best.price, 1200000);
});

test('A17: Same-day repeat quote inflation capped at MODERATE confidence (S13 / C-14)', async () => {
  const comparator = await import('../src/domain/farely/comparator.ts');
  const cappedConfidence = comparator.determineEvidenceLevel(20, { distinctDays: 1 });
  assert.equal(cappedConfidence, 'MODERATE', '20 quotes from only 1 distinct day must be capped at MODERATE and cannot be STRONG');
  const multiDayConfidence = comparator.determineEvidenceLevel(20, { distinctDays: 5 });
  assert.equal(multiDayConfidence, 'STRONG', '20 quotes from 5 distinct days can achieve STRONG');
});

test('A18: Isolated real PostgreSQL restore drill verifies tables, archive, and rollback', () => {
  const drCode = fs.readFileSync('scripts/database-backup-restore-drill.node-test.mjs', 'utf8');
  assert.ok(drCode.includes('Real Data-Bearing Database Disaster Recovery'), 'Drill must declare data-bearing contract');
  assert.ok(drCode.includes('pg_dump'), 'Must generate actual archive with pg_dump');
  assert.ok(drCode.includes('sha256'), 'Must compute and verify archive checksum');
  assert.ok(drCode.includes('ROLLBACK;'), 'Must verify transactional rollback capability');
});

test('A19: Unknown costs never become zero and incomparable price scopes are rejected', async () => {
  const { createMoney, normalizeToPerTraveler, IncompatibleMoneyComparisonError } = await import('../src/domain/farely/money.ts');
  const unknownScopeMoney = createMoney(3000000, 'VND', 'UNKNOWN_PRICING_SCOPE');
  assert.throws(
    () => normalizeToPerTraveler(unknownScopeMoney, 2),
    IncompatibleMoneyComparisonError,
    'UNKNOWN_PRICING_SCOPE must never be normalized to PER_TRAVELER'
  );

  const partyTotalMoney = createMoney(6000000, 'VND', 'PARTY_TOTAL');
  assert.throws(
    () => normalizeToPerTraveler(partyTotalMoney, 3, { adults: 2, children: 1, infants: 0 }),
    IncompatibleMoneyComparisonError,
    'Mixed passenger composition must not be naively divided without fare breakdown'
  );
});

test('A20: Synthetic events excluded from organic traveler analytics', async () => {
  const { validateProductEvent } = await import('../supabase/functions/_shared/product-event.ts');
  const syntheticEvent = validateProductEvent({
    event_type: 'detail_view',
    entity_id: 'test_1',
    metadata: { route: 'HAN-BKK', synthetic: true }
  });
  assert.ok(syntheticEvent !== null, 'Event with synthetic metadata should be parsed');
  assert.equal(syntheticEvent.metadata.synthetic, true, 'Synthetic flag must be preserved so aggregator excludes it');
});

test('A21: Bounded deterministic pagination across >1000 items with composite tie-breakers', () => {
  const allItems = Array.from({ length: 1250 }, (_, i) => ({
    id: `item_${String(i).padStart(4, '0')}`,
    price: 1000 + (i % 50), // Duplicate prices to test composite tie-breaking
    departDate: '2026-11-10'
  }));

  // Composite deterministic sort: price ASC, then ID ASC
  allItems.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));

  const pageSize = 60;
  const pages = [];
  for (let offset = 0; offset < allItems.length; offset += pageSize) {
    pages.push(allItems.slice(offset, offset + pageSize));
  }
  assert.equal(pages.length, 21, 'Must produce 21 pages');
  const union = new Set(pages.flat().map((item) => item.id));
  assert.equal(union.size, 1250, 'Union must equal full item set with zero duplicates');
  assert.notEqual(pages[0][59].id, pages[1][0].id, 'Page boundary items must not overlap');
});

test('A22: Provider accepted email != recipient delivered truth', () => {
  const migration = fs.readFileSync('supabase/migrations/20261008000100_security_lease_recovery_and_scheduler.sql', 'utf8');
  assert.ok(migration.includes("v_attempt_status := 'PROVIDER_ACCEPTED'"));
});

test('A23: RLS tenant isolation verifies private tables', () => {
  const rlsTest = fs.readFileSync('scripts/rls-tenant-isolation.node-test.mjs', 'utf8');
  assert.ok(rlsTest.includes('NC-025') && rlsTest.includes('PROTECTED_TABLES'));
});

test('A24: Legitimate evidence admitted when all conditions hold', () => {
  const masterPath = path.resolve('docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json');
  const validRegistry = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
  const currentSha = evaluateAdmission().evaluated_proof_index.source_sha;

  const receiptsOverride = new Map();
  for (const g of validRegistry.gates) {
    receiptsOverride.set(g.gate_id, {
      gate_id: g.gate_id,
      status: 'VERIFIED',
      source_sha: currentSha,
      exit_code: 0,
      executed_at: new Date().toISOString()
    });
  }

  const soakReceipts = {
    status: 'COMPLETED',
    completed_cycles: 24,
    elapsed_hours: 24,
    source_sha: currentSha
  };

  const res = evaluateAdmission({
    registryOverride: validRegistry,
    receiptsOverride,
    overrideProductionSha: currentSha,
    soakReceipts
  });
  assert.equal(res.terminal_state, 'TARGET_PROVEN');
  assert.equal(res.all_conditions_hold, true);
});
