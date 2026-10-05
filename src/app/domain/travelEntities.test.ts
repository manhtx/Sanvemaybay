import { describe, expect, it } from "vitest";
import { resolveCanonicalAirportOrCity } from "./travelEntities";

describe("resolveCanonicalAirportOrCity", () => {
  it("resolves exact 3-letter IATA codes", () => {
    expect(resolveCanonicalAirportOrCity("BKK")?.code).toBe("BKK");
    expect(resolveCanonicalAirportOrCity("bkk")?.code).toBe("BKK");
    expect(resolveCanonicalAirportOrCity("HAN")?.code).toBe("HAN");
    expect(resolveCanonicalAirportOrCity("SGN")?.code).toBe("SGN");
    expect(resolveCanonicalAirportOrCity("DAD")?.code).toBe("DAD");
  });

  it("resolves city names with and without Vietnamese accents", () => {
    expect(resolveCanonicalAirportOrCity("Bangkok")?.code).toBe("BKK");
    expect(resolveCanonicalAirportOrCity("bangkok")?.code).toBe("BKK");
    expect(resolveCanonicalAirportOrCity("Hà Nội")?.code).toBe("HAN");
    expect(resolveCanonicalAirportOrCity("Ha Noi")?.code).toBe("HAN");
    expect(resolveCanonicalAirportOrCity("Đà Nẵng")?.code).toBe("DAD");
    expect(resolveCanonicalAirportOrCity("Da Nang")?.code).toBe("DAD");
    expect(resolveCanonicalAirportOrCity("TP. Hồ Chí Minh")?.code).toBe("SGN");
    expect(resolveCanonicalAirportOrCity("Saigon")?.code).toBe("SGN");
    expect(resolveCanonicalAirportOrCity("Seoul")?.code).toBe("ICN");
    expect(resolveCanonicalAirportOrCity("Tokyo")?.code).toBe("NRT");
  });

  it("resolves country or airport aliases", () => {
    expect(resolveCanonicalAirportOrCity("Thái Lan")?.code).toBe("BKK");
    expect(resolveCanonicalAirportOrCity("Suvarnabhumi")?.code).toBe("BKK");
    expect(resolveCanonicalAirportOrCity("Noi Bai")?.code).toBe("HAN");
    expect(resolveCanonicalAirportOrCity("Tan Son Nhat")?.code).toBe("SGN");
    expect(resolveCanonicalAirportOrCity("Narita")?.code).toBe("NRT");
  });

  it("returns undefined for unrecognized queries", () => {
    expect(resolveCanonicalAirportOrCity("Atlantis")).toBeUndefined();
    expect(resolveCanonicalAirportOrCity("")).toBeUndefined();
    expect(resolveCanonicalAirportOrCity("xyz999")).toBeUndefined();
  });
});
