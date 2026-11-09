import { describe, expect, it } from "vitest";
import { uniqueOrigins } from "./origins";

describe("uniqueOrigins (REQ-DOM-004, REQ-DOM-001)", () => {
  it("deduplicates enabled tracked routes while preserving first origin label", () => {
    expect(uniqueOrigins([
      { originCode: "HAN", originName: "Hà Nội" },
      { originCode: "HAN", originName: "Nội Bài" },
      { originCode: "HPH", originName: "Hải Phòng" },
    ])).toEqual([
      { code: "HAN", name: "Hà Nội" },
      { code: "HPH", name: "Hải Phòng" },
    ]);
  });

  it("preserves insertion order across multiple diverse airport hubs", () => {
    const routes = [
      { originCode: "SGN", originName: "TP. Hồ Chí Minh" },
      { originCode: "HAN", originName: "Hà Nội" },
      { originCode: "DAD", originName: "Đà Nẵng" },
      { originCode: "SGN", originName: "Tân Sơn Nhất" },
      { originCode: "PQC", originName: "Phú Quốc" },
      { originCode: "DAD", originName: "Đà Nẵng Quốc Tế" },
      { originCode: "CXR", originName: "Cam Ranh / Nha Trang" },
    ];

    const result = uniqueOrigins(routes);
    expect(result).toHaveLength(5);
    expect(result.map((r) => r.code)).toEqual(["SGN", "HAN", "DAD", "PQC", "CXR"]);
    expect(result[0].name).toBe("TP. Hồ Chí Minh");
    expect(result[2].name).toBe("Đà Nẵng");
  });

  it("handles repeated identical entries cleanly", () => {
    const routes = [
      { originCode: "HAN", originName: "Hà Nội" },
      { originCode: "HAN", originName: "Hà Nội" },
      { originCode: "HAN", originName: "Hà Nội" },
    ];
    expect(uniqueOrigins(routes)).toEqual([{ code: "HAN", name: "Hà Nội" }]);
  });

  it("returns an empty list when route data is empty", () => {
    expect(uniqueOrigins([])).toEqual([]);
  });
});
