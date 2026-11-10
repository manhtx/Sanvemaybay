import { completeWithRetry } from './provider.mjs';
import { hash, projectPath, readText, run } from './runtime.mjs';

const TOOL_PROTOCOL = `
You are the autonomous implementation agent. You have full authority over the project.
Return exactly one JSON object, no markdown, with this shape:
{"summary":"...","researchQuestion":"...","systemReview":[],"subpassCoverage":[],"lensCoverage":[],"findings":[{"id":"F-...","claim":"...","evidenceIds":["E-..."],"solutionIds":["S-..."]}],"evidenceLedger":[{"id":"E-...","actionId":"A-...","sourceLocator":"...","evidenceClass":"LOCAL_CODE|LOCAL_RUNTIME|EXPERIMENTAL|USER_RESEARCH|PRODUCT_ANALYTICS|BUSINESS_EVIDENCE|PUBLIC_PRIMARY_SOURCE|BLOCKED_EXTERNAL|UNKNOWN","observedResult":"...","limitation":"...","falsifier":"..."}],"solutions":[{"id":"S-...","findingIds":["F-..."],"mechanism":"...","affectedFiles":["..."],"acceptanceCriteria":"...","falsifier":"...","rollback":"..."}],"rejectedClaims":[],"falsifiers":[],"nextResearchQuestions":[],"newEvidence":[],"actions":[{"actionId":"A-...","type":"read|search|run|write|patch|git","path":"...","command":"...","content":"..."}],"claims":[],"next":"continue|research|stop"}

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
- Every research action must declare a domain (PRODUCT_USER_BUSINESS, UX_CONTENT_INTERACTION, SYSTEM_ARCHITECTURE or DELIVERY_MEASUREMENT_OPERATIONS), a decisionType, and a concrete question; the first 24 successful actions must be product/UX-led.
- Do not ask the user for approval. Recover, revise, or continue.
`;

export async function executeAgent(messages, options = {}) {
  const mode = options.mode || 'implementation';
  const protocol = mode === 'research'
    ? `${TOOL_PROTOCOL}\nResearch mode is read-only. Do not write, patch, commit, or push. Use read/search and safe inspection commands only.`
    : TOOL_PROTOCOL;
  let history = [...messages, { role: 'system', content: protocol }];
  const testMode = process.env.AI_MOCK === '1' || process.env.AI_TEST_MODE === '1';
  const configuredMaxTurns = Number(options.maxTurns || 32);
  const configuredMinTurns = Number(options.minTurns || 24);
  const configuredMinActions = Number(options.minActions || 24);
  const safeMaxTurns = Number.isFinite(configuredMaxTurns) ? configuredMaxTurns : 32;
  const safeMinTurns = Number.isFinite(configuredMinTurns) ? configuredMinTurns : 24;
  const safeMinActions = Number.isFinite(configuredMinActions) ? configuredMinActions : 24;
  const minTurns = mode === 'research' ? (testMode ? safeMinTurns : Math.max(safeMinTurns, 24)) : 0;
  const minActions = mode === 'research' ? (testMode ? safeMinActions : Math.max(safeMinActions, 24)) : 0;
  const maxTurns = mode === 'research' ? Math.max(safeMaxTurns, minTurns) : safeMaxTurns;
  const results = [];
  for (let turn = 0; turn < maxTurns; turn += 1) {
    let action;
    try {
      const response = await completeWithRetry(history, options);
      action = parseJson(response.content);
      const turnNumber = turn + 1;
      action.actions = (action.actions || []).map((item, actionIndex) => ({
        ...item,
        actionId: item.actionId || `t${turnNumber}-a${actionIndex + 1}`,
      }));
      if (mode === 'research') validateResearchAction(action);
    } catch (error) {
      history.push({ role: 'user', content: `Your last response failed the machine protocol: ${error.message}. Return one valid JSON object and continue.` });
      continue;
    }
    results.push(action);
    const outputs = [];
    for (const item of action.actions || []) {
      try {
        outputs.push({ ...(await executeAction(item, mode)), actionId: item.actionId });
      } catch (error) {
        outputs.push({ ok: false, actionId: item.actionId, action: item, error: error.message });
      }
    }
    results[results.length - 1] = { ...action, toolOutputs: outputs };
    const completedTurns = turn + 1;
    const actionCount = results.reduce((sum, item) => sum + (item.actions?.length || 0), 0);
    const stopGuard = mode === 'research' ? researchStopGuard(results) : { ok: true, reasons: [] };
    if (action.next === 'stop' && (completedTurns < minTurns || actionCount < minActions || !stopGuard.ok)) {
      history = [
        ...history,
        { role: 'assistant', content: JSON.stringify(action) },
        { role: 'user', content: `STOP REJECTED: this research round is not deep enough. Completed ${completedTurns}/${minTurns} minimum turns and ${actionCount}/${minActions} investigation actions. Guard failures: ${stopGuard.reasons.join('; ') || 'minimum depth not reached'}. Continue independently, challenge prior claims, and gather new product, system, UX and operations evidence.` },
      ];
      continue;
    }
    if (action.next === 'stop') return { results, stopped: true };
    history = [
      ...history,
      { role: 'assistant', content: JSON.stringify(action) },
      { role: 'user', content: `Action results:\n${JSON.stringify(outputs, null, 2)}\nContinue independently.` },
    ];
  }
  return { results, stopped: false };
}

export function researchStopGuard(results) {
  const rows = results.map((item) => item?.research || item || {});
  const allActions = results.flatMap((item) => item?.actions || []);
  const successfulOutputs = results.flatMap((item) => item?.toolOutputs || []).filter((item) => item?.ok !== false);
  const outputIds = new Set(successfulOutputs.map((item) => item?.actionId).filter(Boolean));
  const evidence = rows.flatMap((item) => item.evidenceLedger || []);
  const subpassText = JSON.stringify(rows.flatMap((item) => item.subpassCoverage || []));
  const lensRows = rows.flatMap((item) => item.lensCoverage || []);
  const lensIds = new Set(lensRows.map((item) => typeof item === 'string' ? item : item?.id).filter(Boolean));
  const reasons = [];
  for (const name of ['PRODUCT_USER_BUSINESS', 'SYSTEM_ARCHITECTURE', 'UX_CONTENT_INTERACTION', 'DELIVERY_MEASUREMENT_OPERATIONS']) if (!new RegExp(name, 'i').test(subpassText)) reasons.push(`missing subpass ${name}`);
  if (lensIds.size < 12) reasons.push(`lenses ${lensIds.size}/12`);
  for (let index = 1; index <= 12; index += 1) {
    const id = `L${String(index).padStart(2, '0')}`;
    const row = lensRows.find((item) => item && typeof item === 'object' && item.id === id);
    if (!row || !['observation', 'evidenceIds', 'sourceLocator', 'consequence', 'limitation', 'falsifier', 'solution'].every((key) => row[key] !== undefined && row[key] !== null && String(row[key]).trim())) reasons.push(`lens ${id} lacks substantive proof`);
  }
  if (evidence.length < 8) reasons.push(`evidence ${evidence.length}/8`);
  if (successfulOutputs.length < 24) reasons.push(`retained outputs ${successfulOutputs.length}/24`);
  const requiredFields = ['researchQuestion', 'systemReview', 'subpassCoverage', 'lensCoverage', 'findings', 'evidenceLedger', 'rejectedClaims', 'falsifiers', 'nextResearchQuestions', 'newEvidence', 'revisedClaims', 'solutions', 'acceptanceMatrix', 'sourceTypes', 'verifiedFindings', 'technicalFindings', 'productValueFindings', 'userJourneyMap', 'uxFrictionRegister', 'businessValueAudit', 'experienceBlueprint', 'productOpportunityBacklog', 'rootCauseAnalysis', 'sourceReceipt', 'systemAudit', 'capabilityMatrix', 'riskRegister', 'decisionRecords', 'verificationPlan', 'adversarialReview', 'completenessAudit', 'roundDelta', 'solutionArchitecture', 'alternatives', 'valueHypotheses', 'limitations', 'compilerImpact', 'finalDecision', 'provenanceReconciliation', 'systemContradictions', 'visualContentAudit', 'runtimeAcceptanceMatrix', 'boundedProbes', 'rootCauseMap', 'adversarialScenarioMatrix', 'releaseHandoff'];
  for (const field of requiredFields) if (!rows.some((item) => Array.isArray(item[field]) ? item[field].length : String(item[field] || '').trim())) reasons.push(`missing ${field}`);
  const minimums = { findings: 10, solutions: 8, productValueFindings: 10, userJourneyMap: 8, uxFrictionRegister: 10, businessValueAudit: 8, experienceBlueprint: 7, productOpportunityBacklog: 10, userResearchPlan: 5, businessExperimentPlan: 5, implementationWaves: 5, negativeTestPlan: 6, adversarialScenarioMatrix: 20 };
  for (const [field, minimum] of Object.entries(minimums)) {
    const total = rows.reduce((sum, item) => sum + (Array.isArray(item[field]) ? item[field].length : 0), 0);
    if (total < minimum) reasons.push(`${field} ${total}/${minimum}`);
  }
  const actionTypes = new Set(allActions.map((item) => item?.type).filter(Boolean));
  if (actionTypes.size < 3) reasons.push('action types 3/3');
  const primaryDomains = new Set(['PRODUCT_USER_BUSINESS', 'UX_CONTENT_INTERACTION']);
  const supportingDomains = new Set(['SYSTEM_ARCHITECTURE', 'DELIVERY_MEASUREMENT_OPERATIONS']);
  const successfulActions = allActions.filter((item) => outputIds.has(item?.actionId));
  const first24 = successfulActions.slice(0, 24);
  if (first24.filter((item) => primaryDomains.has(item?.domain)).length < 18) reasons.push('product/UX investigation actions 18/18');
  if (first24.filter((item) => supportingDomains.has(item?.domain)).length > 6) reasons.push('supporting investigation actions 6/6');
  for (const item of successfulActions) {
    if (!primaryDomains.has(item?.domain) && !supportingDomains.has(item?.domain)) reasons.push(`action ${item.actionId || 'unknown'} lacks valid domain`);
    if (!item?.decisionType || !item?.question) reasons.push(`action ${item.actionId || 'unknown'} lacks decisionType/question`);
  }
  for (const item of allActions) {
    const output = successfulOutputs.find((candidate) => candidate?.actionId === item?.actionId);
    if (!output) continue;
    if (item.type === 'read' && !output.contentHash) reasons.push(`read action ${item.actionId || 'unknown'} lacks content hash`);
    if (['run', 'search'].includes(item.type) && !Number.isFinite(output.code)) reasons.push(`${item.type} action ${item.actionId || 'unknown'} lacks exit code`);
  }
  for (const row of evidence) if (!row?.actionId || !outputIds.has(row.actionId)) reasons.push(`evidence ${row?.id || 'unknown'} lacks retained output`);
  const evidenceIds = new Set(evidence.map((item) => item?.id).filter(Boolean));
  const findingIds = new Set(rows.flatMap((item) => item.findings || []).map((item) => item?.id).filter(Boolean));
  for (const finding of rows.flatMap((item) => item.findings || [])) if (!Array.isArray(finding?.evidenceIds) || !finding.evidenceIds.some((id) => evidenceIds.has(id))) reasons.push(`finding ${finding?.id || 'unknown'} lacks valid evidence`);
  for (const solution of rows.flatMap((item) => item.solutions || [])) if (!Array.isArray(solution?.findingIds) || !solution.findingIds.some((id) => findingIds.has(id)) || !solution.acceptanceCriteria || !solution.falsifier || !solution.rollback) reasons.push(`solution ${solution?.id || 'unknown'} lacks graph/acceptance/falsifier/rollback`);
  return { ok: reasons.length === 0, reasons };
}

function validateResearchAction(action) {
  if (action?.synthetic === true) throw new Error('synthetic research response cannot enter a real cycle');
  for (const field of ['researchQuestion', 'systemReview', 'subpassCoverage', 'lensCoverage', 'findings', 'evidenceLedger', 'rejectedClaims', 'falsifiers', 'nextResearchQuestions', 'newEvidence', 'revisedClaims', 'solutions', 'acceptanceMatrix', 'sourceTypes']) {
    const value = action?.[field];
    if (!(Array.isArray(value) ? value.length : String(value || '').trim())) throw new Error(`research response missing ${field}`);
  }
  const text = JSON.stringify(action);
  if (!Array.isArray(action?.actions) || action.actions.length === 0) throw new Error('research response has no investigation actions');
  const actionIds = new Set(action.actions.map((item) => item?.actionId).filter(Boolean));
  if (actionIds.size !== action.actions.length) throw new Error('every research action must have a unique actionId');
  for (const [index, item] of action.actions.entries()) if (!item?.domain || !item?.decisionType || !item?.question) throw new Error(`research action[${index}] missing domain/decisionType/question`);
  const evidence = Array.isArray(action.evidenceLedger) ? action.evidenceLedger : [];
  if (!evidence.length) throw new Error('research response has no evidenceLedger');
  for (const [index, row] of evidence.entries()) {
    for (const key of ['id', 'actionId', 'sourceLocator', 'evidenceClass', 'observedResult', 'limitation', 'falsifier']) if (!row?.[key]) throw new Error(`evidenceLedger[${index}] missing ${key}`);
    if (!actionIds.has(row.actionId)) throw new Error(`evidenceLedger[${index}] references unknown actionId ${row.actionId}`);
  }
  for (const [index, finding] of (action.findings || []).entries()) if (!finding?.evidenceIds?.length) throw new Error(`findings[${index}] has no evidenceIds`);
  for (const [index, solution] of (action.solutions || []).entries()) if (!solution?.findingIds?.length || !solution?.acceptanceCriteria || !solution?.falsifier || !solution?.rollback) throw new Error(`solutions[${index}] is missing findingIds/acceptance/falsifier/rollback`);
  for (const term of ['provider', 'provenance', 'price', 'route', 'RLS', 'notification', 'performance', 'value']) if (!new RegExp(term, 'i').test(text)) throw new Error(`research response missing Farely coverage ${term}`);
  if (!/prior|previous|challenge|reject|falsif/i.test(text)) throw new Error('research response does not challenge prior evidence');
  if (/SIMULATED|SYNTHETIC|FABRICATED|INVENTED_METRIC/i.test(text)) throw new Error('research response contains synthetic evidence marker');
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
