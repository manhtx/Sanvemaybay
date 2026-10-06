import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyCertificationIntegrity } from './verify-certification-integrity.mjs';

test('certification integrity: all contracts, outcomes, requirements and gates are consistent', () => {
  const result = verifyCertificationIntegrity();
  assert.equal(result.ok, true, `Verification failed: ${result.errors.join('; ')}`);
  assert.equal(result.summary.total_gates, 267);
  assert.equal(result.summary.total_requirements, 213);
  assert.equal(result.summary.total_negative_controls, 35);
  assert.equal(result.summary.total_user_journeys, 19);
});
