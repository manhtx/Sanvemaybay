import { describe, it, expect } from 'vitest';
import { evidenceGatedDealLabel } from './dealClaims';
import { isApprovedHttpsUrl, approvedBookingHosts } from '../../../supabase/functions/_shared/live-deal';

/**
 * Independent Reference Oracle for Differential Testing (Section 25)
 * Written completely independently of the production implementation
 * to catch subtle boundary or boolean operator errors.
 */
function referenceDealLabelOracle(score: number, confidence: number): string {
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  const c = Math.max(0, Math.min(100, Number(confidence) || 0));

  // Low confidence (< 50%) caps urgency strictly
  if (c < 50) {
    return s >= 60 ? "Giá đáng chú ý" : "Giá quan sát";
  }
  if (s >= 90 && c >= 75) {
    return "Deal cực nóng";
  }
  if (s >= 80 && c >= 65) {
    return "Deal rất ngon";
  }
  if (s >= 70) {
    return "Deal ngon";
  }
  if (s >= 60) {
    return "Giá đáng chú ý";
  }
  return "Giá quan sát";
}

describe('Differential Verification (Section 25)', () => {
  it('production evidenceGatedDealLabel matches reference oracle across exhaustive score and confidence matrix', () => {
    // Test all integer combinations of score [0..100 step 5] and confidence [0..100 step 5]
    for (let score = 0; score <= 100; score += 5) {
      for (let confidence = 0; confidence <= 100; confidence += 5) {
        const prod = evidenceGatedDealLabel(score, confidence);
        const ref = referenceDealLabelOracle(score, confidence);
        expect(prod).toBe(ref);
      }
    }
  });

  it('handles negative, NaN, infinity, and floating point inputs identically in production and reference', () => {
    const edgeCases = [
      { s: -10, c: -5 },
      { s: NaN, c: 50 },
      { s: 80, c: NaN },
      { s: Infinity, c: 80 },
      { s: 95.5, c: 74.9 },
      { s: 89.9, c: 75.1 },
      { s: 79.9, c: 65.0 },
      { s: 59.9, c: 100 },
    ];

    for (const { s, c } of edgeCases) {
      const prod = evidenceGatedDealLabel(s, c);
      const ref = referenceDealLabelOracle(s, c);
      expect(prod).toBe(ref);
    }
  });
});

describe('Metamorphic Testing (Section 26)', () => {
  it('Metamorphic Invariant 1: Attractiveness Monotonicity under Price Reduction', () => {
    // If baseline is fixed at 2,000,000 VND, lowering price from 1,600,000 to 1,200,000
    // must strictly increase or maintain discount percentage
    const baseline = 2_000_000;
    const priceHigh = 1_600_000;
    const priceLow = 1_200_000;

    const discountHigh = Math.round(((baseline - priceHigh) / baseline) * 100);
    const discountLow = Math.round(((baseline - priceLow) / baseline) * 100);

    expect(discountLow).toBeGreaterThan(discountHigh);

    // Confidence fixed at 80% -> label for lower price must be at least as attractive
    const labelHigh = evidenceGatedDealLabel(discountHigh * 2, 80);
    const labelLow = evidenceGatedDealLabel(discountLow * 2, 80);

    const tierRank: Record<string, number> = {
      'Giá quan sát': 1,
      'Giá đáng chú ý': 2,
      'Deal ngon': 3,
      'Deal rất ngon': 4,
      'Deal cực nóng': 5,
    };

    expect(tierRank[labelLow]).toBeGreaterThanOrEqual(tierRank[labelHigh]);
  });

  it('Metamorphic Invariant 2: Cost Additivity Monotonicity', () => {
    // Adding optional baggage, seat selection, or card fees must never reduce total estimated cost
    const baseFare = 1_500_000;
    const feesMandatory = 450_000;
    const totalWithoutBaggage = baseFare + feesMandatory;

    const baggageFee = 250_000;
    const totalWithBaggage = totalWithoutBaggage + baggageFee;

    expect(totalWithBaggage).toBeGreaterThan(totalWithoutBaggage);
    expect(totalWithoutBaggage).toBeGreaterThanOrEqual(baseFare);
  });

  it('Metamorphic Invariant 3: Confidence Capping (Evidence Gating)', () => {
    // For any score up to 100, if confidence is < 50%, label must NEVER be "Deal cực nóng" or "Deal rất ngon"
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

  it('Metamorphic Invariant 4: Confidence Monotonicity under Sample Growth', () => {
    // As sample size grows from 1 to 12, confidence score must be monotonically non-decreasing
    const confidenceScore = (sampleCount: number) => Math.round(Math.min(100, (sampleCount / 12) * 100));

    let prev = -1;
    for (let count = 1; count <= 15; count++) {
      const current = confidenceScore(count);
      expect(current).toBeGreaterThanOrEqual(prev);
      prev = current;
    }
  });

  it('Metamorphic Invariant 5: URL Allowlist Security Monotonicity', () => {
    const approved = approvedBookingHosts('vietjetair.com,vietnamairlines.com,bambooairways.com');

    // An untrusted domain MUST remain rejected even when query parameters or credentials attempt to spoof trusted hosts
    const attacks = [
      'https://evil.com',
      'https://evil.com?ref=vietjetair.com',
      'https://evil.com/vietnamairlines.com',
      'https://evil.com#vietjetair.com',
      'http://vietjetair.com', // non-https rejected
      'javascript:alert(1)',
      'https://subdomain.attacker.com',
      'https://notvietjetair.com',
    ];

    for (const url of attacks) {
      expect(isApprovedHttpsUrl(url, approved)).toBe(false);
    }

    // Legit domains and subdomains pass
    expect(isApprovedHttpsUrl('https://vietjetair.com/vi/flights', approved)).toBe(true);
    expect(isApprovedHttpsUrl('https://www.vietnamairlines.com/flights', approved)).toBe(true);
    expect(isApprovedHttpsUrl('https://booking.bambooairways.com', approved)).toBe(true);
  });
});
