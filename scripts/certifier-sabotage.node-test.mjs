/**
 * CERTIFIER SABOTAGE & NEGATIVE CONTROLS TEST SUITE
 * S02..S06, C-01..C-04, A01..A05, A24.
 *
 * Verifies that the Evidence Admission Controller fails closed under adversarial conditions:
 * - A01: Missing required gate -> rejected.
 * - A02: Weakened gate priority or criteria -> rejected.
 * - A03: Forged PASS result -> rejected.
 * - A04: Stale evidence with mismatched source SHA -> rejected.
 * - A05: Outdated / mismatched production release SHA -> rejected.
 * - A24: Legitimate evidence satisfying all predicates -> accepted as TARGET_PROVEN.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { evaluateAdmission } from './evidence-admission-controller.mjs';

test('A01: Terminal evaluator rejects missing required gate', () => {
  const masterPath = path.resolve('docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json');
  const validRegistry = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

  // Sabotage: delete REQ-PRICE-001 (core price truth requirement)
  const sabotagedGates = validRegistry.gates.filter((g) => g.gate_id !== 'REQ-PRICE-001');
  const sabotagedRegistry = { ...validRegistry, gates: sabotagedGates };

  const evalResult = evaluateAdmission({ registryOverride: sabotagedRegistry });

  assert.notEqual(evalResult.terminal_state, 'TARGET_PROVEN', 'Must reject TARGET_PROVEN when required gate is missing');
  assert.equal(evalResult.terminal_state, 'EXECUTING');
  assert.ok(evalResult.boolean_evaluations.missing_required_gates > 0, 'missing_required_gates must be > 0');
  assert.ok(evalResult.shrinkage_errors.some((e) => e.includes('REQ-PRICE-001')), 'Must identify missing REQ-PRICE-001');
});

test('A02: Terminal evaluator rejects weakened gate priority or criteria', () => {
  const masterPath = path.resolve('docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json');
  const validRegistry = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

  // Sabotage: weaken REQ-SEC-002 from P0 to P2
  const sabotagedGates = validRegistry.gates.map((g) => {
    if (g.gate_id === 'REQ-SEC-002') {
      return { ...g, priority: 'P2' };
    }
    return g;
  });
  const sabotagedRegistry = { ...validRegistry, gates: sabotagedGates };

  const evalResult = evaluateAdmission({ registryOverride: sabotagedRegistry });

  assert.notEqual(evalResult.terminal_state, 'TARGET_PROVEN', 'Must reject TARGET_PROVEN when gate priority is weakened');
  assert.equal(evalResult.terminal_state, 'EXECUTING');
  assert.ok(evalResult.boolean_evaluations.weakened_required_gates > 0, 'weakened_required_gates must be > 0');
  assert.ok(evalResult.shrinkage_errors.some((e) => e.includes('REQ-SEC-002')), 'Must identify weakened REQ-SEC-002');
});

test('A03: Terminal evaluator rejects forged PASS result', () => {
  // Sabotage: forge pass on REQ-PRICE-001 without real test execution
  const evalResult = evaluateAdmission({
    forgedPassGates: ['REQ-PRICE-001']
  });

  assert.notEqual(evalResult.terminal_state, 'TARGET_PROVEN', 'Must reject TARGET_PROVEN on forged proof');
  assert.equal(evalResult.terminal_state, 'EXECUTING');
  assert.equal(evalResult.boolean_evaluations.proof_revision_binding_valid, false, 'proof_revision_binding_valid must be false on forged proof');
  assert.ok(evalResult.summary.forged_proofs > 0, 'Must record forged proof count');
});

test('A04: Terminal evaluator rejects stale evidence with mismatched source revision', () => {
  // Sabotage: inject stale proof SHA on critical gate
  const evalResult = evaluateAdmission({
    forcedGateSha: { 'REQ-PRICE-001': '0000000000000000000000000000000000000000' }
  });

  assert.notEqual(evalResult.terminal_state, 'TARGET_PROVEN', 'Must reject TARGET_PROVEN on stale proof');
  assert.equal(evalResult.terminal_state, 'EXECUTING');
  assert.ok(evalResult.boolean_evaluations.stale_critical_proof > 0, 'stale_critical_proof must be > 0');
  assert.equal(evalResult.boolean_evaluations.proof_revision_binding_valid, false, 'proof_revision_binding_valid must be false');
});

test('A05: Terminal evaluator rejects mismatched production release SHA', () => {
  // Sabotage: production reported SHA doesn't match current git SHA
  const evalResult = evaluateAdmission({
    overrideProductionSha: 'mismatched_unverified_production_sha_12345'
  });

  assert.notEqual(evalResult.terminal_state, 'TARGET_PROVEN', 'Must reject TARGET_PROVEN on mismatched production SHA');
  assert.equal(evalResult.terminal_state, 'EXECUTING');
  assert.equal(evalResult.boolean_evaluations.exact_final_release_state_reconciled, false, 'exact_final_release_state_reconciled must be false');
});

test('A24: Terminal evaluator admits legitimate evidence when all conditions hold', () => {
  // Construct fully verified registry where all 267 gates are legitimately proven
  const masterPath = path.resolve('docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json');
  const validRegistry = JSON.parse(fs.readFileSync(masterPath, 'utf8'));

  const currentSha = evaluateAdmission().evaluated_proof_index.source_sha;
  const provenGates = validRegistry.gates.map((g) => ({
    ...g,
    status: 'PROVEN',
    verified_at: new Date().toISOString(),
    evidence: [
      {
        level: g.required_evidence_level || 'E2',
        sha: currentSha,
        status: 'VERIFIED'
      }
    ]
  }));
  const fullRegistry = { ...validRegistry, gates: provenGates };

  const evalResult = evaluateAdmission({ registryOverride: fullRegistry });

  assert.equal(evalResult.boolean_evaluations.missing_required_gates, 0);
  assert.equal(evalResult.boolean_evaluations.weakened_required_gates, 0);
  assert.equal(evalResult.boolean_evaluations.unresolved_p0, 0);
  assert.equal(evalResult.boolean_evaluations.unresolved_required_current_stage_p1, 0);
  assert.equal(evalResult.boolean_evaluations.stale_critical_proof, 0);
  assert.equal(evalResult.boolean_evaluations.contract_hash_valid, true);
  assert.equal(evalResult.boolean_evaluations.exact_final_release_state_reconciled, true);
  assert.equal(evalResult.all_conditions_hold, true, 'All 22 predicates must hold simultaneously');
  assert.equal(evalResult.terminal_state, 'TARGET_PROVEN', 'Must admit TARGET_PROVEN when all conditions hold');
});
