import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { LOOP_DIR, ROOT, STATE_DIR, readJson, readText, writeJson } from './runtime.mjs';

const statePath = join(STATE_DIR, 'loop-state.json');
const current = await readJson(statePath, { cycle: 0, history: [] });
const policy = await readJson(join(LOOP_DIR, 'loop-policy.json'), { minCyclesBeforeCompletion: 1_000_000_000, researchRounds: 10, mastergoalRounds: 5 });
const entries = await readdir(join(LOOP_DIR, 'cycles'), { withFileTypes: true }).catch(() => []);
const cycles = entries.filter((entry) => entry.isDirectory() && /^\d{4}$/.test(entry.name)).map((entry) => Number(entry.name)).sort((a, b) => a - b);
if (!cycles.length) { console.log(JSON.stringify({ ...current, reconciled: false, reason: 'no-cycle-artifacts', root: ROOT }, null, 2)); process.exit(0); }

const cycle = cycles.at(-1);
const dir = join(LOOP_DIR, 'cycles', String(cycle).padStart(4, '0'));
const files = await readdir(dir);
const expectedRounds = Number(policy.researchRounds || 10);
const expectedMastergoalRounds = Number(policy.mastergoalRounds || 5);
const completeRounds = [];
for (let round = 1; round <= expectedRounds; round += 1) {
  if (files.includes(`round-${String(round).padStart(2, '0')}.md`) && files.includes(`round-${String(round).padStart(2, '0')}.json`)) completeRounds.push(round);
}
let round = 0;
while (completeRounds.includes(round + 1)) round += 1;
let phase = round >= expectedRounds ? 'synthesis' : 'research';
let lastArtifact = round ? join(dir, `round-${String(round).padStart(2, '0')}.md`) : dir;
const refinements = [];
for (let refinement = 1; refinement <= expectedMastergoalRounds; refinement += 1) if (await hasText(join(dir, `mastergoal-round-${String(refinement).padStart(2, '0')}.md`))) refinements.push(refinement);
if (await hasText(join(dir, 'mastergoal.md'))) { phase = 'synthesis'; lastArtifact = join(dir, 'mastergoal.md'); }
if (await hasText(join(dir, 'implementation.json'))) { phase = 'implementation'; lastArtifact = join(dir, 'implementation.json'); }
if (await hasText(join(dir, 'evidence-ledger.jsonl'))) { phase = 'evidence'; lastArtifact = join(dir, 'evidence-ledger.jsonl'); }
const validations = ['project-validation.json', 'evidence-validation.json', 'value-validation.json', 'attestation-validation.json'];
let evidenceGateFailed = false;
if (await hasText(join(dir, 'head-sha.txt'))) {
  const validationsPresent = validations.every((name) => files.includes(name));
  const validationsPassed = validationsPresent && (await Promise.all(validations.map(async (name) => /"passed"\s*:\s*true/.test(await readText(join(dir, name)))))).every(Boolean);
  phase = validationsPassed ? 'continuous-improvement' : 'evidence';
  if (validationsPresent && !validationsPassed) {
    evidenceGateFailed = true;
    phase = 'research';
    round = 0;
  }
  lastArtifact = join(dir, 'head-sha.txt');
}
const reconciledCycle = evidenceGateFailed ? cycle + 1 : cycle;
const reconciledHistory = [...(current.history || [])];
if (evidenceGateFailed && !reconciledHistory.some((entry) => Number(entry.cycle) === cycle && entry.status === 'invalid-cycle-evidence-corrective-required')) {
  reconciledHistory.push({ cycle, dir, status: 'invalid-cycle-evidence-corrective-required', correctiveCycle: reconciledCycle, reason: 'one-or-more-evidence-gates-failed' });
}
const completionEligible = reconciledCycle >= Number(policy.minCyclesBeforeCompletion);
const nextState = {
  ...current,
  cycle: reconciledCycle,
  phase: evidenceGateFailed ? 'research' : phase,
  round: evidenceGateFailed ? 0 : round,
  researchRounds: expectedRounds,
  researchRoundsSource: 'research-quality-contract',
  mastergoalRounds: expectedMastergoalRounds,
  mastergoalRound: refinements.length ? Math.max(...refinements) : 0,
  lastArtifact,
  completionEligible,
  continuationRequired: true,
  history: reconciledHistory,
  previousFailedCycle: evidenceGateFailed ? cycle : current.previousFailedCycle || null,
  reconciled: true,
  stateReconciledFrom: { cycle, reconciledCycle, round, phase, evidenceGateFailed, expectedRounds, expectedMastergoalRounds, completeRounds, mastergoalRounds: refinements, artifactCount: files.length },
  nextAction: evidenceGateFailed ? `Start corrective Farely research cycle ${reconciledCycle}` : phase === 'research' ? `Create research artifact round-${String(round + 1).padStart(2, '0')}.md and .json` : phase === 'synthesis' ? `Create mastergoal refinement ${Math.min(expectedMastergoalRounds, (refinements.at(-1) || 0) + 1)}/${expectedMastergoalRounds}` : phase === 'implementation' ? 'Implement mastergoal and create evidence artifacts' : phase === 'evidence' ? `Run all Farely validators for cycle ${cycle}` : `Start independent research cycle ${cycle + 1}`,
  heartbeatAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
await writeJson(statePath, nextState);
console.log(JSON.stringify(nextState, null, 2));

async function hasText(path) { return Boolean((await readText(path, '')).trim()); }
