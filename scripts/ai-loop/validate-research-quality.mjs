import { join } from 'node:path';
import { ROOT, readJson, readText } from './runtime.mjs';

const cycle = Number(process.argv[2] || 0);
if (!cycle) fail('Usage: node scripts/ai-loop/validate-research-quality.mjs <cycle-number>');
const dir = join(ROOT, '.ai-loop', 'cycles', String(cycle).padStart(4, '0'));
const issues = [];
const fingerprints = [];
const requiredTerms = ['evidence', 'falsifier', 'solution', 'next', 'FLY-', 'GATE-', 'source'];
const forbidden = /\b(SIMULATED|SYNTHETIC|PLACEHOLDER|FABRICATED|MOCK_RESULT|FAKE_METRIC)\b/i;
for (let round = 1; round <= 20; round += 1) {
  const name = `round-${String(round).padStart(2, '0')}.md`;
  const text = await readText(join(dir, name), '');
  if (!text.trim()) { issues.push(`missing ${name}`); continue; }
  if (text.length < 1200) issues.push(`${name} is too short to be a complete whole-product research pass`);
  if (forbidden.test(text)) issues.push(`${name} contains synthetic evidence language`);
  for (const term of requiredTerms) if (!new RegExp(term, 'i').test(text)) issues.push(`${name} missing ${term}`);
  if (!/prior|previous|challenge|reject|falsif/i.test(text)) issues.push(`${name} has no prior-claim challenge`);
  for (const term of ['finding', 'solution', 'new evidence', 'rejected', 'next']) if (!new RegExp(term, 'i').test(text)) issues.push(`${name} missing substantive research field: ${term}`);
  fingerprints.push(text.replace(/\s+/g, ' ').slice(0, 8000).toLowerCase());
}
const duplicateCount = fingerprints.length - new Set(fingerprints).size;
if (duplicateCount) issues.push(`${duplicateCount} duplicate Farely research artifact(s)`);
for (let i = 1; i < fingerprints.length; i += 1) if (jaccard(fingerprints[i - 1], fingerprints[i]) >= 0.92) issues.push(`round-${String(i).padStart(2, '0')} and round-${String(i + 1).padStart(2, '0')} are near-duplicates`);
const result = { cycle, passed: issues.length === 0, issues, rounds: fingerprints.length, auditedAt: new Date().toISOString() };
console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exitCode = 1;
function fail(message) { console.error(message); process.exit(1); }
function jaccard(left, right) {
  const tokens = (value) => new Set(value.split(/[^a-z0-9-]+/).filter((token) => token.length > 3));
  const a = tokens(left); const b = tokens(right); let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / new Set([...a, ...b]).size;
}
