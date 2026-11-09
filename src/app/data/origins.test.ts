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

  it("safely handles null and undefined route arguments without throwing", () => {
    expect(uniqueOrigins(null)).toEqual([]);
    expect(uniqueOrigins(undefined)).toEqual([]);
  });

  it("safely handles non-array argument types without throwing", () => {
    expect(uniqueOrigins("HAN" as any)).toEqual([]);
    expect(uniqueOrigins(12345 as any)).toEqual([]);
    expect(uniqueOrigins({} as any)).toEqual([]);
    expect(uniqueOrigins(true as any)).toEqual([]);
  });

  it("trims whitespace and converts lowercase airport codes to uppercase", () => {
    const routes = [
      { originCode: " han ", originName: "Hà Nội" },
      { originCode: " sgn ", originName: "Hồ Chí Minh" },
    ];
    const result = uniqueOrigins(routes);
    expect(result).toEqual([
      { code: "HAN", name: "Hà Nội" },
      { code: "SGN", name: "Hồ Chí Minh" },
    ]);
  });

  it("deduplicates case-insensitively while preserving first seen casing", () => {
    const routes = [
      { originCode: "sgn", originName: "Sài Gòn" },
      { originCode: "SGN", originName: "TP.HCM" },
      { originCode: "Sgn", originName: "Tân Sơn Nhất" },
    ];
    const result = uniqueOrigins(routes);
    expect(result).toEqual([{ code: "SGN", name: "Sài Gòn" }]);
  });

  it("falls back to airport code when originName is empty string", () => {
    const routes = [{ originCode: "HAN", originName: "" }];
    expect(uniqueOrigins(routes)).toEqual([{ code: "HAN", name: "HAN" }]);
  });

  it("falls back to airport code when originName is whitespace only", () => {
    const routes = [{ originCode: "DAD", originName: "   " }];
    expect(uniqueOrigins(routes)).toEqual([{ code: "DAD", name: "DAD" }]);
  });

  it("falls back to airport code when originName is null or undefined", () => {
    const routes = [
      { originCode: "PQC", originName: null },
      { originCode: "CXR", originName: undefined },
    ];
    expect(uniqueOrigins(routes)).toEqual([
      { code: "PQC", name: "PQC" },
      { code: "CXR", name: "CXR" },
    ]);
  });

  it("skips entries with null, undefined, or empty originCode without throwing", () => {
    const routes = [
      { originCode: "HAN", originName: "Hà Nội" },
      { originCode: null as any, originName: "Unknown" },
      { originCode: undefined as any, originName: "Unknown" },
      { originCode: "", originName: "Unknown" },
      { originCode: "   ", originName: "Unknown" },
      { originCode: "SGN", originName: "TP. Hồ Chí Minh" },
    ];
    expect(uniqueOrigins(routes)).toEqual([
      { code: "HAN", name: "Hà Nội" },
      { code: "SGN", name: "TP. Hồ Chí Minh" },
    ]);
  });

  it("skips non-object or null elements within the routes array", () => {
    const routes = [
      null as any,
      undefined as any,
      "corrupt-string" as any,
      123 as any,
      { originCode: "DAD", originName: "Đà Nẵng" },
    ];
    expect(uniqueOrigins(routes)).toEqual([{ code: "DAD", name: "Đà Nẵng" }]);
  });

  it("preserves pure immutability on Object.freeze protected route arrays", () => {
    const frozenRoutes = Object.freeze([
      Object.freeze({ originCode: "HAN", originName: "Hà Nội" }),
      Object.freeze({ originCode: "SGN", originName: "Hồ Chí Minh" }),
    ]);

    expect(() => uniqueOrigins(frozenRoutes)).not.toThrow();
    expect(frozenRoutes).toHaveLength(2);
    expect(frozenRoutes[0].originCode).toBe("HAN");
  });

  it("handles a single route array correctly", () => {
    expect(uniqueOrigins([{ originCode: "VCA", originName: "Cần Thơ" }])).toEqual([
      { code: "VCA", name: "Cần Thơ" },
    ]);
  });

  it("preserves complex Vietnamese diacritics and Unicode characters in city names", () => {
    const routes = [
      { originCode: "HPH", originName: "Hải Phòng" },
      { originCode: "BMV", originName: "Buôn Ma Thuột" },
      { originCode: "VII", originName: "Vinh" },
      { originCode: "DIN", originName: "Điện Biên Phủ" },
      { originCode: "PXU", originName: "Pleiku" },
      { originCode: "TBB", originName: "Tuy Hòa" },
    ];
    const result = uniqueOrigins(routes);
    expect(result).toHaveLength(6);
    expect(result[1].name).toBe("Buôn Ma Thuột");
    expect(result[3].name).toBe("Điện Biên Phủ");
  });

  it("preserves sequential order across full Vietnam domestic network", () => {
    const domesticAirports = [
      { originCode: "HAN", originName: "Hà Nội" },
      { originCode: "SGN", originName: "TP. Hồ Chí Minh" },
      { originCode: "DAD", originName: "Đà Nẵng" },
      { originCode: "CXR", originName: "Nha Trang" },
      { originCode: "PQC", originName: "Phú Quốc" },
      { originCode: "HPH", originName: "Hải Phòng" },
      { originCode: "VCA", originName: "Cần Thơ" },
      { originCode: "BMV", originName: "Buôn Ma Thuột" },
      { originCode: "UIH", originName: "Quy Nhơn" },
      { originCode: "VII", originName: "Vinh" },
      { originCode: "THD", originName: "Thanh Hóa" },
      { originCode: "DIN", originName: "Điện Biên" },
      { originCode: "VDO", originName: "Vân Đồn" },
      { originCode: "PXU", originName: "Pleiku" },
      { originCode: "TBB", originName: "Tuy Hòa" },
      { originCode: "VKG", originName: "Rạch Giá" },
      { originCode: "CAH", originName: "Cà Mau" },
      { originCode: "VCS", originName: "Côn Đảo" },
    ];
    const result = uniqueOrigins(domesticAirports);
    expect(result).toHaveLength(18);
    expect(result.map((r) => r.code)).toEqual([
      "HAN", "SGN", "DAD", "CXR", "PQC", "HPH", "VCA", "BMV", "UIH",
      "VII", "THD", "DIN", "VDO", "PXU", "TBB", "VKG", "CAH", "VCS",
    ]);
  });

  it("handles global international gateway hubs accurately", () => {
    const globalGateways = [
      { originCode: "BKK", originName: "Bangkok" },
      { originCode: "SIN", originName: "Singapore" },
      { originCode: "KUL", originName: "Kuala Lumpur" },
      { originCode: "ICN", originName: "Seoul Incheon" },
      { originCode: "NRT", originName: "Tokyo Narita" },
      { originCode: "HND", originName: "Tokyo Haneda" },
      { originCode: "TPE", originName: "Taipei" },
      { originCode: "HKG", originName: "Hong Kong" },
      { originCode: "SYD", originName: "Sydney" },
      { originCode: "LHR", originName: "London Heathrow" },
      { originCode: "CDG", originName: "Paris Charles de Gaulle" },
      { originCode: "FRA", originName: "Frankfurt" },
    ];
    const result = uniqueOrigins(globalGateways);
    expect(result).toHaveLength(12);
    expect(result[0]).toEqual({ code: "BKK", name: "Bangkok" });
    expect(result[11]).toEqual({ code: "FRA", name: "Frankfurt" });
  });

  it("handles metropolitan multi-airport aliases inside origin list", () => {
    const metroRoutes = [
      { originCode: "BKK_ALL", originName: "Bangkok All Airports" },
      { originCode: "TYO_ALL", originName: "Tokyo All Airports" },
      { originCode: "BKK_ALL", originName: "Bangkok Duplicate" },
    ];
    const result = uniqueOrigins(metroRoutes);
    expect(result).toHaveLength(2);
    expect(result[0].code).toBe("BKK_ALL");
    expect(result[0].name).toBe("Bangkok All Airports");
    expect(result[1].code).toBe("TYO_ALL");
  });

  it("performance benchmark: deduplicates 10,000 route entries in sub-50ms", () => {
    const largeRouteSet = Array.from({ length: 10_000 }, (_, i) => ({
      originCode: `AIR_${i % 50}`,
      originName: `Airport City ${i % 50}`,
    }));

    const start = performance.now();
    const result = uniqueOrigins(largeRouteSet);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(50);
    expect(result).toHaveLength(50);
  });
});
