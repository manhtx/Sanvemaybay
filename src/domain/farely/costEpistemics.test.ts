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
});
