import test from 'node:test';
import assert from 'node:assert/strict';
import { runSyntheticHealthCheck } from './synthetic-health-check.mjs';

test('synthetic health check: verifies core deployment indicators without consuming quota', () => {
  const result = runSyntheticHealthCheck();
  assert.equal(result.ok, true, `Synthetic health check failed: ${JSON.stringify(result.checks)}`);
  assert.ok(result.checks.length >= 3, 'Must evaluate at least 3 critical health indicators');
  const feedCheck = result.checks.find((c) => c.check_id === 'CHK_FEED_CONTRACT');
  assert.equal(feedCheck?.status, 'PASS');
});
