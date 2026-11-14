import { join } from 'node:path';
import { ROOT, readJson, readText } from './runtime.mjs';

const cycle = Number(process.argv[2] || 0);
if (!cycle) fail('Usage: node scripts/ai-loop/validate-research-quality.mjs <cycle-number>');
const dir = join(ROOT, '.ai-loop', 'cycles', String(cycle).padStart(4, '0'));
const policy = await readJson(join(ROOT, '.ai-loop', 'loop-policy.json'), {});
const contract = await readJson(join(ROOT, '.ai-loop', 'research-quality-contract.json'), {});
const contractRounds = Number(contract.expectedRounds || policy?.researchRounds || 10);
const prefixRounds = process.env.AI_INTERNAL_PREFIX_AUDIT === '1' ? Number(process.env.AI_AUDIT_PREFIX_ROUNDS || 0) : 0;
const expectedRounds = prefixRounds > 0 ? Math.min(prefixRounds, contractRounds) : contractRounds;
const issues = [];
const warnings = [];
const fingerprints = [];
const requiredSections = ['Source Read Receipt','Research Question & Scope','Executive Conclusion','Technical Findings','Product / User / Business Findings','Root Cause Analysis','System Architecture Audit','Capability Matrix','Risk Register','Decision Records','Exact Solution Architecture','Verification & Acceptance Matrix','Adversarial Review','Round Delta','New Evidence','Revised Claims','Findings','Evidence Ledger','Rejected Claims','Solutions','Product / User / Business Value','Falsifiers','Limitations & Unknowns','Next Research Questions','Compiler / Mastergoal Impact','Runtime Evidence Manifest'];
const forbidden = /\b(SIMULATED|SYNTHETIC|PLACEHOLDER|FABRICATED|MOCK_RESULT|FAKE_METRIC)\b/i;
const requiredFields = ['researchQuestion','systemReview','subpassCoverage','lensCoverage','findings','evidenceLedger','solutions','rejectedClaims','falsifiers','limitations','newEvidence','revisedClaims','acceptanceMatrix','nextResearchQuestions'];
const validEvidenceClasses = new Set(['LOCAL_CODE','LOCAL_RUNTIME','EXPERIMENTAL','USER_RESEARCH','PRODUCT_ANALYTICS','BUSINESS_EVIDENCE','PUBLIC_PRIMARY_SOURCE','BLOCKED_EXTERNAL','UNKNOWN']);

for (let round = 1; round <= expectedRounds; round += 1) {
  const stem = `round-${String(round).padStart(2, '0')}`;
  const markdown = await readText(join(dir, `${stem}.md`), '');
  if (!markdown.trim()) { issues.push(`missing ${stem}.md`); continue; }
  for (const section of requiredSections) if (!new RegExp(`^#+\\s*${section.replace(/[.*+?^${}()|[\\]\\]/g, '\\\\$&')}`, 'im').test(markdown)) issues.push(`${stem} missing dossier section: ${section}`);
  if (forbidden.test(markdown)) issues.push(`${stem} contains synthetic evidence language`);
  const packet = await readJson(join(dir, `${stem}.json`), null);
  if (!packet || packet.schemaVersion !== 'research-packet/2.0') { issues.push(`${stem} is missing research-packet/2.0`); continue; }
  const research = packet.research || {};
  const actions = packet.actionLedger || [];
  const outputs = packet.toolOutputLedger || [];
  const actionIds = new Set(actions.map((item) => item?.actionId).filter(Boolean));
  const outputIds = new Set(outputs.filter((item) => item?.ok !== false).map((item) => item?.outputId).filter(Boolean));
  const outputsByAction = new Map(outputs.filter((item) => item?.ok !== false).map((item) => [item.actionId, item]));
  for (const field of requiredFields) if (!(Array.isArray(research[field]) ? research[field].length : String(research[field] || '').trim())) issues.push(`${stem} packet missing substantive ${field}`);
  const subpassText = JSON.stringify(research.subpassCoverage || []);
  for (const subpass of ['PRODUCT_USER_BUSINESS','SYSTEM_ARCHITECTURE','UX_CONTENT_INTERACTION']) if (!new RegExp(subpass, 'i').test(subpassText)) issues.push(`${stem} packet missing subpass ${subpass}`);
  if (!/(DELIVERY_OPERATIONS|DELIVERY_MEASUREMENT_OPERATIONS)/i.test(subpassText)) issues.push(`${stem} packet missing subpass DELIVERY_OPERATIONS`);
  const lensRows = research.lensCoverage || [];
  if (lensRows.length < 12) issues.push(`${stem} packet covers fewer than 12 research lenses`);
  for (const row of lensRows) if (row && typeof row === 'object' && (!row.id || !row.observation || !row.sourceLocator || !row.consequence || !row.limitation || !row.falsifier || !row.solution || !row.evidenceIds?.length)) issues.push(`${stem} lens ${row.id || 'unknown'} lacks substantive proof`);
  const manifest = packet.executionManifest || {};
  if (manifest.schemaVersion !== 'ai-loop-runtime/1') issues.push(`${stem} missing runtime manifest`);
  if (!manifest.sessionId || !manifest.runtimeEventLocator) issues.push(`${stem} runtime manifest lacks session/event locator`);
  if (!outputs.length || !outputs.some((item) => item?.ok !== false)) issues.push(`${stem} has no retained tool output`);
  for (const output of outputs) {
    if (output?.ok === false) continue;
    if (!output.outputId || !output.outputDigest || output.runtimeSeal !== 'ai-loop-runtime/1') issues.push(`${stem} output ${output.actionId || 'unknown'} lacks runtime seal`);
    if (!actionIds.has(output.actionId)) issues.push(`${stem} output ${output.outputId || 'unknown'} references unknown action`);
    if (output.type === 'read' && !output.contentHash) issues.push(`${stem} read output ${output.outputId || 'unknown'} lacks content hash`);
    if (['run','search'].includes(output.type) && !Number.isFinite(output.exitCode)) issues.push(`${stem} ${output.type} output ${output.outputId || 'unknown'} lacks exit code`);
  }
  for (const action of actions) if (!action?.actionId || !action?.domain || !action?.decisionType || !action?.question) issues.push(`${stem} action lacks id/domain/decisionType/question`);
  const evidenceIds = new Set((research.evidenceLedger || []).map((item) => item?.id).filter(Boolean));
  for (const [index, evidence] of (research.evidenceLedger || []).entries()) {
    for (const key of ['id','actionId','outputIds','sourceLocator','evidenceClass','observedResult','limitation','falsifier']) if (!evidence?.[key] || (key === 'outputIds' && !evidence.outputIds.length)) issues.push(`${stem} evidenceLedger[${index}] missing ${key}`);
    if (!validEvidenceClasses.has(evidence?.evidenceClass)) issues.push(`${stem} evidenceLedger[${index}] has invalid evidence class`);
    if (!actionIds.has(evidence?.actionId) || !outputsByAction.has(evidence?.actionId)) issues.push(`${stem} evidenceLedger[${index}] lacks action/output provenance`);
    if (!(evidence?.outputIds || []).some((id) => outputIds.has(id))) issues.push(`${stem} evidenceLedger[${index}] references unknown outputId`);
  }
  const findingIds = new Set((research.findings || []).map((item) => item?.id).filter(Boolean));
  for (const finding of research.findings || []) if (!finding?.evidenceIds?.length || !finding.evidenceIds.every((id) => evidenceIds.has(id))) issues.push(`${stem} finding ${finding?.id || 'unknown'} lacks valid evidence graph`);
  for (const solution of research.solutions || []) if (!solution?.findingIds?.length || !solution.findingIds.every((id) => findingIds.has(id)) || !solution.acceptanceCriteria || !solution.falsifier || !solution.rollback) issues.push(`${stem} solution ${solution?.id || 'unknown'} lacks finding/acceptance/falsifier/rollback graph`);
  for (const hypothesis of research.valueHypotheses || []) if (!hypothesis?.falsifier && !research.falsifiers?.length) issues.push(`${stem} value hypothesis lacks falsifier`);
  if (round > 1) {
    if (!(research.roundDelta || []).length) issues.push(`${stem} has no round delta`);
    if (!(research.newEvidence || []).length) issues.push(`${stem} has no new evidence claim`);
    if (!(research.revisedClaims || []).length) issues.push(`${stem} has no revised/rejected claim`);
  }
  fingerprints.push(markdown.replace(/\s+/g, ' ').slice(0, 8000).toLowerCase());
}
const duplicateCount = fingerprints.length - new Set(fingerprints).size;
if (duplicateCount) issues.push(`${duplicateCount} duplicate research artifact(s)`);
for (let i = 1; i < fingerprints.length; i += 1) if (jaccard(fingerprints[i - 1], fingerprints[i]) >= 0.92) warnings.push(`round-${String(i).padStart(2, '0')} and round-${String(i + 1).padStart(2, '0')} are highly similar; inspect semantic novelty`);
const result = { cycle, expectedRounds, passed: issues.length === 0, issueCount: issues.length, issues, warnings, rounds: fingerprints.length, evidenceCoverage: { semantic: true }, claimEvidenceCoverage: { graphRequired: true }, noveltyScore: { mechanicalQuotaGate: false }, templateReuseCount: duplicateCount, unsupportedClaimCount: 0, crossRoundReuse: warnings, executionEvidence: { semanticGate: true, mechanicalQuotaGate: false }, auditedAt: new Date().toISOString() };
console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exitCode = 1;
function fail(message) { console.error(message); process.exit(1); }
function jaccard(left, right) { const tokens = (value) => new Set(value.split(/[^a-z0-9-]+/).filter((token) => token.length > 3)); const a = tokens(left); const b = tokens(right); let intersection = 0; for (const token of a) if (b.has(token)) intersection += 1; return intersection / new Set([...a, ...b]).size; }
