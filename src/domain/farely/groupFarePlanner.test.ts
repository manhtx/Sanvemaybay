import { describe, it, expect } from "vitest";
import {
  calculateGroupFamilyFare,
  validatePassengerParty,
  assertTransparentGroupFareClaim,
  GroupFareValidationError,
  SingleAdultPricePromotedToFamilyTotalError,
  PassengerPartyComposition,
} from "./groupFarePlanner";

describe("Group & Family Fare Planner (F40 & F87)", () => {
  describe("validatePassengerParty", () => {
    it("accepts valid party with 1 adult", () => {
      expect(() => validatePassengerParty({ adults: 1, children: 0, infants: 0 })).not.toThrow();
    });

    it("accepts valid family with 2 adults, 2 children, 1 infant", () => {
      expect(() => validatePassengerParty({ adults: 2, children: 2, infants: 1 })).not.toThrow();
    });

    it("rejects party with zero adults", () => {
      expect(() => validatePassengerParty({ adults: 0, children: 1, infants: 0 })).toThrow(
        GroupFareValidationError
      );
    });

    it("rejects party where infants exceed adults (airline safety rule)", () => {
      expect(() => validatePassengerParty({ adults: 1, children: 0, infants: 2 })).toThrow(
        GroupFareValidationError
      );
      try {
        validatePassengerParty({ adults: 1, children: 0, infants: 2 });
      } catch (err: any) {
        expect(err.code).toBe("INFANTS_EXCEED_ADULTS");
      }
    });

    it("rejects negative counts or non-integers", () => {
      expect(() => validatePassengerParty({ adults: 1.5, children: 0, infants: 0 })).toThrow();
      expect(() => validatePassengerParty({ adults: 1, children: -1, infants: 0 })).toThrow();
    });
  });

  describe("calculateGroupFamilyFare", () => {
    it("computes accurate single adult one-way fare", () => {
      const breakdown = calculateGroupFamilyFare({
        baseAdultFarePerPerson: 1_000_000,
        party: { adults: 1, children: 0, infants: 0 },
        segmentsCount: 1,
      });

      expect(breakdown.adultSubtotal).toBe(1_000_000);
      expect(breakdown.childSubtotal).toBe(0);
      expect(breakdown.infantSubtotal).toBe(0);
      expect(breakdown.passengerFacilityFeesSubtotal).toBe(120_000);
      expect(breakdown.baggageSubtotal).toBe(0);
      expect(breakdown.totalPartyFare).toBe(1_120_000);
      expect(breakdown.perPersonAverageFare).toBe(1_120_000);
      expect(breakdown.fareScopeLabelVi).toContain("1 người lớn");
    });

    it("computes family with 2 adults, 1 child (75% base), 1 infant with baggage for round-trip", () => {
      const breakdown = calculateGroupFamilyFare({
        baseAdultFarePerPerson: 1_000_000,
        party: { adults: 2, children: 1, infants: 1 },
        segmentsCount: 2, // round-trip
        baggageSelection: {
          adultsBaggage: ["checked_20kg", "none"],
          childrenBaggage: ["none"],
        },
      });

      expect(breakdown.totalPassengerCount).toBe(4);
      // Adults: 1M * 2 adults * 2 segments = 4,000,000
      expect(breakdown.adultSubtotal).toBe(4_000_000);
      // Child: 750k * 1 child * 2 segments = 1,500,000
      expect(breakdown.childSubtotal).toBe(1_500_000);
      // Infant: default Math.max(110_000, 10% * 1M) = 110,000 * 2 segments = 220,000
      expect(breakdown.infantSubtotal).toBe(220_000);
      // Mandatory fees: (120k * 2 adults + 60k * 1 child + 0 infant) * 2 segments = 600,000
      expect(breakdown.passengerFacilityFeesSubtotal).toBe(600_000);
      // Baggage: 1 checked_20kg (220,000) * 2 segments = 440,000
      expect(breakdown.baggageSubtotal).toBe(440_000);

      // Total party fare: 4M + 1.5M + 220k + 600k + 440k = 6,760,000
      expect(breakdown.totalPartyFare).toBe(6_760_000);
      expect(breakdown.perPersonAverageFare).toBe(Math.round(6_760_000 / 4));
      expect(breakdown.fareScopeLabelVi).toBe(
        "Tổng giá cho 4 khách (2 người lớn, 1 trẻ em, 1 em bé)"
      );
    });
  });

  describe("F40 / F87 Invariant: assertTransparentGroupFareClaim", () => {
    it("passes when advertised price reflects true total party price", () => {
      const party: PassengerPartyComposition = { adults: 2, children: 1, infants: 0 };
      const breakdown = calculateGroupFamilyFare({
        baseAdultFarePerPerson: 1_000_000,
        party,
        segmentsCount: 1,
      });

      expect(() => {
        assertTransparentGroupFareClaim(breakdown.totalPartyFare, breakdown);
      }).not.toThrow();
    });

    it("throws SingleAdultPricePromotedToFamilyTotalError when 1-person price is advertised for a family", () => {
      const party: PassengerPartyComposition = { adults: 2, children: 1, infants: 0 };
      const breakdown = calculateGroupFamilyFare({
        baseAdultFarePerPerson: 1_000_000,
        party,
        segmentsCount: 1,
      });

      // Deceptive claim: advertising base single adult price (1,000,000 VND) for 3 passengers
      expect(() => {
        assertTransparentGroupFareClaim(1_000_000, breakdown);
      }).toThrow(SingleAdultPricePromotedToFamilyTotalError);
    });
  });
});
