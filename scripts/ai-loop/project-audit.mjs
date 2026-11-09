import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'AGENTS.md',
  '.ai-loop/FARELY_PROJECT_ADAPTER.md',
  '.ai-loop/GOAL_AI_LOOP.md',
  '.ai-loop/loop-policy.json',
  '.flycheap/MISSION.md',
  '.flycheap/AUTONOMY_CONSTITUTION.md',
  '.flycheap/ACCEPTANCE_CONTRACT.json',
  '.flycheap/FEATURE_CONTRACT.json',
  '.flycheap/CANONICAL_REQUIREMENT_REGISTRY.json',
  '.flycheap/RELEASE_GATES.json',
  '.flycheap/RUNTIME_GATES.json',
  '.flycheap/PERFORMANCE_BUDGETS.json',
  '.flycheap/STATE.json',
  '.flycheap/STATUS.json',
  'docs/TESTING_STRATEGY.md',
  'docs/AUTOMATION_FLOW.md',
  'docs/DEFINITION_OF_DONE_MATRIX.md',
];

const issues = [];
const warnings = [];
const missing = [];
for (const relativePath of requiredFiles) {
  if (await exists(join(root, relativePath))) continue;
  missing.push(relativePath);
  issues.push(`missing Farely source-of-truth file: ${relativePath}`);
}

const acceptance = await readJson('.flycheap/ACCEPTANCE_CONTRACT.json');
const features = await readJson('.flycheap/FEATURE_CONTRACT.json');
const release = await readJson('.flycheap/RELEASE_GATES.json');
const runtime = await readJson('.flycheap/RUNTIME_GATES.json');
const blockers = await readJson('.flycheap/RELEASE_BLOCKERS.json');
const status = await readJson('.flycheap/STATUS.json');

const requirementIds = new Set((acceptance?.requirements || []).map((item) => item.id).filter(Boolean));
const featureIds = new Set((features?.features || []).map((item) => item.feature_id).filter(Boolean));
const releaseGates = release?.release_gates || [];
const runtimeGates = runtime?.gates || [];
const activeExternalBlockers = (blockers?.blockers || []).filter((item) => item.severity && !/resolved|closed|none/i.test(item.status || ''));
const openP0P1 = Number(status?.failing_p0_count || 0) + Number(status?.failing_p1_count || 0);

if (!requirementIds.size) issues.push('Farely acceptance contract contains no requirement IDs');
if (!featureIds.size) issues.push('Farely feature contract contains no feature IDs');
if (!releaseGates.length) issues.push('Farely release gate registry is empty');
if (!runtimeGates.length) issues.push('Farely runtime gate registry is empty');
if (openP0P1 > 0) warnings.push(`current STATUS reports ${openP0P1} open P0/P1 defects`);
if (activeExternalBlockers.length) warnings.push(`${activeExternalBlockers.length} external blocker records require explicit evidence classification`);

const result = {
  project: 'farely',
  product: 'FlyCheap AI',
  passed: issues.length === 0,
  sourceOfTruth: {
    requiredFiles: requiredFiles.length,
    missing,
    acceptanceRequirements: requirementIds.size,
    features: featureIds.size,
    releaseGates: releaseGates.length,
    runtimeGates: runtimeGates.length,
  },
  currentState: {
    phase: status?.current_phase || null,
    slice: status?.current_slice || null,
    openP0P1,
    externalBlockers: activeExternalBlockers.map((item) => ({ id: item.blocker_id, title: item.title, severity: item.severity })),
  },
  requiredEvidenceClasses: ['LOCAL_VERIFIED', 'STAGING_VERIFIED', 'PRODUCTION_VERIFIED', 'EMPIRICAL_PENDING', 'BLOCKED_EXTERNAL', 'NOT_APPLICABLE'],
  issues,
  warnings,
  auditedAt: new Date().toISOString(),
};

console.log(JSON.stringify(result, null, 2));
if (!result.passed) process.exitCode = 1;

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

async function readJson(relativePath) {
  try { return JSON.parse(await readFile(join(root, relativePath), 'utf8')); } catch { return null; }
}
