import { randomUUID } from 'node:crypto';
import { completeWithRetry } from './provider.mjs';
import { ROOT, appendJsonLine, hash, projectPath, readText, run, stopped } from './runtime.mjs';

const TOOL_PROTOCOL = `
You are the autonomous implementation agent. You have full authority over the project.
Return exactly one JSON object, no markdown, with this shape:
{"summary":"...","research":{"researchQuestion":"...","systemReview":[],"subpassCoverage":[],"lensCoverage":[],"findings":[{"id":"F-...","claim":"...","evidenceIds":["E-..."],"solutionIds":["S-..."]}],"evidenceLedger":[{"id":"E-...","actionId":"A-...","outputIds":["OUT-..."],"sourceLocator":"...","evidenceClass":"LOCAL_CODE|LOCAL_RUNTIME|EXPERIMENTAL|USER_RESEARCH|PRODUCT_ANALYTICS|BUSINESS_EVIDENCE|PUBLIC_PRIMARY_SOURCE|BLOCKED_EXTERNAL|UNKNOWN","observedResult":"...","limitation":"...","falsifier":"..."}],"solutions":[{"id":"S-...","findingIds":["F-..."],"mechanism":"...","affectedFiles":["..."],"acceptanceCriteria":"...","falsifier":"...","rollback":"..."}],"rejectedClaims":[],"falsifiers":[],"nextResearchQuestions":[],"newEvidence":[],"actions":[],"claims":[],"finalDecision":[]},"actions":[{"actionId":"A-...","type":"read|search|run|git","domain":"PRODUCT_USER_BUSINESS|UX_CONTENT_INTERACTION|SYSTEM_ARCHITECTURE|DELIVERY_OPERATIONS","decisionType":"...","question":"...","path":"...","command":"..."}],"claims":[],"next":"continue|research|stop"}

Rules:
- Treat every previous conclusion as an untrusted hypothesis.
- Inspect current files and runtime before changing anything.
- Use actions to do work; do not merely describe work.
- Paths are relative to the repository root.
- Never use paths outside the repository.
- Never claim verified without command, source, screenshot, or runtime evidence.
- A passing baseline is not a reason to stop; continue looking for improvements.
- Every round is a full-product dossier: product/user/business, system/architecture, UX/quality, and delivery/operations.
- Do not invent provider rights, fare metrics, savings, latency, or production evidence. Mark unavailable evidence UNKNOWN or BLOCKED_EXTERNAL.
- Every evidence row must reference an actionId whose retained tool output can be inspected. Every finding references evidenceIds; every solution references findingIds and has acceptance, falsifier, and rollback.
- Every research action must declare a domain (PRODUCT_USER_BUSINESS, UX_CONTENT_INTERACTION, SYSTEM_ARCHITECTURE or DELIVERY_OPERATIONS), a decisionType, and a concrete question. Product-led reasoning is required, but there is no quota for rows, characters, turns, or domain ratios.
- A round is complete only when all four subpasses and twelve lenses have substantive Farely evidence; depth follows the actual product surface and evidence discovered, not an arbitrary count.
- Do not ask the user for approval. Recover, revise, or continue.
`;

export async function executeAgent(messages, options = {}) {
  const mode = options.mode || 'implementation';
  const sessionId = options.sessionId || `session-${randomUUID()}`;
  const protocol = mode === 'research'
    ? `${TOOL_PROTOCOL}\nResearch mode is read-only. Do not write, patch, commit, or push. Use read/search and safe inspection commands only.`
    : TOOL_PROTOCOL;
  const baseHistory = [{ role: 'system', content: protocol }, ...messages];
  let recentHistory = [];
  let history = [...baseHistory];
  const configuredMaxTurns = Number(options.maxTurns || 32);
  const configuredMinTurns = Number(options.minTurns || 1);
  const configuredMinActions = Number(options.minActions || 4);
  const safeMaxTurns = Number.isFinite(configuredMaxTurns) ? configuredMaxTurns : 32;
  const safeMinTurns = Number.isFinite(configuredMinTurns) ? configuredMinTurns : 1;
  const safeMinActions = Number.isFinite(configuredMinActions) ? configuredMinActions : 4;
  const minTurns = mode === 'research' ? Math.max(1, safeMinTurns) : 0;
  const minActions = mode === 'research' ? Math.max(4, safeMinActions) : 0;
  const maxTurns = mode === 'research' ? Math.max(safeMaxTurns, minTurns) : safeMaxTurns;
  const results = [];
  for (let turn = 0; turn < maxTurns; turn += 1) {
    if (await stopped()) return { results, stopped: true, stopReason: 'explicit-stop-file', sessionId, completionGate: researchStopGuard(results) };
    const turnNumber = turn + 1;
    let action;
    try {
      const response = await completeWithRetry(history, options);
      action = parseJson(response.content);
      action.actions = (action.actions || []).map((item, actionIndex) => ({
        ...item,
        actionId: item.actionId || `t${turnNumber}-a${actionIndex + 1}`,
      }));
      if (mode === 'research') validateResearchAction(action);
    } catch (error) {
      recentHistory = appendRecentHistory(recentHistory, { role: 'user', content: `Protocol error: ${error.message}. Return one valid JSON object and continue the same investigation.` });
      history = [...baseHistory, ...recentHistory];
      continue;
    }
    results.push(action);
    const outputs = [];
    for (const [actionIndex, item] of (action.actions || []).entries()) {
      const startedAt = new Date().toISOString();
      try {
        const output = await executeAction(item, mode);
        const sealed = sealToolOutput({ ...output, actionId: item.actionId }, { sessionId, action: item, turn: turnNumber, actionIndex, startedAt });
        await recordRuntimeEvent(sealed, options.runtimeEventPath);
        outputs.push(sealed);
      } catch (error) {
        const failed = sealToolOutput({ ok: false, actionId: item.actionId, action: item, error: error.message }, { sessionId, action: item, turn: turnNumber, actionIndex, startedAt });
        try { await recordRuntimeEvent(failed, options.runtimeEventPath); } catch { /* audit rejects missing receipts */ }
        outputs.push(failed);
      }
    }
    const outputByAction = new Map(outputs.filter((output) => output?.ok !== false).map((output) => [output.actionId, output]));
    const payload = action.research ? { ...action.research } : action;
    if (Array.isArray(payload.evidenceLedger)) payload.evidenceLedger = payload.evidenceLedger.map((row) => row?.outputIds || row?.outputId ? row : outputByAction.has(row?.actionId) ? { ...row, outputIds: [outputByAction.get(row.actionId).outputId] } : row);
    const recordedAction = action.research ? { ...action, research: payload } : { ...action, ...payload };
    results[results.length - 1] = { ...recordedAction, toolOutputs: outputs };
    const completedTurns = turn + 1;
    const actionCount = results.reduce((sum, item) => sum + (item.toolOutputs || []).filter((output) => output?.ok !== false).length, 0);
    const stopGuard = mode === 'research' ? researchStopGuard(results) : { ok: true, reasons: [] };
    if (action.next === 'stop' && (completedTurns < minTurns || actionCount < minActions || !stopGuard.ok)) {
      recentHistory = appendRecentHistory(recentHistory, { role: 'assistant', content: JSON.stringify(compactActionForHistory(action)) }, { role: 'user', content: `STOP REJECTED: semantic Farely research gates are incomplete. Completed ${completedTurns} turns and ${actionCount} successful outputs. Missing: ${stopGuard.reasons.join('; ') || 'evidence depth'}. Continue with real actions; do not pad or copy a template.\n\nCUMULATIVE DOSSIER:\n${buildCumulativeResearchContext(results)}` });
      history = [...baseHistory, ...recentHistory];
      continue;
    }
    if (action.next === 'stop') return { results, stopped: true, sessionId, completionGate: stopGuard };
    recentHistory = appendRecentHistory(recentHistory, { role: 'assistant', content: JSON.stringify(compactActionForHistory(action)) }, { role: 'user', content: `Host action results:\n${JSON.stringify(compactOutputs(outputs), null, 2)}\n\nCUMULATIVE DOSSIER:\n${buildCumulativeResearchContext(results)}\n\nContinue independently and re-check earlier claims.` });
    history = [...baseHistory, ...recentHistory];
  }
  return { results, stopped: false, sessionId, completionGate: researchStopGuard(results) };
}

function appendRecentHistory(existing, ...entries) {
  const next = [...existing, ...entries];
  const limit = Math.max(12000, Number(process.env.AI_AGENT_RECENT_HISTORY_CHARS || 80000));
  const text = next.map((item) => `${item.role}: ${item.content}`).join('\n\n');
  return text.length <= limit ? next : [{ role: 'user', content: `Earlier turns are summarized in the cumulative Farely dossier; re-check claims with fresh actions.\n${text.slice(-limit)}` }];
}
function compactActionForHistory(action) { return { ...action, actions: (action.actions || []).map((item) => { const copy = { ...item }; delete copy.content; delete copy.replace; return copy; }) }; }
function compactOutputs(outputs) { return outputs.map((output) => ({ outputId: output?.outputId, actionId: output?.actionId, actionType: output?.actionType || output?.type, path: output?.path, command: output?.command, exitCode: output?.exitCode ?? output?.code ?? null, ok: output?.ok !== false, contentHash: output?.contentHash || null, stdout: String(output?.stdout || '').slice(0, 3000), stderr: String(output?.stderr || '').slice(0, 1200), content: String(output?.content || '').slice(0, 7000) })); }
function buildCumulativeResearchContext(results = []) {
  const fields = ['researchQuestion', 'systemReview', 'subpassCoverage', 'lensCoverage', 'executiveConclusion', 'verifiedFindings', 'technicalFindings', 'productValueFindings', 'userJourneyMap', 'uxFrictionRegister', 'businessValueAudit', 'experienceBlueprint', 'productOpportunityBacklog', 'rootCauseAnalysis', 'findings', 'evidenceLedger', 'rejectedClaims', 'solutions', 'acceptanceMatrix', 'newEvidence', 'revisedClaims', 'limitations', 'nextResearchQuestions', 'finalDecision'];
  const merged = {};
  for (const field of fields) { const items = results.flatMap((turn) => { const value = turn?.research?.[field] ?? turn?.[field]; return Array.isArray(value) ? value : value == null ? [] : [value]; }); if (items.length) merged[field] = items.slice(-60); }
  merged.actionIndex = results.flatMap((turn) => turn?.actions || []).map((action) => ({ actionId: action?.actionId, type: action?.type, domain: action?.domain, decisionType: action?.decisionType, question: action?.question, path: action?.path, command: action?.command })).filter((item) => item.actionId);
  merged.runtimeOutputIndex = results.flatMap((turn) => turn?.toolOutputs || []).map((output) => ({ outputId: output?.outputId, actionId: output?.actionId, actionType: output?.actionType || output?.type, path: output?.path, command: output?.command, exitCode: output?.exitCode ?? output?.code ?? null, outputDigest: output?.outputDigest || null, contentHash: output?.contentHash || null })).filter((item) => item.outputId);
  const text = JSON.stringify(merged, null, 2); const limit = Math.max(60000, Number(process.env.AI_AGENT_CUMULATIVE_CONTEXT_CHARS || 240000));
  return text.length <= limit ? text : `${text.slice(0, Math.floor(limit * 0.75))}\n...[bounded working draft; full receipts remain on disk]...\n${text.slice(-Math.floor(limit * 0.25))}`;
}
function sealToolOutput(output, context) { const endedAt = new Date().toISOString(); const payload = { type: output?.type || context.action?.type || 'unknown', path: output?.path || context.action?.path || '', command: output?.command || context.action?.command || '', stdout: output?.stdout || '', stderr: output?.stderr || '', content: output?.content || '', exitCode: Number.isFinite(output?.code) ? output.code : null, ok: output?.ok !== false, error: output?.error || '' }; return { ...output, outputId: `out-${context.sessionId}-${context.turn}-${context.actionIndex + 1}`, sessionId: context.sessionId, actionId: context.action?.actionId, actionType: context.action?.type || output?.type || 'unknown', startedAt: context.startedAt, endedAt, cwd: ROOT, exitCode: Number.isFinite(output?.code) ? output.code : null, outputDigest: hash(JSON.stringify(payload)), runtimeSeal: 'ai-loop-runtime/1' }; }
async function recordRuntimeEvent(output, eventPath) { if (!eventPath) throw new Error('runtime event path is required for research evidence'); await appendJsonLine(eventPath, { outputId: output.outputId, sessionId: output.sessionId, actionId: output.actionId, actionType: output.actionType, startedAt: output.startedAt, endedAt: output.endedAt, cwd: output.cwd, exitCode: output.exitCode, ok: output.ok !== false, outputDigest: output.outputDigest, runtimeSeal: output.runtimeSeal }); }
export function researchStopGuard(results) {
  const rows = results.map((item) => item?.research || item || {});
  const allActions = results.flatMap((item) => item?.actions || []);
  const successfulOutputs = results.flatMap((item) => item?.toolOutputs || []).filter((item) => item?.ok !== false);
  const outputIds = new Set(successfulOutputs.map((item) => item?.outputId).filter(Boolean));
  const outputByAction = new Map(successfulOutputs.map((item) => [item?.actionId, item]));
  const evidence = rows.flatMap((item) => item.evidenceLedger || []);
  const subpassText = JSON.stringify(rows.flatMap((item) => item.subpassCoverage || []));
  const lensRows = rows.flatMap((item) => item.lensCoverage || []);
  const lensIds = new Set(lensRows.map((item) => typeof item === 'string' ? item : item?.id).filter(Boolean));
  const reasons = [];
  for (const name of ['PRODUCT_USER_BUSINESS', 'SYSTEM_ARCHITECTURE', 'UX_CONTENT_INTERACTION']) if (!new RegExp(name, 'i').test(subpassText)) reasons.push(`missing subpass ${name}`);
  if (!/(DELIVERY_OPERATIONS|DELIVERY_MEASUREMENT_OPERATIONS)/i.test(subpassText)) reasons.push('missing subpass DELIVERY_OPERATIONS');
  if (lensIds.size < 12) reasons.push(`lenses ${lensIds.size}/12`);
  for (let index = 1; index <= 12; index += 1) {
    const id = `L${String(index).padStart(2, '0')}`;
    const row = lensRows.find((item) => item && typeof item === 'object' && item.id === id);
    if (!row || !['observation', 'evidenceIds', 'sourceLocator', 'consequence', 'limitation', 'falsifier', 'solution'].every((key) => row[key] !== undefined && row[key] !== null && String(row[key]).trim())) reasons.push(`lens ${id} lacks substantive proof`);
  }
  const requiredFields = ['researchQuestion', 'systemReview', 'subpassCoverage', 'lensCoverage', 'findings', 'evidenceLedger', 'rejectedClaims', 'falsifiers', 'nextResearchQuestions', 'newEvidence', 'revisedClaims', 'solutions', 'acceptanceMatrix', 'sourceTypes', 'verifiedFindings', 'technicalFindings', 'productValueFindings', 'userJourneyMap', 'uxFrictionRegister', 'businessValueAudit', 'experienceBlueprint', 'productOpportunityBacklog', 'userResearchPlan', 'businessExperimentPlan', 'implementationWaves', 'negativeTestPlan', 'rootCauseAnalysis', 'sourceReceipt', 'systemAudit', 'capabilityMatrix', 'riskRegister', 'decisionRecords', 'verificationPlan', 'adversarialReview', 'completenessAudit', 'roundDelta', 'solutionArchitecture', 'alternatives', 'valueHypotheses', 'limitations', 'compilerImpact', 'finalDecision', 'provenanceReconciliation', 'systemContradictions', 'visualContentAudit', 'runtimeAcceptanceMatrix', 'boundedProbes', 'rootCauseMap', 'adversarialScenarioMatrix', 'releaseHandoff'];
  for (const field of requiredFields) if (!rows.some((item) => Array.isArray(item[field]) ? item[field].length : String(item[field] || '').trim())) reasons.push(`missing ${field}`);
  if (!successfulOutputs.length) reasons.push('no retained tool outputs');
  if (successfulOutputs.some((item) => !item.outputId || item.runtimeSeal !== 'ai-loop-runtime/1' || !item.outputDigest)) reasons.push('runtime output seal incomplete');
  const validDomains = new Set(['PRODUCT_USER_BUSINESS', 'UX_CONTENT_INTERACTION', 'SYSTEM_ARCHITECTURE', 'DELIVERY_OPERATIONS', 'DELIVERY_MEASUREMENT_OPERATIONS']);
  const successfulActions = allActions.filter((item) => outputByAction.has(item?.actionId));
  for (const item of successfulActions) {
    if (!validDomains.has(item?.domain)) reasons.push(`action ${item.actionId || 'unknown'} lacks valid domain`);
    if (!item?.decisionType || !item?.question) reasons.push(`action ${item.actionId || 'unknown'} lacks decisionType/question`);
  }
  for (const item of allActions) {
    const output = successfulOutputs.find((candidate) => candidate?.actionId === item?.actionId);
    if (!output) continue;
    if (item.type === 'read' && !output.contentHash) reasons.push(`read action ${item.actionId || 'unknown'} lacks content hash`);
    if (['run', 'search'].includes(item.type) && !Number.isFinite(output.exitCode)) reasons.push(`${item.type} action ${item.actionId || 'unknown'} lacks exit code`);
  }
  for (const row of evidence) {
    if (!row?.actionId || !outputByAction.has(row.actionId)) reasons.push(`evidence ${row?.id || 'unknown'} lacks retained output`);
    if (!Array.isArray(row?.outputIds) || !row.outputIds.some((id) => outputIds.has(id))) reasons.push(`evidence ${row?.id || 'unknown'} lacks outputIds`);
  }
  const evidenceIds = new Set(evidence.map((item) => item?.id).filter(Boolean));
  const findingIds = new Set(rows.flatMap((item) => item.findings || []).map((item) => item?.id).filter(Boolean));
  for (const finding of rows.flatMap((item) => item.findings || [])) if (!Array.isArray(finding?.evidenceIds) || !finding.evidenceIds.some((id) => evidenceIds.has(id))) reasons.push(`finding ${finding?.id || 'unknown'} lacks valid evidence`);
  for (const solution of rows.flatMap((item) => item.solutions || [])) if (!Array.isArray(solution?.findingIds) || !solution.findingIds.some((id) => findingIds.has(id)) || !solution.acceptanceCriteria || !solution.falsifier || !solution.rollback) reasons.push(`solution ${solution?.id || 'unknown'} lacks graph/acceptance/falsifier/rollback`);
  return { ok: reasons.length === 0, reasons };
}

function validateResearchAction(action) {
  if (action?.synthetic === true) throw new Error('synthetic research response cannot enter a real cycle');
  const payload = action?.research && typeof action.research === 'object' ? action.research : action;
  if (!Array.isArray(action?.actions) || action.actions.length === 0) throw new Error('research response has no investigation actions');
  const actionIds = new Set(action.actions.map((item) => item?.actionId).filter(Boolean));
  if (actionIds.size !== action.actions.length) throw new Error('every research action must have a unique actionId');
  for (const [index, item] of action.actions.entries()) if (!item?.domain || !item?.decisionType || !item?.question) throw new Error(`research action[${index}] missing domain/decisionType/question`);
  const evidence = Array.isArray(payload.evidenceLedger) ? payload.evidenceLedger : [];
  if (!evidence.length) throw new Error('research response has no evidenceLedger');
  for (const [index, row] of evidence.entries()) {
    for (const key of ['id', 'actionId', 'sourceLocator', 'evidenceClass', 'observedResult', 'limitation', 'falsifier']) if (!row?.[key]) throw new Error(`evidenceLedger[${index}] missing ${key}`);
    if (!actionIds.has(row.actionId)) throw new Error(`evidenceLedger[${index}] references unknown actionId ${row.actionId}`);
  }
  for (const [index, finding] of (payload.findings || []).entries()) if (finding?.evidenceIds && !finding.evidenceIds.length) throw new Error(`findings[${index}] has no evidenceIds`);
  for (const [index, solution] of (payload.solutions || []).entries()) if (solution?.findingIds && (!solution.findingIds.length || !solution.acceptanceCriteria || !solution.falsifier || !solution.rollback)) throw new Error(`solutions[${index}] is missing findingIds/acceptance/falsifier/rollback`);
  if (/SIMULATED|SYNTHETIC|FABRICATED|INVENTED_METRIC/i.test(JSON.stringify(action))) throw new Error('research response contains synthetic evidence marker');
}

function parseJson(content) {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
  const candidate = fenced || content.trim();
  try { return JSON.parse(candidate); } catch (error) {
    throw new Error(`AI response was not valid JSON: ${error.message}\n${content.slice(0, 2000)}`);
  }
}

async function executeAction(action, mode = 'implementation') {
  if (!action || typeof action !== 'object') throw new Error('Invalid action');
  if (mode === 'research' && ['write', 'patch', 'git'].includes(action.type)) {
    throw new Error(`Research mode rejects mutating action: ${action.type}`);
  }
  if (mode === 'research' && action.type === 'run') {
    const allowed = new Set(['rg', 'find', 'ls', 'pwd', 'sed', 'cat', 'curl', 'git', 'node', 'python', 'python3']);
    const command = action.command || action.path;
    if (!allowed.has(command)) throw new Error(`Research mode rejects command: ${command}`);
    if (command === 'git' && !['status', 'log', 'show', 'diff', 'branch', 'remote'].includes(action.args?.[0])) {
      throw new Error(`Research mode rejects git subcommand: ${action.args?.[0]}`);
    }
  }
  if (action.type === 'read') {
    const content = await readText(projectPath(action.path));
    const configuredLimit = Number(process.env.AI_MAX_READ_CHARS || 120000);
    const limit = Number.isFinite(configuredLimit) ? Math.max(120000, configuredLimit) : 120000;
    return { type: action.type, path: action.path, content: content.slice(0, limit), contentHash: hash(content), truncated: content.length > limit, originalLength: content.length };
  }
  if (action.type === 'search') return await run('rg', ['-n', '--hidden', '-g', '!.git', '-g', '!node_modules', action.pattern || action.path || ''], { timeoutMs: 120000 });
  if (action.type === 'run') {
    const command = action.command || action.path;
    if (!command) throw new Error('run action requires command');
    return await run(command, action.args || [], { timeoutMs: action.timeoutMs || 900000 });
  }
  if (action.type === 'write') {
    const { writeText } = await import('./runtime.mjs');
    await writeText(projectPath(action.path), action.content || '');
    return { type: action.type, path: action.path, ok: true };
  }
  if (action.type === 'patch') {
    const { writeText } = await import('./runtime.mjs');
    const current = await readText(projectPath(action.path));
    if (!action.find || !current.includes(action.find)) return { type: action.type, path: action.path, ok: false, error: 'find text missing' };
    await writeText(projectPath(action.path), current.replace(action.find, () => (action.replace || '')));
    return { type: action.type, path: action.path, ok: true };
  }
  if (action.type === 'git') return await run('git', action.args || [], { timeoutMs: 180000 });
  throw new Error(`Unsupported action: ${action.type}`);
}
