import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyV17Contract } from './verify-farely-v17-contract.mjs';

test('V17 Static Contract: Verifies V17 package, authentic capabilities, drift matrix, and rules', () => {
  const result = verifyV17Contract();
  assert.equal(result.success, true);
  assert.equal(result.capability_count, 89);
  assert.equal(result.priority_drift_resolved, 34);
  assert.equal(result.adversarial_challenges_count, 40);
  assert.equal(result.rules_verified, 3);
});
