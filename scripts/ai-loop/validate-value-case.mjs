import { join } from 'node:path';
import { ROOT, readJson, readText } from './runtime.mjs';

const cycle = String(process.argv[2] || '').padStart(4, '0');
if (!/^\d{4}$/.test(cycle)) fail('Usage: node scripts/ai-loop/validate-value-case.mjs <cycle-number>');
const dir = join(ROOT, '.ai-loop', 'cycles', cycle);
const valueCase = await readText(join(dir, 'value-case.md'), '');
const implementation = await readJson(join(dir, 'implementation.json'), null);
const issues = [];
for (const section of ['Problem', 'Baseline', 'Exact Change', 'Expected Result', 'Observed Result', 'Evidence', 'Residual Uncertainty']) if (!new RegExp(`^#+\\s*${section.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}`, 'im').test(valueCase)) issues.push(`value-case.md missing ${section}`);
for (const term of ['before', 'after', 'metric', 'evidence class', 'user', 'business', 'falsifier']) if (!new RegExp(term, 'i').test(valueCase)) issues.push(`value-case.md missing ${term}`);
if (/\b(SIMULATED|SYNTHETIC|PLACEHOLDER|FABRICATED|MOCK_RESULT|FAKE_METRIC)\b/i.test(valueCase)) issues.push('value-case.md contains synthetic evidence language');
const waves = Array.isArray(implementation?.waves) ? implementation.waves : [];
if (!waves.length) issues.push('implementation.json has no waves');
for (const [index, wave] of waves.entries()) for (const key of ['requirements', 'gates', 'falsifiers', 'evidenceClass']) if (wave[key] === undefined) issues.push(`wave ${index + 1} missing ${key}`);
if (implementation && !Array.isArray(implementation.requirements)) issues.push('implementation.json lacks requirements mapping');
const result = { cycle: Number(cycle), passed: issues.length === 0, issues, auditedAt: new Date().toISOString() };
console.log(JSON.stringify(result, null, 2));
if (issues.length) process.exitCode = 1;
function fail(message) { console.error(message); process.exit(1); }
