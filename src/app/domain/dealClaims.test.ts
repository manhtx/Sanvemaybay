import { describe, expect, it } from "vitest";
import { evidenceGatedDealLabel } from "./dealClaims";

describe("evidenceGatedDealLabel", () => {
  it("caps strong legacy server labels when confidence is low", () => {
    expect(evidenceGatedDealLabel(99, 25)).toBe("Giá đáng chú ý");
    expect(evidenceGatedDealLabel(59, 25)).toBe("Giá quan sát");
  });

  it("requires both score and confidence for the strongest claims", () => {
    expect(evidenceGatedDealLabel(90, 74)).toBe("Deal rất ngon");
    expect(evidenceGatedDealLabel(90, 75)).toBe("Deal cực nóng");
    expect(evidenceGatedDealLabel(80, 65)).toBe("Deal rất ngon");
  });
});
