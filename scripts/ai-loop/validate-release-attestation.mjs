import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, readJson, readText } from './runtime.mjs';

const cycle = String(process.argv[2] || '').padStart(4, '0');
if (!/^\d{4}$/.test(cycle)) fail('Usage: node scripts/ai-loop/validate-release-attestation.mjs <cycle-number>');
const loopDir = join(ROOT, '.ai-loop');
const dir = join(loopDir, 'cycles', cycle);
const attestation = await readJson(join(dir, 'release-attestation.json'), null);
const registry = await readJson(join(dir, 'evidence-index.json'), null);
const head = (await readText(join(dir, 'head-sha.txt'))).trim().split(/\s+/)[0];
const issues = [];
const warnings = [];
if (!attestation) issues.push('release-attestation.json is missing or invalid');
if (!registry) issues.push('evidence-index.json claim registry is missing or invalid');
for (const key of ['cycle', 'codeSha', 'reportSha', 'requirements', 'gates', 'externalBlockers', 'continuationRequired', 'claims', 'createdAt']) if (attestation?.[key] === undefined) issues.push(`missing ${key}`);
if (head && attestation?.codeSha && attestation.codeSha !== head) issues.push('codeSha does not match head-sha.txt');
if (!Array.isArray(attestation?.requirements) || !attestation.requirements.length) issues.push('requirements mapping is empty');
if (!Array.isArray(attestation?.gates) || !attestation.gates.length) issues.push('gates mapping is empty');
const registryClaims = Array.isArray(registry?.claims) ? registry.claims : Array.isArray(registry?.entries) ? registry.entries : [];
const attestationClaims = Array.isArray(attestation?.claims) ? attestation.claims : [];
if (!registryClaims.length) issues.push('evidence-index.json has no claims');
if (!attestationClaims.length) issues.push('release attestation claims registry is empty');
const registryIds = new Set();
for (const [index, claim] of registryClaims.entries()) {
  const id = claim.claimId || claim.claim_id;
  if (!id || registryIds.has(id)) issues.push(`evidence-index claim ${index + 1} has missing or duplicate claimId`);
  if (id) registryIds.add(id);
  for (const key of ['claim', 'evidence', 'falsifier']) if (!String(claim[key] || '').trim()) issues.push(`evidence-index claim ${index + 1} missing ${key}`);
}
for (const [index, claim] of attestationClaims.entries()) {
  for (const key of ['claimId', 'requirement', 'implementation', 'evidence', 'falsifier', 'status']) if (!String(claim[key] || '').trim()) issues.push(`attestation claim ${index + 1} missing ${key}`);
  if (claim.claimId && registryClaims.length && !registryIds.has(claim.claimId)) issues.push(`attestation claim ${claim.claimId} is absent from evidence-index.json`);
}
if (attestation?.continuationRequired !== true) issues.push('continuationRequired must remain true below the global threshold');

const cycleDirs = await readdir(join(loopDir, 'cycles'), { withFileTypes: true }).catch(() => []);
const priorIds = new Set();
for (const entry of cycleDirs) {
  if (!entry.isDirectory() || !/^\d{4}$/.test(entry.name) || entry.name === cycle) continue;
  const ledger = await readText(join(loopDir, 'cycles', entry.name, 'evidence-ledger.jsonl'), '');
  for (const line of ledger.split(/\r?\n/).filter(Boolean)) {
    try { const value = JSON.parse(line); if (value.evidence_id) priorIds.add(value.evidence_id); } catch { /* other validator owns malformed JSON */ }
  }
}
const currentLedger = await readText(join(dir, 'evidence-ledger.jsonl'), '');
for (const line of currentLedger.split(/\r?\n/).filter(Boolean)) {
  try { const value = JSON.parse(line); if (value.evidence_id && priorIds.has(value.evidence_id)) issues.push(`evidence_id reused from an earlier cycle: ${value.evidence_id}`); } catch { /* ledger validator reports this */ }
}
const result = { cycle: Number(cycle), passed: issues.length === 0, issues, warnings, registryClaims: registryClaims.length, attestationClaims: attestationClaims.length, auditedAt: new Date().toISOString() };
console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exitCode = 1;
function fail(message) { console.error(message); process.exit(1); }

