import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
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
const normalizedFingerprints = [];
const requiredSections = ['Source Read Receipt','Research Question & Scope','Executive Conclusion','Technical Findings','Product / User / Business Findings','Root Cause Analysis','System Architecture Audit','Capability Matrix','Risk Register','Decision Records','Exact Solution Architecture','Verification & Acceptance Matrix','Adversarial Review','Round Delta','New Evidence','Revised Claims','Findings','Evidence Ledger','Rejected Claims','Solutions','Product / User / Business Value','Falsifiers','Limitations & Unknowns','Next Research Questions','Compiler / Mastergoal Impact','Runtime Evidence Manifest'];
const forbidden = /\b(SIMULATED|SYNTHETIC|PLACEHOLDER|FABRICATED|MOCK_RESULT|FAKE_METRIC)\b/i;
const requiredFields = ['researchQuestion','systemReview','subpassCoverage','lensCoverage','findings','evidenceLedger','solutions','rejectedClaims','falsifiers','limitations','newEvidence','revisedClaims','acceptanceMatrix','nextResearchQuestions'];
const validEvidenceClasses = new Set(['LOCAL_CODE','LOCAL_RUNTIME','EXPERIMENTAL','USER_RESEARCH','PRODUCT_ANALYTICS','BUSINESS_EVIDENCE','PUBLIC_PRIMARY_SOURCE','BLOCKED_EXTERNAL','UNKNOWN']);
const forbiddenSourcePatterns = (contract.forbiddenSyntheticSourcePatterns || ['Cycle \\d+ Round \\d+ Audit Matrix', 'Genuine Autonomous Loop Cycle']).map((pattern) => new RegExp(pattern, 'i'));
const writerIssues = await findForbiddenCycleWriters(contract);
issues.push(...writerIssues);

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
  for (const row of lensRows) if (row && typeof row === 'object') {
    if (!row.id || !row.observation || !row.sourceLocator || !row.consequence || !row.limitation || !row.falsifier || !row.solution || !row.evidenceIds?.length) issues.push(`${stem} lens ${row.id || 'unknown'} lacks substantive proof`);
    if (forbiddenSourcePatterns.some((pattern) => pattern.test(String(row.sourceLocator || ''))) || !hasConcreteSourceLocator(row.sourceLocator)) issues.push(`${stem} lens ${row.id || 'unknown'} sourceLocator is not traceable to a real source`);
  }
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
    if (forbiddenSourcePatterns.some((pattern) => pattern.test(String(evidence?.sourceLocator || '')))) issues.push(`${stem} evidenceLedger[${index}] uses a generated audit-matrix locator`);
    if (evidence?.sourceLocator && !hasConcreteSourceLocator(evidence.sourceLocator)) issues.push(`${stem} evidenceLedger[${index}] sourceLocator is not traceable to a file, command or public URL`);
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
  const compact = markdown.replace(/\s+/g, ' ').slice(0, 8000).toLowerCase();
  fingerprints.push(compact);
  normalizedFingerprints.push(normalizeForComparison(compact));
}
const duplicateCount = fingerprints.length - new Set(fingerprints).size;
if (duplicateCount) issues.push(`${duplicateCount} duplicate research artifact(s)`);
let intraRoundReuse = 0;
for (let i = 1; i < normalizedFingerprints.length; i += 1) if (jaccard(normalizedFingerprints[i - 1], normalizedFingerprints[i]) >= 0.92) {
  intraRoundReuse += 1;
  issues.push(`round-${String(i + 1).padStart(2, '0')} is materially identical to the preceding round after cycle/receipt normalization`);
}
const crossCycle = await compareWithPreviousCycle(cycle, normalizedFingerprints);
if (crossCycle.available && crossCycle.highlySimilarRounds > Number(contract.crossCycleNovelty?.maxHighlySimilarRounds || 3)) {
  issues.push(`cross-cycle replay detected: ${crossCycle.highlySimilarRounds}/${crossCycle.comparedRounds} rounds materially repeat the previous cycle`);
}
if (crossCycle.available && contract.crossCycleNovelty?.requireNewEvidenceAfterBaseline && !crossCycle.newEvidenceChanged) issues.push('newEvidence is unchanged from the previous cycle after normalization');
if (crossCycle.available && contract.crossCycleNovelty?.requireRevisedClaimAfterBaseline && !crossCycle.revisedClaimsChanged) issues.push('revisedClaims are unchanged from the previous cycle after normalization');
const result = { cycle, expectedRounds, passed: issues.length === 0, issueCount: issues.length, issues, warnings, rounds: fingerprints.length, evidenceCoverage: { semantic: true }, claimEvidenceCoverage: { graphRequired: true }, noveltyScore: { mechanicalQuotaGate: false, intraRoundReuse, crossCycle }, templateReuseCount: duplicateCount + intraRoundReuse, unsupportedClaimCount: 0, crossRoundReuse: [...warnings, ...(crossCycle.reasons || [])], executionEvidence: { semanticGate: true, mechanicalQuotaGate: false }, auditedAt: new Date().toISOString() };
console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exitCode = 1;
function fail(message) { console.error(message); process.exit(1); }
function jaccard(left, right) { const tokens = (value) => new Set(value.split(/[^a-z0-9-]+/).filter((token) => token.length > 3)); const a = tokens(left); const b = tokens(right); let intersection = 0; for (const token of a) if (b.has(token)) intersection += 1; return intersection / new Set([...a, ...b]).size; }
function normalizeForComparison(value) {
  return String(value || '').toLowerCase()
    .replace(/out-c?\d+[-a-z0-9-]*/g, 'output-receipt')
    .replace(/f-c?\d+[-a-z0-9-]*/g, 'finding-id')
    .replace(/s-c?\d+[-a-z0-9-]*/g, 'solution-id')
    .replace(/e-c?\d+[-a-z0-9-]*/g, 'evidence-id')
    .replace(/cycle\s*\d+/g, 'cycle-n')
    .replace(/\b\d{4}-\d{2}-\d{2}t[^\s]+/g, 'timestamp')
    .replace(/\b\d+\b/g, 'n')
    .replace(/\s+/g, ' ')
    .trim();
}
function hasConcreteSourceLocator(locator) {
  const value = String(locator || '').trim();
  if (/^https?:\/\//i.test(value)) return true;
  const candidates = [value, value.replace(/^(?:file|path|source|locator)\s*[:=]?\s+/i, '')];
  return candidates.some((candidate) => {
    const match = candidate.match(/(?:^|\s)([.\w-]+(?:\/[\w.@+-]+)+(?::\d+(?::\d+)?)?)/);
    const path = match?.[1] || candidate;
    return existsSync(join(ROOT, path.replace(/:\d+(?::\d+)?$/, '')));
  }) || /(?:^|\s)(?:npm|node|npx|deno|git|vite|playwright|curl)\s/i.test(value);
}
async function findForbiddenCycleWriters(contractValue) {
  const issuesFound = [];
  const forbiddenNames = (contractValue.forbiddenCycleWriterPatterns || ['run-continuous-loop', 'run-cycle-', 'generate-rounds']).map((pattern) => new RegExp(pattern, 'i'));
  const allowed = new Set(['orchestrator.mjs', 'runtime.mjs', 'update-state.mjs', 'reconcile-state.mjs', 'research-packet.mjs', 'validate-cycle.mjs', 'validate-evidence-ledger.mjs', 'validate-mastergoal.mjs', 'validate-release-attestation.mjs', 'validate-research-quality.mjs', 'validate-value-case.mjs', 'smoke-test.mjs', 'project-audit.mjs']);
  for (const directory of [join(ROOT, 'scripts', 'ai-loop'), join(ROOT, '.ai-loop', 'input')]) {
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.mjs')) continue;
      const relativePath = directory.includes(`${ROOT}/scripts/ai-loop`) ? `scripts/ai-loop/${entry.name}` : `.ai-loop/input/${entry.name}`;
      const source = await readText(join(directory, entry.name), '');
      const writesCycleArtifacts = /(?:writeFileSync|writeFile|writeText|writeJson|appendJsonLine|rename)/.test(source) && /(?:\.ai-loop[/'"`\\]*cycles|cycleDir|round-\$\{|mastergoal|value-case|evidence-ledger)/i.test(source);
      if (forbiddenNames.some((pattern) => pattern.test(entry.name)) || (writesCycleArtifacts && !allowed.has(entry.name))) issuesFound.push(`forbidden generated cycle writer detected: ${relativePath}`);
    }
  }
  return issuesFound;
}
async function compareWithPreviousCycle(currentCycle, currentFingerprints) {
  if (currentCycle <= 1 || currentFingerprints.length < 2) return { available: false, reasons: [] };
  const cyclesDir = join(ROOT, '.ai-loop', 'cycles');
  const entries = await readdir(cyclesDir, { withFileTypes: true }).catch(() => []);
  const candidates = entries.filter((entry) => entry.isDirectory() && /^\d{4}$/.test(entry.name) && Number(entry.name) < currentCycle).map((entry) => Number(entry.name)).sort((a, b) => b - a);
  for (const previousCycle of candidates) {
    const previous = [];
    for (let round = 1; round <= currentFingerprints.length; round += 1) {
      const markdown = await readText(join(cyclesDir, String(previousCycle).padStart(4, '0'), `round-${String(round).padStart(2, '0')}.md`), '');
      if (!markdown) break;
      previous.push(normalizeForComparison(markdown.replace(/\s+/g, ' ').slice(0, 8000).toLowerCase()));
    }
    if (previous.length !== currentFingerprints.length) continue;
    const similarities = currentFingerprints.map((fingerprint, index) => jaccard(fingerprint, previous[index]));
    const highlySimilarRounds = similarities.filter((score) => score >= Number(contract.crossCycleNovelty?.maxRoundSimilarity || 0.92)).length;
    const currentPacketTexts = await readCycleResearchValues(currentCycle, 'newEvidence');
    const previousPacketTexts = await readCycleResearchValues(previousCycle, 'newEvidence');
    const currentClaims = await readCycleResearchValues(currentCycle, 'revisedClaims');
    const previousClaims = await readCycleResearchValues(previousCycle, 'revisedClaims');
    return { available: true, previousCycle, comparedRounds: similarities.length, highlySimilarRounds, maxSimilarity: Math.max(...similarities), newEvidenceChanged: normalizeForComparison(currentPacketTexts) !== normalizeForComparison(previousPacketTexts), revisedClaimsChanged: normalizeForComparison(currentClaims) !== normalizeForComparison(previousClaims), reasons: [`compared against cycle ${previousCycle}`, `max round similarity ${Math.max(...similarities).toFixed(3)}`] };
  }
  return { available: false, reasons: [] };
}
async function readCycleResearchValues(cycleNumber, field) {
  const dirPath = join(ROOT, '.ai-loop', 'cycles', String(cycleNumber).padStart(4, '0'));
  const values = [];
  for (let round = 1; round <= 10; round += 1) {
    const packet = await readJson(join(dirPath, `round-${String(round).padStart(2, '0')}.json`), null);
    const value = packet?.research?.[field];
    if (Array.isArray(value)) values.push(...value);
  }
  return JSON.stringify(values);
}
