import test from 'node:test';
import assert from 'node:assert/strict';

// Production domain reference logic
function normalizeOption(option, context) {
  const firstLeg = option.flights?.[0];
  const price = option.price;
  const totalDuration = option.total_duration;

  if (!firstLeg?.flight_number || !firstLeg.airline || price == null || totalDuration == null) {
    return null;
  }
  if (!Number.isFinite(price) || !Number.isFinite(totalDuration)) {
    return null;
  }
  if (price <= 0 || totalDuration <= 0) {
    return null;
  }

  return {
    origin_code: context.origin_code,
    destination_code: context.destination_code,
    date: context.outbound_date,
    airline: firstLeg.airline,
    flight_number: firstLeg.flight_number.trim(),
    price,
    currency: 'VND',
    stops: option.layovers?.length ?? 0,
    timestamp: context.observed_at,
  };
}

function scoreObservation(price, cohortPrices, observationTime, now) {
  const comparison = cohortPrices.filter((p) => Number(p) > 0);
  if (comparison.length < 3) {
    // Insufficient baseline
    return {
      deal_score: 50,
      confidence_percent: Math.round((comparison.length / 12) * 100),
      deal_label: 'Giá quan sát',
      action: 'MONITOR',
      is_stale: false,
    };
  }

  const sorted = [...comparison].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const baseline = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  const discount = baseline > price ? Math.round(((baseline - price) / baseline) * 100) : 0;
  const confidence = Math.min(100, Math.round((comparison.length / 12) * 100));

  const diffMinutes = Math.max(0, Math.round((now.getTime() - observationTime.getTime()) / 60_000));
  const isStale = diffMinutes > 1440; // > 24 hours

  let dealScore = Math.min(100, Math.round(discount * 1.5 + confidence * 0.3));
  if (isStale) dealScore = Math.max(10, dealScore - 30);

  let label = 'Giá quan sát';
  if (confidence < 50) {
    label = discount >= 20 ? 'Giá đáng chú ý' : 'Giá quan sát';
  } else if (dealScore >= 90 && confidence >= 75) {
    label = 'Deal cực nóng';
  } else if (dealScore >= 80 && confidence >= 65) {
    label = 'Deal rất ngon';
  } else if (dealScore >= 70) {
    label = 'Deal ngon';
  } else if (dealScore >= 60) {
    label = 'Giá đáng chú ý';
  }

  let action = 'MONITOR';
  if (label === 'Deal cực nóng' || label === 'Deal rất ngon') {
    action = 'BUY_NOW';
  } else if (isStale) {
    action = 'WAIT_FOR_REFRESH';
  }

  return {
    baseline_price: baseline,
    discount_percent: discount,
    deal_score: dealScore,
    confidence_percent: confidence,
    deal_label: label,
    action,
    is_stale: isStale,
  };
}

test('Provider Contract Drift (Section 21): quarantines corrupt or non-finite records', () => {
  const context = {
    origin_code: 'HAN',
    destination_code: 'SGN',
    outbound_date: '2026-10-15',
    observed_at: new Date().toISOString(),
  };

  const corruptOptions = [
    { price: -500000, total_duration: 120, flights: [{ flight_number: 'VJ123', airline: 'VietJet' }] }, // negative price
    { price: NaN, total_duration: 120, flights: [{ flight_number: 'VJ123', airline: 'VietJet' }] }, // NaN price
    { price: Infinity, total_duration: 120, flights: [{ flight_number: 'VJ123', airline: 'VietJet' }] }, // Infinity price
    { price: 1200000, total_duration: 0, flights: [{ flight_number: 'VJ123', airline: 'VietJet' }] }, // zero duration
    { price: 1200000, total_duration: -60, flights: [{ flight_number: 'VJ123', airline: 'VietJet' }] }, // negative duration
    { price: 1200000, total_duration: 120, flights: [] }, // missing flight leg
    { price: 1200000, total_duration: 120, flights: [{ flight_number: '', airline: 'VietJet' }] }, // empty flight number
    { price: 1200000, total_duration: 120, flights: [{ flight_number: 'VJ123', airline: '' }] }, // empty airline
  ];

  for (const option of corruptOptions) {
    const res = normalizeOption(option, context);
    assert.equal(res, null, `Corrupt option must be quarantined: ${JSON.stringify(option)}`);
  }

  // Valid option passes cleanly
  const validOption = {
    price: 1250000,
    total_duration: 125,
    flights: [{ flight_number: 'VN210', airline: 'Vietnam Airlines' }],
    layovers: [],
  };
  const normalized = normalizeOption(validOption, context);
  assert.ok(normalized);
  assert.equal(normalized.price, 1250000);
  assert.equal(normalized.airline, 'Vietnam Airlines');
  assert.equal(normalized.stops, 0);
});

test('Claim Kill Switch (Section 23): collapses strong claims when evidence diminishes', () => {
  const now = new Date('2026-10-01T12:00:00Z');
  const freshTime = new Date('2026-10-01T11:30:00Z'); // 30m old
  const staleTime = new Date('2026-09-30T10:00:00Z'); // 26h old

  const richCohort = [2000000, 2100000, 2200000, 1950000, 2050000, 2150000, 2000000, 2250000, 2300000, 2100000, 2050000, 2150000];
  const sparseCohort = [2000000]; // 1 sample

  // 1. Rich evidence + high discount -> BUY_NOW / Deal cực nóng
  const strongDeal = scoreObservation(1000000, richCohort, freshTime, now);
  assert.equal(strongDeal.confidence_percent, 100);
  assert.ok(strongDeal.deal_score >= 80);
  assert.equal(strongDeal.action, 'BUY_NOW');

  // 2. Collapse sample size to 1 -> Claim Kill Switch MUST downgrade to MONITOR
  const sparseDeal = scoreObservation(1000000, sparseCohort, freshTime, now);
  assert.ok(sparseDeal.confidence_percent < 50);
  assert.notEqual(sparseDeal.deal_label, 'Deal cực nóng');
  assert.notEqual(sparseDeal.deal_label, 'Deal rất ngon');
  assert.equal(sparseDeal.action, 'MONITOR');

  // 3. Stale observation (> 24h) -> Claim Kill Switch MUST downgrade to WAIT_FOR_REFRESH
  const staleDeal = scoreObservation(1000000, richCohort, staleTime, now);
  assert.equal(staleDeal.is_stale, true);
  assert.equal(staleDeal.action, 'WAIT_FOR_REFRESH');
});

test('Claim Lineage Consistency (Section 15 & 16): full pipeline traces deterministically', () => {
  const now = new Date('2026-10-01T12:00:00Z');
  const observedTime = new Date('2026-10-01T11:45:00Z');

  const rawOption = {
    price: 1100000,
    total_duration: 120,
    flights: [{ flight_number: 'VJ135', airline: 'VietJet Air' }],
    layovers: [],
  };

  const context = {
    origin_code: 'HAN',
    destination_code: 'DAD',
    outbound_date: '2026-10-20',
    observed_at: observedTime.toISOString(),
  };

  // Stage 1: Ingestion & Normalization
  const normalized = normalizeOption(rawOption, context);
  assert.ok(normalized);
  assert.equal(normalized.price, 1100000);

  // Stage 2: Historical Cohort Lookup
  const historicalPrices = [1800000, 1750000, 1900000, 1850000, 1700000, 1800000, 1950000, 1850000, 1750000, 1800000];

  // Stage 3: Statistical Scoring & Evidence Gating
  const decision = scoreObservation(normalized.price, historicalPrices, observedTime, now);

  // Stage 4: Verify complete lineage properties
  assert.ok(decision.baseline_price > normalized.price);
  assert.ok(decision.discount_percent >= 35);
  assert.ok(decision.confidence_percent >= 75);
  assert.ok(decision.deal_score >= 80);
  assert.equal(decision.is_stale, false);
  assert.equal(decision.action, 'BUY_NOW');
});

test('Provider Contract Drift: whitespace normalization, flight number trimming, and multiple layover handling', () => {
  const context = {
    origin_code: 'HAN',
    destination_code: 'SIN',
    outbound_date: '2026-11-15',
    observed_at: '2026-11-01T08:00:00Z',
  };

  // 1. Untrimmed flight number
  const untrimmedOption = {
    price: 1800000,
    total_duration: 180,
    flights: [{ flight_number: '   SQ 175 \t ', airline: 'Singapore Airlines' }],
    layovers: [{ airport: 'KUL' }, { airport: 'BKK' }],
  };
  const normalized = normalizeOption(untrimmedOption, context);
  assert.ok(normalized);
  assert.equal(normalized.flight_number, 'SQ 175', 'Flight number must be trimmed');
  assert.equal(normalized.stops, 2, 'Stops must match layovers length');
  assert.equal(normalized.currency, 'VND');
  assert.equal(normalized.origin_code, 'HAN');
  assert.equal(normalized.destination_code, 'SIN');

  // 2. Omitted layovers property defaults stops to 0
  const noLayovers = {
    price: 1500000,
    total_duration: 120,
    flights: [{ flight_number: 'VN630', airline: 'Vietnam Airlines' }],
  };
  const normalizedNoLayovers = normalizeOption(noLayovers, context);
  assert.ok(normalizedNoLayovers);
  assert.equal(normalizedNoLayovers.stops, 0);

  // 3. Null flight leg within array fails closed
  const nullLegOption = {
    price: 1500000,
    total_duration: 120,
    flights: [null],
  };
  assert.equal(normalizeOption(nullLegOption, context), null);
});

test('Claim Kill Switch: edge-case pricing, negative discount suppression, and boundary score label transitions', () => {
  const now = new Date('2026-11-01T12:00:00Z');
  const freshTime = new Date('2026-11-01T11:45:00Z');

  // 1. Higher price than baseline: discount must be 0, never negative
  const standardCohort = [2000000, 2100000, 2200000];
  const higherPriceDeal = scoreObservation(2500000, standardCohort, freshTime, now);
  assert.equal(higherPriceDeal.baseline_price, 2100000);
  assert.equal(higherPriceDeal.discount_percent, 0, 'Discount cannot be negative');
  assert.equal(higherPriceDeal.deal_label, 'Giá quan sát');
  assert.equal(higherPriceDeal.action, 'MONITOR');

  // 2. Non-positive cohort values filtered out
  const dirtyCohort = [2000000, 0, -100000, 2100000, null, undefined, 2200000];
  const cleanedDeal = scoreObservation(1500000, dirtyCohort, freshTime, now);
  assert.equal(cleanedDeal.baseline_price, 2100000, 'Baseline must ignore non-positive values');
  assert.ok(cleanedDeal.discount_percent > 0);

  // 3. Cohort with only 2 positive items -> falls below 3-item threshold
  const twoItemCohort = [2000000, 2100000, -500000];
  const insufficientDeal = scoreObservation(1000000, twoItemCohort, freshTime, now);
  assert.equal(insufficientDeal.deal_score, 50);
  assert.equal(insufficientDeal.deal_label, 'Giá quan sát');
  assert.equal(insufficientDeal.action, 'MONITOR');

  // 4. Score label boundary transitions with high confidence (12 samples)
  const fullCohort = [2000000, 2000000, 2000000, 2000000, 2000000, 2000000, 2000000, 2000000, 2000000, 2000000, 2000000, 2000000];
  // baseline = 2,000,000, confidence = 100
  // discount = 50% -> dealScore = round(50 * 1.5 + 100 * 0.3) = 75 + 30 = 105 -> clamped to 100 -> 'Deal cực nóng', 'BUY_NOW'
  const hotDeal = scoreObservation(1000000, fullCohort, freshTime, now);
  assert.equal(hotDeal.deal_label, 'Deal cực nóng');
  assert.equal(hotDeal.action, 'BUY_NOW');

  // discount = 35% -> dealScore = round(35 * 1.5 + 30) = 53 + 30 = 83 -> 'Deal rất ngon', 'BUY_NOW'
  const veryGoodDeal = scoreObservation(1300000, fullCohort, freshTime, now);
  assert.equal(veryGoodDeal.deal_label, 'Deal rất ngon');
  assert.equal(veryGoodDeal.action, 'BUY_NOW');

  // discount = 28% -> dealScore = round(28 * 1.5 + 30) = 42 + 30 = 72 -> 'Deal ngon', 'MONITOR'
  const goodDeal = scoreObservation(1440000, fullCohort, freshTime, now);
  assert.equal(goodDeal.deal_label, 'Deal ngon');
  assert.equal(goodDeal.action, 'MONITOR');
});

test('Provider Drift & Scoring Performance Benchmark: 5,000 normalize and score cycles run under latency budget', () => {
  const context = {
    origin_code: 'HAN',
    destination_code: 'DAD',
    outbound_date: '2026-11-20',
    observed_at: '2026-11-01T10:00:00Z',
  };
  const option = {
    price: 900000,
    total_duration: 120,
    flights: [{ flight_number: 'VN123', airline: 'Vietnam Airlines' }],
    layovers: [],
  };
  const cohort = [
    1800000, 1850000, 1900000, 1750000, 1800000, 1950000,
    1800000, 1850000, 1900000, 1750000, 1800000, 1950000,
  ];
  const now = new Date('2026-11-01T12:00:00Z');
  const obsTime = new Date('2026-11-01T10:00:00Z');

  const start = performance.now();
  const iterations = 5000;

  for (let i = 0; i < iterations; i++) {
    const norm = normalizeOption(option, context);
    const score = scoreObservation(norm.price, cohort, obsTime, now);
    assert.equal(score.action, 'BUY_NOW');
  }

  const duration = performance.now() - start;
  // 5,000 cycles should finish in under 100ms
  assert.ok(duration < 100, `Benchmark took ${duration.toFixed(2)}ms, expected < 100ms`);
});
