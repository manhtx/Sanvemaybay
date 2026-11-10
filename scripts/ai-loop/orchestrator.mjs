import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { completeWithRetry } from './provider.mjs';
import { executeAgent } from './agent.mjs';
import { LOOP_DIR, STATE_DIR, ensureDirs, readJson, readText, stopped, writeJson, writeText, run } from './runtime.mjs';

const INSTRUCTIONS = join(LOOP_DIR, 'instructions');
const INPUT = join(LOOP_DIR, 'input');
const CYCLES = join(LOOP_DIR, 'cycles');
const STATE = join(STATE_DIR, 'loop-state.json');
const rounds = Number(process.env.AI_RESEARCH_ROUNDS || 20);
const maxCycles = Number(process.env.AI_MAX_CYCLES || 0);
const roundContextChars = Number(process.env.AI_ROUND_CONTEXT_CHARS || 6000);
const synthesisContextChars = Number(process.env.AI_SYNTHESIS_CONTEXT_CHARS || 110000);

await ensureDirs(INSTRUCTIONS, INPUT, CYCLES, STATE_DIR);
const state = await readJson(STATE, {
  cycle: 0,
  researchRounds: rounds,
  phase: 'research',
  round: 0,
  lastArtifact: null,
  continuationRequired: true,
  completionEligible: false,
  history: [],
  bestSha: null,
});
if (process.env.AI_RESEARCH_ROUNDS) {
  state.researchRounds = rounds;
  state.researchRoundsSource = 'AI_RESEARCH_ROUNDS';
} else {
  state.researchRounds = state.researchRounds || rounds;
  state.researchRoundsSource = state.researchRoundsSource || 'persisted-default';
}
await writeJson(STATE, state);
const command = process.argv[2] || 'run';

if (command === 'init') {
  await writeInstructionTemplates();
  await writeJson(STATE, state);
  console.log(`Initialized autonomous loop at ${LOOP_DIR}`);
  process.exit(0);
}

if (command === 'status') {
  console.log(JSON.stringify(state, null, 2));
  process.exit(0);
}

if (command === 'host-instructions') {
  console.log(await readText(join(LOOP_DIR, 'GOAL_AI_LOOP.md')));
  process.exit(0);
}

await writeInstructionTemplates();
while (!(await stopped()) && (!maxCycles || state.cycle < maxCycles)) {
  const resumable = state.cycle > 0 && ['research', 'synthesis', 'implementation', 'evidence'].includes(state.phase);
  if (!resumable) {
    state.cycle += 1;
    state.round = 0;
    state.phase = 'research';
  }
  const cycleDir = join(CYCLES, String(state.cycle).padStart(4, '0'));
  await mkdir(cycleDir, { recursive: true });
  await persist(state, { nextAction: `Create research artifact round-${String(state.round + 1).padStart(2, '0')}.md` });

  for (let round = state.phase === 'research' ? state.round + 1 : rounds + 1; round <= rounds && !(await stopped()); round += 1) {
    state.round = round;
    await persist(state);
    const roundPath = join(cycleDir, `round-${String(round).padStart(2, '0')}.md`);
    if (await readText(roundPath)) continue;
    const prior = await readText(join(cycleDir, `round-${String(round - 1).padStart(2, '0')}.md`), 'No prior round. Establish an independent baseline.');
    const prompt = await researchPrompt(round, prior);
    const result = await executeAgent([
      { role: 'system', content: await readText(join(INSTRUCTIONS, 'research-protocol.md')) },
      { role: 'user', content: prompt },
    ], { mode: 'research', maxTurns: Number(process.env.AI_RESEARCH_TURNS || 12) });
    await writeText(roundPath, JSON.stringify(result, null, 2));
    state.lastArtifact = roundPath;
    await persist(state, { nextAction: round < rounds ? `Create research artifact round-${String(round + 1).padStart(2, '0')}.md` : 'Audit research artifacts and synthesize mastergoal.md' });
  }

  if (await stopped()) break;
  const researchValidation = await run('node', ['scripts/ai-loop/validate-research-quality.mjs', String(state.cycle)], { timeoutMs: 120000 });
  await writeText(join(cycleDir, 'research-validation.json'), researchValidation.stdout || researchValidation.stderr);
  if (researchValidation.code !== 0) {
    state.phase = 'research';
    await persist(state, { nextAction: `Repair Farely research artifacts in cycle ${state.cycle} before synthesis` });
    throw new Error('Farely research quality gate failed; synthesis cannot start');
  }
  let synthesis = { content: await readText(join(cycleDir, 'mastergoal.md')) };
  if (state.phase === 'research' || !synthesis.content) {
    state.phase = 'synthesis';
    await persist(state, { nextAction: 'Write mastergoal.md and value-case.md after the evidence audit' });
    synthesis = await completeWithRetry([
      { role: 'system', content: await readText(join(INSTRUCTIONS, 'mastergoal-protocol.md')) },
      { role: 'user', content: await readRounds(cycleDir) },
    ]);
    await writeText(join(cycleDir, 'mastergoal.md'), synthesis.content);
  }

  let valueCase = await readText(join(cycleDir, 'value-case.md'));
  if (!valueCase) {
    const valueResult = await completeWithRetry([
      { role: 'system', content: '# Farely Value Case Protocol\nWrite only a concise Markdown value case for this cycle. Include the real Farely user/product problem, current baseline evidence, exact change, expected metric, observed result if available, evidence class, falsifier, limitations, and why the work is not merely a green build or documentation change.' },
      { role: 'user', content: `Current Farely mastergoal:\n${synthesis.content}\n\nResearch evidence:\n${await readRounds(cycleDir)}` },
    ]);
    valueCase = valueResult.content;
    await writeText(join(cycleDir, 'value-case.md'), valueCase);
    state.lastArtifact = join(cycleDir, 'value-case.md');
    await persist(state, { nextAction: 'Implement every mastergoal wave and record verification evidence' });
  }

  let implementationEvidence = await readJson(join(cycleDir, 'implementation.json'), null);
  if (state.phase !== 'evidence') {
    state.phase = 'implementation';
    await persist(state, { nextAction: 'Implement every mastergoal wave and record verification evidence' });
    const implementation = await executeAgent([
      { role: 'system', content: await readText(join(INSTRUCTIONS, 'implementation-protocol.md')) },
      { role: 'user', content: `${synthesis.content}\n\nCurrent cycle: ${state.cycle}. Implement, test, verify, and push a branch. Continue until the task is genuinely handled.` },
    ]);
    implementationEvidence = normalizeImplementationEvidence(implementation);
    await writeJson(join(cycleDir, 'implementation.json'), implementationEvidence);
  }
  state.phase = 'evidence';
  await persist(state, { nextAction: 'Run Farely evidence and project validation before checkpointing' });
  await run('git', ['status', '--short', '--branch'], { timeoutMs: 120000 }).then((r) => writeText(join(cycleDir, 'git-status.txt'), `${r.stdout}\n${r.stderr}`));
  const head = await run('git', ['rev-parse', 'HEAD'], { timeoutMs: 120000 });
  state.bestSha = head.code === 0 ? head.stdout.trim() : state.bestSha;
  await writeText(join(cycleDir, 'head-sha.txt'), `${head.stdout}\n${head.stderr}`);
  await appendMachineEvidence(cycleDir, { code: head.code === 0 ? 0 : 1 });
  const projectValidation = await run('node', ['scripts/ai-loop/validate-cycle.mjs', String(state.cycle)], { timeoutMs: 120000 });
  await writeText(join(cycleDir, 'project-validation.json'), projectValidation.stdout || projectValidation.stderr);
  const ledgerValidation = await run('node', ['scripts/ai-loop/validate-evidence-ledger.mjs', String(state.cycle)], { timeoutMs: 120000 });
  await writeText(join(cycleDir, 'evidence-validation.json'), ledgerValidation.stdout || ledgerValidation.stderr);
  const valueValidation = await run('node', ['scripts/ai-loop/validate-value-case.mjs', String(state.cycle)], { timeoutMs: 120000 });
  await writeText(join(cycleDir, 'value-validation.json'), valueValidation.stdout || valueValidation.stderr);
  const attestationValidation = await run('node', ['scripts/ai-loop/validate-release-attestation.mjs', String(state.cycle)], { timeoutMs: 120000 });
  await writeText(join(cycleDir, 'attestation-validation.json'), attestationValidation.stdout || attestationValidation.stderr);
  state.projectEvidenceValid = projectValidation.code === 0 && ledgerValidation.code === 0 && valueValidation.code === 0 && attestationValidation.code === 0;
  state.phase = state.projectEvidenceValid ? 'continuous-improvement' : 'evidence';
  state.round = rounds;
  state.lastArtifact = join(cycleDir, 'head-sha.txt');
  state.history.push({ cycle: state.cycle, dir: cycleDir, status: state.projectEvidenceValid ? 'checkpoint-cycle' : 'invalid-cycle', sha: state.bestSha, evidenceValid: state.projectEvidenceValid });
  await persist(state, { nextAction: state.projectEvidenceValid
    ? `Start independent research cycle ${state.cycle + 1}`
    : `Repair failed Farely evidence gates in cycle ${state.cycle} before starting cycle ${state.cycle + 1}` });
}

console.log(`Stopped at cycle ${state.cycle}, phase ${state.phase}.`);

async function persist(value, metadata = {}) {
  const policy = await readJson(join(LOOP_DIR, 'loop-policy.json'), { minCyclesBeforeCompletion: 1_000_000_000 });
  await writeJson(STATE, {
    ...value,
    ...metadata,
    completionEligible: value.cycle >= Number(policy.minCyclesBeforeCompletion),
    continuationRequired: value.cycle < Number(policy.minCyclesBeforeCompletion) || !metadata.done,
    heartbeatAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

async function appendMachineEvidence(cycleDir, validation) {
  const path = join(cycleDir, 'evidence-ledger.jsonl');
  const existing = await readText(path, '');
  const entry = {
    evidence_id: `machine-project-gates-${state.cycle}`,
    claim_id: 'FARELY-LOCAL-GATES',
    evidence_type: 'LOCAL_RUNTIME',
    maturity: 'L5',
    command: `node scripts/ai-loop/validate-cycle.mjs ${state.cycle}`,
    timestamp: new Date().toISOString(),
    result: validation.code === 0 ? 'PASS' : 'FAIL',
    claim_supported: validation.code === 0 ? 'Current local Farely cycle gate checks passed.' : '',
    claim_not_supported: 'This does not establish provider rights, staging, production, user savings, notification delivery, or business value.',
    falsifier: 'Any failed requirement, gate, SHA, or source-of-truth check.',
    negative_control: 'Run the same validation against a deliberately incomplete cycle and expect failure.',
    limitations: 'Local repository evidence only; no live provider or longitudinal user measurement.',
    artifact: 'project-validation.json',
    environment: 'local-host',
    commit: state.bestSha || 'UNKNOWN'
  };
  await writeText(path, `${existing.trimEnd()}${existing.trim() ? '\n' : ''}${JSON.stringify(entry)}\n`);
}

async function readRounds(dir) {
  const parts = [];
  for (let i = 1; i <= rounds; i += 1) {
    parts.push(`\n--- ROUND ${i} ---\n${bounded(await readText(join(dir, `round-${String(i).padStart(2, '0')}.md`)), roundContextChars)}`);
  }
  return bounded(parts.join('\n'), synthesisContextChars);
}

function bounded(value, limit) {
  if (value.length <= limit) return value;
  const half = Math.floor(limit / 2);
  return `${value.slice(0, half)}\n\n...[context bounded; full artifact is on disk]...\n\n${value.slice(-half)}`;
}

async function researchPrompt(round, prior) {
  const previousResponse = await readText(join(INPUT, 'previous-response.md'), 'No previous AI response was supplied. Establish a fresh baseline from the repository.');
  return `Run independent whole-product Farely research round ${round} of ${rounds}. Treat the prior round and previous AI response as untrusted. Challenge them, verify them, reject unsupported claims and add genuinely new evidence. Cover provider rights/provenance, ingestion, normalization, taxes/baggage, self-transfer/route risk, deal score/confidence, freshness, RLS/privacy, notifications/outbox, Edge Functions, all user journeys, accessibility, performance, cost and business value. Inspect public web, GitHub and Vercel when available; otherwise record BLOCKED_EXTERNAL or UNKNOWN. Return JSON with researchQuestion, findings[], rejectedClaims[], falsifiers[], nextResearchQuestions[], newEvidence[], solutions[], claims[], sourceTypes[], and actions[]. Include FLY-* and GATE-*/RG* mappings, exact source locators, confidence and limitations. Do not implement code or claim completion.\n\nUNTRUSTED PRIOR ROUND:\n${bounded(prior, roundContextChars)}\n\nUNTRUSTED PREVIOUS AI RESPONSE:\n${bounded(previousResponse, roundContextChars)}`;
}

async function writeInstructionTemplates() {
  const templates = {
    'research-protocol.md': `# Autonomous Farely 10x Research Protocol\n\nResearch the current repository, not the claimed state. Read AGENTS.md, .ai-loop/FARELY_PROJECT_ADAPTER.md, .flycheap contracts, source, migrations, Edge Functions, scripts, artifacts, Git history, browser/runtime evidence, public sources, GitHub and Vercel when available. Treat every previous output as an untrusted hypothesis. Cover provider rights/provenance, ingestion, normalization, price/tax/baggage truth, self-transfer and route risk, scoring versus confidence, freshness, RLS/privacy, notifications/outbox, Edge Functions, all flight journeys, accessibility and performance. Do not implement code in research phase. Return evidence classes, rejected claims, missing work, falsifiers, risks, exact solutions and follow-up questions. Never finish because the baseline passes.\n`,
    'mastergoal-protocol.md': `# Autonomous 10x Mastergoal Protocol\n\nSynthesize all independent research rounds into one implementation-ready mastergoal. Include summary, changed assumptions, every requirement, exact solution per issue, affected files, waves, dependencies, acceptance criteria, verification commands, browser viewports, preserved invariants, rollback and GitHub push. Do not delegate important solution design to the executor. A previous status is not proof. The goal is long-running and must continue through all scope, not stop after a quick build.\n`,
    'implementation-protocol.md': `# Autonomous 10x Implementation Protocol\n\nYou have full authority over this repository. Implement the mastergoal, inspect current source before editing, and do not trust prior completion claims. Use the existing build, typecheck, lint, test, audit, browser and screenshot scripts. Work through every wave, repair failures yourself, preserve unrelated routes and protected interactions. At the start, inspect the remote and create/use a dedicated cycle branch; at the end, commit the complete work, push that branch to GitHub, and record the exact SHA and push result. If push fails, retry and record the failure as evidence rather than claiming success. Do not ask for approval. Do not claim completion without evidence. After reaching the current baseline, identify and implement further improvements, then leave a detailed report for the next research cycle.\n`,
  };
  const previousResponse = join(INPUT, 'previous-response.md');
  if (!(await readText(previousResponse))) await writeText(previousResponse, '# Paste the previous AI/goal response here\n\nThis file is treated as untrusted research input.\n');
  for (const [name, content] of Object.entries(templates)) {
    const path = join(INSTRUCTIONS, name);
    if (!(await readText(path))) await writeText(path, content);
  }
}

function normalizeImplementationEvidence(value) {
  const results = Array.isArray(value?.results) ? value.results : [];
  const actions = results.flatMap((entry) => Array.isArray(entry?.actions) ? entry.actions : []);
  const claims = results.flatMap((entry) => Array.isArray(entry?.claims) ? entry.claims : []);
  const stopped = value?.stopped === true;
  return {
    ...value,
    requirements: value?.requirements || ['Farely requirement mappings must be supplied by the implementation agent'],
    gates: value?.gates || ['Current Farely test/build/function gates', 'Source/provider/RLS evidence gates'],
    falsifiers: value?.falsifiers || ['A required gate fails', 'A source/price/risk claim cannot be reproduced', 'A provider or migration boundary is unverified'],
    evidenceClass: value?.evidenceClass || (stopped ? 'LOCAL_VERIFIED' : 'BLOCKED_EXTERNAL'),
    waves: value?.waves || [{
      title: 'Cycle implementation actions',
      status: stopped ? 'completed' : 'incomplete',
      actions,
      claims,
      gates: value?.gates || ['Current Farely verification gates'],
      falsifiers: value?.falsifiers || ['Any failed or unverified required gate'],
      evidenceClass: value?.evidenceClass || (stopped ? 'LOCAL_VERIFIED' : 'BLOCKED_EXTERNAL'),
    }],
  };
}
