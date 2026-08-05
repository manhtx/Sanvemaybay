import { describe, expect, it } from "vitest";
import { uniqueOrigins } from "./origins";

describe("uniqueOrigins", () => {
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

  it("returns an empty list when route data is unavailable", () => {
    expect(uniqueOrigins([])).toEqual([]);
  });
});
