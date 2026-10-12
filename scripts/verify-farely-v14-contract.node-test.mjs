/**
 * Test Suite: V14 Static Contract Integrity Test
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyV14Contract } from './verify-farely-v14-contract.mjs';

test('V14 Static Contract: Verifies V13 and V14 packages, rules, and manifests', () => {
  const result = verifyV14Contract();
  assert.equal(result.success, true);
  assert.equal(result.v14_contracts_count, 20);
  assert.equal(result.v13_findings_count, 20);
  assert.equal(result.v13_capabilities_count, 89);
  assert.equal(result.v13_scenarios_count, 30);
});
