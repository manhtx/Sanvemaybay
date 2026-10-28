import { describe, it, expect } from 'vitest';
import { evaluateTrueCost, type TrueCostInput } from './costEpistemics';

describe('Farely Pure Domain Kernel — Cost Epistemics (WP02-COSTEPISTEMICS-TRANSPARENCY-GUARD)', () => {
  it('sanitizes non-positive or non-finite basePrice to 0 without corrupting totals', () => {
    const resNegative = evaluateTrueCost({
      basePrice: -250000,
      providerVerifiedAllIn: true,
      isBaggageExplicitlyIncluded: true,
    });
    expect(resNegative.basePrice).toBe(0);
    expect(resNegative.minVerifiableTotal).toBe(0);
    expect(resNegative.knownTotal).toBe(0);

    const resNaN = evaluateTrueCost({
      basePrice: NaN,
      providerVerifiedAllIn: true,
      isBaggageExplicitlyIncluded: true,
    });
    expect(resNaN.basePrice).toBe(0);
    expect(resNaN.minVerifiableTotal).toBe(0);
  });

  it('sanitizes provided hidden costs and rejects negative fee injections', () => {
    const resObj = evaluateTrueCost({
      basePrice: 1500000,
      providedHiddenCosts: {
        baggageFee: -200000, // hostile negative injection
        airportTaxes: 450000,
      },
    });
    // baggageFee should be undefined due to negative rejection -> fallback to carrier heuristic/unknown
    expect(resObj.itemizedFees.find(f => f.id === 'taxes_and_fees')?.amount).toBe(450000);
    const baggageFee = resObj.itemizedFees.find(f => f.id === 'baggage_fee');
    expect(baggageFee?.amount).not.toBe(-200000);

    const resArray = evaluateTrueCost({
      basePrice: 1500000,
      providedHiddenCosts: [
        { label: 'Hành lý ký gửi', amount: NaN },
        { label: 'Thuế sân bay', amount: 350000 },
      ],
    });
    expect(resArray.itemizedFees.find(f => f.id === 'taxes_and_fees')?.amount).toBe(350000);
    expect(resArray.itemizedFees.find(f => f.id === 'baggage_fee')?.status).not.toBe('KNOWN');
  });

  it('recognizes Pacific Airlines (BL) as budget carrier', () => {
    const resBL = evaluateTrueCost({
      basePrice: 1200000,
      airlineCode: 'BL',
    });
    expect(resBL.baggageState).toBe('ESTIMATED');
    expect(resBL.isBaggageIncluded).toBe(false);
    const baggageComponent = resBL.components.find(c => c.category === 'checked_baggage');
    expect(baggageComponent?.state).toBe('ESTIMATED');
    expect(baggageComponent?.amount).toBe(280000);
  });

  it('guarantees isBaggageExplicitlyIncluded: true overrides budget carrier heuristics', () => {
    const resVietjetBundled = evaluateTrueCost({
      basePrice: 2500000,
      airlineCode: 'VJ',
      isBaggageExplicitlyIncluded: true, // SkyBoss / Deluxe bundle
    });
    expect(resVietjetBundled.baggageState).toBe('KNOWN');
    expect(resVietjetBundled.isBaggageIncluded).toBe(true);
    const baggageComponent = resVietjetBundled.components.find(c => c.category === 'checked_baggage');
    expect(baggageComponent?.state).toBe('KNOWN');
    expect(baggageComponent?.amount).toBe(0);
  });

  it('marks baggage ESTIMATED when isBaggageExplicitlyIncluded is explicitly false even on legacy carrier', () => {
    const resLegacyUnbundled = evaluateTrueCost({
      basePrice: 1800000,
      airlineCode: 'VN', // Vietnam Airlines Super Economy Lite (no luggage)
      isBaggageExplicitlyIncluded: false,
    });
    expect(resLegacyUnbundled.baggageState).toBe('ESTIMATED');
    expect(resLegacyUnbundled.isBaggageIncluded).toBe(false);
    const baggageFee = resLegacyUnbundled.itemizedFees.find(f => f.id === 'baggage_fee');
    expect(baggageFee?.status).toBe('ESTIMATED');
  });

  it('REQ-COST-003 / NC-033: Unknown mandatory cost is UNKNOWN, not zero', () => {
    const res = evaluateTrueCost({
      basePrice: 1000000,
      // No providerVerifiedAllIn and no airportTaxesProvided
    });
    expect(res.hasUnknownMandatoryCost).toBe(true);
    expect(res.hasUnknownMandatory).toBe(true);
    expect(res.totalLabel).toBe('Tổng ước tính');
    expect(res.pricingTransparencyDisclaimer).toContain('phụ phí xuất vé');
  });

  it('REQ-COST-005: providerVerifiedAllIn marks taxes KNOWN and 0 additional', () => {
    const res = evaluateTrueCost({
      basePrice: 1000000,
      providerVerifiedAllIn: true,
      providedHiddenCosts: { paymentFee: 0 },
    });
    const taxFee = res.itemizedFees.find(f => f.id === 'taxes_and_fees');
    expect(taxFee?.status).toBe('KNOWN');
    expect(taxFee?.amount).toBe(0);
    expect(res.hasUnknownMandatoryCost).toBe(false);
  });
});
