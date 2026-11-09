import { mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT } from './runtime.mjs';

const dir = join(ROOT, '.ai-loop-smoke');
await rm(dir, { recursive: true, force: true });
await mkdir(dir, { recursive: true });
const checks = [
  ['runtime imports', () => import('./runtime.mjs')],
  ['provider imports', () => import('./provider.mjs')],
  ['agent imports', () => import('./agent.mjs')],
  ['orchestrator syntax', () => import('node:fs/promises').then(async ({ readFile }) => { await readFile(new URL('./orchestrator.mjs', import.meta.url)); })],
];
for (const [name, check] of checks) { await check(); console.log(`PASS ${name}`); }
await rm(dir, { recursive: true, force: true });
