import { describe, expect, it } from "vitest";
import {
  CANONICAL_TRAVEL_ENTITIES,
  getServedAirports,
  resolveCanonicalAirportOrCity,
} from "./travelEntities";

describe("resolveCanonicalAirportOrCity", () => {
  describe("IATA code resolution", () => {
    it("resolves exact 3-letter IATA codes case-insensitively", () => {
      expect(resolveCanonicalAirportOrCity("BKK")?.code).toBe("BKK");
      expect(resolveCanonicalAirportOrCity("bkk")?.code).toBe("BKK");
      expect(resolveCanonicalAirportOrCity("HAN")?.code).toBe("HAN");
      expect(resolveCanonicalAirportOrCity("han")?.code).toBe("HAN");
      expect(resolveCanonicalAirportOrCity("SGN")?.code).toBe("SGN");
      expect(resolveCanonicalAirportOrCity("sgn")?.code).toBe("SGN");
      expect(resolveCanonicalAirportOrCity("DAD")?.code).toBe("DAD");
      expect(resolveCanonicalAirportOrCity("dad")?.code).toBe("DAD");
    });
  });

  describe("Vietnamese diacritics & city name normalization", () => {
    it("resolves domestic Vietnamese cities with and without tone marks", () => {
      expect(resolveCanonicalAirportOrCity("Hà Nội")?.code).toBe("HAN");
      expect(resolveCanonicalAirportOrCity("Ha Noi")?.code).toBe("HAN");
      expect(resolveCanonicalAirportOrCity("Đà Nẵng")?.code).toBe("DAD");
      expect(resolveCanonicalAirportOrCity("Da Nang")?.code).toBe("DAD");
      expect(resolveCanonicalAirportOrCity("TP. Hồ Chí Minh")?.code).toBe("SGN");
      expect(resolveCanonicalAirportOrCity("TP. Ho Chi Minh")?.code).toBe("SGN");
      expect(resolveCanonicalAirportOrCity("Saigon")?.code).toBe("SGN");
      expect(resolveCanonicalAirportOrCity("Sai Gon")?.code).toBe("SGN");
      expect(resolveCanonicalAirportOrCity("Phú Quốc")?.code).toBe("PQC");
      expect(resolveCanonicalAirportOrCity("Phu Quoc")?.code).toBe("PQC");
    });

    it("resolves Asian international hub cities", () => {
      expect(resolveCanonicalAirportOrCity("Bangkok")?.code).toBe("BKK_ALL");
      expect(resolveCanonicalAirportOrCity("bangkok")?.code).toBe("BKK_ALL");
      expect(resolveCanonicalAirportOrCity("Seoul")?.code).toBe("ICN");
      expect(resolveCanonicalAirportOrCity("Tokyo")?.code).toBe("TYO_ALL");
      expect(resolveCanonicalAirportOrCity("Singapore")?.code).toBe("SIN");
      expect(resolveCanonicalAirportOrCity("Taipei")?.code).toBe("TPE");
    });
  });

  describe("global geographic destinations (Europe, Middle East, Oceania)", () => {
    it("resolves European gateways", () => {
      expect(resolveCanonicalAirportOrCity("Paris")?.code).toBe("CDG");
      expect(resolveCanonicalAirportOrCity("Amsterdam")?.code).toBe("AMS");
      expect(resolveCanonicalAirportOrCity("Schiphol")?.code).toBe("AMS");
      expect(resolveCanonicalAirportOrCity("Istanbul")?.code).toBe("IST");
    });

    it("resolves Middle Eastern hubs", () => {
      expect(resolveCanonicalAirportOrCity("Dubai")?.code).toBe("DXB");
      expect(resolveCanonicalAirportOrCity("Doha")?.code).toBe("DOH");
    });

    it("resolves Oceanic gateways", () => {
      expect(resolveCanonicalAirportOrCity("Sydney")?.code).toBe("SYD");
      expect(resolveCanonicalAirportOrCity("Melbourne")?.code).toBe("MEL");
    });
  });

  describe("facility aliases & substring matching", () => {
    it("resolves facility aliases like airport names", () => {
      expect(resolveCanonicalAirportOrCity("Noi Bai")?.code).toBe("HAN");
      expect(resolveCanonicalAirportOrCity("Tan Son Nhat")?.code).toBe("SGN");
      expect(resolveCanonicalAirportOrCity("Suvarnabhumi")?.code).toBe("BKK");
      expect(resolveCanonicalAirportOrCity("Narita")?.code).toBe("NRT");
      expect(resolveCanonicalAirportOrCity("Charles de Gaulle")?.code).toBe("CDG");
    });

    it("handles compound queries via substring matching", () => {
      expect(resolveCanonicalAirportOrCity("san bay noi bai")?.code).toBe("HAN");
      expect(resolveCanonicalAirportOrCity("bangkok airport")?.code).toBe("BKK_ALL");
    });
  });

  describe("Negative Control: sister airport disambiguation", () => {
    it("strictly separates Bangkok sister airports", () => {
      expect(resolveCanonicalAirportOrCity("Don Mueang")?.code).toBe("DMK");
      expect(resolveCanonicalAirportOrCity("DMK")?.code).toBe("DMK");
      expect(resolveCanonicalAirportOrCity("Suvarnabhumi")?.code).toBe("BKK");
      expect(resolveCanonicalAirportOrCity("BKK")?.code).toBe("BKK");
    });

    it("strictly separates Tokyo sister airports", () => {
      expect(resolveCanonicalAirportOrCity("Haneda")?.code).toBe("HND");
      expect(resolveCanonicalAirportOrCity("HND")?.code).toBe("HND");
      expect(resolveCanonicalAirportOrCity("Narita")?.code).toBe("NRT");
      expect(resolveCanonicalAirportOrCity("NRT")?.code).toBe("NRT");
    });
  });

  describe("edge cases & negative queries", () => {
    it("returns undefined for unrecognized, empty, or whitespace queries", () => {
      expect(resolveCanonicalAirportOrCity("Atlantis")).toBeUndefined();
      expect(resolveCanonicalAirportOrCity("")).toBeUndefined();
      expect(resolveCanonicalAirportOrCity("   ")).toBeUndefined();
      expect(resolveCanonicalAirportOrCity(undefined)).toBeUndefined();
      expect(resolveCanonicalAirportOrCity("xyz999")).toBeUndefined();
    });
  });
});

describe("getServedAirports", () => {
  it("resolves served airports for metro aggregate codes", () => {
    expect(getServedAirports("BKK_ALL")).toEqual(["BKK", "DMK"]);
    expect(getServedAirports("TYO_ALL")).toEqual(["NRT", "HND"]);
  });

  it("preserves single individual airport codes without expansion", () => {
    expect(getServedAirports("BKK")).toEqual(["BKK"]);
    expect(getServedAirports("DMK")).toEqual(["DMK"]);
    expect(getServedAirports("NRT")).toEqual(["NRT"]);
    expect(getServedAirports("HAN")).toEqual(["HAN"]);
    expect(getServedAirports("SGN")).toEqual(["SGN"]);
  });

  it("handles empty or falsy codes safely", () => {
    expect(getServedAirports("")).toEqual([]);
    expect(getServedAirports("   ")).toEqual([]);
  });
});

describe("CANONICAL_TRAVEL_ENTITIES catalog integrity", () => {
  it("guarantees unique primary entity codes across the entire registry", () => {
    const codes = CANONICAL_TRAVEL_ENTITIES.map((e) => e.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it("ensures every entity has required metadata and non-empty aliases", () => {
    for (const entity of CANONICAL_TRAVEL_ENTITIES) {
      expect(entity.code).toBeTruthy();
      expect(entity.name).toBeTruthy();
      expect(entity.country).toBeTruthy();
      expect(entity.region).toBeTruthy();
      expect(Array.isArray(entity.aliases)).toBe(true);
      expect(entity.aliases.length).toBeGreaterThan(0);
    }
  });

  it("resolves full official Vietnamese airport names truthfully", () => {
    expect(resolveCanonicalAirportOrCity("Sân bay Quốc tế Nội Bài")?.code).toBe("HAN");
    expect(resolveCanonicalAirportOrCity("Sân bay Quốc tế Tân Sơn Nhất")?.code).toBe("SGN");
    expect(resolveCanonicalAirportOrCity("Sân bay Quốc tế Đà Nẵng")?.code).toBe("DAD");
    expect(resolveCanonicalAirportOrCity("Sân bay Quốc tế Cam Ranh")?.code).toBe("CXR");
    expect(resolveCanonicalAirportOrCity("Sân bay Quốc tế Phú Quốc")?.code).toBe("PQC");
  });

  it("resolves secondary domestic Vietnamese airports by city or alias", () => {
    expect(resolveCanonicalAirportOrCity("Hải Phòng")?.code).toBe("HPH");
    expect(resolveCanonicalAirportOrCity("Cát Bi")?.code).toBe("HPH");
    expect(resolveCanonicalAirportOrCity("Vinh")?.code).toBe("VII");
  });

  it("getServedAirports returns fallback single-element array for arbitrary non-metro airport codes", () => {
    expect(getServedAirports("DAD")).toEqual(["DAD"]);
    expect(getServedAirports("CXR")).toEqual(["CXR"]);
    expect(getServedAirports("XYZ")).toEqual(["XYZ"]);
  });

  it("benchmark: 1,000 canonical entity resolutions execute in sub-50ms", () => {
    const queries = ["HAN", "bkk", "Đà Nẵng", "Noi Bai", "SGN", "Tokyo", "Paris", "Singapore"];
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      resolveCanonicalAirportOrCity(queries[i % queries.length]);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
