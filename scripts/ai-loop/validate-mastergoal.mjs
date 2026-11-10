import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT } from './runtime.mjs';

const cycle = String(process.argv[2] || '').padStart(4, '0');
if (!/^\d{4}$/.test(cycle)) fail('Usage: node scripts/ai-loop/validate-mastergoal.mjs <cycle-number>');
const contract = await readJson(join(ROOT, '.ai-loop/mastergoal-quality-contract.json'), {});
const text = await readText(join(ROOT, '.ai-loop/cycles', cycle, 'mastergoal.md'));
const issues = [];
const headings = text.split(/\r?\n/).filter((line) => /^\s*#{1,5}\s+/.test(line)).join('\n');
if (!text.trim()) issues.push('mastergoal.md is missing or empty');
if (/^\s*\{[\s\S]*\}\s*$/m.test(text.trim())) issues.push('mastergoal must be human-readable Markdown, not JSON');
const findingRefs = (text.match(/\bF-[A-Z0-9._-]+\b/gi) || []).length;
const solutionRefs = (text.match(/\bS-[A-Z0-9._-]+\b/gi) || []).length;
const evidenceRefs = (text.match(/\bE-[A-Z0-9._-]+\b/gi) || []).length;
if (findingRefs < 3) issues.push(`mastergoal has only ${findingRefs}/3 research finding references`);
if (solutionRefs < 3) issues.push(`mastergoal has only ${solutionRefs}/3 solution references`);
if (evidenceRefs < 3 && !/UNKNOWN|BLOCKED_EXTERNAL/i.test(text)) issues.push(`mastergoal has only ${evidenceRefs}/3 evidence references and no explicit evidence boundary`);
const traceabilityRecords = extractTraceabilityRecords(text);
if (traceabilityRecords.length < 3) issues.push(`mastergoal has only ${traceabilityRecords.length}/3 complete finding-to-solution traceability records`);
for (const [index, record] of traceabilityRecords.slice(0, 3).entries()) {
  for (const [name, pattern] of [
    ['finding reference', /\bF-[A-Z0-9._-]+\b/i],
    ['solution reference', /\bS-[A-Z0-9._-]+\b/i],
    ['evidence reference', /\bE-[A-Z0-9._-]+\b/i],
    ['affected scope', /affected files?|routes?|functions?|migrations?|modules?|schema|scope|locator/i],
    ['acceptance test', /acceptance|verification gate|definition of done/i],
    ['falsifier', /falsifier|negative test|counterexample|failure injection/i],
    ['evidence class/boundary', /evidence class|LOCAL_|STAGING_|PRODUCTION_|EMPIRICAL_|UNKNOWN|BLOCKED_EXTERNAL|HYPOTHESIS/i],
  ]) if (!pattern.test(record)) issues.push(`traceability record ${index + 1} missing ${name}`);
}
if (/\b(TODO|TBD|let the executor decide|executor chooses architecture)\b/i.test(text)) issues.push('mastergoal delegates or defers a required decision');
if (!/falsifier|negative test|counterexample/i.test(text)) issues.push('mastergoal lacks falsifier/negative-test linkage');
for (const section of contract.requiredSections || []) {
  const pattern = section === 'summary' ? /summary|executive/i : new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (!pattern.test(headings)) issues.push(`missing mastergoal heading: ${section}`);
}
const opening = text.split(/\r?\n/).slice(0, 20).join('\n');
if (!/summary|executive/i.test(opening)) issues.push('summary must be near the top');
if (!/delta|changed|revised|rejected/i.test(opening)) issues.push('delta from prior mastergoal must be near the top');
for (const signal of contract.farelyRequiredSignals || []) if (!new RegExp(signal, 'i').test(text)) issues.push(`missing Farely signal: ${signal}`);
const citedRounds = new Set();
for (const match of text.matchAll(/\b(?:round|r)\s*[-#:]?\s*(0?[1-9]|10)\b/gi)) citedRounds.add(Number(match[1]));
if (citedRounds.size < Number(contract.researchRounds || 10)) issues.push(`research coverage is ${citedRounds.size}/${contract.researchRounds || 10} rounds`);
const waveStarts = text.split(/\r?\n/).map((line, index) => /^\s*#{1,5}\s+.*\b(?:wave|phase|milestone)\b/i.test(line) ? index : -1).filter((index) => index >= 0);
if (!waveStarts.length) issues.push('no execution wave or phase headings');
const lines = text.split(/\r?\n/);
for (const [index, start] of waveStarts.entries()) {
  const body = lines.slice(start + 1, waveStarts[index + 1] ?? lines.length).join('\n');
  for (const [name, pattern] of [
    ['user problem', /user problem|job to be done|pain point/i],
    ['mechanism', /mechanism|causal chain|how this works/i],
    ['scope', /affected files?|routes?|functions?|migrations?|modules?|schema/i],
    ['dependencies', /dependencies|prerequisite|migration order/i],
    ['acceptance', /acceptance|verification gate|definition of done/i],
    ['falsifier', /falsifier|negative test|counterexample/i],
    ['rollback', /rollback|recovery|revert/i],
    ['evidence', /evidence|unknown|blocked_external|empirical_pending/i],
  ]) if (!pattern.test(body)) issues.push(`wave ${index + 1} missing ${name}`);
}
for (const [name, pattern] of [
  ['autonomous execution', /autonomous|without asking|do not ask/i],
  ['completion gate', /only when|completion gate|do not claim done|all gates/i],
  ['GitHub handoff', /github|commit|push|remote branch/i],
]) if (!pattern.test(text)) issues.push(`missing ${name}`);
const result = {
  project: 'Farely', cycle: Number(cycle), passed: issues.length === 0, issueCount: issues.length,
  issues, metrics: { chars: text.length, citedRounds: citedRounds.size, waveBlocks: waveStarts.length },
  path: join(ROOT, '.ai-loop/cycles', cycle, 'mastergoal.md'), auditedAt: new Date().toISOString(),
};
console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exitCode = 1;
async function readText(path) { try { return await readFile(path, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return ''; throw error; } }
async function readJson(path, fallback) { const value = await readText(path); if (!value) return fallback; try { return JSON.parse(value); } catch { return fallback; } }
function fail(message) { console.error(message); process.exit(1); }
function extractTraceabilityRecords(value) {
  const paragraphs = String(value).split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  const candidates = paragraphs.filter((part) =>
    /\bF-[A-Z0-9._-]+\b/i.test(part) && /\bS-[A-Z0-9._-]+\b/i.test(part) && /\bE-[A-Z0-9._-]+\b/i.test(part),
  );
  return candidates.filter((part, index) => candidates.findIndex((candidate) => candidate === part) === index);
}
