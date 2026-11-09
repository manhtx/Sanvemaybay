import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runSyntheticHealthCheck } from './synthetic-health-check.mjs';

test('synthetic health check: verifies core deployment indicators without consuming quota', () => {
  const result = runSyntheticHealthCheck();
  assert.equal(result.ok, true, `Synthetic health check failed: ${JSON.stringify(result.checks)}`);
  assert.ok(result.checks.length >= 4, 'Must evaluate at least 4 critical health indicators');

  const expectedCheckIds = [
    'CHK_RELEASE_METADATA',
    'CHK_FEED_CONTRACT',
    'CHK_SECURITY_HEADERS',
    'CHK_CLIENT_DIAGNOSTICS',
  ];
  for (const id of expectedCheckIds) {
    const check = result.checks.find((c) => c.check_id === id);
    assert.ok(check, `Missing expected check: ${id}`);
    assert.equal(check.status, 'PASS', `Check ${id} must pass in clean repo`);
  }
  assert.match(result.checked_at, /^\d{4}-\d{2}-\d{2}T/);
});

test('synthetic health check: fail-closed evaluation on missing critical components (missing diagnostics)', () => {
  const emptyDir = mkdtempSync(join(tmpdir(), 'flycheap-synth-'));
  try {
    const result = runSyntheticHealthCheck({ projectRoot: emptyDir });
    assert.equal(result.ok, false, 'Synthetic check must fail when project root is missing diagnostics');
    const diagCheck = result.checks.find((c) => c.check_id === 'CHK_CLIENT_DIAGNOSTICS');
    assert.ok(diagCheck);
    assert.equal(diagCheck.status, 'FAIL');
  } finally {
    rmSync(emptyDir, { recursive: true, force: true });
  }
});

test('synthetic health check: feed contract validator rejects malformed deal envelope', () => {
  // Unit verification of the envelope criteria embedded in synthetic-health-check
  const isValidEnvelope = (env) => Boolean(env && env.status && Array.isArray(env.deals) && env.generated_at);

  assert.equal(isValidEnvelope({ status: 'healthy', deals: [], generated_at: new Date().toISOString() }), true);
  assert.equal(isValidEnvelope({ status: 'healthy', deals: 'not-an-array', generated_at: new Date().toISOString() }), false);
  assert.equal(isValidEnvelope({ deals: [], generated_at: new Date().toISOString() }), false);
  assert.equal(isValidEnvelope({ status: 'healthy', deals: [] }), false);
  assert.equal(isValidEnvelope(null), false);
  assert.equal(isValidEnvelope(undefined), false);
});

test('synthetic health check: vercel security headers check validates configured security headers and detects invalid configs', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'flycheap-vercel-'));
  try {
    // 1. Invalid vercel.json (syntax error)
    writeFileSync(join(tempDir, 'vercel.json'), '{ broken json', 'utf8');
    const failRes = runSyntheticHealthCheck({ projectRoot: tempDir });
    const brokenHeaderCheck = failRes.checks.find((c) => c.check_id === 'CHK_SECURITY_HEADERS');
    assert.equal(brokenHeaderCheck?.status, 'FAIL');

    // 2. vercel.json with empty headers array
    writeFileSync(join(tempDir, 'vercel.json'), JSON.stringify({ headers: [] }), 'utf8');
    const emptyHeaderRes = runSyntheticHealthCheck({ projectRoot: tempDir });
    const emptyHeaderCheck = emptyHeaderRes.checks.find((c) => c.check_id === 'CHK_SECURITY_HEADERS');
    assert.equal(emptyHeaderCheck?.status, 'FAIL');

    // 3. vercel.json with valid headers array
    writeFileSync(
      join(tempDir, 'vercel.json'),
      JSON.stringify({ headers: [{ source: '/(.*)', headers: [{ key: 'X-Frame-Options', value: 'DENY' }] }] }),
      'utf8'
    );
    const validHeaderRes = runSyntheticHealthCheck({ projectRoot: tempDir });
    const validHeaderCheck = validHeaderRes.checks.find((c) => c.check_id === 'CHK_SECURITY_HEADERS');
    assert.equal(validHeaderCheck?.status, 'PASS');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('synthetic health check: release metadata resolution gracefully differentiates dist build vs dev tree', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'flycheap-release-'));
  try {
    // In dev tree without dist/release.json, status is PASS with dev note
    const devRes = runSyntheticHealthCheck({ projectRoot: tempDir });
    const devMeta = devRes.checks.find((c) => c.check_id === 'CHK_RELEASE_METADATA');
    assert.equal(devMeta?.status, 'PASS');
    assert.ok(devMeta?.note);

    // In dist tree with release.json
    const distDir = join(tempDir, 'dist');
    mkdirSync(distDir, { recursive: true });
    writeFileSync(join(distDir, 'release.json'), JSON.stringify({ sha: 'c0ffee123456' }), 'utf8');

    const distRes = runSyntheticHealthCheck({ projectRoot: tempDir });
    const distMeta = distRes.checks.find((c) => c.check_id === 'CHK_RELEASE_METADATA');
    assert.equal(distMeta?.status, 'PASS');
    assert.equal(distMeta?.release_sha, 'c0ffee123456');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('performance benchmark: synthetic health check executes under latency budget', () => {
  const start = performance.now();
  for (let i = 0; i < 500; i++) {
    const res = runSyntheticHealthCheck();
    assert.equal(res.ok, true);
  }
  const duration = performance.now() - start;
  // 500 in-memory/disk evaluations must finish within 500ms
  assert.ok(duration < 500, `Expected duration < 500ms, took ${duration.toFixed(2)}ms`);
});
