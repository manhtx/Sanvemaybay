/**
 * Farely V17 Contract Verification Script
 * Validates existence, structure, and integrity of V17 contract packages,
 * authentic capability contracts, semantic drift matrix, and agent rules.
 */
import fs from 'node:fs';
import path from 'node:path';

export function verifyV17Contract(projectRoot = process.cwd()) {
  const v17Dir = path.join(projectRoot, 'docs/convergence/v17');
  const v13Dir = path.join(projectRoot, 'docs/convergence/v13');
  const v15Dir = path.join(projectRoot, 'docs/convergence/v15');
  const rulesDir = path.join(projectRoot, '.agents/rules');
  const agentsMd = path.join(projectRoot, 'AGENTS.md');

  // 1. Root AGENTS.md verification
  if (!fs.existsSync(agentsMd)) {
    throw new Error('Missing root AGENTS.md');
  }
  const agentsContent = fs.readFileSync(agentsMd, 'utf8');
  if (!agentsContent.includes('Owner Authority') || !agentsContent.includes('No Self-Certification')) {
    throw new Error('AGENTS.md missing mandatory always-on invariants');
  }

  // 2. Persistent rules YAML frontmatter verification
  const requiredRules = [
    'farely-project10x-v14.md',
    'farely-project10x-v15.md',
    'farely-project10x-v17.md'
  ];
  for (const r of requiredRules) {
    const p = path.join(rulesDir, r);
    if (!fs.existsSync(p)) {
      throw new Error(`Missing agent rule file: ${r}`);
    }
    const content = fs.readFileSync(p, 'utf8');
    if (!content.startsWith('---') || !content.includes('trigger: always_on')) {
      throw new Error(`Rule ${r} missing valid YAML frontmatter with trigger: always_on`);
    }
  }

  // 3. V17 Package Files Verification
  const v17Files = [
    'MASTER_GOAL.md',
    'CANONICAL_DAG.json',
    'ADVERSARIAL_CHALLENGES_A01_A40.json',
    'SEMANTIC_DRIFT_MATRIX.json',
    'OWNER_SOURCE_RESTORATION.md',
    'DURABLE_CHECKPOINT.json'
  ];
  for (const f of v17Files) {
    const p = path.join(v17Dir, f);
    if (!fs.existsSync(p)) {
      throw new Error(`Missing V17 file: ${f}`);
    }
  }

  // 4. Validate Authentic Capability Contracts in V13
  const v13Path = path.join(v13Dir, 'LOCKED_RESEARCH_CONTRACT.json');
  const v13Data = JSON.parse(fs.readFileSync(v13Path, 'utf8'));
  if (!Array.isArray(v13Data.capability_contracts) || v13Data.capability_contracts.length !== 89) {
    throw new Error(`Expected 89 capability contracts in V13 contract, found ${v13Data.capability_contracts?.length}`);
  }
  const f00 = v13Data.capability_contracts.find(c => c.id === 'F00');
  if (f00?.title !== 'Independent proof authority' || f00?.tier !== 'P0') {
    throw new Error('F00 does not match authentic owner title or tier');
  }
  const f21 = v13Data.capability_contracts.find(c => c.id === 'F21');
  if (f21?.title !== 'Budget-first Everywhere Explore' || f21?.tier !== 'P1') {
    throw new Error('F21 does not match authentic owner title or tier');
  }

  // 5. Validate Semantic Drift Matrix
  const matrixPath = path.join(v17Dir, 'SEMANTIC_DRIFT_MATRIX.json');
  const matrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
  if (matrix.priority_mismatch_count !== 34 || matrix.total_capabilities !== 89) {
    throw new Error(`Expected 34 priority mismatches across 89 capabilities in drift matrix, found ${matrix.priority_mismatch_count}`);
  }

  // 6. Validate 40 Adversarial Challenges
  const challengesPath = path.join(v17Dir, 'ADVERSARIAL_CHALLENGES_A01_A40.json');
  const challenges = JSON.parse(fs.readFileSync(challengesPath, 'utf8'));
  if (!Array.isArray(challenges.challenges) || challenges.challenges.length !== 40) {
    throw new Error(`Expected 40 adversarial challenges (A01..A40), found ${challenges.challenges?.length}`);
  }

  // 7. Validate Work Package Statuses (No fake COMPLETED)
  const v15Packages = JSON.parse(fs.readFileSync(path.join(v15Dir, 'EXECUTION_PACKAGES.json'), 'utf8'));
  const prematureCompleted = v15Packages.packages.filter(p => p.status === 'COMPLETED');
  if (prematureCompleted.length > 0) {
    throw new Error(`Found ${prematureCompleted.length} work packages hardcoded to COMPLETED without dynamic proof derivation`);
  }

  return {
    success: true,
    capability_count: v13Data.capability_contracts.length,
    priority_drift_resolved: matrix.priority_mismatch_count,
    adversarial_challenges_count: challenges.challenges.length,
    rules_verified: requiredRules.length
  };
}

// Execute when invoked directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename || 'scripts/verify-farely-v17-contract.mjs')) {
  try {
    const res = verifyV17Contract();
    console.log('Farely V17 Contract Verification: PASS', res);
    process.exit(0);
  } catch (err) {
    console.error('Farely V17 Contract Verification: FAIL', err.message);
    process.exit(1);
  }
}
