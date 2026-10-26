import { describe, it, expect } from "vitest";
import {
  validateMultiCityItinerary,
  FictitiousSingleOfferError,
  InvalidMultiCitySequenceError,
  ItinerarySlice,
  isMetropolitanAirportChange,
  getMetropolitanMinimumTransitMinutes,
} from "./multiCityItinerary";

describe("Multi-City Itinerary Coherence (F41)", () => {
  it("rejects itinerary with fewer than 2 slices", () => {
    const singleSlice: ItinerarySlice[] = [
      {
        sliceIndex: 0,
        originCode: "HAN",
        destinationCode: "NRT",
        departDate: "2026-11-01",
        airlineCode: "VN",
        airlineName: "Vietnam Airlines",
        price: 4_500_000,
      },
    ];

    expect(() => validateMultiCityItinerary({ slices: singleSlice })).toThrow(
      InvalidMultiCitySequenceError
    );
  });

  it("rejects chronologically inverted flight slices", () => {
    const invertedSlices: ItinerarySlice[] = [
      {
        sliceIndex: 0,
        originCode: "HAN",
        destinationCode: "NRT",
        departDate: "2026-11-10",
        airlineCode: "VN",
        airlineName: "Vietnam Airlines",
        price: 4_500_000,
      },
      {
        sliceIndex: 1,
        originCode: "NRT",
        destinationCode: "HAN",
        departDate: "2026-11-05", // Earlier than leg 1!
        airlineCode: "VN",
        airlineName: "Vietnam Airlines",
        price: 4_200_000,
      },
    ];

    expect(() => validateMultiCityItinerary({ slices: invertedSlices })).toThrow(
      InvalidMultiCitySequenceError
    );
  });

  it("detects and flags open-jaw surface transport segments", () => {
    const openJawSlices: ItinerarySlice[] = [
      {
        sliceIndex: 0,
        originCode: "HAN",
        destinationCode: "NRT", // Arrive Tokyo
        departDate: "2026-11-01",
        airlineCode: "VN",
        airlineName: "Vietnam Airlines",
        price: 4_500_000,
      },
      {
        sliceIndex: 1,
        originCode: "KIX", // Depart Osaka (open-jaw ground transfer Tokyo -> Osaka)
        destinationCode: "HAN",
        departDate: "2026-11-08",
        airlineCode: "VN",
        airlineName: "Vietnam Airlines",
        price: 4_200_000,
      },
    ];

    const result = validateMultiCityItinerary({ slices: openJawSlices });
    expect(result.isValid).toBe(true);
    expect(result.hasOpenJawSurfaceSegment).toBe(true);
    expect(result.openJawNotices[0]).toContain("NRT → KIX");
    expect(result.coherenceType).toBe("SINGLE_THROUGH_TICKET");
  });

  it("throws FictitiousSingleOfferError when joining unrelated LCC one-ways as a single ticket (F41 Invariant)", () => {
    const unrelatedSlices: ItinerarySlice[] = [
      {
        sliceIndex: 0,
        originCode: "HAN",
        destinationCode: "SIN",
        departDate: "2026-11-01",
        airlineCode: "VN",
        airlineName: "Vietnam Airlines",
        price: 2_500_000,
      },
      {
        sliceIndex: 1,
        originCode: "SIN",
        destinationCode: "DPS",
        departDate: "2026-11-03",
        airlineCode: "VJ", // Vietjet, completely separate booking, no interline protection with VN
        airlineName: "Vietjet Air",
        price: 1_500_000,
      },
    ];

    // Attempting to claim unrelated carriers as a single guaranteed ticket is forbidden
    expect(() =>
      validateMultiCityItinerary({
        slices: unrelatedSlices,
        claimedAsSingleTicket: true,
      })
    ).toThrow(FictitiousSingleOfferError);
  });

  it("permits separate self-transfer when explicitly tagged as SELF_TRANSFER_UNPROTECTED", () => {
    const unrelatedSlices: ItinerarySlice[] = [
      {
        sliceIndex: 0,
        originCode: "HAN",
        destinationCode: "SIN",
        departDate: "2026-11-01",
        airlineCode: "VN",
        airlineName: "Vietnam Airlines",
        price: 2_500_000,
      },
      {
        sliceIndex: 1,
        originCode: "SIN",
        destinationCode: "DPS",
        departDate: "2026-11-03",
        airlineCode: "VJ",
        airlineName: "Vietjet Air",
        price: 1_500_000,
      },
    ];

    const result = validateMultiCityItinerary({
      slices: unrelatedSlices,
      claimedAsSingleTicket: false, // Transparent: honest separate tickets
    });

    expect(result.isValid).toBe(true);
    expect(result.coherenceType).toBe("SELF_TRANSFER_UNPROTECTED");
    expect(result.selfTransferWarningVi).toContain("nối chuyến tự túc (Self-transfer)");
  });

  describe("SOL-03: Metropolitan Split-Airport Identification", () => {
    it("identifies inter-airport transfers across metropolitan airport pairs", () => {
      expect(isMetropolitanAirportChange("HND", "NRT")).toBe(true);
      expect(isMetropolitanAirportChange("NRT", "HND")).toBe(true);
      expect(isMetropolitanAirportChange("DMK", "BKK")).toBe(true);
      expect(isMetropolitanAirportChange("hnd", "nrt")).toBe(true); // Case-insensitive
      expect(isMetropolitanAirportChange("HAN", "SGN")).toBe(false);
    });

    it("evaluates required ground transit minutes and flags metropolitan transfer warnings", () => {
      expect(getMetropolitanMinimumTransitMinutes("HND", "NRT")).toBe(210);
      expect(getMetropolitanMinimumTransitMinutes("DMK", "BKK")).toBe(210);
      expect(getMetropolitanMinimumTransitMinutes("HAN", "SGN")).toBe(0);

      const metroSlices: ItinerarySlice[] = [
        {
          sliceIndex: 0,
          originCode: "HAN",
          destinationCode: "HND",
          departDate: "2026-11-01",
          airlineCode: "VN",
          airlineName: "Vietnam Airlines",
          price: 5_000_000,
        },
        {
          sliceIndex: 1,
          originCode: "NRT", // Metropolitan transfer Tokyo HND -> NRT
          destinationCode: "HAN",
          departDate: "2026-11-05",
          airlineCode: "VN",
          airlineName: "Vietnam Airlines",
          price: 5_000_000,
        },
      ];

      const validation = validateMultiCityItinerary({ slices: metroSlices });
      expect(validation.isValid).toBe(true);
      expect(validation.hasOpenJawSurfaceSegment).toBe(true);
      expect(validation.connectionRisk).toBe("HIGH");
      expect(validation.openJawNotices[0]).toContain("Metropolitan transfer: HND → NRT");
      expect(validation.openJawNotices[0]).toContain("210 phút");
    });

    it("normalizes ISO date formats and handles whitespace in airline codes cleanly", () => {
      const slices: ItinerarySlice[] = [
        {
          sliceIndex: 0,
          originCode: "HAN ",
          destinationCode: "SIN",
          departDate: "2026-11-01T08:30:00Z",
          airlineCode: "vn ",
          airlineName: "Vietnam Airlines",
          price: 2_500_000.4,
        },
        {
          sliceIndex: 1,
          originCode: "SIN",
          destinationCode: "DPS",
          departDate: "2026-11-03",
          airlineCode: " AF ", // SkyTeam partner with VN
          airlineName: "Air France",
          price: -100, // Non-positive price clamped
        },
      ];

      const validation = validateMultiCityItinerary({ slices, claimedAsSingleTicket: true });
      expect(validation.isValid).toBe(true);
      expect(validation.coherenceType).toBe("SINGLE_THROUGH_TICKET");
      expect(validation.totalPrice).toBe(2_500_000);
    });
  });
});
