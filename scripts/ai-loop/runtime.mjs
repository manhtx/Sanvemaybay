import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, access, readdir, rename } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';

export const ROOT = resolve(new URL('../..', import.meta.url).pathname);
export const LOOP_DIR = join(ROOT, '.ai-loop');
export const STATE_DIR = join(LOOP_DIR, 'state');
export const STOP_FILE = join(LOOP_DIR, 'STOP');

export async function ensureDirs(...paths) {
  await Promise.all(paths.map((path) => mkdir(path, { recursive: true })));
}

export async function readText(path, fallback = '') {
  try { return await readFile(path, 'utf8'); } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function writeText(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

export async function readJson(path, fallback) {
  const text = await readText(path, '');
  if (!text) return fallback;
  return JSON.parse(text);
}

export async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, path);
}

export async function stopped() {
  try { await access(STOP_FILE); return true; } catch { return false; }
}

export function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

export async function run(command, args = [], options = {}) {
  const cwd = options.cwd || ROOT;
  const timeoutMs = options.timeoutMs || 900000;
  return new Promise((resolveResult, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...(options.env || {}) },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      resolveResult({ code: code ?? 1, signal, stdout, stderr, command: [command, ...args].join(' ') });
    });
  });
}

export async function collectTextFiles(dir = ROOT, maxFiles = 80) {
  const ignored = new Set(['node_modules', '.git', '.next', 'dist', 'dist-private', '.ai-loop']);
  const result = [];
  async function walk(current) {
    if (result.length >= maxFiles) return;
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (ignored.has(entry.name)) continue;
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (/\.(md|json|ts|tsx|js|mjs|css|html|txt)$/.test(entry.name)) result.push(path);
      if (result.length >= maxFiles) return;
    }
  }
  await walk(dir);
  return result;
}

export function projectPath(path) {
  const absolute = resolve(ROOT, path);
  const relativePath = relative(ROOT, absolute);
  if (relativePath.startsWith('..')) throw new Error(`Path escapes project root: ${path}`);
  return absolute;
}
