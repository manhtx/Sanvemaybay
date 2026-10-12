/**
 * Farely V14 Static Contract Verification Script
 * Validates existence, structure, and integrity of V13/V14 contract packages.
 */
import fs from 'node:fs';
import path from 'node:path';

export function verifyV14Contract(projectRoot = process.cwd()) {
  const v14Dir = path.join(projectRoot, 'docs/convergence/v14');
  const v13Dir = path.join(projectRoot, 'docs/convergence/v13');
  const rulesPath = path.join(projectRoot, '.agents/rules/farely-project10x-v14.md');

  // 1. Verify V14 Files
  const v14Files = ['MASTER_GOAL.md', 'V14_CONTROL_ADDENDUM.md', 'CORRECTIVE_CONTRACTS.json', 'OWNER_LOCK_MANIFEST.json'];
  for (const f of v14Files) {
    const p = path.join(v14Dir, f);
    if (!fs.existsSync(p)) {
      throw new Error(`Missing V14 file: ${f}`);
    }
  }

  // 2. Verify V13 Files
  const v13Files = ['MASTER_GOAL.md', 'LOCKED_RESEARCH_CONTRACT.json', 'GOLDEN_SCENARIOS.json', 'RESEARCH_V3_HISTORICAL_HANDOFF.md'];
  for (const f of v13Files) {
    const p = path.join(v13Dir, f);
    if (!fs.existsSync(p)) {
      throw new Error(`Missing V13 file: ${f}`);
    }
  }

  // 3. Verify Persistent Rules
  if (!fs.existsSync(rulesPath)) {
    throw new Error('Missing .agents/rules/farely-project10x-v14.md');
  }

  // 4. Validate V14 Contracts
  const v14Contracts = JSON.parse(fs.readFileSync(path.join(v14Dir, 'CORRECTIVE_CONTRACTS.json'), 'utf8'));
  if (!Array.isArray(v14Contracts.contracts) || v14Contracts.contracts.length !== 20) {
    throw new Error(`Expected 20 V14 corrective contracts, found ${v14Contracts.contracts?.length}`);
  }

  // 5. Validate V13 Research Contract
  const v13Research = JSON.parse(fs.readFileSync(path.join(v13Dir, 'LOCKED_RESEARCH_CONTRACT.json'), 'utf8'));
  if (!Array.isArray(v13Research.systemic_findings) || v13Research.systemic_findings.length !== 20) {
    throw new Error(`Expected 20 V3 systemic findings, found ${v13Research.systemic_findings?.length}`);
  }
  if (!Array.isArray(v13Research.capability_contracts) || v13Research.capability_contracts.length !== 89) {
    throw new Error(`Expected 89 capability contracts (F00..F88), found ${v13Research.capability_contracts?.length}`);
  }

  // 6. Validate V13 Golden Scenarios
  const v13Scenarios = JSON.parse(fs.readFileSync(path.join(v13Dir, 'GOLDEN_SCENARIOS.json'), 'utf8'));
  if (!Array.isArray(v13Scenarios.scenarios) || v13Scenarios.scenarios.length !== 30) {
    throw new Error(`Expected 30 golden scenarios, found ${v13Scenarios.scenarios?.length}`);
  }

  return {
    success: true,
    v14_contracts_count: v14Contracts.contracts.length,
    v13_findings_count: v13Research.systemic_findings.length,
    v13_capabilities_count: v13Research.capability_contracts.length,
    v13_scenarios_count: v13Scenarios.scenarios.length
  };
}

// Execute when invoked directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename || 'scripts/verify-farely-v14-contract.mjs')) {
  try {
    const result = verifyV14Contract();
    console.log('Farely V14 Contract Verification: PASS', result);
    process.exit(0);
  } catch (err) {
    console.error('Farely V14 Contract Verification: FAIL', err.message);
    process.exit(1);
  }
}
