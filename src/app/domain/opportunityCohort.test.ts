import { describe, expect, it } from "vitest";
import { evaluateCohortComparison, extractCohortCriteria, ObservationData } from "./opportunityCohort";

describe("evaluateCohortComparison - Comparable Cohort Intelligence", () => {
  const currentObs: ObservationData = {
    id: "obs-1",
    originCode: "HAN",
    destinationCode: "BKK",
    departDate: "2026-10-19",
    returnDate: "2026-10-23",
    price: 4570000,
    stops: 0,
    airlineCode: "VJ",
    observedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    scanRunId: "scan-3",
  };

  it("extracts correct cohort criteria", () => {
    const criteria = extractCohortCriteria(currentObs);
    expect(criteria.originCode).toBe("HAN");
    expect(criteria.destinationCode).toBe("BKK");
    expect(criteria.tripType).toBe("roundtrip");
    expect(criteria.departMonth).toBe("2026-10");
    expect(criteria.stopsClass).toBe("direct");
    expect(criteria.durationDaysBucket).toBe("short"); // 4 days
  });

  it("evaluates defensible cohort comparison with preferred copy (Section 10)", () => {
    // 14 observations with median ~ 5,850,000
    const cohort: ObservationData[] = Array.from({ length: 14 }, (_, i) => ({
      id: `cohort-${i}`,
      originCode: "HAN",
      destinationCode: "BKK",
      departDate: "2026-10-19",
      returnDate: "2026-10-23",
      price: 5500000 + i * 50000,
      stops: 0,
      observedAt: new Date(Date.now() - (i * 60 + 20) * 60 * 1000).toISOString(),
      scanRunId: `scan-${(i % 3) + 1}`,
    }));
    // include currentObs in cohort
    cohort.push(currentObs);

    const result = evaluateCohortComparison(currentObs, cohort);
    expect(result.sampleSize).toBe(15);
    expect(result.deltaPercent).toBeGreaterThanOrEqual(15);
    expect(result.comparisonExplanation).toContain("thấp hơn median của");
    expect(result.comparisonExplanation).toContain("mức giá tương đương Farely đã quan sát");

    // Evidence checks
    expect(result.evidence.tier).toBe("STRONG");
    expect(result.evidence.label).toBe("BẰNG CHỨNG MẠNH");
    expect(result.evidence.summaryText).toContain("quan sát ·");
    expect(result.evidence.summaryText).toContain("lượt quét");
  });

  it("Negative Control: refuses comparison claims when sample size < 5", () => {
    const sparseCohort: ObservationData[] = [
      currentObs,
      {
        id: "sparse-1",
        originCode: "HAN",
        destinationCode: "BKK",
        departDate: "2026-10-19",
        returnDate: "2026-10-23",
        price: 5000000,
        stops: 0,
        observedAt: new Date().toISOString(),
      },
    ];

    const result = evaluateCohortComparison(currentObs, sparseCohort);
    expect(result.sampleSize).toBe(2);
    expect(result.isDiscounted).toBe(false);
    expect(result.comparisonExplanation).toContain("Đang tích lũy bằng chứng");
    expect(result.evidence.tier).toBe("ACCUMULATING");
    expect(result.evidence.label).toBe("ĐANG TÍCH LŨY BẰNG CHỨNG");
  });
});
