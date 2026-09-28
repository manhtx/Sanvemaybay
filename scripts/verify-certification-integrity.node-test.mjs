import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyCertificationIntegrity } from './verify-certification-integrity.mjs';

test('certification integrity: all contracts, outcomes, requirements and gates are consistent', () => {
  const result = verifyCertificationIntegrity();
  assert.equal(result.ok, true, `Verification failed: ${result.errors.join('; ')}`);
  assert.equal(result.summary.total_requirements, 34);
  assert.equal(result.summary.total_features, 12);
  assert.equal(result.summary.total_outcomes, 14);
  assert.equal(result.summary.total_gates, 33);
  assert.deepEqual(result.summary.category_breakdown, {
    DATA: 5,
    INTEL: 10,
    UX: 9,
    SEC: 5,
    OPS: 5,
  });
});
