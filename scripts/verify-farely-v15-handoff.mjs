/**
 * Farely V15 Handoff Verification Script
 * Validates existence, structure, and integrity of V15 packages, negative vectors, and execution graph.
 */
import fs from 'node:fs';
import path from 'node:path';

export function verifyV15Handoff(projectRoot = process.cwd()) {
  const v15Dir = path.join(projectRoot, 'docs/convergence/v15');
  const rulesPath = path.join(projectRoot, '.agents/rules/farely-project10x-v15.md');

  // 1. Verify V15 Files
  const v15Files = [
    'MASTER_GOAL.md',
    'V15_PRECISION_ADDENDUM.md',
    'EXECUTION_PACKAGES.json',
    'NEGATIVE_VECTORS.json',
    'CONDITIONAL_ROADMAP.md',
    'OWNER_LOCK_MANIFEST.json'
  ];
  for (const f of v15Files) {
    const p = path.join(v15Dir, f);
    if (!fs.existsSync(p)) {
      throw new Error(`Missing V15 file: ${f}`);
    }
  }

  // 2. Verify Persistent Rule
  if (!fs.existsSync(rulesPath)) {
    throw new Error('Missing .agents/rules/farely-project10x-v15.md');
  }

  // 3. Validate Execution Packages
  const v15Packages = JSON.parse(fs.readFileSync(path.join(v15Dir, 'EXECUTION_PACKAGES.json'), 'utf8'));
  if (!Array.isArray(v15Packages.packages) || v15Packages.packages.length !== 14) {
    throw new Error(`Expected 14 execution packages (WP00..WP13), found ${v15Packages.packages?.length}`);
  }

  // 4. Validate Negative Vectors
  const v15Vectors = JSON.parse(fs.readFileSync(path.join(v15Dir, 'NEGATIVE_VECTORS.json'), 'utf8'));
  if (!Array.isArray(v15Vectors.vectors) || v15Vectors.vectors.length !== 24) {
    throw new Error(`Expected 24 negative vectors (NV01..NV24), found ${v15Vectors.vectors?.length}`);
  }

  // 5. Validate Owner Lock Manifest
  const manifest = JSON.parse(fs.readFileSync(path.join(v15Dir, 'OWNER_LOCK_MANIFEST.json'), 'utf8'));
  if (manifest.precision_solutions !== 15 || manifest.execution_packages !== 14 || manifest.negative_vectors !== 24) {
    throw new Error('Mismatched counts in V15 OWNER_LOCK_MANIFEST.json');
  }

  return {
    success: true,
    packages_count: v15Packages.packages.length,
    vectors_count: v15Vectors.vectors.length,
    solutions_count: manifest.precision_solutions
  };
}

// Execute when invoked directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename || 'scripts/verify-farely-v15-handoff.mjs')) {
  try {
    const result = verifyV15Handoff();
    console.log('Farely V15 Handoff Verification: PASS', result);
    process.exit(0);
  } catch (err) {
    console.error('Farely V15 Handoff Verification: FAIL', err.message);
    process.exit(1);
  }
}
