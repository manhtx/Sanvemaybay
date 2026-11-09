import { describe, expect, it } from "vitest";
import { evaluateTrueCost } from "./costEpistemic";

describe("evaluateTrueCost - Negative Controls & Epistemic Correctness", () => {
  it("Negative Control: missing baggage data becomes UNKNOWN and NEVER 'included'", () => {
    // Carrier "XX" is unknown (neither budget nor recognized legacy)
    const result = evaluateTrueCost({
      basePrice: 1500000,
      airlineCode: "XX",
      region: "asia",
    });

    expect(result.isBaggageIncluded).toBe(false);
    expect(result.baggageState).toBe("UNKNOWN");

    const baggageComponent = result.components.find((c) => c.category === "checked_baggage");
    expect(baggageComponent?.state).toBe("UNKNOWN");
    expect(baggageComponent?.amount).toBeNull(); // UNKNOWN != ZERO
  });

  it("marks budget airlines as ESTIMATED baggage extra", () => {
    const result = evaluateTrueCost({
      basePrice: 1200000,
      airlineCode: "VJ",
      region: "domestic",
    });

    expect(result.isBaggageIncluded).toBe(false);
    expect(result.baggageState).toBe("ESTIMATED");
    expect(result.estimatedAdditional).toBe(280000);
    expect(result.estimatedTotal).toBe(1480000);
    expect(result.totalLabel).toBe("Tổng ước tính"); // Never "Tổng thực tế phải trả"
  });

  it("uses 'Tổng ước tính' when unknown payment or baggage exists", () => {
    const result = evaluateTrueCost({
      basePrice: 2000000,
      airlineCode: "VN",
      isBaggageExplicitlyIncluded: true,
    });

    expect(result.isBaggageIncluded).toBe(true);
    // Payment fee is still UNKNOWN
    expect(result.hasUnknownMandatory).toBe(true);
    expect(result.totalLabel).toBe("Tổng ước tính");
  });

  it("Negative Control: carrier identity alone (e.g. VN/SQ) does NOT mark baggage as KNOWN", () => {
    const result = evaluateTrueCost({
      basePrice: 2000000,
      airlineCode: "VN",
    });

    expect(result.isBaggageIncluded).toBe(false);
    expect(result.baggageState).toBe("UNKNOWN");
    const baggageComponent = result.components.find((c) => c.category === "checked_baggage");
    expect(baggageComponent?.state).toBe("UNKNOWN");
    expect(baggageComponent?.amount).toBeNull();
  });

  it("normalizes array-format providedHiddenCosts with Vietnamese labels", () => {
    const result = evaluateTrueCost({
      basePrice: 1800000,
      airlineCode: "VJ",
      providedHiddenCosts: [
        { label: "Phí hành lý ký gửi 20kg", amount: 320000 },
        { label: "Phụ phí thanh toán trực tuyến", amount: 55000 },
        { label: "Thuế và phí sân bay bắt buộc", amount: 210000 }
      ]
    });

    expect(result.baggageState).toBe("KNOWN");
    const baggageComp = result.components.find((c) => c.category === "checked_baggage");
    expect(baggageComp?.amount).toBe(320000);
    expect(baggageComp?.state).toBe("KNOWN");

    const paymentComp = result.components.find((c) => c.category === "payment_fee");
    expect(paymentComp?.amount).toBe(55000);
    expect(paymentComp?.state).toBe("KNOWN");

    const taxComp = result.components.find((c) => c.category === "taxes_fees");
    expect(taxComp?.amount).toBe(210000);
    expect(taxComp?.state).toBe("KNOWN");

    // All mandatory are known
    expect(result.hasUnknownMandatoryCost).toBe(false);
    expect(result.hasUnknownMandatory).toBe(false);
    expect(result.totalLabel).toBe("Tổng chi phí");
  });

  it("evaluates low-cost carrier codes with correct domestic vs international rates", () => {
    const lccCodes = ["AK", "FD", "TR", "5J", "SL", "VU"];
    for (const code of lccCodes) {
      // Domestic
      const domestic = evaluateTrueCost({
        basePrice: 900000,
        airlineCode: code,
        isInternational: false
      });
      expect(domestic.baggageState).toBe("ESTIMATED");
      expect(domestic.estimatedAdditional).toBe(280000);

      // International
      const intl = evaluateTrueCost({
        basePrice: 1500000,
        airlineCode: code,
        isInternational: true
      });
      expect(intl.baggageState).toBe("ESTIMATED");
      expect(intl.estimatedAdditional).toBe(450000);
    }
  });

  it("marks taxes KNOWN and 0 when providerVerifiedAllIn is true", () => {
    const result = evaluateTrueCost({
      basePrice: 1500000,
      airlineCode: "QH",
      providerVerifiedAllIn: true
    });

    const taxFee = result.itemizedFees.find((f) => f.id === "taxes_and_fees");
    expect(taxFee).toBeDefined();
    expect(taxFee?.status).toBe("KNOWN");
    expect(taxFee?.amount).toBe(0);
  });

  it("transitions totalLabel to 'Tổng chi phí' only when all mandatory costs are verified", () => {
    // Incomplete fees: missing payment fee
    const incomplete = evaluateTrueCost({
      basePrice: 2000000,
      airlineCode: "VN",
      providerVerifiedAllIn: true,
      isBaggageExplicitlyIncluded: true
      // paymentFee missing -> UNKNOWN
    });
    expect(incomplete.hasUnknownMandatory).toBe(true);
    expect(incomplete.totalLabel).toBe("Tổng ước tính");

    // Complete fees: providerVerifiedAllIn + paymentFee + explicit baggage
    const complete = evaluateTrueCost({
      basePrice: 2000000,
      airlineCode: "VN",
      providerVerifiedAllIn: true,
      isBaggageExplicitlyIncluded: true,
      providedHiddenCosts: { paymentFee: 0 }
    });
    expect(complete.hasUnknownMandatory).toBe(false);
    expect(complete.totalLabel).toBe("Tổng chi phí");
  });

  it("emits accurate pricing transparency disclaimer based on unknown mandatory costs", () => {
    const unknownMandatory = evaluateTrueCost({
      basePrice: 1000000,
      airlineCode: "VJ"
    });
    expect(unknownMandatory.pricingTransparencyDisclaimer).toContain("chưa bao gồm đầy đủ");

    const verifiedAllIn = evaluateTrueCost({
      basePrice: 1000000,
      airlineCode: "VJ",
      providerVerifiedAllIn: true,
      providedHiddenCosts: { paymentFee: 0 }
    });
    expect(verifiedAllIn.hasUnknownMandatoryCost).toBe(false);
    expect(verifiedAllIn.pricingTransparencyDisclaimer).toContain("đã xác nhận bao gồm thuế");
  });

  it("calculates minVerifiableTotal as basePrice + knownMandatoryTotal", () => {
    const result = evaluateTrueCost({
      basePrice: 2500000,
      providedHiddenCosts: { airportTaxes: 350000, paymentFee: 50000 }
    });

    // Taxes are mandatory: 350000
    expect(result.knownMandatoryTotal).toBe(350000);
    expect(result.minVerifiableTotal).toBe(2850000); // 2500000 + 350000
  });

  it("guarantees seat selection is always represented as OPTIONAL with null amount", () => {
    const result = evaluateTrueCost({
      basePrice: 1200000,
      airlineCode: "VJ"
    });

    const seat = result.components.find((c) => c.category === "seat_selection");
    expect(seat).toBeDefined();
    expect(seat?.state).toBe("OPTIONAL");
    expect(seat?.amount).toBeNull();
  });

  it("preserves immutability and never mutates input parameters", () => {
    const input = Object.freeze({
      basePrice: 1500000,
      airlineCode: "VJ",
      providedHiddenCosts: Object.freeze({ baggageFee: 300000 })
    });

    expect(() => evaluateTrueCost(input)).not.toThrow();
  });
});
