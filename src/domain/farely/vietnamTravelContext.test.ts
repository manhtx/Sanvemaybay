import { describe, expect, it } from "vitest";
import {
  getVietnamHolidayContext,
  getCarrierBaggagePolicy,
  getDestinationsByMotivation,
  isValidCalendarDate,
  DEFAULT_CARRIER_BAGGAGE_POLICY,
} from "./vietnamTravelContext";

describe("Vietnam Travel Context (F86 & F87)", () => {
  it("identifies Tet Nguyen Dan 2026 peak demand period correctly", () => {
    const holiday = getVietnamHolidayContext("2026-02-18");
    expect(holiday).not.toBeNull();
    expect(holiday?.name).toContain("Tết Nguyên Đán");
    expect(holiday?.peakDemand).toBe(true);
  });

  it("identifies April 30 - May 1 holiday correctly", () => {
    const holiday = getVietnamHolidayContext("2026-05-01");
    expect(holiday).not.toBeNull();
    expect(holiday?.name).toContain("30/4 - 1/5");
  });

  it("returns null for non-holiday regular dates", () => {
    const holiday = getVietnamHolidayContext("2026-03-15");
    expect(holiday).toBeNull();
  });

  it("provides truthful carrier baggage policies for domestic airlines", () => {
    const vn = getCarrierBaggagePolicy("VN");
    expect(vn?.standardCarryOnKg).toBe(12);
    expect(vn?.standardCheckedBagIncluded).toBe(true);
    expect(vn?.defaultCheckedKgIfIncluded).toBe(23);

    const vj = getCarrierBaggagePolicy("VJ");
    expect(vj?.standardCarryOnKg).toBe(7);
    expect(vj?.standardCheckedBagIncluded).toBe(false);

    const qh = getCarrierBaggagePolicy("qh");
    expect(qh?.standardCarryOnKg).toBe(7);

    expect(getCarrierBaggagePolicy("NONEXISTENT")).toBeNull();
  });

  it("maps travel motivations to destinations correctly (F87)", () => {
    const beachDestinations = getDestinationsByMotivation("BEACH");
    expect(beachDestinations).toContain("PQC");
    expect(beachDestinations).toContain("DAD");
    expect(beachDestinations).toContain("CXR");

    const trekkingDestinations = getDestinationsByMotivation("NATURE_TREKKING");
    expect(trekkingDestinations).toContain("DLI");
    expect(trekkingDestinations).toContain("BMV");
  });

  it("validates calendar dates strictly and rejects impossible dates (L01/L05)", () => {
    expect(isValidCalendarDate("2026-02-18")).toBe(true);
    expect(isValidCalendarDate("2026-04-30")).toBe(true);

    // 2026 is not a leap year: Feb 29 does not exist
    expect(isValidCalendarDate("2026-02-29")).toBe(false);
    expect(isValidCalendarDate("2026-02-31")).toBe(false);
    expect(isValidCalendarDate("2026-04-31")).toBe(false); // April has 30 days
    expect(isValidCalendarDate("invalid-date")).toBe(false);
    expect(isValidCalendarDate("")).toBe(false);

    // Holiday check rejects invalid calendar dates
    expect(getVietnamHolidayContext("2026-02-31")).toBeNull();
    expect(getVietnamHolidayContext("2026-02-29")).toBeNull();
  });

  it("normalizes date delimiters with slashes or dots (L05)", () => {
    const slashDate = getVietnamHolidayContext("2026/02/18");
    expect(slashDate).not.toBeNull();
    expect(slashDate?.name).toContain("Tết Nguyên Đán");

    const dotDate = getVietnamHolidayContext("2026.05.01");
    expect(dotDate).not.toBeNull();
    expect(dotDate?.name).toContain("30/4 - 1/5");
  });

  it("provides transparent fallback policy for unlisted carriers when requested (L11)", () => {
    const fallback = getCarrierBaggagePolicy("UNKNOWN_AIRLINE", true);
    expect(fallback).not.toBeNull();
    expect(fallback?.carrierCode).toBe("DEFAULT");
    expect(fallback?.standardCarryOnKg).toBe(7);
    expect(fallback?.standardCheckedBagIncluded).toBe(false);
    expect(fallback?.baggageNoteVi).toContain("CAAV");

    // Without fallback flag, maintains null for backwards compatibility
    expect(getCarrierBaggagePolicy("UNKNOWN_AIRLINE")).toBeNull();
    expect(getCarrierBaggagePolicy("UNKNOWN_AIRLINE", false)).toBeNull();

    // Guard against non-string inputs
    expect(getCarrierBaggagePolicy(null as any)).toBeNull();
    expect(getCarrierBaggagePolicy(undefined as any)).toBeNull();
    expect(getCarrierBaggagePolicy(null as any, true)).toBe(DEFAULT_CARRIER_BAGGAGE_POLICY);
  });

  describe("SOL-TRAVELCTX-01: Enhanced Holiday & Baggage Dimension Tests", () => {
    it("identifies Tet Duong Lich 2027 holiday context accurately", () => {
      const newYearHoliday = getVietnamHolidayContext("2027-01-01");
      expect(newYearHoliday).not.toBeNull();
      expect(newYearHoliday?.name).toContain("Tết Dương lịch 2027");
      expect(newYearHoliday?.peakDemand).toBe(true);
    });

    it("exposes CAAV compliant standard carry-on dimensions on carrier baggage policies", () => {
      const vn = getCarrierBaggagePolicy("VN");
      expect(vn?.maxCarryOnDimensionsCm).toBe("56 x 36 x 23 cm");

      const vj = getCarrierBaggagePolicy("VJ");
      expect(vj?.maxCarryOnDimensionsCm).toBe("56 x 36 x 23 cm");

      const fallback = getCarrierBaggagePolicy("UNKNOWN", true);
      expect(fallback?.maxCarryOnDimensionsCm).toContain("56 x 36 x 23 cm");
    });
  });
});
