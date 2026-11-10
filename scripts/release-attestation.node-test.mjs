import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  generateReleaseAttestation,
  computeMigrationSetHash,
  sha256File,
} from './generate-release-attestation.mjs';

test('release attestation: hashes and test suites are verifiable and consistent', () => {
  const attestation = generateReleaseAttestation(process.cwd(), null, false);
  assert.equal(attestation.release_candidate_id, 'RC-V7.0-001');
  assert.equal(attestation.branch, 'rc/v6.0-candidate');
  assert.ok(typeof attestation.git_sha === 'string' && attestation.git_sha.length === 40);
  assert.ok(attestation.hashes.acceptance_contract_hash);
  assert.ok(attestation.hashes.feature_contract_hash);
  assert.ok(attestation.hashes.migration_set_hash);
  assert.ok(attestation.hashes.package_lock_hash);
  assert.ok(attestation.hashes.threshold_registry_hash);
  assert.ok(attestation.hashes.evidence_kernel_hash);
  assert.equal(Object.keys(attestation.hashes.edge_functions).length, 14);
  assert.equal(attestation.release_mode, 'MODE_1_INDICATIVE_PUBLIC_BETA');
  assert.equal(attestation.system_authority_state, 'LOCAL_FULLSTACK_VERIFIED');
});

test('release attestation: computeMigrationSetHash computes deterministic SHA256 over sorted migration files', () => {
  const migrationsDir = join(process.cwd(), 'supabase', 'migrations');
  const hash1 = computeMigrationSetHash(migrationsDir);
  const hash2 = computeMigrationSetHash(migrationsDir);

  assert.ok(hash1, 'Migration set hash must not be null');
  assert.match(hash1, /^[a-f0-9]{64}$/, 'Hash must be 64-char hex string');
  assert.equal(hash1, hash2, 'Migration set hash must be completely deterministic');

  // Non-existent directory returns null safely
  const nullHash = computeMigrationSetHash('/non/existent/migrations/dir');
  assert.equal(nullHash, null, 'Non-existent directory must return null safely');

  // Verify sensitivity: changing a migration in a temp dir changes the hash
  const tempDir = mkdtempSync(join(tmpdir(), 'flycheap-mig-'));
  try {
    writeFileSync(join(tempDir, '001_init.sql'), 'CREATE TABLE test_a (id int);', 'utf8');
    const tempHash1 = computeMigrationSetHash(tempDir);

    writeFileSync(join(tempDir, '001_init.sql'), 'CREATE TABLE test_a (id bigint);', 'utf8'); // modified content
    const tempHash2 = computeMigrationSetHash(tempDir);

    assert.notEqual(tempHash1, tempHash2, 'Migration set hash must be sensitive to content modifications');
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('release attestation: sha256File helper safely handles existing and missing files', () => {
  // Existing file
  const pkgHash = sha256File(join(process.cwd(), 'package.json'));
  assert.ok(pkgHash);
  assert.match(pkgHash, /^[a-f0-9]{64}$/);

  // Missing file returns null without throwing
  const missingHash = sha256File(join(process.cwd(), 'non-existent-secret-file.env'));
  assert.equal(missingHash, null);
});

test('release attestation: generateReleaseAttestation preserves explicit custom git_sha parameter', () => {
  const customSha = 'abcdef1234567890abcdef1234567890abcdef12';
  const attestation = generateReleaseAttestation(process.cwd(), customSha, false);
  assert.equal(attestation.git_sha, customSha, 'Must preserve custom git_sha argument without overriding');
});

test('release attestation: edge functions catalog in attestation maps all 14 Edge Functions with valid SHA256 hashes', () => {
  const attestation = generateReleaseAttestation(process.cwd(), null, false);
  const expectedFunctions = [
    'flight-ingest',
    'analyze-price',
    'ai-explainer',
    'alert-processor',
    'setup-alert',
    'manage-alert',
    'manage-user-data',
    'feed-snapshot',
    'refresh-observed-fares',
    'observed-fares',
    'deal-redirect',
    'flight-search',
    'track-event',
    'retention-cleanup',
  ];

  assert.equal(Object.keys(attestation.hashes.edge_functions).length, expectedFunctions.length);
  for (const fn of expectedFunctions) {
    const fnHash = attestation.hashes.edge_functions[fn];
    assert.ok(fnHash, `Edge Function "${fn}" must have a computed hash`);
    assert.match(fnHash, /^[a-f0-9]{64}$/, `Edge Function "${fn}" hash must be valid SHA256 hex string`);
  }
});

test('release attestation: non-destructive in-memory mode vs execution latency budget', () => {
  const start = performance.now();
  for (let i = 0; i < 5; i++) {
    const att = generateReleaseAttestation(process.cwd(), null, false);
    assert.ok(att.hashes.migration_set_hash);
  }
  const duration = performance.now() - start;
  // 5 full attestations (each hashing migrations + 14 functions + contracts) should finish in under 500ms
  assert.ok(duration < 500, `Expected duration < 500ms, took ${duration.toFixed(2)}ms`);
});

test('release attestation: disk output persistence, hash schema format integrity, and contract tamper sensitivity', () => {
  const tempProject = mkdtempSync(join(tmpdir(), 'flycheap-att-'));
  try {
    const tempFlycheap = join(tempProject, '.flycheap');
    mkdirSync(tempFlycheap, { recursive: true });

    // Seed mock contract file
    const contractPath = join(tempFlycheap, 'ACCEPTANCE_CONTRACT.json');
    writeFileSync(contractPath, JSON.stringify({ version: '1.0.0', gates: [] }), 'utf8');

    // Run with writeToDisk: true
    const att = generateReleaseAttestation(tempProject, '1234567890123456789012345678901234567890', true);
    assert.equal(att.git_sha, '1234567890123456789012345678901234567890');
    assert.equal(att.version, '7.0.0');
    assert.equal(att.worktree_status, 'CLEAN');

    // Verify file written to disk
    const diskPath = join(tempFlycheap, 'RELEASE_ATTESTATION.json');
    const diskContent = JSON.parse(readFileSync(diskPath, 'utf8'));
    assert.equal(diskContent.git_sha, att.git_sha);
    assert.equal(diskContent.hashes.acceptance_contract_hash, att.hashes.acceptance_contract_hash);
    assert.match(diskContent.hashes.acceptance_contract_hash, /^[a-f0-9]{64}$/);

    // Tamper test: modify contract file and regenerate
    writeFileSync(contractPath, JSON.stringify({ version: '2.0.0', gates: ['tampered'] }), 'utf8');
    const tamperedAtt = generateReleaseAttestation(tempProject, att.git_sha, false);
    assert.notEqual(tamperedAtt.hashes.acceptance_contract_hash, att.hashes.acceptance_contract_hash, 'Modifying contract must change acceptance_contract_hash');
  } finally {
    rmSync(tempProject, { recursive: true, force: true });
  }
});
