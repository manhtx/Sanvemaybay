import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { evidenceGatedDealLabel, sanitizeBookingUrl, runGoldenCorpus } from './golden-corpus-runner.mjs';

const corpusPath = path.join(process.cwd(), 'docs', 'convergence', 'GOLDEN_DATASET_V1.json');

test('golden truth corpus: dataset structure integrity (20 curated cases exist with required fields)', () => {
  assert.equal(fs.existsSync(corpusPath), true, 'GOLDEN_DATASET_V1.json must exist');

  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
  assert.equal(corpus.cases.length, 20, 'Expected exactly 20 curated truth cases');
  assert.ok(Array.isArray(corpus.cases), 'corpus cases must be an array');
});

test('golden truth corpus: discount calculation and evidence-gated deal labeling (cases 01, 10, 11)', () => {
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));

  // Case 01: Normal direct flight
  const c1 = corpus.cases[0];
  assert.equal(c1.case_id, 'case_01_normal_direct');
  const discount1 = Math.round(((c1.input.history_median_price - c1.input.price) / c1.input.history_median_price) * 100);
  assert.equal(discount1, 32);
  const label1 = evidenceGatedDealLabel(78, 85);
  assert.equal(label1, 'Deal ngon');

  // Case 10: Strong legitimate discount
  const c10 = corpus.cases[9].case_10_strong_legitimate_discount;
  assert.equal(c10.expected.label, 'TOP_DEAL');
  const label10 = evidenceGatedDealLabel(92, 85);
  assert.equal(label10, 'Deal cực nóng');

  // Case 11: Weak discount
  const c11 = corpus.cases[10].case_11_weak_discount;
  assert.equal(c11.expected.label, 'STANDARD_PRICE');
  const label11 = evidenceGatedDealLabel(55, 70);
  assert.equal(label11, 'Giá quan sát');
});

test('golden truth corpus: baggage and cost monotonicity invariants (cases 06, 07)', () => {
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));

  // Case 06: Baggage excluded -> allIn must be >= base
  const c6 = corpus.cases[5].case_06_baggage_excluded;
  const base6 = c6.input.price;
  const allIn6 = base6 + (c6.input.baggage_fee || 0);
  assert.ok(allIn6 >= base6, 'Adding baggage must never decrease total cost');
  assert.equal(allIn6, 130);

  // Case 07: Baggage included -> allIn equals base
  const c7 = corpus.cases[6].case_07_baggage_included;
  assert.equal(c7.input.price, c7.expected.all_in_price, 'When baggage is included, all_in_price must equal input price');
});

test('golden truth corpus: tiny sample confidence capping prevents false hot labels (case 12)', () => {
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));

  const c12 = corpus.cases[11].case_12_large_discount_tiny_sample;
  assert.equal(c12.expected.claim_capped, true);
  const lowConfidence = 30; // capped due to N=1
  const score12 = 95; // apparent huge discount
  const label12 = evidenceGatedDealLabel(score12, lowConfidence);
  assert.notEqual(label12, 'Deal cực nóng', 'Tiny sample must NEVER be labeled Deal cực nóng');
  assert.notEqual(label12, 'Deal rất ngon', 'Tiny sample must NEVER be labeled Deal rất ngon');
  assert.equal(label12, 'Giá đáng chú ý', 'Capped label applies under low confidence');
});

test('golden truth corpus: temporal boundaries and stale fare detection (cases 13, 18)', () => {
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));

  // Case 13: Stale fare threshold
  const c13 = corpus.cases[12].case_13_stale_fare;
  const isStale = c13.input.observed_minutes_ago > 360;
  assert.equal(isStale, true, 'Observations > 360m must be classified as stale');

  // Case 18: Expired departure date
  const c18 = corpus.cases[17].case_18_expired_fare;
  const depTime = new Date(c18.input.departure_date).getTime();
  const now = Date.now();
  assert.ok(depTime < now, 'Departure in past must be detected as expired');
});

test('golden truth corpus: malicious booking URL quarantine and full corpus runner execution (20/20 cases pass)', () => {
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));

  // Case 19: Malicious booking URL sanitization
  const c19 = corpus.cases[18].case_19_malicious_booking_url;
  const sanitized = sanitizeBookingUrl(c19.input.booking_url);
  assert.equal(sanitized, undefined, 'Malicious booking URL must be rejected by domain allowlist');

  // Run full golden corpus runner
  const runResult = runGoldenCorpus(corpusPath);
  assert.equal(runResult.ok, true, 'Golden corpus runner must return ok: true');
  assert.equal(runResult.total, 20, 'Golden corpus runner must execute exactly 20 cases');
});
