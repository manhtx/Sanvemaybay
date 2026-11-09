import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { verifyCertificationIntegrity } from './verify-certification-integrity.mjs';

test('certification integrity: all contracts, outcomes, requirements and gates are consistent', () => {
  const result = verifyCertificationIntegrity();
  assert.equal(result.ok, true, `Verification failed: ${result.errors.join('; ')}`);
  assert.equal(result.summary.total_gates, 267);
  assert.equal(result.summary.total_requirements, 213);
  assert.equal(result.summary.total_negative_controls, 35);
  assert.equal(result.summary.total_user_journeys, 19);
  assert.ok(result.summary.category_breakdown);
});

test('certification integrity: fail-closed evaluation on missing convergence artifacts directory', () => {
  const emptyDir = mkdtempSync(join(tmpdir(), 'flycheap-cert-'));
  try {
    const result = verifyCertificationIntegrity(emptyDir);
    assert.equal(result.ok, false);
    assert.ok(result.errors.length >= 5, 'Must report missing files for all 5 canonical convergence artifacts');
    assert.ok(result.errors.some((e) => e.includes('MASTER_ACCEPTANCE_REGISTRY.json')));
    assert.ok(result.errors.some((e) => e.includes('CURRENT_BASELINE.json')));
  } finally {
    rmSync(emptyDir, { recursive: true, force: true });
  }
});

test('certification integrity: invalid gate priority validation rejects non-P0/P1/P2 priorities', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'flycheap-cert-pri-'));
  try {
    const convDir = join(tempDir, 'docs', 'convergence');
    mkdirSync(convDir, { recursive: true });

    // Mock minimal required files
    writeFileSync(join(convDir, 'CURRENT_BASELINE.json'), JSON.stringify({ git: { head_sha: 'abc123' } }));
    writeFileSync(join(convDir, 'TEST_MATRIX.json'), JSON.stringify({}));
    writeFileSync(join(convDir, 'RELEASE_MANIFEST.json'), JSON.stringify({}));
    writeFileSync(join(convDir, 'FINAL_SCORECARD.json'), JSON.stringify({}));

    // Registry with gate having invalid priority "P9"
    const fakeGates = Array.from({ length: 267 }, (_, i) => ({
      gate_id: `GATE_${i}`,
      category: 'DATA_TRUTH',
      priority: i === 0 ? 'P9' : 'P0',
      acceptance_criteria: 'Criteria must pass cleanly',
      requirement: 'Requirement description is non-empty',
    }));

    writeFileSync(
      join(convDir, 'MASTER_ACCEPTANCE_REGISTRY.json'),
      JSON.stringify({ gates: fakeGates, total_requirements: 213, total_negative_controls: 35, total_user_journeys: 19 })
    );

    const result = verifyCertificationIntegrity(tempDir);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('invalid priority: P9')));
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('certification integrity: duplicate gate identifier detection flags collisions', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'flycheap-cert-dup-'));
  try {
    const convDir = join(tempDir, 'docs', 'convergence');
    mkdirSync(convDir, { recursive: true });

    writeFileSync(join(convDir, 'CURRENT_BASELINE.json'), JSON.stringify({ git: { head_sha: 'abc123' } }));
    writeFileSync(join(convDir, 'TEST_MATRIX.json'), JSON.stringify({}));
    writeFileSync(join(convDir, 'RELEASE_MANIFEST.json'), JSON.stringify({}));
    writeFileSync(join(convDir, 'FINAL_SCORECARD.json'), JSON.stringify({}));

    // Registry with duplicate gate_id: GATE_0 appears twice
    const fakeGates = Array.from({ length: 267 }, (_, i) => ({
      gate_id: i === 1 ? 'GATE_0' : `GATE_${i}`,
      category: 'DATA_TRUTH',
      priority: 'P0',
      acceptance_criteria: 'Criteria must pass cleanly',
      requirement: 'Requirement description is non-empty',
    }));

    writeFileSync(
      join(convDir, 'MASTER_ACCEPTANCE_REGISTRY.json'),
      JSON.stringify({ gates: fakeGates, total_requirements: 213, total_negative_controls: 35, total_user_journeys: 19 })
    );

    const result = verifyCertificationIntegrity(tempDir);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes('Duplicate gate ID: GATE_0')));
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('certification integrity: category breakdown accurately reflects all categories across 267 gates', () => {
  const result = verifyCertificationIntegrity();
  assert.equal(result.ok, true);

  const categories = Object.keys(result.summary.category_breakdown);
  assert.ok(categories.length >= 10, 'Must cover multiple categories');

  // Sum of gates across categories must equal 267
  const sumGates = Object.values(result.summary.category_breakdown).reduce((acc, count) => acc + count, 0);
  assert.equal(sumGates, 267, 'Sum of categorized gates must equal total gates 267');
});

test('performance benchmark: certification integrity verification finishes within latency budget', () => {
  const start = performance.now();
  for (let i = 0; i < 30; i++) {
    const res = verifyCertificationIntegrity();
    assert.equal(res.ok, true);
  }
  const duration = performance.now() - start;
  // 30 full integrity checks over large JSON files must complete within 200ms
  assert.ok(duration < 200, `Expected duration < 200ms, took ${duration.toFixed(2)}ms`);
});
