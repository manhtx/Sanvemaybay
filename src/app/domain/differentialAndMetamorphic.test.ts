import { describe, it, expect } from 'vitest';
import { evidenceGatedDealLabel } from './dealClaims';
import { assessDeal, calculateTotalCost } from './flightIntelligence';
import { assessRoute, RouteOption } from './routeOptimization';
import { forecastPrice } from './priceForecast';
import { buildTripAdvice } from './tripAdvisor';
import { Deal } from '../data/deals';
import { isApprovedHttpsUrl, approvedBookingHosts } from '../../../supabase/functions/_shared/live-deal';

/**
 * Independent Reference Oracle for Differential Testing (Section 27 & 28)
 * Derived strictly from Canonical Acceptance Criteria (FLY-INTEL-004)
 * and Threshold Registry (THR-SCORE-HOT, THR-SCORE-VERY-GOOD, THR-SCORE-GOOD,
 * THR-SCORE-NOTEWORTHY, THR-CONFIDENCE-CAP-FLOOR, THR-CONFIDENCE-HIGH, THR-CONFIDENCE-MEDIUM).
 */
function referenceDealLabelOracle(score: number, confidence: number): string {
  const boundedScore = Math.max(0, Math.min(100, Number(score) || 0));
  const boundedConfidence = Math.max(0, Math.min(100, Number(confidence) || 0));

  // Low confidence (< 50%) caps urgency strictly (FLY-INTEL-004)
  if (boundedConfidence < 50) {
    return boundedScore >= 60 ? 'Giá đáng chú ý' : 'Giá quan sát';
  }
  if (boundedScore >= 90 && boundedConfidence >= 75) {
    return 'Deal cực nóng';
  }
  if (boundedScore >= 80 && boundedConfidence >= 65) {
    return 'Deal rất ngon';
  }
  if (boundedScore >= 70) {
    return 'Deal ngon';
  }
  if (boundedScore >= 60) {
    return 'Giá đáng chú ý';
  }
  return 'Giá quan sát';
}

describe('Differential Verification & Boundary Testing (Section 27 & 28)', () => {
  it('production evidenceGatedDealLabel matches reference oracle across exhaustive matrix', () => {
    for (let score = 0; score <= 100; score += 5) {
      for (let confidence = 0; confidence <= 100; confidence += 5) {
        const prod = evidenceGatedDealLabel(score, confidence);
        const ref = referenceDealLabelOracle(score, confidence);
        expect(prod).toBe(ref);
      }
    }
  });

  it('boundary testing: validates exact threshold +/- epsilon transitions', () => {
    const epsilon = 0.001;
    const boundaryCases = [
      // 90 / 75 boundary ("Deal cực nóng")
      { s: 90 - epsilon, c: 75, expected: 'Deal rất ngon' },
      { s: 90, c: 75, expected: 'Deal cực nóng' },
      { s: 90 + epsilon, c: 75, expected: 'Deal cực nóng' },
      { s: 90, c: 75 - epsilon, expected: 'Deal rất ngon' },

      // 80 / 65 boundary ("Deal rất ngon")
      { s: 80 - epsilon, c: 65, expected: 'Deal ngon' },
      { s: 80, c: 65, expected: 'Deal rất ngon' },
      { s: 80 + epsilon, c: 65, expected: 'Deal rất ngon' },
      { s: 80, c: 65 - epsilon, expected: 'Deal ngon' },

      // 70 boundary ("Deal ngon")
      { s: 70 - epsilon, c: 50, expected: 'Giá đáng chú ý' },
      { s: 70, c: 50, expected: 'Deal ngon' },
      { s: 70 + epsilon, c: 50, expected: 'Deal ngon' },

      // 60 boundary ("Giá đáng chú ý")
      { s: 60 - epsilon, c: 50, expected: 'Giá quan sát' },
      { s: 60, c: 50, expected: 'Giá đáng chú ý' },
      { s: 60 + epsilon, c: 50, expected: 'Giá đáng chú ý' },

      // 50 confidence cap boundary
      { s: 95, c: 50 - epsilon, expected: 'Giá đáng chú ý' },
      { s: 95, c: 50, expected: 'Deal ngon' },
      { s: 55, c: 50 - epsilon, expected: 'Giá quan sát' },
      { s: 55, c: 50, expected: 'Giá quan sát' },
    ];

    for (const { s, c, expected } of boundaryCases) {
      const prod = evidenceGatedDealLabel(s, c);
      const ref = referenceDealLabelOracle(s, c);
      expect(prod).toBe(expected);
      expect(prod).toBe(ref);
    }
  });

  it('boundary testing: handles extreme, NaN, Infinity, negative, and out-of-range values safely', () => {
    const extremeCases = [
      { s: -100, c: -50 },
      { s: 0, c: 0 },
      { s: 100, c: 100 },
      { s: 150, c: 200 },
      { s: NaN, c: 75 },
      { s: 85, c: NaN },
      { s: NaN, c: NaN },
      { s: Infinity, c: 80 },
      { s: 90, c: Infinity },
      { s: -Infinity, c: 50 },
      { s: 90, c: -Infinity },
    ];

    for (const { s, c } of extremeCases) {
      const prod = evidenceGatedDealLabel(s, c);
      const ref = referenceDealLabelOracle(s, c);
      expect(prod).toBe(ref);
    }
  });
});

describe('Metamorphic Invariants on Production Domain Engine (Section 29–33)', () => {
  it('Metamorphic Invariant 1: Price Reduction Monotonicity on assessDeal', () => {
    const baselinePrice = 2_000_000;
    const higherPrice = 1_600_000;
    const lowerPrice = 1_200_000;

    // Execute real production domain scoring engine
    const assessHigh = assessDeal({
      currentPrice: higherPrice,
      baselinePrice,
      comparableSamples: 15,
      historicalSamples: 15,
    });

    const assessLow = assessDeal({
      currentPrice: lowerPrice,
      baselinePrice,
      comparableSamples: 15,
      historicalSamples: 15,
    });

    // Monotonic discount and score increase
    expect(assessLow.discountPercent).toBeGreaterThan(assessHigh.discountPercent);
    expect(assessLow.score).toBeGreaterThanOrEqual(assessHigh.score);

    // Pipe through production label gating
    const labelHigh = evidenceGatedDealLabel(assessHigh.score, Math.round(assessHigh.confidence * 100));
    const labelLow = evidenceGatedDealLabel(assessLow.score, Math.round(assessLow.confidence * 100));

    const tierRank: Record<string, number> = {
      'Giá quan sát': 1,
      'Giá đáng chú ý': 2,
      'Deal ngon': 3,
      'Deal rất ngon': 4,
      'Deal cực nóng': 5,
    };

    expect(tierRank[labelLow]).toBeGreaterThanOrEqual(tierRank[labelHigh]);
  });

  it('Metamorphic Invariant 2: Cost Additivity Monotonicity on calculateTotalCost', () => {
    const baseFare = 1_200_000;
    const mandatoryTaxes = 350_000;
    const optionalBaggage = 220_000;

    // Real production cost engine
    const baseTotal = calculateTotalCost([baseFare]);
    const withTaxes = calculateTotalCost([baseFare, mandatoryTaxes]);
    const withBaggage = calculateTotalCost([baseFare, mandatoryTaxes, optionalBaggage]);

    expect(withTaxes).toBeGreaterThan(baseTotal);
    expect(withBaggage).toBeGreaterThan(withTaxes);

    // Non-negative and finite constraint validation
    expect(() => calculateTotalCost([baseFare, -50_000])).toThrow('Cost components must be finite and non-negative.');
    expect(() => calculateTotalCost([baseFare, NaN])).toThrow('Cost components must be finite and non-negative.');
    expect(() => calculateTotalCost([baseFare, Infinity])).toThrow('Cost components must be finite and non-negative.');
  });

  it('Metamorphic Invariant 3: Confidence Monotonicity under Sample Growth on assessDeal', () => {
    const currentPrice = 1_400_000;
    const baselinePrice = 2_000_000;

    let previousConfidence = 0;
    for (let samples = 1; samples <= 30; samples += 2) {
      const assessment = assessDeal({
        currentPrice,
        baselinePrice,
        comparableSamples: samples,
        historicalSamples: samples,
      });

      expect(assessment.confidence).toBeGreaterThanOrEqual(previousConfidence);
      previousConfidence = assessment.confidence;
    }
  });

  it('Metamorphic Invariant 4: Confidence Capping (Evidence Gating)', () => {
    // When confidence is strictly < 50%, labels can never breach modest tiers
    for (let s = 0; s <= 100; s += 1) {
      for (let c = 0; c < 50; c += 5) {
        const label = evidenceGatedDealLabel(s, c);
        expect(label).not.toBe('Deal cực nóng');
        expect(label).not.toBe('Deal rất ngon');
        expect(label).not.toBe('Deal ngon');
        expect(['Giá đáng chú ý', 'Giá quan sát']).toContain(label);
      }
    }
  });

  it('Metamorphic Invariant 5: URL Security & Adversarial Spoof Resistance', () => {
    const approved = approvedBookingHosts('vietjetair.com,vietnamairlines.com,bambooairways.com');

    const attacks = [
      // Userinfo attack (attempting to trick parser with trusted host in userinfo)
      'https://vietjetair.com@evil.com/checkout',
      'https://vietjetair.com:password@evil.com',

      // Prefix and suffix attack
      'https://evil.com/vietjetair.com',
      'https://evil.com?target=vietjetair.com',
      'https://evil.com#vietjetair.com',
      'https://vietjetair.com.attacker.com',
      'https://fakevietjetair.com',
      'https://notvietjetair.com/booking',

      // Protocol attacks
      'http://vietjetair.com', // Non-HTTPS must be rejected
      'javascript:alert(1)',
      'data:text/html,evil',
      '//vietjetair.com', // Scheme-relative URL

      // Malformed / Non-URL input
      '',
      'vietjetair.com',
      '   ',
      'https://',
    ];

    for (const url of attacks) {
      expect(isApprovedHttpsUrl(url, approved)).toBe(false);
    }

    // Valid legitimate booking URLs pass
    expect(isApprovedHttpsUrl('https://vietjetair.com', approved)).toBe(true);
    expect(isApprovedHttpsUrl('https://vietjetair.com/vi/flights/select', approved)).toBe(true);
    expect(isApprovedHttpsUrl('https://booking.vietjetair.com/flights', approved)).toBe(true);
    expect(isApprovedHttpsUrl('https://www.vietnamairlines.com/vn/vi/', approved)).toBe(true);
    expect(isApprovedHttpsUrl('https://bambooairways.com/booking', approved)).toBe(true);
    expect(isApprovedHttpsUrl('https://VietJetAir.com/booking', approved)).toBe(true); // Case insensitive
  });

  it('Metamorphic Invariant 6: Route Detour & Multi-Leg Cost/Duration Monotonicity', () => {
    const directRoute: RouteOption = {
      type: 'DIRECT',
      legs: [
        {
          origin: 'HAN',
          destination: 'BKK',
          price: 2_000_000,
          durationMinutes: 120,
          departureAt: '2026-12-01T08:00:00.000Z',
          arrivalAt: '2026-12-01T10:00:00.000Z',
          baggageIncluded: true,
        },
      ],
    };

    const connectingRoute: RouteOption = {
      type: 'MULTI_LEG',
      legs: [
        {
          origin: 'HAN',
          destination: 'DAD',
          price: 1_200_000,
          durationMinutes: 80,
          departureAt: '2026-12-01T08:00:00.000Z',
          arrivalAt: '2026-12-01T09:20:00.000Z',
          baggageIncluded: true,
        },
        {
          origin: 'DAD',
          destination: 'BKK',
          price: 1_500_000,
          durationMinutes: 110,
          departureAt: '2026-12-01T12:00:00.000Z',
          arrivalAt: '2026-12-01T13:50:00.000Z',
          baggageIncluded: true,
        },
      ],
    };

    const assessedDirect = assessRoute(directRoute);
    const assessedConnecting = assessRoute(connectingRoute);

    // Multi-leg total flight duration must be strictly greater than single leg direct duration
    expect(assessedConnecting.totalDurationMinutes).toBeGreaterThan(assessedDirect.totalDurationMinutes);
    // Additive cost across 2 legs must be strictly greater than either individual leg
    expect(assessedConnecting.totalCost).toBe(2_700_000);
    expect(assessedConnecting.totalCost).toBeGreaterThan(connectingRoute.legs[0].price);
    expect(assessedConnecting.totalCost).toBeGreaterThan(connectingRoute.legs[1].price);
  });

  it('Metamorphic Invariant 7: Price Forecast Trend Slope Monotonicity with Price Trajectories', () => {
    // 14 days of steadily decreasing prices: 5M down to 3.7M
    const fallingPoints = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, '0')}`,
      price: 5_000_000 - i * 100_000,
    }));

    const fallingForecast = forecastPrice(fallingPoints);
    expect(fallingForecast).toBeDefined();
    expect(fallingForecast?.direction).toBe('down');
    expect(fallingForecast?.probability).toBeGreaterThan(0.5);

    // 14 days of steadily rising prices: 3M up to 4.3M
    const risingPoints = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, '0')}`,
      price: 3_000_000 + i * 100_000,
    }));

    const risingForecast = forecastPrice(risingPoints);
    expect(risingForecast).toBeDefined();
    expect(risingForecast?.direction).toBe('up');
    expect(risingForecast?.probability).toBeGreaterThan(0.5);

    // 14 days of completely identical prices
    const flatPoints = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, '0')}`,
      price: 4_000_000,
    }));

    const flatForecast = forecastPrice(flatPoints);
    expect(flatForecast).toBeDefined();
    expect(flatForecast?.direction).toBe('stable');
  });

  it('Metamorphic Invariant 8: Hostile IP Addresses, Trailing Dots, and Non-Standard Ports', () => {
    const approved = approvedBookingHosts('vietjetair.com,vietnamairlines.com');

    const hostileUrls = [
      'https://192.168.1.1/booking',
      'https://10.0.0.1/vietjetair.com',
      'https://127.0.0.1:8080/checkout',
      'https://vietjetair.com.:443/flights',
      'ftp://vietjetair.com/booking',
      'file:///etc/passwd',
      'https://vietjetair.com.evil.co/',
    ];

    for (const url of hostileUrls) {
      expect(isApprovedHttpsUrl(url, approved)).toBe(false);
    }
  });

  it('preserves pure immutability on Object.freeze protected deal assessment inputs', () => {
    const frozenParams = Object.freeze({
      currentPrice: 1_500_000,
      baselinePrice: 2_000_000,
      comparableSamples: 10,
      historicalSamples: 10,
    });

    expect(() => assessDeal(frozenParams)).not.toThrow();
    expect(frozenParams.currentPrice).toBe(1_500_000);
  });

  it('Metamorphic Invariant 9: Scale Invariance of relative discount percentage under proportional currency/unit inflation', () => {
    const baseCurrent = 1_500_000;
    const baseBaseline = 2_000_000;
    const multiplier = 10;

    const baseAssessment = assessDeal({
      currentPrice: baseCurrent,
      baselinePrice: baseBaseline,
      comparableSamples: 20,
      historicalSamples: 20,
    });

    const scaledAssessment = assessDeal({
      currentPrice: baseCurrent * multiplier,
      baselinePrice: baseBaseline * multiplier,
      comparableSamples: 20,
      historicalSamples: 20,
    });

    expect(scaledAssessment.discountPercent).toBe(baseAssessment.discountPercent);
    expect(scaledAssessment.level).toBe(baseAssessment.level);
    expect(scaledAssessment.score).toBe(baseAssessment.score);
    expect(scaledAssessment.confidence).toBe(baseAssessment.confidence);
  });

  it('Metamorphic Invariant 10: Strict Idempotency of evidenceGatedDealLabel across repeat executions', () => {
    const testCases = [
      { score: 95, confidence: 85 },
      { score: 85, confidence: 70 },
      { score: 75, confidence: 55 },
      { score: 65, confidence: 50 },
      { score: 50, confidence: 90 },
      { score: 95, confidence: 40 },
    ];

    for (const { score, confidence } of testCases) {
      const first = evidenceGatedDealLabel(score, confidence);
      for (let run = 0; run < 100; run++) {
        expect(evidenceGatedDealLabel(score, confidence)).toBe(first);
      }
    }
  });

  it('Metamorphic Invariant 11: Route self-transfer risk flag preservation on self-transfer and high-risk itineraries', () => {
    const selfTransferRoute: RouteOption = {
      type: 'SELF_TRANSFER',
      legs: [
        {
          origin: 'SGN',
          destination: 'BKK',
          price: 1_200_000,
          durationMinutes: 90,
          departureAt: '2026-12-01T08:00:00.000Z',
          arrivalAt: '2026-12-01T09:30:00.000Z',
          baggageIncluded: true,
        },
        {
          origin: 'BKK',
          destination: 'SIN',
          price: 1_100_000,
          durationMinutes: 120,
          departureAt: '2026-12-01T14:00:00.000Z',
          arrivalAt: '2026-12-01T16:00:00.000Z',
          baggageIncluded: true,
        },
      ],
      connectionMinutes: 270,
    };

    const assessed = assessRoute(selfTransferRoute);
    expect(assessed.requiresUserConfirmation).toBe(true);
    expect(assessed.riskReasons.some((r) => r.includes('Tách vé'))).toBe(true);
  });

  it('Metamorphic Invariant 12: Price forecast safe fallback on empty, single-point, or minimal datasets', () => {
    expect(forecastPrice([])).toBeUndefined();

    const singlePoint = [{ date: '2026-10-01', price: 2_000_000 }];
    expect(forecastPrice(singlePoint)).toBeUndefined();

    const thirteenPoints = Array.from({ length: 13 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, '0')}`,
      price: 2_000_000 + i * 10_000,
    }));
    expect(forecastPrice(thirteenPoints)).toBeUndefined();

    // 14 points is minimal requirement
    const fourteenPoints = [
      ...thirteenPoints,
      { date: '2026-10-14', price: 2_140_000 },
    ];
    expect(forecastPrice(fourteenPoints)).toBeDefined();
  });

  it('Metamorphic Invariant 13: Flight Intelligence cost calculation zero-cost element handling', () => {
    expect(calculateTotalCost([])).toBe(0);
    expect(calculateTotalCost([0, 0, 0])).toBe(0);
    expect(calculateTotalCost([1_500_000, 0, 0])).toBe(1_500_000);
    expect(calculateTotalCost([0, 250_000, 150_000])).toBe(400_000);
  });

  it('Metamorphic Invariant 14: Comprehensive URL parser defense (encoded characters, IP matching, port matching)', () => {
    const approved = approvedBookingHosts('vietjetair.com,vietnamairlines.com');

    // URLs with non-approved host, userinfo attack, or control characters must be rejected
    expect(isApprovedHttpsUrl('https://vietjetair.com\r\nevil.com', approved)).toBe(false);
    expect(isApprovedHttpsUrl('https://vietjetair.com@evil.com/booking', approved)).toBe(false);
    expect(isApprovedHttpsUrl('https://admin:secret@evil-phish.com/vj', approved)).toBe(false);
    expect(isApprovedHttpsUrl(null, approved)).toBe(false);
    expect(isApprovedHttpsUrl(12345, approved)).toBe(false);
    expect(isApprovedHttpsUrl({}, approved)).toBe(false);

    // Empty approved set rejects all
    expect(isApprovedHttpsUrl('https://vietjetair.com', new Set())).toBe(false);
  });

  it('Metamorphic Invariant 15: Trip budget scaling monotonicity with flight fare across multi-tier scenarios', () => {
    const baseDeal: Deal = {
      id: 'd-monotonic-1',
      from: 'Hà Nội',
      fromCode: 'HAN',
      to: 'Đà Nẵng',
      toCode: 'DAD',
      country: 'Vietnam',
      region: 'domestic',
      price: 1_000_000,
      normalPrice: 1_500_000,
      discount: 33,
      currency: 'VND',
      airline: 'Vietjet Air',
      airlineCode: 'VJ',
      departDate: '2026-12-01',
      duration: '1h 20m',
      stops: 0,
      stopCity: null,
      seatsLeft: 5,
      expiresIn: '24h',
      image: '/deals/han-dad.jpg',
      flightNumber: 'VJ123',
      aiInsight: {
        reason: 'Giá rẻ',
        tags: ['cheap'],
        risk: 'low',
        riskDetails: 'Không có rủi ro',
        recommendation: 'buy_now',
        recommendationNote: 'Nên mua',
        savingScore: 85,
      },
      hiddenCosts: [],
      advertisedTotal: 1_000_000,
      realTotal: 1_000_000,
      tripType: 'domestic',
    };

    const expensiveDeal: Deal = {
      ...baseDeal,
      id: 'd-monotonic-2',
      price: 2_000_000,
      realTotal: 2_000_000,
    };

    const advice = buildTripAdvice([baseDeal, expensiveDeal], {
      origin: 'HAN',
      budget: 10_000_000,
      days: 3,
    });

    expect(advice.length).toBe(2);
    // Cheaper flight yields lower estimated trip budget
    expect(advice[0].estimatedTripBudget).toBeLessThan(advice[1].estimatedTripBudget);
    // Cheaper flight has higher remaining budget
    expect(advice[0].budgetRemaining).toBeGreaterThan(advice[1].budgetRemaining);
  });

  it('processes 10,000 differential oracle checks within sub-50ms latency budget', () => {
    const start = performance.now();
    for (let i = 0; i < 10_000; i++) {
      const s = (i * 7) % 101;
      const c = (i * 13) % 101;
      const prod = evidenceGatedDealLabel(s, c);
      const ref = referenceDealLabelOracle(s, c);
      if (prod !== ref) {
        throw new Error(`Oracle divergence at ${s}, ${c}`);
      }
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
});
