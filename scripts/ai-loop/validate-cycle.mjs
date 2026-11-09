import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const statePath = join(root, '.ai-loop/state/loop-state.json');
const state = await readJson(statePath, {});
const policy = await readJson(join(root, '.ai-loop/loop-policy.json'), { minCyclesBeforeCompletion: 1_000_000_000 });
const cycle = Number(process.argv[2] || state.cycle || 0);
if (!cycle) fail('No cycle supplied and loop state has no cycle.');

const cycleDir = join(root, '.ai-loop/cycles', String(cycle).padStart(4, '0'));
const issues = [];
const warnings = [];
const evidence = [];
const completionEligible = cycle >= Number(policy.minCyclesBeforeCompletion);
if (!completionEligible) warnings.push(`completion forbidden before cycle ${policy.minCyclesBeforeCompletion}; current cycle is ${cycle}`);

for (let round = 1; round <= 20; round += 1) {
  const path = join(cycleDir, `round-${String(round).padStart(2, '0')}.md`);
  if (!(await exists(path))) issues.push(`missing research artifact: round-${String(round).padStart(2, '0')}.md`);
  else evidence.push(path);
}

const mastergoalPath = join(cycleDir, 'mastergoal.md');
if (!(await exists(mastergoalPath))) issues.push('missing mastergoal.md');
else {
  const mastergoal = await readFile(mastergoalPath, 'utf8');
  if (/status:\s*implementing/i.test(mastergoal)) issues.push('mastergoal still says IMPLEMENTING');
  evidence.push(mastergoalPath);
}

const implementationPath = join(cycleDir, 'implementation.json');
if (!(await exists(implementationPath))) issues.push('missing implementation.json');
else {
  const implementation = await readJson(implementationPath, null);
  if (!implementation) issues.push('implementation.json is invalid JSON');
  else if (Array.isArray(implementation.waves)) {
    for (const wave of implementation.waves) {
      if (wave.status && !/completed|passed|verified/i.test(wave.status)) issues.push(`implementation wave not complete: ${wave.title || 'unnamed'}`);
    }
  }
  evidence.push(implementationPath);
}

const valueCasePath = join(cycleDir, 'value-case.md');
if (!(await exists(valueCasePath))) issues.push('missing value-case.md: no concrete user/product value proof');
else {
  const valueCase = await readFile(valueCasePath, 'utf8');
  for (const requiredTerm of ['problem', 'baseline', 'result', 'evidence']) {
    if (!new RegExp(requiredTerm, 'i').test(valueCase)) issues.push(`value-case.md missing ${requiredTerm} evidence`);
  }
  evidence.push(valueCasePath);
}

const shaPath = join(cycleDir, 'head-sha.txt');
const sha = (await readText(shaPath)).trim().split(/\s+/)[0];
if (!/^[0-9a-f]{40}$/i.test(sha)) issues.push('missing or invalid 40-character Git SHA evidence');
else evidence.push(shaPath);

const reportPath = join(root, '.ai-loop/reports', `cycle-${String(cycle).padStart(4, '0')}-report.md`);
if (await exists(reportPath)) {
  const report = await readFile(reportPath, 'utf8');
  if (issues.length && /PROVEN|COMPLETED/i.test(report)) issues.push('report claims completion despite failed evidence gates');
  evidence.push(reportPath);
}

const farelyAdapterPath = join(root, '.ai-loop/FARELY_PROJECT_ADAPTER.md');
if (await exists(farelyAdapterPath)) {
  const mastergoal = await readText(mastergoalPath);
  const implementation = await readJson(implementationPath, null);
  const valueCase = await readText(valueCasePath);
  const projectEvidenceClasses = ['LOCAL_VERIFIED', 'STAGING_VERIFIED', 'PRODUCTION_VERIFIED', 'EMPIRICAL_PENDING', 'BLOCKED_EXTERNAL', 'NOT_APPLICABLE'];
  if (!/FLY-[A-Z0-9-]+/i.test(mastergoal)) issues.push('Farely mastergoal has no FLY-* requirement mapping');
  if (!/(?:GATE-[A-Z0-9-]+|RG\d+)/i.test(mastergoal)) issues.push('Farely mastergoal has no GATE-* or RG* gate mapping');
  if (!/falsifier|counterexample|negative test/i.test(mastergoal)) issues.push('Farely mastergoal has no falsifier/negative-test plan');
  if (!projectEvidenceClasses.some((name) => new RegExp(name, 'i').test(valueCase))) issues.push('Farely value-case.md has no explicit evidence class');
  if (!/falsifier|counterexample|negative test/i.test(valueCase)) issues.push('Farely value-case.md has no falsifier/negative-test evidence');
  if (implementation && typeof implementation === 'object') {
    if (!Array.isArray(implementation.requirements) || !implementation.requirements.length) issues.push('Farely implementation.json has no mapped requirements[]');
    if (!Array.isArray(implementation.gates) || !implementation.gates.length) issues.push('Farely implementation.json has no mapped gates[]');
    if (!Array.isArray(implementation.falsifiers) || !implementation.falsifiers.length) issues.push('Farely implementation.json has no falsifiers[]');
    if (!implementation.evidenceClass) issues.push('Farely implementation.json has no evidenceClass');
  }
}

const result = {
  cycle,
  passed: issues.length === 0,
  evidenceValid: issues.length === 0,
  checkpointComplete: issues.length === 0,
  completionEligible,
  continuationRequired: !completionEligible,
  minCyclesBeforeCompletion: Number(policy.minCyclesBeforeCompletion),
  issues,
  warnings,
  evidence,
  nextAction: issues.length === 0
    ? (completionEligible ? 'Completion may be considered after final policy review' : `Start independent research cycle ${cycle + 1}`)
    : 'Repair failed evidence gates before checkpoint reporting',
  auditedAt: new Date().toISOString(),
};
console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exitCode = 1;

async function exists(path) {
  try { await readFile(path); return true; } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function readText(path) {
  try { return await readFile(path, 'utf8'); } catch (error) {
    if (error.code === 'ENOENT') return '';
    throw error;
  }
}

async function readJson(path, fallback) {
  const text = await readText(path);
  if (!text) return fallback;
  try { return JSON.parse(text); } catch { return fallback; }
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
