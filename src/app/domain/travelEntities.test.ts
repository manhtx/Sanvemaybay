import { describe, expect, it } from "vitest";
import { getServedAirports, resolveCanonicalAirportOrCity } from "./travelEntities";

describe("resolveCanonicalAirportOrCity", () => {
  it("resolves exact 3-letter IATA codes", () => {
    expect(resolveCanonicalAirportOrCity("BKK")?.code).toBe("BKK");
    expect(resolveCanonicalAirportOrCity("bkk")?.code).toBe("BKK");
    expect(resolveCanonicalAirportOrCity("HAN")?.code).toBe("HAN");
    expect(resolveCanonicalAirportOrCity("SGN")?.code).toBe("SGN");
    expect(resolveCanonicalAirportOrCity("DAD")?.code).toBe("DAD");
  });

  it("resolves city names with and without Vietnamese accents", () => {
    expect(resolveCanonicalAirportOrCity("Bangkok")?.code).toBe("BKK_ALL");
    expect(resolveCanonicalAirportOrCity("bangkok")?.code).toBe("BKK_ALL");
    expect(resolveCanonicalAirportOrCity("Hà Nội")?.code).toBe("HAN");
    expect(resolveCanonicalAirportOrCity("Ha Noi")?.code).toBe("HAN");
    expect(resolveCanonicalAirportOrCity("Đà Nẵng")?.code).toBe("DAD");
    expect(resolveCanonicalAirportOrCity("Da Nang")?.code).toBe("DAD");
    expect(resolveCanonicalAirportOrCity("TP. Hồ Chí Minh")?.code).toBe("SGN");
    expect(resolveCanonicalAirportOrCity("Saigon")?.code).toBe("SGN");
    expect(resolveCanonicalAirportOrCity("Seoul")?.code).toBe("ICN");
    expect(resolveCanonicalAirportOrCity("Tokyo")?.code).toBe("TYO_ALL");
  });

  it("resolves country or airport aliases", () => {
    expect(resolveCanonicalAirportOrCity("Thái Lan")?.code).toBe("BKK_ALL");
    expect(resolveCanonicalAirportOrCity("Suvarnabhumi")?.code).toBe("BKK");
    expect(resolveCanonicalAirportOrCity("Noi Bai")?.code).toBe("HAN");
    expect(resolveCanonicalAirportOrCity("Tan Son Nhat")?.code).toBe("SGN");
    expect(resolveCanonicalAirportOrCity("Narita")?.code).toBe("NRT");
  });

  it("Negative Control: airport disambiguation between metropolitan sister airports", () => {
    // Bangkok sister airports
    expect(resolveCanonicalAirportOrCity("Don Mueang")?.code).toBe("DMK");
    expect(resolveCanonicalAirportOrCity("don mueang")?.code).toBe("DMK");
    expect(resolveCanonicalAirportOrCity("DMK")?.code).toBe("DMK");
    expect(resolveCanonicalAirportOrCity("Suvarnabhumi")?.code).toBe("BKK");
    expect(resolveCanonicalAirportOrCity("BKK")?.code).toBe("BKK");

    // Tokyo sister airports
    expect(resolveCanonicalAirportOrCity("Haneda")?.code).toBe("HND");
    expect(resolveCanonicalAirportOrCity("haneda")?.code).toBe("HND");
    expect(resolveCanonicalAirportOrCity("HND")?.code).toBe("HND");
    expect(resolveCanonicalAirportOrCity("Narita")?.code).toBe("NRT");
    expect(resolveCanonicalAirportOrCity("NRT")?.code).toBe("NRT");
  });

  it("returns undefined for unrecognized queries", () => {
    expect(resolveCanonicalAirportOrCity("Atlantis")).toBeUndefined();
    expect(resolveCanonicalAirportOrCity("")).toBeUndefined();
    expect(resolveCanonicalAirportOrCity("xyz999")).toBeUndefined();
  });

  it("resolves served airports for metro areas and individual airports", () => {
    expect(getServedAirports("BKK_ALL")).toEqual(["BKK", "DMK"]);
    expect(getServedAirports("BKK")).toEqual(["BKK"]);
    expect(getServedAirports("DMK")).toEqual(["DMK"]);
    expect(getServedAirports("TYO_ALL")).toEqual(["NRT", "HND"]);
    expect(getServedAirports("NRT")).toEqual(["NRT"]);
    expect(getServedAirports("HAN")).toEqual(["HAN"]);
  });
});

