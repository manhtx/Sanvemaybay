/**
 * FARELY PROJECT 10X — V35 PRODUCTION SMOKE REQUIREMENTS TEST SUITE (PS35-01 THROUGH PS35-18)
 * Section H3 of Farely Project 10X Master Convergence Mission V35.
 *
 * All 18 production incident negative gates are exercised against real production domain modules.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Production domain imports
import {
  evaluateReleaseTupleCompatibility
} from '../src/domain/farely/releaseTuple.ts';
import {
  evaluateSmokeVsVerifyBranchStatus,
  evaluateFeedSnapshotInventory,
  evaluateFlightSearchProviderHealth,
  evaluateProductionTruthStandby,
  evaluateMinObservedFaresRequirement,
  evaluateRouteCoverageScope,
  evaluateDateWindowCoverageScope,
  evaluateSourceProductionAuthorization,
  evaluateWorkflowBranchProvenance,
  evaluateWatchReliabilityWithCoverage,
  evaluateProductJourneyAcceptance,
  evaluateSecuritySmokeProofLevel,
  distinguishReadModels,
  evaluateEvidenceFreshness,
  evaluateWorkflowSemanticIntegrity
} from '../src/domain/farely/productionSmokeTruth.ts';

// PS35-01: Frontend release SHA != Edge release SHA
test('PS35-01: Frontend release SHA != Edge release SHA fails strict atomic parity unless authorized compatible tuple is proven', () => {
  // Case A: Mismatch without authorized tuple fails closed
  const mismatchResult = evaluateReleaseTupleCompatibility({
    frontendSha: '084025b1f58a98655222ee4f8fc82461b286dd6a',
    edgeSha: 'f08b4b42472faff1dcc132106ee30b5a54938571'
  });
  assert.equal(mismatchResult.valid, false);
  assert.equal(mismatchResult.status, 'MISMATCH_REJECTED');
  assert.match(mismatchResult.reason, /frontend\/runtime release mismatch/);

  // Case B: Pure atomic parity passes
  const atomicResult = evaluateReleaseTupleCompatibility({
    frontendSha: '084025b1f58a98655222ee4f8fc82461b286dd6a',
    edgeSha: '084025b1f58a98655222ee4f8fc82461b286dd6a'
  });
  assert.equal(atomicResult.valid, true);
  assert.equal(atomicResult.status, 'COMPATIBLE');
  assert.equal(atomicResult.parity_mode, 'ATOMIC_SHA_PARITY');

  // Case C: Independent compatible tuple allowed only with authentic proof
  const authorizedTuple = {
    tuple_id: 'tuple_v35_staging_compat_01',
    frontend_release_sha: '084025b1f58a98655222ee4f8fc82461b286dd6a',
    edge_runtime_sha: 'f08b4b42472faff1dcc132106ee30b5a54938571',
    db_migration_head: '20261016_v35_canonical_convergence',
    worker_revision: 'worker-v35.1',
    active_generation_id: 'gen_prod_01',
    api_contract_version: '1.0.0',
    observation_schema_version: 1,
    parity_mode: 'COMPATIBLE_TUPLE',
    authorized_by: 'FOUNDER_AUTHORITY_STAGING_RECEIPT',
    created_at: '2026-10-16T10:00:00Z'
  };

  const tupleResult = evaluateReleaseTupleCompatibility({
    frontendSha: '084025b1f58a98655222ee4f8fc82461b286dd6a',
    edgeSha: 'f08b4b42472faff1dcc132106ee30b5a54938571',
    registeredTuples: [authorizedTuple]
  });
  assert.equal(tupleResult.valid, true);
  assert.equal(tupleResult.status, 'COMPATIBLE');
  assert.equal(tupleResult.parity_mode, 'COMPATIBLE_TUPLE');
  assert.equal(tupleResult.matched_tuple_id, 'tuple_v35_staging_compat_01');
});

// PS35-02: Frontend SHA matches manually edited release.json but deployment revision differs
test('PS35-02: Frontend SHA matches manually edited release.json but deployment revision differs -> FAIL', () => {
  const tamperedResult = evaluateReleaseTupleCompatibility({
    frontendSha: 'f08b4b42472faff1dcc132106ee30b5a54938571',
    edgeSha: 'f08b4b42472faff1dcc132106ee30b5a54938571',
    releaseJsonTampered: true
  });
  assert.equal(tamperedResult.valid, false);
  assert.equal(tamperedResult.status, 'TAMPERING_REJECTED');
  assert.match(tamperedResult.reason, /release\.json manually altered/);
});

// PS35-03: Edge DEPLOYED_COMMIT is overwritten to match frontend without actual deployment
test('PS35-03: Edge DEPLOYED_COMMIT is overwritten to match frontend without actual deployment -> FAIL', () => {
  const forgedResult = evaluateReleaseTupleCompatibility({
    frontendSha: '084025b1f58a98655222ee4f8fc82461b286dd6a',
    edgeSha: '084025b1f58a98655222ee4f8fc82461b286dd6a',
    deployedCommitOverwrittenWithoutDeploy: true
  });
  assert.equal(forgedResult.valid, false);
  assert.equal(forgedResult.status, 'UNAUTHORIZED_MUTATION_REJECTED');
  assert.match(forgedResult.reason, /Edge DEPLOYED_COMMIT overwritten/);
});

// PS35-04: GitHub PR Verify green, production smoke on main red
test('PS35-04: GitHub PR Verify green, production smoke on main red -> PRODUCTION_NOT_VERIFIED', () => {
  const result = evaluateSmokeVsVerifyBranchStatus({
    prVerifyGreen: true,
    productionSmokeGreen: false
  });
  assert.equal(result.isVerified, false);
  assert.equal(result.status, 'PRODUCTION_NOT_VERIFIED');
});

// PS35-05: feed-snapshot returns healthy_empty, 0 deals, 0 routes
test('PS35-05: feed-snapshot returns healthy_empty, 0 deals, 0 routes -> API ok but live-inventory usefulness cannot be certified', () => {
  const result = evaluateFeedSnapshotInventory({
    status: 'healthy_empty',
    dealsCount: 0,
    routesCount: 0
  });
  assert.equal(result.apiAvailability, 'OK');
  assert.equal(result.canCertifyInventoryUsefulness, false);
  assert.match(result.reason, /live-inventory usefulness cannot be certified/);
});

// PS35-06: flight-search returns 503
test('PS35-06: flight-search returns 503 -> Degraded source status, no healthy provider claim or false no-flight result', () => {
  const result = evaluateFlightSearchProviderHealth({
    httpStatus: 503
  });
  assert.equal(result.providerStatus, 'DEGRADED');
  assert.equal(result.isHealthyProviderClaimAllowed, false);
  assert.equal(result.isNoFlightResult, false);
  assert.match(result.reason, /degraded source status/);
});

// PS35-07: production-truth returns ok=true with totalRows=0 and ALLOW_INDICATIVE_STANDBY=true
test('PS35-07: production-truth returns ok=true with totalRows=0 and ALLOW_INDICATIVE_STANDBY=true -> INDICATIVE_STANDBY only', () => {
  const result = evaluateProductionTruthStandby({
    ok: true,
    totalRows: 0,
    allowIndicativeStandby: true
  });
  assert.equal(result.classification, 'INDICATIVE_STANDBY');
  assert.equal(result.hasHealthyLiveInventory, false);
  assert.match(result.reason, /cannot claim healthy live inventory/);
});

// PS35-08: MIN_OBSERVED_FARES=0
test('PS35-08: MIN_OBSERVED_FARES=0 -> Does not satisfy nonzero production inventory without authorized decision', () => {
  const unauthorized = evaluateMinObservedFaresRequirement({
    minObservedFares: 0,
    hasAuthorizedThresholdDecision: false
  });
  assert.equal(unauthorized.satisfied, false);
  assert.match(unauthorized.reason, /without an authorized threshold decision/);

  const authorized = evaluateMinObservedFaresRequirement({
    minObservedFares: 0,
    hasAuthorizedThresholdDecision: true
  });
  assert.equal(authorized.satisfied, true);
});

// PS35-09: Route has no snapshots but scanner never monitored it
test('PS35-09: Route has no snapshots but scanner never monitored it -> UNMONITORED, not VERIFIED_EMPTY', () => {
  const result = evaluateRouteCoverageScope({
    hasSnapshots: false,
    scannerMonitored: false
  });
  assert.equal(result.status, 'UNMONITORED');
  assert.equal(result.isVerifiedEmpty, false);
  assert.match(result.reason, /UNMONITORED, not VERIFIED_EMPTY/);
});

// PS35-10: Snapshot exists for route, not requested date window
test('PS35-10: Snapshot exists for route, not requested date window -> exact query scope remains unmonitored', () => {
  const result = evaluateDateWindowCoverageScope({
    snapshotDates: ['2026-11-01', '2026-11-02'],
    requestedDate: '2026-12-15'
  });
  assert.equal(result.status, 'UNMONITORED_WINDOW');
  assert.equal(result.isMonitored, false);
  assert.match(result.reason, /exact query scope remains unmonitored/);
});

// PS35-11: Edge health is fresh but data source rights missing
test('PS35-11: Edge health is fresh but data source rights missing -> source excluded from authorized production claims', () => {
  const result = evaluateSourceProductionAuthorization({
    edgeFresh: true,
    hasRedistributionRights: false
  });
  assert.equal(result.isSourceProductionAuthorized, false);
  assert.match(result.reason, /source excluded from authorized production claims/);
});

// PS35-12: A scheduled GitHub workflow tests main while latest application implementation exists on another branch
test('PS35-12: A scheduled GitHub workflow tests main while latest application implementation exists on another branch -> separate branch status', () => {
  const result = evaluateWorkflowBranchProvenance({
    workflowBranch: 'main',
    appImplementationBranch: 'antigravity/farely-v12-product-convergence',
    workflowSha: '084025b1f58a98655222ee4f8fc82461b286dd6a',
    appSha: 'dfc4ad10cf43afc4f8adcd73718ecfbdc72c0b78'
  });
  assert.equal(result.isProductionRunningPR, false);
  assert.equal(result.branchStatus, 'SEPARATE_BRANCH_PROVENANCE');
});

// PS35-13: Production smoke job is green but Watch scheduler has no actual coverage
test('PS35-13: Production smoke job is green but Watch scheduler has no actual coverage -> Watch reliability gate fails', () => {
  const result = evaluateWatchReliabilityWithCoverage({
    smokeJobGreen: true,
    activeWatchCount: 12,
    scannedWatchCount: 0
  });
  assert.equal(result.watchReliabilityGate, 'FAIL');
  assert.match(result.reason, /Watch reliability gate fails/);
});

// PS35-14: Public frontend is accessible but no qualified opportunity or honest degraded explanation exists
test('PS35-14: Public frontend is accessible but no qualified opportunity or honest degraded explanation exists -> product journey incomplete', () => {
  const result = evaluateProductJourneyAcceptance({
    frontendHttp200: true,
    qualifiedOpportunitiesCount: 0,
    hasHonestDegradedNotice: false
  });
  assert.equal(result.status, 'PRODUCT_JOURNEY_INCOMPLETE');
  assert.equal(result.passesAcceptance, false);
});

// PS35-15: Anonymous security smoke returns HTTP 200 []
test('PS35-15: Anonymous security smoke returns HTTP 200 [] -> narrow anonymous boundary only, not full RLS proven', () => {
  const result = evaluateSecuritySmokeProofLevel({
    anonymousGetStatus: 200,
    anonymousDataLength: 0,
    hasAuthenticatedRlsTestSuite: false
  });
  assert.equal(result.anonymousBoundaryVerified, true);
  assert.equal(result.fullRlsSecurityProven, false);
  assert.equal(result.proofLevel, 'NARROW_ANONYMOUS_BOUNDARY_ONLY');
});

// PS35-16: Legacy live deals table has zero rows while observed-fare snapshots contain scoped historical data
test('PS35-16: Legacy live deals table has zero rows while observed-fare snapshots contain scoped historical data -> no conflation', () => {
  const result = distinguishReadModels({
    legacyDealsRowCount: 0,
    observedFareSnapshotsCount: 420
  });
  assert.equal(result.distinctModels, true);
  assert.equal(result.conflated, false);
  assert.equal(result.legacyDealsRowCount, 0);
  assert.equal(result.observedFareSnapshotsCount, 420);
});

// PS35-17: A newer production smoke run exists but investigator cites only October 8 historical failure as current
test('PS35-17: A newer production smoke run exists but investigator cites only October 8 historical failure -> evidence freshness fails', () => {
  const result = evaluateEvidenceFreshness({
    citedRunTimestamp: '2026-10-08T10:36:15Z',
    latestRunTimestamp: '2026-10-16T10:00:32Z',
    citedRunId: '37811791024',
    latestRunId: '38867341355'
  });
  assert.equal(result.isFresh, false);
  assert.match(result.reason, /evidence freshness fails/);
});

// PS35-18: A workflow is made green by removing release, provider, coverage or negative checks
test('PS35-18: A workflow is made green by removing release, provider, coverage or negative checks -> semantic integrity FAIL', () => {
  const badWorkflow = `
    name: Production Smoke
    jobs:
      smoke:
        steps:
          - run: echo "all green without checks"
  `;
  const result = evaluateWorkflowSemanticIntegrity({
    workflowContent: badWorkflow,
    requiredGates: [
      'Check observed-fare freshness and release identity',
      'production-truth.mjs',
      'security-smoke.mjs'
    ]
  });
  assert.equal(result.semanticIntegrity, 'FAIL');
  assert.equal(result.missingGates?.length, 3);
  assert.match(result.reason, /acceptance-semantic integrity FAIL/);
});
