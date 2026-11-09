import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const root = process.cwd();
const statePath = join(root, '.ai-loop/state/loop-state.json');
const policyPath = join(root, '.ai-loop/loop-policy.json');

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const token = process.argv[i];
  if (!token.startsWith('--')) continue;
  args.set(token.slice(2), process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : 'true');
}

const state = await readJson(statePath, { cycle: 0, phase: 'research', round: 0, history: [] });
const policy = await readJson(policyPath, { minCyclesBeforeCompletion: 1_000_000_000 });
const cycle = Number(args.get('cycle') || state.cycle || 0);
const round = args.has('round') ? Number(args.get('round')) : state.round || 0;
const completionEligible = cycle >= Number(policy.minCyclesBeforeCompletion);
const nextState = {
  ...state,
  cycle,
  phase: args.get('phase') || state.phase || 'research',
  round,
  lastArtifact: args.get('artifact') || state.lastArtifact || null,
  nextAction: args.get('next-action') || state.nextAction || null,
  continuationRequired: !completionEligible,
  completionEligible,
  heartbeatAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

await atomicWrite(statePath, `${JSON.stringify(nextState, null, 2)}\n`);
console.log(JSON.stringify(nextState, null, 2));

async function readJson(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch { return fallback; }
}

async function atomicWrite(path, content) {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temp, content, 'utf8');
  await rename(temp, path);
}
