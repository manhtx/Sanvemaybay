import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { completeWithRetry } from './provider.mjs';
import { executeAgent } from './agent.mjs';
import { compileResearchPacket, renderResearchDossier } from './research-packet.mjs';
import { LOOP_DIR, STATE_DIR, ensureDirs, readJson, readText, stopped, writeJson, writeText, writeTextAtomic, run } from './runtime.mjs';

const INSTRUCTIONS = join(LOOP_DIR, 'instructions');
const INPUT = join(LOOP_DIR, 'input');
const CYCLES = join(LOOP_DIR, 'cycles');
const STATE = join(STATE_DIR, 'loop-state.json');
// Keep the real workflow invariant. Short round counts are permitted only in
// isolated mock/test runs and cannot accidentally weaken a production goal.
const testRoundOverride = process.env.AI_MOCK === '1' || process.env.AI_TEST_MODE === '1';
const rounds = testRoundOverride ? Number(process.env.AI_RESEARCH_ROUNDS || 10) : 10;
const mastergoalRounds = testRoundOverride ? Number(process.env.AI_MASTERGOAL_ROUNDS || 5) : 5;
const maxCycles = testRoundOverride ? Number(process.env.AI_MAX_CYCLES || 0) : 0;
const maxRoundAttempts = testRoundOverride ? Number(process.env.AI_MAX_ROUND_ATTEMPTS || 3) : 3;
// Preserve full prior dossier substance; this is a ceiling, never a minimum.
const roundContextChars = testRoundOverride ? Number(process.env.AI_ROUND_CONTEXT_CHARS || 640000) : 640000;
const synthesisContextChars = testRoundOverride ? Number(process.env.AI_SYNTHESIS_CONTEXT_CHARS || 6000000) : 6000000;
const researchTurns = testRoundOverride ? Number(process.env.AI_RESEARCH_TURNS || 48) : 48;
// Semantic depth is authoritative; these are only safety floors against an empty response.
const researchMinTurns = testRoundOverride ? Number(process.env.AI_RESEARCH_MIN_TURNS || 1) : 1;
const researchMinActions = testRoundOverride ? Number(process.env.AI_RESEARCH_MIN_ACTIONS || 4) : 4;

await ensureDirs(INSTRUCTIONS, INPUT, CYCLES, STATE_DIR);
const command = process.argv[2] || 'run';
const state = await readJson(STATE, {
  cycle: 0,
  researchRounds: rounds,
  phase: 'research',
  round: 0,
  lastArtifact: null,
  continuationRequired: true,
  completionEligible: false,
  mastergoalRound: 0,
  history: [],
  bestSha: null,
});
if (command === 'run') {
  state.researchRounds = rounds;
  state.mastergoalRounds = mastergoalRounds;
}
await writeJson(STATE, state);

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
mainLoop: while (!(await stopped()) && (!maxCycles || state.cycle < maxCycles)) {
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
    const packetPath = join(cycleDir, `round-${String(round).padStart(2, '0')}.json`);
    if ((await readText(roundPath)).trim() && (await readText(packetPath)).trim()) {
      const existingAudit = await run('node', ['scripts/ai-loop/validate-research-quality.mjs', String(state.cycle)], { timeoutMs: 120000, env: { AI_INTERNAL_PREFIX_AUDIT: '1', AI_AUDIT_PREFIX_ROUNDS: String(round) } });
      if (existingAudit.code === 0) continue;
    }
    const prior = round > 1
      ? buildPriorRoundContext(
        await readText(join(cycleDir, `round-${String(round - 1).padStart(2, '0')}.md`), ''),
        await readText(join(cycleDir, `round-${String(round - 1).padStart(2, '0')}.json`), ''),
        roundContextChars,
      )
      : 'No prior round. Establish an independent baseline from the current repository and runtime.';
    const prompt = await researchPrompt(round, prior);
    let repair = '';
    let accepted = false;
    for (let attempt = 1; attempt <= maxRoundAttempts && !accepted; attempt += 1) {
      const sessionId = `cycle-${state.cycle}-round-${round}-attempt-${attempt}-${randomUUID()}`;
      const runtimeEventPath = join(cycleDir, `round-${String(round).padStart(2, '0')}-attempt-${String(attempt).padStart(2, '0')}.runtime.jsonl`);
      const result = await executeAgent([
        { role: 'system', content: await readText(join(INSTRUCTIONS, 'research-protocol.md')) },
        { role: 'user', content: `${prompt}\n\nROUND ATTEMPT ${attempt}/${maxRoundAttempts}.\n${repair}` },
      ], {
        mode: 'research', maxTurns: researchTurns, minTurns: researchMinTurns, minActions: researchMinActions,
        sessionId, runtimeEventPath,
      });
      const packet = compileResearchPacket(result, { domain: 'Farely', cycle: state.cycle, round });
      packet.executionManifest = { ...(packet.executionManifest || {}), sessionId, runtimeEventPath, executionMode: 'research', stopped: result.stopped === true, completionGate: result.completionGate || null };
      await writeJson(packetPath, packet);
      await writeTextAtomic(roundPath, renderResearchDossier(packet));
      const roundCheck = await run('node', ['scripts/ai-loop/validate-research-quality.mjs', String(state.cycle)], { timeoutMs: 120000, env: { AI_INTERNAL_PREFIX_AUDIT: '1', AI_AUDIT_PREFIX_ROUNDS: String(round) } });
      await writeText(join(cycleDir, `round-${String(round).padStart(2, '0')}-audit-attempt-${String(attempt).padStart(2, '0')}.json`), roundCheck.stdout || roundCheck.stderr);
      accepted = roundCheck.code === 0 && result.stopped === true;
      if (!accepted) repair = `The round failed its semantic audit. Repair every issue and re-run the complete whole-product investigation; do not merely edit prose.\n${roundCheck.stdout || roundCheck.stderr}`;
    }
    if (!accepted) {
      state.history.push({ cycle: state.cycle, status: 'invalid-research-round', round, reason: 'round-audit-failed' });
      state.cycle += 1; state.round = 0; state.mastergoalRound = 0; state.phase = 'research';
      await persist(state, { nextAction: `Start corrective full-product research cycle ${state.cycle}` });
      continue mainLoop;
    }
    state.lastArtifact = roundPath;
    await persist(state, { nextAction: round < rounds ? `Create research artifact round-${String(round + 1).padStart(2, '0')}.md` : 'Audit research artifacts and synthesize mastergoal.md' });
  }

  if (await stopped()) break;
  const projectPreflight = await run('node', ['scripts/ai-loop/project-audit.mjs'], { timeoutMs: 120000 });
  await writeText(join(cycleDir, 'project-preflight.json'), projectPreflight.stdout || projectPreflight.stderr);
  if (projectPreflight.code !== 0) {
    state.phase = 'research';
    state.history.push({ cycle: state.cycle, status: 'invalid-project-preflight', reason: 'project-audit-failed', validation: projectPreflight.stdout || projectPreflight.stderr });
    state.cycle += 1;
    state.round = 0;
    state.mastergoalRound = 0;
    await persist(state, { nextAction: `Repair Farely project audit failures in cycle ${state.cycle} before mastergoal synthesis` });
    continue;
  }
  const researchValidation = await run('node', ['scripts/ai-loop/validate-research-quality.mjs', String(state.cycle)], { timeoutMs: 120000 });
  await writeText(join(cycleDir, 'research-validation.json'), researchValidation.stdout || researchValidation.stderr);
  if (researchValidation.code !== 0) {
    state.phase = 'research';
    state.history.push({ cycle: state.cycle, status: 'invalid-research-corrective-cycle', reason: 'research-quality-gate', validation: researchValidation.stdout || researchValidation.stderr });
    state.cycle += 1;
    state.round = 0;
    state.mastergoalRound = 0;
    await persist(state, { nextAction: `Repair Farely research artifacts in cycle ${state.cycle} before synthesis` });
    continue;
  }
  let synthesis = { content: await readText(join(cycleDir, 'mastergoal.md')) };
  if (state.phase === 'research' || !synthesis.content || Number(state.mastergoalRound || 0) < mastergoalRounds) {
    state.phase = 'synthesis';
    const researchContext = await readRounds(cycleDir);
    let priorDraft = synthesis.content || '';
    for (let refinement = Math.max(1, Number(state.mastergoalRound || 0) + 1); refinement <= mastergoalRounds; refinement += 1) {
      state.mastergoalRound = refinement;
      await persist(state, { nextAction: `Write Farely mastergoal refinement ${refinement}/${mastergoalRounds}` });
      synthesis = await completeWithRetry([
        { role: 'system', content: await readText(join(INSTRUCTIONS, 'mastergoal-protocol.md')) },
        { role: 'user', content: `${researchContext}\n\nPRIOR MASTERGOAL (UNTRUSTED):\n${bounded(priorDraft, synthesisContextChars)}\n\nMASTERGOAL REFINEMENT ${refinement}/${mastergoalRounds}. Re-check all 10 rounds and return the complete Markdown dossier, not a delta summary.` },
      ]);
      priorDraft = synthesis.content;
      await writeText(join(cycleDir, `mastergoal-round-${String(refinement).padStart(2, '0')}.md`), synthesis.content);
      await writeText(join(cycleDir, 'mastergoal.md'), synthesis.content);
      const refinementAudit = await run('node', ['scripts/ai-loop/validate-mastergoal.mjs', String(state.cycle)], { timeoutMs: 120000 });
      await writeText(join(cycleDir, `mastergoal-round-${String(refinement).padStart(2, '0')}-validation.json`), refinementAudit.stdout || refinementAudit.stderr);
      if (refinementAudit.code !== 0) {
        state.mastergoalRound = refinement - 1;
        state.mastergoalAttempts = Number(state.mastergoalAttempts || 0) + 1;
        await persist(state, { nextAction: `Repair Farely mastergoal refinement ${refinement}/${mastergoalRounds}; attempt ${state.mastergoalAttempts}` });
        if (state.mastergoalAttempts >= 3) {
          state.history.push({ cycle: state.cycle, status: 'invalid-mastergoal-corrective-cycle', reason: 'mastergoal-quality-gate', validation: refinementAudit.stdout || refinementAudit.stderr });
          state.cycle += 1; state.round = 0; state.mastergoalRound = 0; state.mastergoalAttempts = 0; state.phase = 'research';
        }
        break;
      }
    }
  }

  const mastergoalAudit = await run('node', ['scripts/ai-loop/validate-mastergoal.mjs', String(state.cycle)], { timeoutMs: 120000 });
  await writeText(join(cycleDir, 'mastergoal-audit.json'), mastergoalAudit.stdout || mastergoalAudit.stderr);
  if (mastergoalAudit.code !== 0 || Number(state.mastergoalRound || 0) < mastergoalRounds) {
    state.phase = 'synthesis';
    state.mastergoalRound = Math.max(0, Number(state.mastergoalRound || 0) - 1);
    state.mastergoalAttempts = Number(state.mastergoalAttempts || 0) + 1;
    await persist(state, { nextAction: `Repair Farely mastergoal refinement ${Number(state.mastergoalRound || 0) + 1}/${mastergoalRounds}` });
    if (state.mastergoalAttempts >= 3) {
      state.history.push({ cycle: state.cycle, status: 'invalid-mastergoal-corrective-cycle', reason: 'mastergoal-audit', validation: mastergoalAudit.stdout || mastergoalAudit.stderr });
      state.cycle += 1; state.round = 0; state.mastergoalRound = 0; state.mastergoalAttempts = 0; state.phase = 'research';
    }
    continue;
  }
  state.mastergoalAttempts = 0;

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
    ], { mode: 'implementation', sessionId: `cycle-${state.cycle}-implementation-${randomUUID()}`, runtimeEventPath: join(cycleDir, 'implementation.runtime.jsonl') });
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
  state.round = rounds;
  state.mastergoalRound = mastergoalRounds;
  state.lastArtifact = join(cycleDir, 'head-sha.txt');
  if (!state.projectEvidenceValid) {
    state.history.push({
      cycle: state.cycle,
      dir: cycleDir,
      status: 'invalid-cycle-evidence-corrective-required',
      sha: state.bestSha,
      evidenceValid: false,
      validationCodes: {
        project: projectValidation.code,
        evidence: ledgerValidation.code,
        value: valueValidation.code,
        attestation: attestationValidation.code,
      },
    });
    state.cycle += 1;
    state.round = 0;
    state.mastergoalRound = 0;
    state.phase = 'research';
    state.synthesisBlocked = true;
    await persist(state, { nextAction: `Start corrective Farely research cycle ${state.cycle} after evidence gate failure` });
    continue mainLoop;
  }
  state.phase = 'continuous-improvement';
  state.history.push({ cycle: state.cycle, dir: cycleDir, status: 'checkpoint-cycle', sha: state.bestSha, evidenceValid: true });
  await persist(state, { nextAction: `Start independent research cycle ${state.cycle + 1}` });
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
  const perRoundBudget = Math.max(24000, Math.floor(synthesisContextChars / Math.max(rounds, 1)));
  for (let i = 1; i <= rounds; i += 1) {
    const markdown = await readText(join(dir, `round-${String(i).padStart(2, '0')}.md`), '');
    const packet = await readText(join(dir, `round-${String(i).padStart(2, '0')}.json`), '');
    parts.push(`\n--- ROUND ${i} ---\n${buildPriorRoundContext(markdown, packet, perRoundBudget)}`);
  }
  return bounded(parts.join('\n'), synthesisContextChars);
}

function bounded(value, limit) {
  if (value.length <= limit) return value;
  const half = Math.floor(limit / 2);
  return `${value.slice(0, half)}\n\n...[context bounded; full artifact is on disk]...\n\n${value.slice(-half)}`;
}

function buildPriorRoundContext(markdown, packetText, limit) {
  let packet;
  try { packet = JSON.parse(packetText); } catch { packet = null; }
  const research = packet?.research || {};
  const productFields = ['researchSynthesis', 'productValueFindings', 'userJourneyMap', 'uxFrictionRegister', 'businessValueAudit', 'experienceBlueprint', 'productOpportunityBacklog', 'userResearchPlan', 'businessExperimentPlan', 'valueHypotheses', 'revisedClaims', 'roundDelta', 'newEvidence', 'evidenceLedger'];
  const productContext = JSON.stringify(Object.fromEntries(productFields.map((field) => [field, research[field] || []])), null, 2);
  const technicalFields = ['technicalFindings', 'architectureGaps', 'rootCauseAnalysis', 'systemContradictions', 'visualContentAudit', 'runtimeAcceptanceMatrix', 'solutions', 'acceptanceMatrix', 'falsifiers'];
  const technicalContext = JSON.stringify(Object.fromEntries(technicalFields.map((field) => [field, research[field] || []])), null, 2);
  const markdownBudget = Math.floor(limit * 0.25);
  const productBudget = Math.floor(limit * 0.5);
  return `PRIOR ROUND MARKDOWN DOSSIER (UNTRUSTED):\n${bounded(markdown, markdownBudget)}\n\nPRIOR PRODUCT/USER/BUSINESS/UX PACKET (UNTRUSTED — RECHECK EVERY CLAIM):\n${bounded(productContext, productBudget)}\n\nPRIOR TECHNICAL/OPERATIONS PACKET (UNTRUSTED — SUPPORTING CONTEXT ONLY):\n${bounded(technicalContext, limit - markdownBudget - productBudget)}`;
}

async function researchPrompt(round, prior) {
  const previousResponse = await readText(join(INPUT, 'previous-response.md'), 'No previous AI response was supplied. Establish a fresh baseline from the repository.');
  return `Run independent whole-product Farely research round ${round} of ${rounds}. Treat the prior round and previous AI response as untrusted hypotheses, not truth. Re-read the repository and runtime, re-check important prior claims with fresh actions, reject unsupported claims, and add genuinely new evidence. Complete four subpasses: PRODUCT_USER_BUSINESS, SYSTEM_ARCHITECTURE, UX_CONTENT_INTERACTION, and DELIVERY_OPERATIONS; then cover all 12 lenses: mission, traveler, journey, value, fare-truth, interaction, accessibility, performance, architecture, security, delivery, evidence. Cover provider rights/provenance, ingestion, normalization, taxes/baggage, self-transfer/route risk, deal score/confidence, freshness, RLS/privacy, notifications/outbox, Edge Functions, all user journeys, accessibility, performance, cost and business value. Inspect public web, GitHub and Vercel when available; otherwise record BLOCKED_EXTERNAL or UNKNOWN. This is a semantic deep-research dossier, not a length exercise: there is no quota for rows, characters, turns, actions, or domain ratios. Return one complete JSON dossier with all requested sections, concrete observations, root causes, exact solution architecture, alternatives, rejected claims, acceptance tests, falsifiers and limitations. Every evidence row must contain id, actionId, outputIds, sourceLocator, evidenceClass, observedResult, limitation and falsifier; every finding maps to evidenceIds; every solution maps to findingIds and contains mechanism, affected files, dependencies, acceptance, verification and rollback. Include FLY-* and GATE-*/RG* mappings, exact source locators, confidence and limitations. Do not implement code or claim completion.\n\nUNTRUSTED PRIOR ROUND:\n${bounded(prior, roundContextChars)}\n\nUNTRUSTED PREVIOUS AI RESPONSE:\n${bounded(previousResponse, roundContextChars)}`;
}

async function writeInstructionTemplates() {
  const templates = {
    'research-protocol.md': `# Autonomous Farely 10x Research Protocol\n\nResearch the current repository, not the claimed state. Read AGENTS.md, .ai-loop/FARELY_PROJECT_ADAPTER.md, .flycheap contracts, source, migrations, Edge Functions, scripts, artifacts, Git history, browser/runtime evidence, public sources, GitHub and Vercel when available. Treat every previous output as an untrusted hypothesis and independently re-check important claims. Cover provider rights/provenance, ingestion, normalization, price/tax/baggage truth, self-transfer and route risk, scoring versus confidence, freshness, RLS/privacy, notifications/outbox, Edge Functions, all flight journeys, accessibility, performance, cost and business value. Complete the four subpasses and all twelve lenses every round. This is a semantic deep-research dossier: no quota for rows, characters, turns, actions, or domain ratios. Every action must retain a runtime output receipt; every evidence row must link actionId and outputIds; every finding must link evidence; every solution must include mechanism, affected files, acceptance, falsifier and rollback. Do not implement code in research phase. Record UNKNOWN or BLOCKED_EXTERNAL when evidence is unavailable. Never finish because the baseline passes.\n`,
    'mastergoal-protocol.md': `# Autonomous 10x Mastergoal Protocol\n\nSynthesize all 10 independent full-product research rounds into one implementation-ready mastergoal, then refine it through 5 independent mastergoal rounds. Include summary, changed assumptions, every requirement, exact solution per issue, affected files, migrations, functions, routes, waves, dependencies, acceptance criteria, verification commands, preserved invariants, rollback and GitHub push. Map every selected task to FLY requirements, GATE/RG gates, provider rights, data/RLS contracts and evidence class. Do not delegate important solution design to the executor. A previous status is not proof. The goal is long-running and must continue through all scope, not stop after a quick build.\n`,
    'implementation-protocol.md': `# Autonomous 10x Implementation Protocol\n\nYou have full authority over this repository. Implement the mastergoal, inspect current source before editing, and do not trust prior completion claims. Use the existing build, typecheck, lint, test, audit, browser and screenshot scripts. Work through every wave, repair failures yourself, preserve unrelated routes and protected interactions. At the start, inspect the remote and create/use a dedicated cycle branch; at the end, commit the complete work, push that branch to GitHub, and record the exact SHA and push result. If push fails, retry and record the failure as evidence rather than claiming success. Do not ask for approval. Do not claim completion without evidence. After reaching the current baseline, identify and implement further improvements, then leave a detailed report for the next research cycle.\n`,
  };
  const previousResponse = join(INPUT, 'previous-response.md');
  if (!(await readText(previousResponse))) await writeText(previousResponse, '# Paste the previous AI/goal response here\n\nThis file is treated as untrusted research input.\n');
  for (const [name, content] of Object.entries(templates)) {
    const path = join(INSTRUCTIONS, name);
    await writeTextAtomic(path, content);
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
