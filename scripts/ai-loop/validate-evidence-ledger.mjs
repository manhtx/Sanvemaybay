import { join } from 'node:path';
import { ROOT, readJson, readText } from './runtime.mjs';

const loopDir = join(ROOT, '.ai-loop');
const cycle = Number(process.argv[2] || 0);
const policy = await readJson(join(loopDir, 'evidence-policy.json'), null);
if (!policy || !cycle) fail('Usage: node scripts/ai-loop/validate-evidence-ledger.mjs <cycle-number>');
const loopPolicy = await readJson(join(loopDir, 'loop-policy.json'), { strictEvidenceFromCycle: 2 });
const strict = cycle >= Number(loopPolicy.strictEvidenceFromCycle || 2);
const dir = join(loopDir, 'cycles', String(cycle).padStart(4, '0'));
const source = await readText(join(dir, policy.requiredLedgerFile), '');
const issues = [];
const warnings = [];
const entries = [];
const ids = new Set();
const maturityCounts = {};
const typeCounts = {};

if (!source.trim()) (strict ? issues : warnings).push(`missing ${policy.requiredLedgerFile}`);
for (const [index, line] of source.split(/\r?\n/).filter((value) => value.trim()).entries()) {
  let entry;
  try { entry = JSON.parse(line); } catch { issues.push(`line ${index + 1}: invalid JSON`); continue; }
  entries.push(entry);
  for (const key of policy.requiredKeys) if (entry[key] === undefined || entry[key] === null || entry[key] === '') issues.push(`line ${index + 1}: missing ${key}`);
  if (entry.evidence_id && ids.has(entry.evidence_id)) issues.push(`line ${index + 1}: duplicate evidence_id ${entry.evidence_id}`);
  if (entry.evidence_id) ids.add(entry.evidence_id);
  if (entry.result && !policy.results.includes(entry.result)) issues.push(`line ${index + 1}: invalid result ${entry.result}`);
  if (entry.evidence_type && !policy.allowedEvidenceTypes.includes(entry.evidence_type)) issues.push(`line ${index + 1}: invalid evidence_type ${entry.evidence_type}`);
  if (entry.maturity && !policy.maturityLevels.some((level) => level.id === entry.maturity)) issues.push(`line ${index + 1}: invalid maturity ${entry.maturity}`);
  if (entry.timestamp && Number.isNaN(Date.parse(entry.timestamp))) issues.push(`line ${index + 1}: invalid timestamp`);
  if (entry.result === 'PASS' && !String(entry.claim_supported || '').trim()) issues.push(`line ${index + 1}: PASS requires claim_supported`);
  if (['BLOCKED', 'UNKNOWN', 'PENDING'].includes(entry.result) && !String(entry.claim_not_supported || '').trim()) issues.push(`line ${index + 1}: ${entry.result} requires claim_not_supported`);
  maturityCounts[entry.maturity] = (maturityCounts[entry.maturity] || 0) + 1;
  typeCounts[entry.evidence_type] = (typeCounts[entry.evidence_type] || 0) + 1;
}
if (strict && !entries.some((entry) => policy.strictExternalEvidenceTypes.includes(entry.evidence_type))) issues.push('ledger requires user/product/business/experimental or explicitly blocked-external evidence');
if (entries.some((entry) => policy.forbiddenClaimTokens.some((token) => String(entry.claim_supported || '').toUpperCase().includes(token)))) issues.push('claim_supported contains a forbidden certainty token');
const result = { cycle, strict, passed: issues.length === 0, issues, warnings, entries: entries.length, maturityCounts, typeCounts, ledger: join(dir, policy.requiredLedgerFile), auditedAt: new Date().toISOString() };
console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exitCode = 1;
function fail(message) { console.error(message); process.exit(1); }
