import { describe, it, expect } from 'vitest';
import { evidenceGatedDealLabel } from './dealClaims';
import { assessDeal, calculateTotalCost } from './flightIntelligence';
import { assessRoute, RouteOption } from './routeOptimization';
import { forecastPrice } from './priceForecast';
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
});
