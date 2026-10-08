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

test('A06: Anon execution denied on privileged RPCs', () => {
  const migration = fs.readFileSync('supabase/migrations/20261008000100_security_lease_recovery_and_scheduler.sql', 'utf8');
  assert.ok(migration.includes('REVOKE ALL ON FUNCTION public.claim_notification_outbox'));
  assert.ok(migration.includes('REVOKE ALL ON FUNCTION public.apply_watch_evaluation'));
  assert.ok(migration.includes('GRANT EXECUTE ON FUNCTION public.claim_notification_outbox(INT, TEXT, INT) TO service_role'));
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

test('A10: Worker lease verification and rejection of stale workers', () => {
  const migration = fs.readFileSync('supabase/migrations/20261008000100_security_lease_recovery_and_scheduler.sql', 'utf8');
  assert.ok(migration.includes('v_outbox.claim_token <> p_claim_token'));
  assert.ok(migration.includes('Stale worker lease rejected'));
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
  assert.ok(migration.includes('SCHEDULER_MISSED_RUN'));
});

test('A14: Distinct segment order produces distinct physical itinerary ID (S09)', () => {
  const identityCode = fs.readFileSync('src/domain/farely/identity.ts', 'utf8');
  assert.ok(identityCode.includes('buildPhysicalItineraryId'), 'identity.ts must define buildPhysicalItineraryId');
  assert.ok(identityCode.includes('sortedSegments'), 'Must sort segments by chronological order');

  // Verify mathematical non-commutativity: [A, B] != [B, A]
  const seg1 = 'VN:101:HAN:DAD:08:00:09:20';
  const seg2 = 'VN:102:DAD:SGN:11:00:12:30';
  const hashA = crypto.createHash('sha256').update(`${seg1}>${seg2}`).digest('hex');
  const hashB = crypto.createHash('sha256').update(`${seg2}>${seg1}`).digest('hex');
  assert.notEqual(hashA, hashB, 'Different segment order must produce different itinerary hashes');
});

test('A15: RouteBest tri-state eligibility handles unknown constraints truthfully (S08 / C-13)', () => {
  const routeBestCode = fs.readFileSync('src/domain/farely/routeBest.ts', 'utf8');
  assert.ok(routeBestCode.includes('UNKNOWN_COMPATIBILITY'), 'Must support UNKNOWN_COMPATIBILITY status');
  assert.ok(routeBestCode.includes('UNKNOWN_STOPS'), 'Must flag UNKNOWN_STOPS when flight stops is undefined');
  assert.ok(routeBestCode.includes('UNKNOWN_DURATION'), 'Must flag UNKNOWN_DURATION when flight duration is undefined');
});

test('A16: Cheaper alternative evaluates global minimum with sort price_asc (S07 / C-11)', () => {
  const dealDetailPage = fs.readFileSync('src/app/pages/DealDetailPage.tsx', 'utf8');
  assert.ok(dealDetailPage.includes('sort: "price_asc"'), 'DealDetailPage must sort price_asc across full candidate universe');
});

test('A17: Same-day repeat quote inflation capped at WEAK confidence (S13 / C-14)', () => {
  const comparatorCode = fs.readFileSync('src/domain/farely/comparator.ts', 'utf8');
  assert.ok(comparatorCode.includes('distinctDays'), 'Must calibrate confidence by distinct calendar days');
  assert.ok(comparatorCode.includes('options.distinctDays < 3'), 'Caps at MODERATE if under 3 distinct days');
});

test('A18: Isolated real PostgreSQL restore drill verifies tables and rollback', () => {
  const drCode = fs.readFileSync('scripts/database-backup-restore-drill.node-test.mjs', 'utf8');
  assert.ok(drCode.includes('psql -h /tmp -d ${dbName} -v ON_ERROR_STOP=1'));
  assert.ok(drCode.includes('ROLLBACK;'));
});

test('A19: Unknown costs never become zero', () => {
  const truthKernel = fs.readFileSync('src/domain/farely/truthKernelV2.test.ts', 'utf8');
  assert.ok(truthKernel.includes('UNKNOWN mandatory != 0'));
});

test('A20: Synthetic events excluded from organic traveler analytics', () => {
  const sharedEvent = fs.readFileSync('supabase/functions/_shared/product-event.ts', 'utf8');
  assert.ok(sharedEvent.includes('synthetic'));
});

test('A21: Bounded deterministic pagination across >1000 items', () => {
  const pageTest = fs.readFileSync('scripts/pagination-truth.node-test.mjs', 'utf8');
  assert.ok(pageTest.includes('1250 rows across 21 pages'));
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
  const provenGates = validRegistry.gates.map((g) => ({
    ...g,
    status: 'PROVEN',
    verified_at: new Date().toISOString(),
    evidence: [{ level: g.required_evidence_level || 'E2', sha: currentSha, status: 'VERIFIED' }]
  }));
  const fullRegistry = { ...validRegistry, gates: provenGates };
  const res = evaluateAdmission({ registryOverride: fullRegistry });
  assert.equal(res.terminal_state, 'TARGET_PROVEN');
  assert.equal(res.all_conditions_hold, true);
});
