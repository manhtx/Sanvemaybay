import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

test('performance budgets: all defined budgets meet release criteria', () => {
  const budgetPath = join(process.cwd(), '.flycheap', 'PERFORMANCE_BUDGETS.json');
  assert.equal(existsSync(budgetPath), true, 'PERFORMANCE_BUDGETS.json must exist');

  const data = JSON.parse(readFileSync(budgetPath, 'utf8'));
  assert.ok(Array.isArray(data.budgets), 'budgets must be an array');
  assert.ok(data.budgets.length >= 5, 'Must evaluate at least 5 performance budgets');

  for (const b of data.budgets) {
    assert.equal(b.status, 'PASS', `Performance budget failed for: ${b.dimension}`);
  }
});
