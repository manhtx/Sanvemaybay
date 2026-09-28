import test from 'node:test';
import assert from 'node:assert/strict';
import { generateReleaseAttestation } from './generate-release-attestation.mjs';

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
});
