import { describe, expect, it } from "vitest";
import {
  getVietnamHolidayContext,
  getCarrierBaggagePolicy,
  getDestinationsByMotivation,
  VIETNAM_MAJOR_HOLIDAYS_2026,
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
});
