/**
 * Unit Test Suite for True Cost & Cost Epistemic Evaluation
 * REQ-COST-001, REQ-COST-002, REQ-COST-003, REQ-COST-004, REQ-COST-005, NC-005, NC-033
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateTrueCost
} from './costEpistemics';

describe('True Cost Epistemic Evaluation & Invariant Defense', () => {
  it('evaluates base fare as KNOWN mandatory component', () => {
    const result = evaluateTrueCost({ basePrice: 1500000 });
    expect(result.basePrice).toBe(1500000);
    expect(result.knownTotal).toBeGreaterThanOrEqual(1500000);

    const fareComp = result.components.find((c) => c.category === 'fare');
    expect(fareComp).toBeDefined();
    expect(fareComp?.state).toBe('KNOWN');
    expect(fareComp?.amount).toBe(1500000);
  });

  it('handles explicit baggage inclusion truthfully', () => {
    const result = evaluateTrueCost({
      basePrice: 2000000,
      airline: 'VN',
      isBaggageExplicitlyIncluded: true
    });

    expect(result.isBaggageIncluded).toBe(true);
    expect(result.baggageState).toBe('KNOWN');

    const baggageFee = result.itemizedFees.find((f) => f.id === 'baggage_fee');
    expect(baggageFee).toBeDefined();
    expect(baggageFee?.amount).toBe(0);
    expect(baggageFee?.status).toBe('KNOWN');
  });

  it('handles explicit provider-supplied baggage fee', () => {
    const result = evaluateTrueCost({
      basePrice: 1200000,
      airline: 'VJ',
      providedHiddenCosts: { baggageFee: 360000 }
    });

    expect(result.baggageState).toBe('KNOWN');
    const baggageFee = result.itemizedFees.find((f) => f.id === 'baggage_fee');
    expect(baggageFee?.amount).toBe(360000);
    expect(baggageFee?.status).toBe('KNOWN');
  });

  it('satisfies invariant NC-005: budget carrier defaults baggage to ESTIMATED, never 0 or included', () => {
    // VietJet domestic
    const vjDomestic = evaluateTrueCost({
      basePrice: 890000,
      airline: 'VJ',
      isInternational: false
    });

    expect(vjDomestic.isBaggageIncluded).toBe(false);
    expect(vjDomestic.baggageState).toBe('ESTIMATED');

    const baggageFee = vjDomestic.itemizedFees.find((f) => f.id === 'baggage_fee');
    expect(baggageFee?.amount).toBe(280000); // Domestic LCC estimated baggage fee
    expect(baggageFee?.status).toBe('ESTIMATED');
    expect(baggageFee?.mandatory).toBe(false);

    // VietJet international
    const vjIntl = evaluateTrueCost({
      basePrice: 1500000,
      airline: 'VJ',
      isInternational: true
    });
    const intlBaggageFee = vjIntl.itemizedFees.find((f) => f.id === 'baggage_fee');
    expect(intlBaggageFee?.amount).toBe(450000); // International LCC estimated fee
    expect(intlBaggageFee?.status).toBe('ESTIMATED');
  });

  it('satisfies negative control: legacy carrier identity alone does not imply free baggage without fare class', () => {
    const vnResult = evaluateTrueCost({
      basePrice: 2500000,
      airline: 'VN'
    });

    // Lite economy fares may omit checked bags; epistemic state must be UNKNOWN
    expect(vnResult.baggageState).toBe('UNKNOWN');
    const baggageFee = vnResult.itemizedFees.find((f) => f.id === 'baggage_fee');
    expect(baggageFee?.status).toBe('UNKNOWN');
    expect(baggageFee?.amount).toBeNull();
  });

  it('handles unknown airline with safe UNKNOWN epistemic state and disclaimer', () => {
    const unknownResult = evaluateTrueCost({
      basePrice: 3000000,
      airline: 'MYSTERY_AIR'
    });

    expect(unknownResult.baggageState).toBe('UNKNOWN');
    expect(unknownResult.pricingTransparencyDisclaimer).toContain('chưa bao gồm');
  });

  it('verifies cost component summation consistency', () => {
    const result = evaluateTrueCost({
      basePrice: 1000000,
      airline: 'VJ',
      isInternational: false
    });

    // Known total must equal basePrice + known mandatory fees
    expect(result.knownTotal).toBeGreaterThanOrEqual(result.basePrice);

    // Estimated total must include optional estimated baggage
    expect(result.estimatedTotal).toBe(result.knownTotal + 280000);
    expect(result.estimatedAdditional).toBe(280000);
  });

  it('satisfies invariant NC-033: unverified taxes are UNKNOWN, never 0', () => {
    const result = evaluateTrueCost({
      basePrice: 1000000,
      isInternational: false
    });

    const taxFee = result.itemizedFees.find((f) => f.id === 'taxes_and_fees');
    expect(taxFee).toBeDefined();
    expect(taxFee?.status).toBe('UNKNOWN');
    expect(taxFee?.amount).toBeNull();
    expect(taxFee?.mandatory).toBe(true);
    expect(result.hasUnknownMandatoryCost).toBe(true);
  });

  it('marks taxes KNOWN when provider confirms all-in fare', () => {
    const result = evaluateTrueCost({
      basePrice: 1200000,
      providerVerifiedAllIn: true,
      providedHiddenCosts: { paymentFee: 0 }
    });

    const taxFee = result.itemizedFees.find((f) => f.id === 'taxes_and_fees');
    expect(taxFee).toBeDefined();
    expect(taxFee?.status).toBe('KNOWN');
    expect(taxFee?.amount).toBe(0);
    expect(result.hasUnknownMandatoryCost).toBe(false);
  });

  it('marks taxes KNOWN when explicit airport taxes are provided', () => {
    const result = evaluateTrueCost({
      basePrice: 1500000,
      providedHiddenCosts: { airportTaxes: 210000 }
    });

    const taxFee = result.itemizedFees.find((f) => f.id === 'taxes_and_fees');
    expect(taxFee).toBeDefined();
    expect(taxFee?.status).toBe('KNOWN');
    expect(taxFee?.amount).toBe(210000);
    expect(result.knownTotal).toBe(1710000);
  });

  it('normalizes array of hidden cost objects with localized tokens', () => {
    const result = evaluateTrueCost({
      basePrice: 1800000,
      providedHiddenCosts: [
        { label: 'Kiện hành lý ký gửi 20kg', amount: 300000 },
        { label: 'Phí thanh toán', amount: 50000 },
        { label: 'Thuế phi trường', amount: 200000 }
      ]
    });

    expect(result.baggageState).toBe('KNOWN');
    expect(result.knownTotal).toBe(2350000); // 1800000 + 300000 + 50000 + 200000
    expect(result.hasUnknownMandatoryCost).toBe(false);
    expect(result.totalLabel).toBe('Tổng chi phí');
  });

  it('preserves minimum verifiable total invariant: basePrice + knownMandatory', () => {
    const result = evaluateTrueCost({
      basePrice: 2000000,
      providedHiddenCosts: { airportTaxes: 300000, paymentFee: 45000 }
    });

    expect(result.knownMandatoryTotal).toBe(300000);
    expect(result.minVerifiableTotal).toBe(2300000);
  });

  it('handles explicit payment fee values including zero amount', () => {
    const resPaid = evaluateTrueCost({
      basePrice: 1500000,
      providedHiddenCosts: { paymentFee: 50000 }
    });
    const feePaid = resPaid.itemizedFees.find((f) => f.id === 'payment_fee');
    expect(feePaid).toBeDefined();
    expect(feePaid?.amount).toBe(50000);
    expect(feePaid?.status).toBe('KNOWN');

    const resZero = evaluateTrueCost({
      basePrice: 1500000,
      providedHiddenCosts: { paymentFee: 0 }
    });
    const feeZero = resZero.itemizedFees.find((f) => f.id === 'payment_fee');
    expect(feeZero).toBeDefined();
    expect(feeZero?.amount).toBe(0);
    expect(feeZero?.status).toBe('KNOWN');
  });

  it('verifies all 7 budget carriers default to ESTIMATED baggage (280k domestic vs 450k international)', () => {
    const budgetCarriers = ['VJ', 'AK', 'FD', 'TR', '5J', 'SL', 'VU'];
    for (const code of budgetCarriers) {
      const dom = evaluateTrueCost({ basePrice: 1000000, airlineCode: code, isInternational: false });
      expect(dom.baggageState).toBe('ESTIMATED');
      const domBaggage = dom.itemizedFees.find((f) => f.id === 'baggage_fee');
      expect(domBaggage?.amount).toBe(280000);

      const intl = evaluateTrueCost({ basePrice: 1000000, airlineCode: code, isInternational: true });
      expect(intl.baggageState).toBe('ESTIMATED');
      const intlBaggage = intl.itemizedFees.find((f) => f.id === 'baggage_fee');
      expect(intlBaggage?.amount).toBe(450000);
    }
  });

  it('verifies legacy carriers default to UNKNOWN baggage state without explicit fare class', () => {
    const legacyCarriers = ['VN', 'QH', 'SQ', 'TG', 'JL', 'NH', 'KE', 'OZ', 'CX', 'BR', 'CI', 'EK', 'QR', 'TK'];
    for (const code of legacyCarriers) {
      const res = evaluateTrueCost({ basePrice: 2500000, airlineCode: code });
      expect(res.baggageState).toBe('UNKNOWN');
      const baggageFee = res.itemizedFees.find((f) => f.id === 'baggage_fee');
      expect(baggageFee?.status).toBe('UNKNOWN');
      expect(baggageFee?.amount).toBeNull();
    }
  });

  it('verifies totalLabel truthfulness: exact total vs estimated total', () => {
    // All known costs -> 'Tổng chi phí'
    const knownRes = evaluateTrueCost({
      basePrice: 1000000,
      providerVerifiedAllIn: true,
      isBaggageExplicitlyIncluded: true,
      providedHiddenCosts: { paymentFee: 0 }
    });
    expect(knownRes.hasUnknownMandatoryCost).toBe(false);
    expect(knownRes.totalLabel).toBe('Tổng chi phí');

    // Has unknown taxes -> 'Tổng ước tính'
    const estimatedRes = evaluateTrueCost({
      basePrice: 1000000,
      airline: 'VJ'
    });
    expect(estimatedRes.hasUnknownMandatoryCost).toBe(true);
    expect(estimatedRes.totalLabel).toBe('Tổng ước tính');
  });

  it('derives international status from region strings (asia, europe, americas, international)', () => {
    for (const region of ['asia', 'europe', 'americas', 'international']) {
      const res = evaluateTrueCost({ basePrice: 1000000, airline: 'VJ', region });
      const fee = res.itemizedFees.find((f) => f.id === 'baggage_fee');
      expect(fee?.amount).toBe(450000); // 450k international fee
    }

    const domesticRes = evaluateTrueCost({ basePrice: 1000000, airline: 'VJ', region: 'domestic' });
    const domFee = domesticRes.itemizedFees.find((f) => f.id === 'baggage_fee');
    expect(domFee?.amount).toBe(280000); // 280k domestic fee
  });

  it('handles boundary value basePrice = 0 without error or NaN totals', () => {
    const zeroRes = evaluateTrueCost({ basePrice: 0 });
    expect(zeroRes.basePrice).toBe(0);
    expect(Number.isFinite(zeroRes.knownTotal)).toBe(true);
    expect(Number.isFinite(zeroRes.estimatedTotal)).toBe(true);
  });

  it('preserves pure immutability on Object.freeze protected TrueCostInput', () => {
    const frozenCosts = Object.freeze([
      Object.freeze({ label: 'Phí thanh toán', amount: 35000 })
    ]);
    const frozenInput = Object.freeze({
      basePrice: 1200000,
      airline: 'VJ',
      providedHiddenCosts: frozenCosts as any
    });

    expect(() => evaluateTrueCost(frozenInput)).not.toThrow();
  });

  it('benchmark: 5,000 true cost evaluations execute in sub-50ms', () => {
    const input = {
      basePrice: 1500000,
      airline: 'VJ',
      isInternational: true,
      providedHiddenCosts: { airportTaxes: 200000, paymentFee: 30000 }
    };

    const start = performance.now();
    for (let i = 0; i < 5000; i++) {
      evaluateTrueCost(input);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
