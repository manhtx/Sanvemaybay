import fs from 'node:fs';
import path from 'node:path';

export function verifyCertificationIntegrity(projectRoot = process.cwd()) {
  const flycheapDir = path.join(projectRoot, '.flycheap');
  const errors = [];

  const acceptancePath = path.join(flycheapDir, 'ACCEPTANCE_CONTRACT.json');
  const featurePath = path.join(flycheapDir, 'FEATURE_CONTRACT.json');
  const tracePath = path.join(flycheapDir, 'PRODUCT_TRACEABILITY.json');
  const maturityPath = path.join(flycheapDir, 'EVIDENCE_MATURITY.json');
  const gatesPath = path.join(flycheapDir, 'RUNTIME_GATES.json');

  if (!fs.existsSync(acceptancePath)) errors.push('Missing ACCEPTANCE_CONTRACT.json');
  if (!fs.existsSync(featurePath)) errors.push('Missing FEATURE_CONTRACT.json');
  if (!fs.existsSync(tracePath)) errors.push('Missing PRODUCT_TRACEABILITY.json');
  if (!fs.existsSync(maturityPath)) errors.push('Missing EVIDENCE_MATURITY.json');
  if (!fs.existsSync(gatesPath)) errors.push('Missing RUNTIME_GATES.json');

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const acceptance = JSON.parse(fs.readFileSync(acceptancePath, 'utf8'));
  const feature = JSON.parse(fs.readFileSync(featurePath, 'utf8'));
  const trace = JSON.parse(fs.readFileSync(tracePath, 'utf8'));
  const maturity = JSON.parse(fs.readFileSync(maturityPath, 'utf8'));
  const gates = JSON.parse(fs.readFileSync(gatesPath, 'utf8'));

  // 1. Acceptance Requirements Check
  const reqs = acceptance.requirements || [];
  const reqIds = new Set();
  const categoryCounts = { DATA: 0, INTEL: 0, UX: 0, SEC: 0, OPS: 0 };

  for (const r of reqs) {
    if (reqIds.has(r.id)) {
      errors.push(`Duplicate requirement ID: ${r.id}`);
    }
    reqIds.add(r.id);
    const prefix = r.id.split('-')[1];
    if (prefix in categoryCounts) {
      categoryCounts[prefix]++;
    } else {
      errors.push(`Unknown requirement prefix for ID ${r.id}: ${prefix}`);
    }
    if (!['P0', 'P1'].includes(r.priority)) {
      errors.push(`Requirement ${r.id} has invalid priority: ${r.priority}`);
    }
    if (!r.acceptance || !Array.isArray(r.acceptance) || r.acceptance.length === 0) {
      errors.push(`Requirement ${r.id} missing acceptance criteria`);
    }
  }

  if (reqs.length !== 34) {
    errors.push(`Expected 34 requirements in acceptance contract, found ${reqs.length}`);
  }

  const expectedCounts = { DATA: 5, INTEL: 10, UX: 9, SEC: 5, OPS: 5 };
  for (const [cat, exp] of Object.entries(expectedCounts)) {
    if (categoryCounts[cat] !== exp) {
      errors.push(`Taxonomy mismatch for ${cat}: expected ${exp}, found ${categoryCounts[cat]}`);
    }
  }

  // 2. Feature Contract Check
  const feats = feature.features || [];
  const featIds = new Set();
  for (const f of feats) {
    if (featIds.has(f.feature_id)) {
      errors.push(`Duplicate feature ID: ${f.feature_id}`);
    }
    featIds.add(f.feature_id);
    for (const rid of f.acceptance_requirement_ids || []) {
      if (!reqIds.has(rid)) {
        errors.push(`Feature ${f.feature_id} references unknown requirement ${rid}`);
      }
    }
  }
  if (feats.length !== 12) {
    errors.push(`Expected 12 features in feature contract, found ${feats.length}`);
  }

  // 3. Traceability Check
  const outcomes = trace.outcomes || [];
  if (outcomes.length !== 14) {
    errors.push(`Expected 14 outcomes in traceability matrix, found ${outcomes.length}`);
  }

  const mappedReqs = new Set();
  const mappedFeats = new Set();
  for (const o of outcomes) {
    for (const r of o.requirements || []) {
      if (!reqIds.has(r)) {
        errors.push(`Outcome ${o.outcome_id} references unknown requirement ${r}`);
      }
      mappedReqs.add(r);
    }
    for (const f of o.features || []) {
      if (!featIds.has(f)) {
        errors.push(`Outcome ${o.outcome_id} references unknown feature ${f}`);
      }
      mappedFeats.add(f);
    }
  }

  for (const rid of reqIds) {
    if (!mappedReqs.has(rid)) {
      errors.push(`Orphan requirement not mapped to any outcome: ${rid}`);
    }
  }

  for (const fid of featIds) {
    if (!mappedFeats.has(fid)) {
      errors.push(`Orphan feature not mapped to any outcome: ${fid}`);
    }
  }

  // 4. Evidence Maturity Check
  const reqMaturity = maturity.requirements_maturity || {};
  const maturityReqIds = new Set(Object.keys(reqMaturity));
  for (const rid of reqIds) {
    if (!maturityReqIds.has(rid)) {
      errors.push(`Requirement ${rid} missing from evidence maturity ledger`);
    }
  }

  const levelSummary = maturity.maturity_summary || {};
  const computedLevels = {
    L0_claim_only: 0,
    L1_code_present: 0,
    L2_static_inspection: 0,
    L3_unit_fixture: 0,
    L4_local_integration: 0,
    L5_local_fullstack: 0,
    L6_remote_staging: 0,
    L7_live_external: 0,
    L8_production: 0,
    L9_longitudinal: 0,
  };

  const levelMap = {
    L0: 'L0_claim_only',
    L1: 'L1_code_present',
    L2: 'L2_static_inspection',
    L3: 'L3_unit_fixture',
    L4: 'L4_local_integration',
    L5: 'L5_local_fullstack',
    L6: 'L6_remote_staging',
    L7: 'L7_live_external',
    L8: 'L8_production',
    L9: 'L9_longitudinal',
  };

  for (const [rid, data] of Object.entries(reqMaturity)) {
    const key = levelMap[data.highest_level];
    if (key && key in computedLevels) {
      computedLevels[key]++;
    } else {
      errors.push(`Requirement ${rid} has unknown evidence level: ${data.highest_level}`);
    }
  }

  for (const [lvl, count] of Object.entries(computedLevels)) {
    if (levelSummary[lvl] !== count) {
      errors.push(`Evidence maturity summary mismatch for ${lvl}: declared ${levelSummary[lvl]}, computed ${count}`);
    }
  }

  // 5. Release Gates Check
  const gateList = gates.gates || [];
  const validGateStatuses = ['SUPPORTED', 'BLOCKED', 'FALSIFIED', 'IN_PROGRESS', 'NOT_STARTED', 'NOT_APPLICABLE'];
  const gateIds = new Set();

  for (const g of gateList) {
    if (gateIds.has(g.gate_id)) {
      errors.push(`Duplicate gate ID: ${g.gate_id}`);
    }
    gateIds.add(g.gate_id);
    if (!validGateStatuses.includes(g.status)) {
      errors.push(`Gate ${g.gate_id} has invalid status: ${g.status}`);
    }
    if (g.status === 'NOT_APPLICABLE' && (!g.rationale || g.rationale.trim() === '')) {
      errors.push(`Gate ${g.gate_id} is NOT_APPLICABLE but missing rationale`);
    }
  }

  if (gateList.length !== 33) {
    errors.push(`Expected 33 release gates (RG01-RG33), found ${gateList.length}`);
  }

  // Cross-validation: Outcome release gates must exist in RUNTIME_GATES
  for (const o of outcomes) {
    for (const gid of o.release_gates || []) {
      if (!gateIds.has(gid)) {
        errors.push(`Outcome ${o.outcome_id} references unknown gate ${gid}`);
      }
    }
  }

  // Cross-validation: RELEASE_BLOCKERS citations
  const blockersPath = path.join(flycheapDir, 'RELEASE_BLOCKERS.json');
  if (fs.existsSync(blockersPath)) {
    const blockersData = JSON.parse(fs.readFileSync(blockersPath, 'utf8'));
    for (const b of blockersData.blockers || []) {
      for (const gid of b.affected_gates || []) {
        if (!gateIds.has(gid)) {
          errors.push(`Blocker ${b.blocker_id} references unknown gate ${gid}`);
        }
      }
      for (const rid of b.affected_requirements || []) {
        if (!reqIds.has(rid)) {
          errors.push(`Blocker ${b.blocker_id} references unknown requirement ${rid}`);
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    summary: {
      total_requirements: reqs.length,
      category_breakdown: categoryCounts,
      total_features: feats.length,
      total_outcomes: outcomes.length,
      total_gates: gateList.length,
      maturity_levels: computedLevels,
    },
  };
}

if (process.argv[1] && process.argv[1].endsWith('verify-certification-integrity.mjs')) {
  const result = verifyCertificationIntegrity();
  if (!result.ok) {
    console.error('Certification integrity verification FAILED:');
    for (const err of result.errors) {
      console.error(`- ${err}`);
    }
    process.exit(1);
  }
  console.log('Certification integrity verification PASSED:');
  console.log(JSON.stringify(result.summary, null, 2));
}
