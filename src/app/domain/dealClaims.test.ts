import { describe, expect, it } from "vitest";
import { evidenceGatedDealLabel } from "./dealClaims";

describe("Farely Pure Domain — Evidence-Gated Deal Claims (REQ-SCORE-001, NC-014)", () => {
  it("Invariant NC-014: caps strong labels when confidence is below 50%", () => {
    // Score of 99 or 100 with 49% confidence MUST NOT claim hot deal status
    expect(evidenceGatedDealLabel(100, 49)).toBe("Giá đáng chú ý");
    expect(evidenceGatedDealLabel(90, 25)).toBe("Giá đáng chú ý");
    expect(evidenceGatedDealLabel(60, 0)).toBe("Giá đáng chú ý");

    // Score < 60 with low confidence caps at "Giá quan sát"
    expect(evidenceGatedDealLabel(59, 49)).toBe("Giá quan sát");
    expect(evidenceGatedDealLabel(30, 10)).toBe("Giá quan sát");
  });

  it("verifies dual-condition boundary for top-tier 'Deal cực nóng' (score >= 90 && confidence >= 75)", () => {
    // Both met
    expect(evidenceGatedDealLabel(90, 75)).toBe("Deal cực nóng");
    expect(evidenceGatedDealLabel(95, 80)).toBe("Deal cực nóng");

    // Score 90, but confidence 74 falls back to 'Deal rất ngon'
    expect(evidenceGatedDealLabel(90, 74)).toBe("Deal rất ngon");

    // Confidence 75, but score 89 falls back to 'Deal rất ngon'
    expect(evidenceGatedDealLabel(89, 75)).toBe("Deal rất ngon");
  });

  it("verifies dual-condition boundary for second-tier 'Deal rất ngon' (score >= 80 && confidence >= 65)", () => {
    // Both met
    expect(evidenceGatedDealLabel(80, 65)).toBe("Deal rất ngon");
    expect(evidenceGatedDealLabel(85, 70)).toBe("Deal rất ngon");

    // Score 80, but confidence 64 falls back to 'Deal ngon'
    expect(evidenceGatedDealLabel(80, 64)).toBe("Deal ngon");

    // Confidence 65, but score 79 falls back to 'Deal ngon'
    expect(evidenceGatedDealLabel(79, 65)).toBe("Deal ngon");
  });

  it("verifies 'Deal ngon' baseline (score >= 70 && confidence >= 50)", () => {
    expect(evidenceGatedDealLabel(70, 50)).toBe("Deal ngon");
    expect(evidenceGatedDealLabel(75, 55)).toBe("Deal ngon");
    expect(evidenceGatedDealLabel(79, 64)).toBe("Deal ngon");

    // Score 70 with confidence 49 collapses to 'Giá đáng chú ý'
    expect(evidenceGatedDealLabel(70, 49)).toBe("Giá đáng chú ý");
  });

  it("verifies 'Giá đáng chú ý' band (score >= 60 with confidence >= 50)", () => {
    expect(evidenceGatedDealLabel(60, 50)).toBe("Giá đáng chú ý");
    expect(evidenceGatedDealLabel(69, 100)).toBe("Giá đáng chú ý");
  });

  it("verifies 'Giá quan sát' fallback (score < 60)", () => {
    expect(evidenceGatedDealLabel(59, 100)).toBe("Giá quan sát");
    expect(evidenceGatedDealLabel(0, 100)).toBe("Giá quan sát");
    expect(evidenceGatedDealLabel(40, 60)).toBe("Giá quan sát");
  });

  it("sanitizes adversarial out-of-bound numbers (clamps to [0, 100])", () => {
    // Negative score clamps to 0
    expect(evidenceGatedDealLabel(-10, 80)).toBe("Giá quan sát");

    // Score > 100 clamps to 100
    expect(evidenceGatedDealLabel(150, 80)).toBe("Deal cực nóng");

    // Negative confidence clamps to 0 (which is < 50)
    expect(evidenceGatedDealLabel(90, -20)).toBe("Giá đáng chú ý");

    // Confidence > 100 clamps to 100
    expect(evidenceGatedDealLabel(90, 120)).toBe("Deal cực nóng");
  });

  it("sanitizes NaN and undefined inputs safely to 0", () => {
    expect(evidenceGatedDealLabel(NaN, 80)).toBe("Giá quan sát");
    expect(evidenceGatedDealLabel(90, NaN)).toBe("Giá đáng chú ý");
    expect(evidenceGatedDealLabel(NaN, NaN)).toBe("Giá quan sát");
  });

  it("resiliently coerces string-encoded numeric inputs", () => {
    expect(evidenceGatedDealLabel("90" as any, "75" as any)).toBe("Deal cực nóng");
    expect(evidenceGatedDealLabel("80" as any, "65" as any)).toBe("Deal rất ngon");
    expect(evidenceGatedDealLabel("70" as any, "50" as any)).toBe("Deal ngon");
    expect(evidenceGatedDealLabel("60" as any, "30" as any)).toBe("Giá đáng chú ý");
  });

  it("metamorphic monotonicity: increasing confidence never degrades label conviction", () => {
    const tierRanking: Record<string, number> = {
      "Giá quan sát": 0,
      "Giá đáng chú ý": 1,
      "Deal ngon": 2,
      "Deal rất ngon": 3,
      "Deal cực nóng": 4
    };

    const testScores = [50, 65, 75, 85, 95];
    for (const score of testScores) {
      let prevRank = -1;
      for (let conf = 0; conf <= 100; conf += 10) {
        const label = evidenceGatedDealLabel(score, conf);
        const currentRank = tierRanking[label];
        expect(currentRank).toBeGreaterThanOrEqual(prevRank);
        prevRank = currentRank;
      }
    }
  });
});
