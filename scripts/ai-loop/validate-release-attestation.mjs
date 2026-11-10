import { join } from 'node:path';
import { ROOT, readJson, readText } from './runtime.mjs';

const cycle = String(process.argv[2] || '').padStart(4, '0');
if (!/^\d{4}$/.test(cycle)) fail('Usage: node scripts/ai-loop/validate-release-attestation.mjs <cycle-number>');
const dir = join(ROOT, '.ai-loop', 'cycles', cycle);
const attestation = await readJson(join(dir, 'release-attestation.json'), null);
const head = (await readText(join(dir, 'head-sha.txt'))).trim().split(/\s+/)[0];
const issues = [];
if (!attestation) issues.push('release-attestation.json is missing or invalid');
for (const key of ['cycle', 'codeSha', 'reportSha', 'requirements', 'gates', 'externalBlockers', 'continuationRequired', 'claims', 'createdAt']) if (attestation?.[key] === undefined) issues.push(`missing ${key}`);
if (head && attestation?.codeSha && attestation.codeSha !== head) issues.push('codeSha does not match head-sha.txt');
if (!Array.isArray(attestation?.requirements) || !attestation.requirements.length) issues.push('requirements mapping is empty');
if (!Array.isArray(attestation?.gates) || !attestation.gates.length) issues.push('gates mapping is empty');
if (!Array.isArray(attestation?.claims) || !attestation.claims.length) issues.push('claims registry is empty');
for (const [index, claim] of (attestation?.claims || []).entries()) for (const key of ['claimId', 'requirement', 'implementation', 'evidence', 'falsifier', 'status']) if (!String(claim[key] || '').trim()) issues.push(`claim ${index + 1} missing ${key}`);
if (attestation?.continuationRequired !== true) issues.push('continuationRequired must remain true below the global threshold');
const result = { cycle: Number(cycle), passed: issues.length === 0, issues, auditedAt: new Date().toISOString() };
console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exitCode = 1;
function fail(message) { console.error(message); process.exit(1); }

