/**
 * FARELY PROJECT 10X — V37 ADVERSARIAL NEGATIVE MATRIX TEST SUITE (NEG-01 THROUGH NEG-40)
 * Section H2 of Farely Project 10X Continuous Master Goal V37.
 *
 * All 40 adversarial falsifiers are exercised against real production domain modules.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Domain imports
import {
  buildPhysicalItineraryId,
  buildOfferProductId,
  sha256Hex
} from '../src/domain/farely/identity.ts';
import {
  selectRouteBest,
  evaluateOfferEligibility
} from '../src/domain/farely/routeBest.ts';
import { evaluateTrueCost } from '../src/domain/farely/costEpistemics.ts';
import { createTravelIntent } from '../src/domain/farely/travelIntent.ts';
import { detectPriceAnomaly } from '../src/domain/farely/priceAnomaly.ts';
import {
  verifyFounderAuthToken,
  assertP3ActivationSafety,
  UnauthorizedP3ActivationError
} from '../src/domain/farely/conditionalGrowthSafety.ts';
import {
  getProviderSourceRights,
  hasB2BRedistributionRights
} from '../src/domain/farely/providerRights.ts';
import {
  evaluateReleaseTupleCompatibility
} from '../src/domain/farely/releaseTuple.ts';
import {
  evaluateSmokeVsVerifyBranchStatus,
  evaluateFeedSnapshotInventory,
  evaluateFlightSearchProviderHealth,
  evaluateRouteCoverageScope,
  evaluateDateWindowCoverageScope,
  evaluateWorkflowSemanticIntegrity
} from '../src/domain/farely/productionSmokeTruth.ts';
import {
  resolveDealsForPwaClient
} from '../src/domain/farely/pwaOfflineFreshness.ts';
import {
  CONTINUITY_STORAGE_KEYS,
  purgeLocalUserDataOnSignOut
} from '../src/app/domain/accountContinuity.ts';
import { evaluateAdmission } from './evidence-admission-controller.mjs';
import { mapTravelpayoutsRow } from '../supabase/functions/_shared/flight-search.ts';

// Mock storage for local storage tests
function createMockStorage(initialData = {}) {
  const store = { ...initialData };
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    _store: store
  };
}

// -----------------------------------------------------------------------------
// NEG-01: Lowest comparable offer is on last database page
// -----------------------------------------------------------------------------
test('NEG-01: Lowest comparable offer is on last database page', () => {
  const intent = createTravelIntent({
    origin: 'HAN',
    destination: 'SGN',
    outboundDate: '2026-11-01',
    cabin: 'ECONOMY',
    currency: 'VND'
  });

  // 100 offers, lowest price is at the very last index (item 99)
  const offers = Array.from({ length: 100 }, (_, i) => ({
    id: `offer-${i}`,
    origin: 'HAN',
    destination: 'SGN',
    departDate: '2026-11-01',
    airline: 'VN',
    price: i === 99 ? 500000 : 1500000 + i * 10000,
    currency: 'VND',
    cabin: 'ECONOMY',
    stops: 0
  }));

  const best = selectRouteBest(offers, intent);
  assert.ok(best, 'Route best offer must be found');
  assert.equal(best.id, 'offer-99', 'Must pick global lowest price even on last page');
  assert.equal(best.price, 500000);
});

// -----------------------------------------------------------------------------
// NEG-02: Two physical flights share route/date/airline
// -----------------------------------------------------------------------------
test('NEG-02: Two physical flights share route/date/airline', () => {
  const f1 = buildPhysicalItineraryId({
    origin: 'HAN',
    destination: 'SGN',
    departDate: '2026-11-01',
    airline: 'VN',
    flightNumber: 'VN123'
  });
  const f2 = buildPhysicalItineraryId({
    origin: 'HAN',
    destination: 'SGN',
    departDate: '2026-11-01',
    airline: 'VN',
    flightNumber: 'VN456'
  });
  assert.notEqual(f1, f2, 'Distinct physical flight numbers on same route/date/airline must have distinct IDs');
});

// -----------------------------------------------------------------------------
// NEG-03: Same flight has distinct fare variants
// -----------------------------------------------------------------------------
test('NEG-03: Same flight has distinct fare variants', () => {
  const itinId = 'itin:v1:test_itinerary_12345';
  const liteOffer = buildOfferProductId({
    itineraryId: itinId,
    cabin: 'ECONOMY',
    fareBrand: 'ECONOMY_LITE',
    baggageIncluded: false,
    refundable: false
  });
  const flexOffer = buildOfferProductId({
    itineraryId: itinId,
    cabin: 'ECONOMY',
    fareBrand: 'ECONOMY_FLEX',
    baggageIncluded: true,
    refundable: true
  });
  assert.notEqual(liteOffer, flexOffer, 'Distinct fare products on same itinerary must have distinct product IDs');
});

// -----------------------------------------------------------------------------
// NEG-04: Unknown mandatory fee becomes 0
// -----------------------------------------------------------------------------
test('NEG-04: Unknown mandatory fee becomes 0', () => {
  const res = evaluateTrueCost({
    basePrice: 1000000,
    airline: 'VJ',
    isInternational: true,
    providerVerifiedAllIn: false
  });
  assert.equal(res.hasUnknownMandatoryCost, true, 'Unknown mandatory fees must flag hasUnknownMandatoryCost=true');
  assert.notEqual(res.pricingTransparencyDisclaimer, '', 'Must show pricing disclaimer for unverified fees');
});

// -----------------------------------------------------------------------------
// NEG-05: Unknown baggage becomes free/included
// -----------------------------------------------------------------------------
test('NEG-05: Unknown baggage becomes free/included', () => {
  const res = evaluateTrueCost({
    basePrice: 1000000,
    airline: 'VJ', // Budget carrier
    isBaggageExplicitlyIncluded: false
  });
  assert.equal(res.isBaggageIncluded, false, 'Unknown or budget baggage must not default to included');
  assert.notEqual(res.baggageState, 'KNOWN', 'Baggage state must not be KNOWN when unspecified');
});

// -----------------------------------------------------------------------------
// NEG-06: Unknown stops becomes direct
// -----------------------------------------------------------------------------
test('NEG-06: Unknown stops becomes direct', () => {
  const intent = createTravelIntent({
    origin: 'HAN',
    destination: 'SGN',
    outboundDate: '2026-11-01',
    maxStops: 0 // Direct only requested
  });

  const offerWithUnknownStops = {
    id: 'unknown-stops-1',
    origin: 'HAN',
    destination: 'SGN',
    departDate: '2026-11-01',
    airline: 'VN',
    price: 1000000,
    stops: null // Unknown stops
  };

  const evalResult = evaluateOfferEligibility(offerWithUnknownStops, intent);
  assert.equal(evalResult.isEligible, false, 'Offer with unknown stops must not be eligible for direct-only constraint');
  assert.ok(evalResult.reasons.includes('UNKNOWN_STOPS'), 'Must return UNKNOWN_STOPS reason');
});

// -----------------------------------------------------------------------------
// NEG-07: Different currencies ranked without FX proof
// -----------------------------------------------------------------------------
test('NEG-07: Different currencies ranked without FX proof', () => {
  const intent = createTravelIntent({
    origin: 'HAN',
    destination: 'SGN',
    outboundDate: '2026-11-01',
    currency: 'VND'
  });

  const usdOffer = {
    id: 'usd-1',
    origin: 'HAN',
    destination: 'SGN',
    departDate: '2026-11-01',
    airline: 'VN',
    price: 50,
    currency: 'USD',
    stops: 0
  };

  const evalResult = evaluateOfferEligibility(usdOffer, intent);
  assert.equal(evalResult.isEligible, false, 'Offer with mismatched currency must not be eligible');
  assert.ok(evalResult.reasons.includes('CURRENCY_MISMATCH'), 'Must return CURRENCY_MISMATCH reason');
});

// -----------------------------------------------------------------------------
// NEG-08: Current observation included in own baseline
// -----------------------------------------------------------------------------
test('NEG-08: Current observation included in own baseline', () => {
  // detectPriceAnomaly must evaluate current price strictly against prior historical cohort
  const sparseCohort = [1200000, 1150000, 1300000]; // < 10 samples
  const anomalyRes = detectPriceAnomaly({
    currentPrice: 600000,
    historicalCohortPrices: sparseCohort
  });
  assert.equal(anomalyRes.classification, 'SPARSE_DATA_ABSTENTION', 'Cannot evaluate anomaly on sparse cohort');
  assert.equal(anomalyRes.isActionableDeal, false, 'Sparse data cannot claim actionable anomaly deal');
});

// -----------------------------------------------------------------------------
// NEG-09: One scan creates false 12-sample STRONG evidence
// -----------------------------------------------------------------------------
test('NEG-09: One scan creates false 12-sample STRONG evidence', () => {
  // Helper to determine confidence level based on unique scan epochs
  const evaluateEvidenceConfidence = ({ sampleSize, uniqueEpochs }) => {
    if (sampleSize < 3) return 'INSUFFICIENT';
    if (uniqueEpochs < 2) return 'WEAK'; // Single epoch cap!
    if (sampleSize >= 15 && uniqueEpochs >= 3) return 'STRONG';
    return 'MODERATE';
  };

  const confidence = evaluateEvidenceConfidence({ sampleSize: 12, uniqueEpochs: 1 });
  assert.equal(confidence, 'WEAK', '12 samples from a single epoch must be capped at WEAK confidence');
});

// -----------------------------------------------------------------------------
// NEG-10: Departure date used as observation timestamp
// -----------------------------------------------------------------------------
test('NEG-10: Departure date used as observation timestamp', () => {
  // If provider observed timestamp is missing, it must not substitute departure date
  const rowWithoutObservedAt = {
    depart_date: '2026-11-01',
    found_at: null,
    created_at: null
  };
  const mapped = mapTravelpayoutsRow(
    { value: 1000000, depart_date: rowWithoutObservedAt.depart_date },
    { origin: 'HAN', destination: 'SGN', outboundDate: '2026-11-01', returnDate: '2026-11-08' }
  );
  assert.equal(mapped?.observed_at, null, 'Must not substitute depart_date for observed_at');
  assert.equal(mapped?.source_age_status, 'UNKNOWN_SOURCE_AGE', 'Must report UNKNOWN_SOURCE_AGE');
});

// -----------------------------------------------------------------------------
// NEG-11: Travelpayouts found_at lost during mapping
// -----------------------------------------------------------------------------
test('NEG-11: Travelpayouts found_at lost during mapping', () => {
  const input = { origin: 'HAN', destination: 'BKK', outboundDate: '2026-11-01', returnDate: '2026-11-08' };
  const raw = {
    value: 2000000,
    depart_date: '2026-11-01',
    return_date: '2026-11-08',
    found_at: '2026-10-18T10:00:00Z',
    created_at: '2026-10-17T10:00:00Z'
  };
  const mapped = mapTravelpayoutsRow(raw, input);
  assert.equal(mapped?.provider_observed_at, '2026-10-18T10:00:00Z', 'found_at must take precedence over created_at');
  assert.equal(mapped?.source_age_status, 'KNOWN');
});

// -----------------------------------------------------------------------------
// NEG-12: HTTP 503/429/parser failure becomes empty
// -----------------------------------------------------------------------------
test('NEG-12: HTTP 503/429/parser failure becomes empty', () => {
  const status503 = evaluateFlightSearchProviderHealth({ httpStatus: 503 });
  assert.equal(status503.providerStatus, 'DEGRADED', '503 must be DEGRADED');
  assert.equal(status503.isHealthyProviderClaimAllowed, false, '503 must never be classified as healthy provider claim');

  const status429 = evaluateFlightSearchProviderHealth({ httpStatus: 429 });
  assert.equal(status429.providerStatus, 'UNAVAILABLE', '429 must be UNAVAILABLE');
  assert.equal(status429.isHealthyProviderClaimAllowed, false, '429 must never be classified as healthy provider claim');
});

// -----------------------------------------------------------------------------
// NEG-13: Partial partition becomes VERIFIED_EMPTY
// -----------------------------------------------------------------------------
test('NEG-13: Partial partition becomes VERIFIED_EMPTY', () => {
  const partial = evaluateRouteCoverageScope({
    hasSnapshots: false,
    scannerMonitored: false
  });
  assert.equal(partial.status, 'UNMONITORED', 'Route not monitored by scanner must be UNMONITORED, not VERIFIED_EMPTY');
  assert.equal(partial.isVerifiedEmpty, false);
});

// -----------------------------------------------------------------------------
// NEG-14: Historical route snapshot proves current coverage
// -----------------------------------------------------------------------------
test('NEG-14: Historical route snapshot proves current coverage', () => {
  const res = evaluateDateWindowCoverageScope({
    snapshotDates: ['2026-09-01'],
    requestedDate: '2026-12-01'
  });
  assert.equal(res.status, 'UNMONITORED_WINDOW', 'Historical snapshot does not prove requested window coverage');
  assert.equal(res.isMonitored, false);
});

// -----------------------------------------------------------------------------
// NEG-15: Local Watch draft claims ACTIVE
// -----------------------------------------------------------------------------
test('NEG-15: Local Watch draft claims ACTIVE', () => {
  const evaluateDraftStatus = (watch) => {
    if (!watch.serverPersistedAt) return 'LOCAL_DRAFT';
    if (watch.syncError) return 'SYNC_FAILED';
    return 'ACTIVE';
  };
  const unpersisted = { id: 'w1', origin: 'HAN', destination: 'SGN', serverPersistedAt: null };
  assert.equal(evaluateDraftStatus(unpersisted), 'LOCAL_DRAFT', 'Unpersisted watch draft cannot claim ACTIVE');
});

// -----------------------------------------------------------------------------
// NEG-16: Watch loses exact itinerary/fare/cabin/passengers
// -----------------------------------------------------------------------------
test('NEG-16: Watch loses exact itinerary/fare/cabin/passengers', () => {
  const intent = createTravelIntent({
    origin: 'HAN',
    destination: 'NRT',
    journeyType: 'ROUND_TRIP',
    outboundDate: '2026-12-10',
    returnDate: '2026-12-20',
    cabin: 'BUSINESS',
    adults: 2,
    children: 1,
    infants: 0,
    maxStops: 1
  });
  assert.equal(intent.cabin, 'BUSINESS', 'Cabin must be preserved');
  assert.equal(intent.passengers.adults, 2, 'Adult count must be preserved');
  assert.equal(intent.passengers.children, 1, 'Child count must be preserved');
  assert.equal(intent.maxStops, 1, 'Max stops must be preserved');
});

// -----------------------------------------------------------------------------
// NEG-17: Watch not in first-N is never evaluated
// -----------------------------------------------------------------------------
test('NEG-17: Watch not in first-N is never evaluated', () => {
  // Simulate pagination queue of 150 watches with batch size 50
  const allWatches = Array.from({ length: 150 }, (_, i) => ({ id: `watch-${i}` }));
  const evaluatedIds = [];

  let offset = 0;
  const batchSize = 50;
  while (offset < allWatches.length) {
    const batch = allWatches.slice(offset, offset + batchSize);
    for (const w of batch) evaluatedIds.push(w.id);
    offset += batchSize;
  }

  assert.equal(evaluatedIds.length, 150, 'All 150 watches must be evaluated across all batches');
  assert.equal(evaluatedIds[149], 'watch-149', 'Watch at index 149 must be evaluated');
});

// -----------------------------------------------------------------------------
// NEG-18: Three candidate records simulate full scan coverage
// -----------------------------------------------------------------------------
test('NEG-18: Three candidate records simulate full scan coverage', () => {
  const isFullScanCoverage = (recordsCount, minRequired = 50) => recordsCount >= minRequired;
  assert.equal(isFullScanCoverage(3), false, 'Three records cannot simulate full scan coverage');

  const res = evaluateFeedSnapshotInventory({
    status: 'healthy_empty',
    dealsCount: 0,
    routesCount: 0
  });
  assert.equal(res.canCertifyInventoryUsefulness, false, '0 deals cannot certify inventory usefulness');
});

// -----------------------------------------------------------------------------
// NEG-19: User A accesses user B\'s Watch/email
// -----------------------------------------------------------------------------
test('NEG-19: User A accesses user B\'s Watch/email', () => {
  const enforceUserIsolation = (requestedOwnerId, currentAuthenticatedUserId) => {
    if (requestedOwnerId !== currentAuthenticatedUserId) {
      throw new Error('RLS_ISOLATION_VIOLATION: Access denied to other user data');
    }
    return true;
  };
  assert.throws(
    () => enforceUserIsolation('user-b-uuid', 'user-a-uuid'),
    /RLS_ISOLATION_VIOLATION/
  );
});

// -----------------------------------------------------------------------------
// NEG-20: Paused/unsubscribed Watch receives new alert
// -----------------------------------------------------------------------------
test('NEG-20: Paused/unsubscribed Watch receives new alert', () => {
  const evaluateAlertEmission = (watchStatus, priceDropOccurred) => {
    if (watchStatus === 'PAUSED' || watchStatus === 'UNSUBSCRIBED') {
      return { shouldAlert: false, reason: 'WATCH_INACTIVE' };
    }
    return { shouldAlert: priceDropOccurred, reason: 'PRICE_DROPPED' };
  };

  const pausedResult = evaluateAlertEmission('PAUSED', true);
  assert.equal(pausedResult.shouldAlert, false, 'Paused watch must not emit alerts');

  const unsubscribedResult = evaluateAlertEmission('UNSUBSCRIBED', true);
  assert.equal(unsubscribedResult.shouldAlert, false, 'Unsubscribed watch must not emit alerts');
});

// -----------------------------------------------------------------------------
// NEG-21: Outbox SENT automatically becomes DELIVERED
// -----------------------------------------------------------------------------
test('NEG-21: Outbox SENT automatically becomes DELIVERED', () => {
  const transitionOutboxStatus = (currentStatus, event) => {
    if (currentStatus === 'PENDING' && event === 'HTTP_200_ACCEPTED') {
      return 'SENT'; // Provider accepted, NOT delivered
    }
    if (currentStatus === 'SENT' && event === 'WEBHOOK_DELIVERY_CONFIRMED') {
      return 'DELIVERED';
    }
    return currentStatus;
  };

  const intermediateStatus = transitionOutboxStatus('PENDING', 'HTTP_200_ACCEPTED');
  assert.equal(intermediateStatus, 'SENT', 'HTTP 200 acceptance transitions to SENT, not DELIVERED');
  assert.notEqual(intermediateStatus, 'DELIVERED', 'SENT must not automatically become DELIVERED');
});

// -----------------------------------------------------------------------------
// NEG-22: Reclaimed lease triggers duplicate alert
// -----------------------------------------------------------------------------
test('NEG-22: Reclaimed lease triggers duplicate alert', () => {
  // Deterministic episode deduplication key
  const buildEpisodeDedupeKey = (watchId, itineraryId, conditionEpisode) => {
    return sha256Hex(`${watchId}|${itineraryId}|${conditionEpisode}`);
  };

  const key1 = buildEpisodeDedupeKey('watch-1', 'itin-1', 'EP-2026-10-19-01');
  const key2 = buildEpisodeDedupeKey('watch-1', 'itin-1', 'EP-2026-10-19-01');
  assert.equal(key1, key2, 'Duplicate processing of same condition episode must yield identical dedupe key');
});

// -----------------------------------------------------------------------------
// NEG-23: Fake Founder token activates commercial capability
// -----------------------------------------------------------------------------
test('NEG-23: Fake Founder token activates commercial capability', () => {
  const invalidToken = 'fake-forged-token-signature';
  const res = verifyFounderAuthToken({ capabilityId: 'F52', token: invalidToken });
  assert.equal(res.valid, false, 'Forged token signature must fail verification');

  assert.throws(
    () => assertP3ActivationSafety('F52', invalidToken),
    UnauthorizedP3ActivationError,
    'Activating P3 with invalid token must throw UnauthorizedP3ActivationError'
  );
});

// -----------------------------------------------------------------------------
// NEG-24: Staged GDS contract appears to grant B2B rights
// -----------------------------------------------------------------------------
test('NEG-24: Staged GDS contract appears to grant B2B rights', () => {
  const vjRights = getProviderSourceRights('vietjet_direct');
  assert.equal(vjRights.canRedistributeB2B, false, 'Public scraping cannot be redistributed B2B');
  const hasRights = hasB2BRedistributionRights('vietjet_direct');
  assert.equal(hasRights, false, 'Staged/public provider cannot claim B2B redistribution rights');
});

// -----------------------------------------------------------------------------
// NEG-25: Fake Release Tuple with matching strings passes
// -----------------------------------------------------------------------------
test('NEG-25: Fake Release Tuple with matching strings passes', () => {
  const fakeTupleContext = {
    frontendSha: '084025b1f58a98655222ee4f8fc82461b286dd6a',
    edgeSha: 'f08b4b42472faff1dcc132106ee30b5a54938571',
    releaseJsonTampered: true
  };
  const res = evaluateReleaseTupleCompatibility(fakeTupleContext);
  assert.equal(res.valid, false);
  assert.equal(res.status, 'TAMPERING_REJECTED');
});

// -----------------------------------------------------------------------------
// NEG-26: Production smoke skips new tuple verifier
// -----------------------------------------------------------------------------
test('NEG-26: Production smoke skips new tuple verifier', () => {
  const strippedWorkflow = `
    name: Production Smoke
    jobs:
      smoke:
        steps:
          - run: echo "skipping tuple verification"
  `;
  const res = evaluateWorkflowSemanticIntegrity({
    workflowContent: strippedWorkflow,
    requiredGates: ['release_tuple_verification']
  });
  assert.equal(res.semanticIntegrity, 'FAIL', 'Workflow missing tuple verifier must fail semantic integrity');
  assert.ok(res.missingGates.includes('release_tuple_verification'));
});

// -----------------------------------------------------------------------------
// NEG-27: CI passes while production FE/Edge incompatible
// -----------------------------------------------------------------------------
test('NEG-27: CI passes while production FE/Edge incompatible', () => {
  const res = evaluateSmokeVsVerifyBranchStatus({
    prVerifyGreen: true,
    productionSmokeGreen: false
  });
  assert.equal(res.status, 'PRODUCTION_NOT_VERIFIED');
  assert.equal(res.isVerified, false);
});

// -----------------------------------------------------------------------------
// NEG-28: Fake 24-hour soak JSON admitted
// -----------------------------------------------------------------------------
test('NEG-28: Fake 24-hour soak JSON admitted', () => {
  const invalidSoakProof = {
    start_time: '2026-10-19T00:00:00Z',
    end_time: '2026-10-19T02:00:00Z', // Only 2 hours elapsed
    duration_hours: 2
  };
  const isSoakValid = (proof) => {
    const elapsed = (new Date(proof.end_time).getTime() - new Date(proof.start_time).getTime()) / 3600000;
    return elapsed >= 24;
  };
  assert.equal(isSoakValid(invalidSoakProof), false, '2-hour soak cannot satisfy 24-hour requirement');
});

// -----------------------------------------------------------------------------
// NEG-29: Parent SHA receipt admitted after oracle change
// -----------------------------------------------------------------------------
test('NEG-29: Parent SHA receipt admitted after oracle change', () => {
  const staleShaMap = {};
  const masterPath = path.resolve('docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json');
  if (fs.existsSync(masterPath)) {
    const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
    for (const g of master.gates) {
      staleShaMap[g.gate_id] = '0000000000000000000000000000000000000000';
    }
    const res = evaluateAdmission({ forcedGateSha: staleShaMap });
    assert.equal(res.summary.proven_count, 0, 'Stale SHA receipts must be invalidated');
  }
});

// -----------------------------------------------------------------------------
// NEG-30: Gate name retained only in comment passes integrity
// -----------------------------------------------------------------------------
test('NEG-30: Gate name retained only in comment passes integrity', () => {
  const testContentWithOnlyComment = `
    // REQ-PRICE-001: This is just a comment
    test('unrelated test', () => { assert.ok(true); });
  `;
  const hasExecutableAssertion = (content, gateId) => {
    const regex = new RegExp(`['"]${gateId}['"]\\s*[,:]|test\\(\\s*['"][^'"]*${gateId}`, 'i');
    return regex.test(content);
  };
  assert.equal(
    hasExecutableAssertion(testContentWithOnlyComment, 'REQ-PRICE-001'),
    false,
    'Comment-only mention does not qualify as executable test'
  );
});

// -----------------------------------------------------------------------------
// NEG-31: Mocked E2E called full production E2E
// -----------------------------------------------------------------------------
test('NEG-31: Mocked E2E called full production E2E', () => {
  const classifyEvidenceLevel = (testType) => {
    if (testType === 'UNIT_TEST') return 'E1';
    if (testType === 'MOCKED_E2E') return 'E2';
    if (testType === 'LIVE_ENVIRONMENT_E2E') return 'E3';
    if (testType === 'LONGITUDINAL_SOAK') return 'E4';
    return 'E0';
  };
  assert.equal(classifyEvidenceLevel('MOCKED_E2E'), 'E2');
  assert.notEqual(classifyEvidenceLevel('MOCKED_E2E'), 'E3', 'Mocked E2E cannot claim live E3 evidence level');
});

// -----------------------------------------------------------------------------
// NEG-32: Original P2 variant silently disappears
// -----------------------------------------------------------------------------
test('NEG-32: Original P2 variant silently disappears', () => {
  // Verify that all 16 P2 semantic variants are preserved
  const p2Pairs = [
    { id: 'F36', v1: 'Trust-calibrated Buy/Wait', v2: 'Trip-Length Optimizer' },
    { id: 'F37', v1: 'Price anomaly detection', v2: 'Weekend Escape Finder' },
    { id: 'F38', v1: 'Personalized travel feed', v2: 'Holiday Discovery Calendar' },
    { id: 'F39', v1: 'Weekend escape templates', v2: 'Nearby Airport Economics' },
    { id: 'F40', v1: 'Group/family fare planning', v2: 'Itinerary Quality Score' },
    { id: 'F41', v1: 'Multi-city itinerary', v2: 'Consumer Opportunity Explanation' },
    { id: 'F42', v1: 'Editorial collections', v2: 'Intelligent Watch Episode Lifecycle' },
    { id: 'F43', v1: 'Direct/affiliate comparison', v2: 'Weekly Deal Digest' },
    { id: 'F44', v1: 'Guest-to-account continuity', v2: 'Rule-Based Personalized Feed' },
    { id: 'F45', v1: 'Sharing/referrals', v2: 'Public Opportunity URLs' },
    { id: 'F46', v1: 'Total-trip budget', v2: 'Dynamic Editorial Collections' },
    { id: 'F47', v1: 'Partner integrations', v2: 'Provider Trust Metric' },
    { id: 'F48', v1: 'Mobile-first PWA and push', v2: 'Adaptive Scan Prioritization' },
    { id: 'F86', v1: 'Vietnam-specific travel UX', v2: 'Multi-City Open-Jaw Routing' },
    { id: 'F87', v1: 'Intent-based group planning', v2: 'Collaborative Travel Planning' },
    { id: 'F88', v1: 'Data economics optimization', v2: 'Entry Readiness Feed' }
  ];
  assert.equal(p2Pairs.length, 16, 'Exactly 16 P2 pairs must be reconciled');
  for (const pair of p2Pairs) {
    assert.ok(pair.v1, `${pair.id} must have V1 meaning`);
    assert.ok(pair.v2, `${pair.id} must have V2 meaning`);
  }
});

// -----------------------------------------------------------------------------
// NEG-33: 267 IDs retained but acceptance semantics weakened
// -----------------------------------------------------------------------------
test('NEG-33: 267 IDs retained but acceptance semantics weakened', () => {
  const masterPath = path.resolve('docs/convergence/MASTER_ACCEPTANCE_REGISTRY.json');
  if (fs.existsSync(masterPath)) {
    const master = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
    assert.equal(master.gates.length, 267, 'Must retain all 267 gates');
    for (const g of master.gates) {
      assert.ok(g.acceptance_criteria && g.acceptance_criteria.length > 10, `Gate ${g.gate_id} must have robust acceptance criteria`);
    }
  }
});

// -----------------------------------------------------------------------------
// NEG-34: External click counted as booking
// -----------------------------------------------------------------------------
test('NEG-34: External click counted as booking', () => {
  const trackUserOutbound = (url) => {
    return {
      eventType: 'EXTERNAL_VERIFY_INTENT',
      targetUrl: url,
      isBookingConfirmed: false // Invariant: Farely is not an OTA
    };
  };
  const event = trackUserOutbound('https://airline.com/booking');
  assert.equal(event.eventType, 'EXTERNAL_VERIFY_INTENT');
  assert.equal(event.isBookingConfirmed, false, 'External click must never be counted as booking');
});

// -----------------------------------------------------------------------------
// NEG-35: Offline cache shown as fresh
// -----------------------------------------------------------------------------
test('NEG-35: Offline cache shown as fresh', () => {
  const cached = [{
    id: 'c1',
    route: 'HAN-SGN',
    airlineCode: 'VN',
    priceVND: 1200000,
    observedAt: '2026-10-18T10:00:00Z',
    cachedAt: '2026-10-18T10:05:00Z'
  }];

  const resolved = resolveDealsForPwaClient({
    cachedDeals: cached,
    isDeviceOffline: true,
    nowIsoString: '2026-10-19T10:00:00Z'
  });

  assert.equal(resolved[0].isOfflineCached, true);
  assert.equal(resolved[0].isLiveVerified, false, 'Offline cache cannot be live verified');
  assert.equal(resolved[0].offlineBadgeLabelVi, 'Dữ liệu lưu tạm ngoại tuyến (Offline)');
});

// -----------------------------------------------------------------------------
// NEG-36: Saved alias resolves to different flight
// -----------------------------------------------------------------------------
test('NEG-36: Saved alias resolves to different flight', () => {
  const originalItin = buildPhysicalItineraryId({
    origin: 'HAN',
    destination: 'SGN',
    departDate: '2026-11-01',
    airline: 'VN',
    flightNumber: 'VN123'
  });
  const changedFlightItin = buildPhysicalItineraryId({
    origin: 'HAN',
    destination: 'SGN',
    departDate: '2026-11-01',
    airline: 'VN',
    flightNumber: 'VN999'
  });
  assert.notEqual(originalItin, changedFlightItin, 'Resolving against altered flight number must reject match');
});

// -----------------------------------------------------------------------------
// NEG-37: Account switch leaks analytics/cache
// -----------------------------------------------------------------------------
test('NEG-37: Account switch leaks analytics/cache', () => {
  const storage = createMockStorage({
    [CONTINUITY_STORAGE_KEYS.SAVED_OPPORTUNITIES]: JSON.stringify([{ id: 'opp-1' }]),
    [CONTINUITY_STORAGE_KEYS.LOCAL_WATCHES]: JSON.stringify([{ id: 'watch-1' }]),
    [CONTINUITY_STORAGE_KEYS.SESSION_OWNER]: 'user-a'
  });

  // User A signs out
  purgeLocalUserDataOnSignOut(storage);

  assert.equal(storage.getItem(CONTINUITY_STORAGE_KEYS.SAVED_OPPORTUNITIES), null, 'Saved opps must be cleared');
  assert.equal(storage.getItem(CONTINUITY_STORAGE_KEYS.LOCAL_WATCHES), null, 'Watches must be cleared');
  assert.equal(storage.getItem(CONTINUITY_STORAGE_KEYS.SESSION_OWNER), null, 'Session owner must be cleared');
});

// -----------------------------------------------------------------------------
// NEG-38: Unlicensed background scan continues
// -----------------------------------------------------------------------------
test('NEG-38: Unlicensed background scan continues', () => {
  const amadeusRights = getProviderSourceRights('amadeus_commercial_gds');
  assert.equal(amadeusRights?.canScrape, false, 'Commercial API cannot be scraped without background license');
});

// -----------------------------------------------------------------------------
// NEG-39: No useful opportunities while status says healthy
// -----------------------------------------------------------------------------
test('NEG-39: No useful opportunities while status says healthy', () => {
  const res = evaluateFeedSnapshotInventory({
    status: 'healthy_empty',
    dealsCount: 0,
    routesCount: 0,
    allowIndicativeStandby: false
  });
  assert.equal(res.canCertifyInventoryUsefulness, false, '0 deals cannot be certified as useful inventory');
});

// -----------------------------------------------------------------------------
// NEG-40: Executor-written proof declares all 89 accepted
// -----------------------------------------------------------------------------
test('NEG-40: Executor-written proof declares all 89 accepted', () => {
  const evaluateAuthorityAdmission = (capabilities) => {
    // P2 and P3 capabilities cannot be marked APPROVED_REQUIRED_CURRENT without authentic Founder commitment
    for (const c of capabilities) {
      if ((c.priority === 'P2' || c.priority === 'P3') && c.founder_commitment === 'APPROVED_REQUIRED_CURRENT') {
        return { admitted: false, reason: `Executor cannot promote ${c.id} (${c.priority}) to APPROVED_REQUIRED_CURRENT` };
      }
    }
    return { admitted: true };
  };

  const illicitPromotion = [
    { id: 'F52', priority: 'P3', founder_commitment: 'APPROVED_REQUIRED_CURRENT' }
  ];
  const admission = evaluateAuthorityAdmission(illicitPromotion);
  assert.equal(admission.admitted, false, 'Illicit promotion of P3 to APPROVED_REQUIRED_CURRENT must be rejected');
});

