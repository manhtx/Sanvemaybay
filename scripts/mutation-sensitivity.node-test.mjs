import test from 'node:test';
import assert from 'node:assert/strict';
import { testMutationSensitivity } from './mutation-sensitivity.mjs';

test('mutation testing: MUT_CONFIDENCE_CAP_BYPASS is strictly detected and killed', () => {
  const result = testMutationSensitivity();
  const mut = result.mutations.find((m) => m.mutation_id === 'MUT_CONFIDENCE_CAP_BYPASS');
  assert.ok(mut, 'MUT_CONFIDENCE_CAP_BYPASS must be defined');
  assert.equal(mut.killed, true, 'Removing confidence cap must be killed');
});

test('mutation testing: MUT_ALLOWLIST_ARBITRARY_HOST is strictly detected and killed', () => {
  const result = testMutationSensitivity();
  const mut = result.mutations.find((m) => m.mutation_id === 'MUT_ALLOWLIST_ARBITRARY_HOST');
  assert.ok(mut, 'MUT_ALLOWLIST_ARBITRARY_HOST must be defined');
  assert.equal(mut.killed, true, 'Accepting arbitrary https hosts must be killed');
});

test('mutation testing: MUT_ALLOWLIST_SUFFIX_SPOOF is strictly detected and killed', () => {
  const result = testMutationSensitivity();
  const mut = result.mutations.find((m) => m.mutation_id === 'MUT_ALLOWLIST_SUFFIX_SPOOF');
  assert.ok(mut, 'MUT_ALLOWLIST_SUFFIX_SPOOF must be defined');
  assert.equal(mut.killed, true, 'Permitting suffix spoof domains must be killed');
});

test('mutation testing: MUT_BOUNDARY_COMPARISON_INVERTED is strictly detected and killed', () => {
  const result = testMutationSensitivity();
  const mut = result.mutations.find((m) => m.mutation_id === 'MUT_BOUNDARY_COMPARISON_INVERTED');
  assert.ok(mut, 'MUT_BOUNDARY_COMPARISON_INVERTED must be defined');
  assert.equal(mut.killed, true, 'Inverting boundary comparison must be killed');
});

test('mutation testing: MUT_COST_MONOTONICITY_INVERTED is strictly detected and killed', () => {
  const result = testMutationSensitivity();
  const mut = result.mutations.find((m) => m.mutation_id === 'MUT_COST_MONOTONICITY_INVERTED');
  assert.ok(mut, 'MUT_COST_MONOTONICITY_INVERTED must be defined');
  assert.equal(mut.killed, true, 'Fee subtraction must be killed');
});

test('mutation testing: MUT_FRESHNESS_BOUNDARY_SHIFTED is strictly detected and killed', () => {
  const result = testMutationSensitivity();
  const mut = result.mutations.find((m) => m.mutation_id === 'MUT_FRESHNESS_BOUNDARY_SHIFTED');
  assert.ok(mut, 'MUT_FRESHNESS_BOUNDARY_SHIFTED must be defined');
  assert.equal(mut.killed, true, 'Shifting staleness threshold to 1000m must be killed');
});

test('mutation testing: MUT_ZERO_PRICE_ACCEPTED is strictly detected and killed', () => {
  const result = testMutationSensitivity();
  const mut = result.mutations.find((m) => m.mutation_id === 'MUT_ZERO_PRICE_ACCEPTED');
  assert.ok(mut, 'MUT_ZERO_PRICE_ACCEPTED must be defined');
  assert.equal(mut.killed, true, 'Accepting price of 0 must be killed');
});

test('mutation testing: comprehensive suite verifies 100% of injected mutants killed with zero survivors', () => {
  const result = testMutationSensitivity();
  assert.equal(result.ok, true, 'All mutants must be detected and killed by assertions');
  assert.equal(result.mutations_killed, result.total_mutations);
  assert.ok(result.total_mutations >= 7, 'Must evaluate at least 7 critical invariant mutations');
  for (const m of result.mutations) {
    assert.equal(m.killed, true, `Mutant survived: ${m.mutation_id} - ${m.description}`);
  }
});
