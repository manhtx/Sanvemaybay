import fs from 'node:fs';
import path from 'node:path';

export function verifyCertificationIntegrity(projectRoot = process.cwd()) {
  const convergenceDir = path.join(projectRoot, 'docs', 'convergence');
  const errors = [];

  const masterRegistryPath = path.join(convergenceDir, 'MASTER_ACCEPTANCE_REGISTRY.json');
  const baselinePath = path.join(convergenceDir, 'CURRENT_BASELINE.json');
  const testMatrixPath = path.join(convergenceDir, 'TEST_MATRIX.json');
  const releaseManifestPath = path.join(convergenceDir, 'RELEASE_MANIFEST.json');
  const scorecardPath = path.join(convergenceDir, 'FINAL_SCORECARD.json');

  if (!fs.existsSync(masterRegistryPath)) errors.push('Missing docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json');
  if (!fs.existsSync(baselinePath)) errors.push('Missing docs/convergence/CURRENT_BASELINE.json');
  if (!fs.existsSync(testMatrixPath)) errors.push('Missing docs/convergence/TEST_MATRIX.json');
  if (!fs.existsSync(releaseManifestPath)) errors.push('Missing docs/convergence/RELEASE_MANIFEST.json');
  if (!fs.existsSync(scorecardPath)) errors.push('Missing docs/convergence/FINAL_SCORECARD.json');

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const registry = JSON.parse(fs.readFileSync(masterRegistryPath, 'utf8'));
  const gates = registry.gates || [];

  if (gates.length !== 267) {
    errors.push(`Expected exactly 267 gates in MASTER_ACCEPTANCE_REGISTRY.json, found ${gates.length}`);
  }

  const categoryCounts = {};
  const gateIds = new Set();

  for (const g of gates) {
    if (gateIds.has(g.gate_id)) {
      errors.push(`Duplicate gate ID: ${g.gate_id}`);
    }
    gateIds.add(g.gate_id);

    categoryCounts[g.category] = (categoryCounts[g.category] || 0) + 1;

    if (!['P0', 'P1', 'P2'].includes(g.priority)) {
      errors.push(`Gate ${g.gate_id} has invalid priority: ${g.priority}`);
    }
    if (!g.acceptance_criteria || typeof g.acceptance_criteria !== 'string' || g.acceptance_criteria.length === 0) {
      errors.push(`Gate ${g.gate_id} missing acceptance criteria`);
    }
    if (!g.requirement || typeof g.requirement !== 'string' || g.requirement.length === 0) {
      errors.push(`Gate ${g.gate_id} missing requirement description`);
    }
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  if (!baseline.git || (!baseline.git.local_head && !baseline.git.head_sha)) {
    errors.push('CURRENT_BASELINE.json missing git local_head or head_sha');
  }

  return {
    ok: errors.length === 0,
    errors,
    summary: {
      total_gates: gates.length,
      total_requirements: registry.total_requirements,
      total_negative_controls: registry.total_negative_controls,
      total_user_journeys: registry.total_user_journeys,
      category_breakdown: categoryCounts
    }
  };
}

if (process.argv[1] && process.argv[1].endsWith('verify-certification-integrity.mjs')) {
  const result = verifyCertificationIntegrity();
  if (!result.ok) {
    console.error('Certification integrity verification FAILED:');
    result.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log(`Certification integrity verified: ${result.summary.total_gates} gates checked across ${Object.keys(result.summary.category_breakdown).length} categories.`);
  }
}
