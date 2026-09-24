import test from 'node:test';
import assert from 'node:assert/strict';
import { testMutationSensitivity } from './mutation-sensitivity.mjs';

test('mutation testing: 100% of injected mutants on critical invariants are killed', () => {
  const result = testMutationSensitivity();
  assert.equal(result.ok, true, 'All mutants must be detected and killed by assertions');
  assert.equal(result.mutations_killed, result.total_mutations);
  assert.ok(result.total_mutations >= 5, 'Must evaluate at least 5 critical invariant mutations');
  for (const m of result.mutations) {
    assert.equal(m.killed, true, `Mutant survived: ${m.mutation_id} - ${m.description}`);
  }
});
