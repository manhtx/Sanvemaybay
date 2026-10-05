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
});
