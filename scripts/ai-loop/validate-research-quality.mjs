import { join } from 'node:path';
import { ROOT, readJson, readText } from './runtime.mjs';

const cycle = Number(process.argv[2] || 0);
if (!cycle) fail('Usage: node scripts/ai-loop/validate-research-quality.mjs <cycle-number>');
const dir = join(ROOT, '.ai-loop', 'cycles', String(cycle).padStart(4, '0'));
const policy = await readJson(join(ROOT, '.ai-loop', 'loop-policy.json'));
const contractRounds = Number(policy?.researchRounds || 10);
const prefixRounds = process.env.AI_INTERNAL_PREFIX_AUDIT === '1' ? Number(process.env.AI_AUDIT_PREFIX_ROUNDS || 0) : 0;
const expectedRounds = prefixRounds > 0 ? Math.min(prefixRounds, contractRounds) : contractRounds;
const issues = [];
const fingerprints = [];
const requiredTerms = ['evidence', 'falsifier', 'solution', 'next', 'FLY-', 'GATE-', 'source'];
const requiredSections = ['Source Read Receipt', 'Research Question & Scope', 'Executive Conclusion', 'Technical Findings', 'Product / User / Business Findings', 'Root Cause Analysis', 'System Architecture Audit', 'Capability Matrix', 'Risk Register', 'Decision Records', 'Exact Solution Architecture', 'Verification & Acceptance Matrix', 'Adversarial Review', 'Round Delta', 'New Evidence', 'Revised Claims', 'Findings', 'Evidence Ledger', 'Rejected Claims', 'Solutions', 'Product / User / Business Value', 'Falsifiers', 'Limitations & Unknowns', 'Next Research Questions', 'Compiler / Mastergoal Impact'];
const forbidden = /\b(SIMULATED|SYNTHETIC|PLACEHOLDER|FABRICATED|MOCK_RESULT|FAKE_METRIC)\b/i;
for (let round = 1; round <= expectedRounds; round += 1) {
  const name = `round-${String(round).padStart(2, '0')}.md`;
  const text = await readText(join(dir, name), '');
  if (!text.trim()) { issues.push(`missing ${name}`); continue; }
  for (const section of requiredSections) if (!new RegExp(`^#+\\s*${section.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}`, 'im').test(text)) issues.push(`${name} missing dossier section: ${section}`);
  const packet = await readJson(join(dir, `round-${String(round).padStart(2, '0')}.json`));
  if (!packet || packet.schemaVersion !== 'research-packet/2.0') issues.push(`${name} is missing its machine-readable research-packet/2.0 companion`);
  if (packet) {
    const actionRows = packet.actionLedger || [];
    const outputRows = packet.toolOutputLedger || [];
    const actions = new Set(actionRows.map((item) => item?.actionId).filter(Boolean));
    const outputs = new Set(outputRows.filter((item) => item?.ok !== false && (item.stdout || item.stderr || item.content || item.path || item.command)).map((item) => item.actionId).filter(Boolean));
    if (Number(packet.turnCount || 0) < 20) issues.push(`${name} has only ${packet.turnCount || 0}/20 research turns`);
    if (Number(packet.investigationActionCount || 0) < 24) issues.push(`${name} has only ${packet.investigationActionCount || 0}/24 investigation actions`);
    for (const output of outputRows) if (output?.type === 'read' && output?.ok !== false && !output.contentHash) issues.push(`${name} read output ${output.actionId || 'unknown'} has no content hash`);
    if (!actions.size || !outputs.size) issues.push(`${name} has no retained action/tool-output provenance`);
    const research = packet.research || {};
    for (const field of ['researchQuestion', 'systemReview', 'subpassCoverage', 'lensCoverage', 'findings', 'evidenceLedger', 'solutions', 'rejectedClaims', 'falsifiers', 'limitations', 'newEvidence', 'revisedClaims', 'acceptanceMatrix', 'nextResearchQuestions']) if (!(Array.isArray(research[field]) ? research[field].length : String(research[field] || '').trim())) issues.push(`${name} packet missing substantive ${field}`);
    const subpassText = JSON.stringify(research.subpassCoverage || []);
    for (const subpass of ['PRODUCT_USER_BUSINESS', 'SYSTEM_ARCHITECTURE', 'UX_CONTENT_INTERACTION', 'DELIVERY_MEASUREMENT_OPERATIONS']) if (!new RegExp(subpass, 'i').test(subpassText)) issues.push(`${name} packet missing subpass ${subpass}`);
    if ((research.lensCoverage || []).length < 12) issues.push(`${name} packet covers fewer than 12 research lenses`);
    for (const [index, evidenceRow] of (research.evidenceLedger || []).entries()) {
      for (const key of ['id', 'actionId', 'sourceLocator', 'evidenceClass', 'observedResult', 'limitation', 'falsifier']) if (!evidenceRow?.[key]) issues.push(`${name} evidenceLedger[${index}] missing ${key}`);
      if (evidenceRow?.actionId && (!actions.has(evidenceRow.actionId) || !outputs.has(evidenceRow.actionId))) issues.push(`${name} evidenceLedger[${index}] is not linked to retained output`);
    }
    for (const [index, finding] of (research.findings || []).entries()) if (!finding?.evidenceIds?.length) issues.push(`${name} finding ${index + 1} has no evidenceIds`);
    const evidenceIds = new Set((research.evidenceLedger || []).map((item) => item?.id).filter(Boolean));
    const findingIds = new Set((research.findings || []).map((item) => item?.id).filter(Boolean));
    for (const [index, finding] of (research.findings || []).entries()) for (const evidenceId of finding?.evidenceIds || []) if (!evidenceIds.has(evidenceId)) issues.push(`${name} finding ${index + 1} references unknown evidence ${evidenceId}`);
    for (const [index, solution] of (research.solutions || []).entries()) for (const findingId of solution?.findingIds || []) if (!findingIds.has(findingId)) issues.push(`${name} solution ${index + 1} references unknown finding ${findingId}`);
    if (round > 1 && (research.newEvidence || []).length < 3) issues.push(`${name} has fewer than 3 new evidence records after baseline`);
    if (round > 1 && (research.revisedClaims || []).length < 2) issues.push(`${name} has fewer than 2 revised/rejected claims after baseline`);
  }
  if (forbidden.test(text)) issues.push(`${name} contains synthetic evidence language`);
  for (const term of requiredTerms) if (!new RegExp(term, 'i').test(text)) issues.push(`${name} missing ${term}`);
  if (!/prior|previous|challenge|reject|falsif/i.test(text)) issues.push(`${name} has no prior-claim challenge`);
  for (const term of ['finding', 'root cause', 'solution', 'new evidence', 'rejected', 'next']) if (!new RegExp(term, 'i').test(text)) issues.push(`${name} missing substantive research field: ${term}`);
  fingerprints.push(text.replace(/\s+/g, ' ').slice(0, 8000).toLowerCase());
}
const duplicateCount = fingerprints.length - new Set(fingerprints).size;
if (duplicateCount) issues.push(`${duplicateCount} duplicate Farely research artifact(s)`);
for (let i = 1; i < fingerprints.length; i += 1) if (jaccard(fingerprints[i - 1], fingerprints[i]) >= 0.92) issues.push(`round-${String(i).padStart(2, '0')} and round-${String(i + 1).padStart(2, '0')} are near-duplicates`);
const result = { cycle, expectedRounds, passed: issues.length === 0, issues, rounds: fingerprints.length, auditedAt: new Date().toISOString() };
console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exitCode = 1;
function fail(message) { console.error(message); process.exit(1); }
function jaccard(left, right) {
  const tokens = (value) => new Set(value.split(/[^a-z0-9-]+/).filter((token) => token.length > 3));
  const a = tokens(left); const b = tokens(right); let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / new Set([...a, ...b]).size;
}
