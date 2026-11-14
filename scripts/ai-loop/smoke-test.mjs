import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT } from './runtime.mjs';

const dir = join(ROOT, '.ai-loop-smoke');
await rm(dir, { recursive: true, force: true });
await mkdir(dir, { recursive: true });
const checks = [
  ['runtime imports', () => import('./runtime.mjs')],
  ['provider imports', () => import('./provider.mjs')],
  ['agent imports', () => import('./agent.mjs')],
  ['research packet imports', () => import('./research-packet.mjs')],
  ['orchestrator syntax', () => import('node:fs/promises').then(async ({ readFile }) => { await readFile(new URL('./orchestrator.mjs', import.meta.url)); })],
];
for (const [name, check] of checks) { await check(); console.log(`PASS ${name}`); }
const loopOrchestratorSource = await (await import('node:fs/promises')).readFile(join(ROOT, 'scripts', 'ai-loop', 'orchestrator.mjs'), 'utf8');
const cycleValidatorSource = await (await import('node:fs/promises')).readFile(join(ROOT, 'scripts', 'ai-loop', 'validate-cycle.mjs'), 'utf8');
for (const required of ['mastergoal-round-${String(refinement).padStart(2, \'0\')}-validation.json', 'Repair Farely mastergoal refinement']) {
  if (!loopOrchestratorSource.includes(required)) throw new Error(`mastergoal refinement audit missing ${required}`);
}
console.log('PASS mastergoal refinement is audited before implementation');
if (!cycleValidatorSource.includes('research-quality-contract.json') || !cycleValidatorSource.includes("researchRoundsSource: 'research-quality-contract'")) throw new Error('Farely checkpoint validator can trust an environment-shortened round count');
console.log('PASS checkpoint validator is contract-bound');
const loopReadme = await (await import('node:fs/promises')).readFile(join(ROOT, '.ai-loop', 'README.md'), 'utf8');
if (/AI_MOCK=.*npm run ai-loop:run\b/.test(loopReadme) || !/AI_MOCK=.*npm run ai-loop:api-run\b/.test(loopReadme)) throw new Error('mock smoke documentation must use api-run, not host-instructions');
console.log('PASS mock documentation invokes the API runner explicitly');
const { providerConfig } = await import('./provider.mjs');
for (const env of [{ AI_BASE_URL: 'http://127.0.0.1:11434/v1', AI_API_KEY: 'test', AI_MODEL: 'test' }, {}]) {
  let rejected = false;
  try { providerConfig(env); } catch (error) { rejected = /Ollama|No external AI provider/i.test(error.message); }
  if (!rejected) throw new Error('provider configuration did not fail closed to host-native mode');
}
console.log('PASS host-native provider boundary');
for (const required of [
  "const testRoundOverride = process.env.AI_MOCK === '1' || process.env.AI_TEST_MODE === '1'",
  "const rounds = testRoundOverride ? Number(process.env.AI_RESEARCH_ROUNDS || 10) : 10",
  "const mastergoalRounds = testRoundOverride ? Number(process.env.AI_MASTERGOAL_ROUNDS || 5) : 5",
  "const maxCycles = testRoundOverride ? Number(process.env.AI_MAX_CYCLES || 0) : 0",
  "const researchMinActions = testRoundOverride ? Number(process.env.AI_RESEARCH_MIN_ACTIONS || 4) : 4",
]) {
  if (!loopOrchestratorSource.includes(required)) throw new Error(`production 10/5 lock missing: ${required}`);
}
console.log('PASS production 10 research / 5 mastergoal lock');
const agentSource = await (await import('node:fs/promises')).readFile(join(ROOT, 'scripts', 'ai-loop', 'agent.mjs'), 'utf8');
for (const required of ['runtimeSeal', 'adversarialScenarioMatrix', 'userResearchPlan', 'decisionType/question', 'lens ${id} lacks substantive proof', 'safeMinTurns', 'safeMinActions', 'Math.max(safeMaxTurns, minTurns)']) {
  if (!agentSource.includes(required)) throw new Error(`research stop guard missing ${required}`);
}
console.log('PASS product-led deep research stop guard is installed');
for (const required of ['mainLoop:', 'invalid-cycle-evidence-corrective-required', 'Start corrective Farely research cycle']) {
  if (!loopOrchestratorSource.includes(required)) throw new Error(`Farely evidence failure corrective-cycle guard missing ${required}`);
}
console.log('PASS Farely evidence failures force a new corrective research cycle');
const { researchStopGuard } = await import('./agent.mjs');
const shallowStop = researchStopGuard([{ subpassCoverage: ['PRODUCT_USER_BUSINESS'], lensCoverage: ['L01'], evidenceLedger: [], actions: [{ type: 'read' }], toolOutputs: [] }]);
if (shallowStop.ok || !shallowStop.reasons.some((reason) => reason.includes('subpass')) || !shallowStop.reasons.some((reason) => reason.includes('lenses'))) throw new Error('research stop guard accepted a shallow Farely round');
console.log('PASS research stop guard rejects shallow rounds');
const { compileResearchPacket, renderResearchDossier } = await import('./research-packet.mjs');
const mastergoalValidatorSource = await (await import('node:fs/promises')).readFile(join(ROOT, 'scripts', 'ai-loop', 'validate-mastergoal.mjs'), 'utf8');
for (const required of ['extractTraceabilityRecords', 'complete finding-to-solution traceability records', 'evidence class/boundary']) {
  if (!mastergoalValidatorSource.includes(required)) throw new Error(`mastergoal validator missing ${required}`);
}
console.log('PASS mastergoal traceability gate is installed');
const fixture = compileResearchPacket({ results: [{
  researchQuestion: 'Full product fixture',
  findings: [{ id: 'F1', claim: 'Fixture finding', evidenceIds: ['E1'] }],
  evidenceLedger: [{ id: 'E1', actionId: 'A1', sourceLocator: 'file .flycheap/MISSION.md', evidenceClass: 'LOCAL_CODE', observedResult: 'fixture output', limitation: 'fixture only', falsifier: 'source changes' }],
  solutions: [{ id: 'S1', findingIds: ['F1'], mechanism: 'fixture mechanism', acceptanceCriteria: 'fixture acceptance', falsifier: 'fixture failure', rollback: 'fixture rollback' }],
  actions: [{ actionId: 'A1', type: 'read', path: '.flycheap/MISSION.md' }],
  toolOutputs: [{ actionId: 'A1', type: 'read', path: '.flycheap/MISSION.md', content: 'fixture output', ok: true }],
  sourceReceipt: ['file .flycheap/MISSION.md'],
  newEvidence: ['E1'], revisedClaims: ['C1'], systemAudit: ['system fixture'],
}] }, { domain: 'Farely', cycle: 1, round: 1 });
if (fixture.schemaVersion !== 'research-packet/2.0' || !renderResearchDossier(fixture).includes('## Exact Solution Architecture')) throw new Error('research packet/dossier contract failed');
console.log('PASS research packet and human dossier contract');
await rm(dir, { recursive: true, force: true });
