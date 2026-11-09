import { describe, expect, it } from "vitest";
import {
  BookingParams,
  buildGoogleFlightsUrl,
  buildKayakUrl,
  buildSkyscannerUrl,
  getAllBookingOptions,
  getBestBookingUrl,
  getEffectiveDealBookingUrl,
} from "./bookingUrls";

const roundTripParams: BookingParams = {
  fromCode: "HAN",
  toCode: "BKK",
  departDate: "2026-09-01",
  returnDate: "2026-09-05",
};

const oneWayParams: BookingParams = {
  fromCode: "SGN",
  toCode: "ICN",
  departDate: "2026-10-15",
};

describe("booking URL builders (FLY-SEC-003, NC-015, NC-016, REQ-AFF-001, REQ-BOOK-001)", () => {
  describe("getEffectiveDealBookingUrl: affiliate fail-closed gating (NC-015, REQ-AFF-001)", () => {
    it("uses affiliate link only when linkKind is live_affiliate with network and url present", () => {
      const liveDeal = {
        affiliateUrl: "https://approved-affiliate.example/deal?id=123",
        affiliateNetwork: "accesstrade",
        linkKind: "live_affiliate",
        bookingUrl: "https://www.google.com/travel/flights?q=fallback",
      };
      expect(getEffectiveDealBookingUrl(liveDeal, "default-fallback")).toBe(
        "https://approved-affiliate.example/deal?id=123",
      );
    });

    it("fails closed to bookingUrl when linkKind is not live_affiliate", () => {
      const nonAffiliateDeal = {
        affiliateUrl: "https://approved-affiliate.example/deal?id=123",
        affiliateNetwork: "accesstrade",
        linkKind: "live_source",
        bookingUrl: "https://www.google.com/travel/flights?q=fallback",
      };
      expect(getEffectiveDealBookingUrl(nonAffiliateDeal, "default-fallback")).toBe(
        "https://www.google.com/travel/flights?q=fallback",
      );
    });

    it("fails closed when affiliateNetwork is empty or undefined", () => {
      const missingNetwork = {
        affiliateUrl: "https://approved-affiliate.example/deal?id=123",
        linkKind: "live_affiliate",
        bookingUrl: "https://www.google.com/travel/flights?q=fallback",
      };
      expect(getEffectiveDealBookingUrl(missingNetwork, "default-fallback")).toBe(
        "https://www.google.com/travel/flights?q=fallback",
      );
    });

    it("fails closed when affiliateUrl is empty string", () => {
      const emptyUrl = {
        affiliateUrl: "",
        affiliateNetwork: "accesstrade",
        linkKind: "live_affiliate",
        bookingUrl: "https://www.google.com/travel/flights?q=fallback",
      };
      expect(getEffectiveDealBookingUrl(emptyUrl, "default-fallback")).toBe(
        "https://www.google.com/travel/flights?q=fallback",
      );
    });

    it("falls back to the explicit fallback argument when bookingUrl is also absent", () => {
      expect(getEffectiveDealBookingUrl({}, "https://farely.app/default")).toBe(
        "https://farely.app/default",
      );
    });

    it("falls back to fallback argument when linkKind is undefined or unknown value", () => {
      expect(
        getEffectiveDealBookingUrl(
          { linkKind: "unknown_kind" as any, bookingUrl: undefined },
          "https://farely.app/fallback",
        ),
      ).toBe("https://farely.app/fallback");
    });

    it("fails closed when linkKind is historical or stale even if affiliateUrl is present", () => {
      const historicalDeal = {
        affiliateUrl: "https://approved-affiliate.example/deal?id=123",
        affiliateNetwork: "accesstrade",
        linkKind: "historical",
        bookingUrl: "https://www.google.com/travel/flights?q=fallback",
      };
      expect(getEffectiveDealBookingUrl(historicalDeal, "default-fallback")).toBe(
        "https://www.google.com/travel/flights?q=fallback",
      );

      const staleDeal = {
        affiliateUrl: "https://approved-affiliate.example/deal?id=123",
        affiliateNetwork: "accesstrade",
        linkKind: "stale",
        bookingUrl: "https://www.google.com/travel/flights?q=fallback",
      };
      expect(getEffectiveDealBookingUrl(staleDeal, "default-fallback")).toBe(
        "https://www.google.com/travel/flights?q=fallback",
      );
    });
  });

  describe("buildGoogleFlightsUrl: public query builder", () => {
    it("builds a round-trip Google Flights query with route, dates, Vietnamese lang, and VND currency", () => {
      const url = buildGoogleFlightsUrl(roundTripParams);
      expect(url).toContain("https://www.google.com/travel/flights?q=");
      expect(url).toContain("hl=vi");
      expect(url).toContain("curr=VND");

      const decoded = decodeURIComponent(url);
      expect(decoded).toContain("Flights to BKK from HAN on 2026-09-01 through 2026-09-05");
    });

    it("builds a one-way Google Flights query omitting through date", () => {
      const url = buildGoogleFlightsUrl(oneWayParams);
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain("Flights to ICN from SGN on 2026-10-15");
      expect(decoded).not.toContain("through");
    });

    it("builds one-way query when returnDate is explicitly undefined or empty string", () => {
      const url = buildGoogleFlightsUrl({ ...oneWayParams, returnDate: "" });
      const decoded = decodeURIComponent(url);
      expect(decoded).not.toContain("through");
    });
  });

  describe("buildSkyscannerUrl: YYMMDD date conversion and path format", () => {
    it("converts round-trip dates to YYMMDD format and lowercases airport codes", () => {
      const url = buildSkyscannerUrl(roundTripParams);
      expect(url).toBe(
        "https://www.skyscanner.net/transport/flights/han/bkk/260901/260905/?adults=1&cabinclass=economy&currency=vnd",
      );
    });

    it("converts one-way dates and omits return path segment", () => {
      const url = buildSkyscannerUrl(oneWayParams);
      expect(url).toBe(
        "https://www.skyscanner.net/transport/flights/sgn/icn/261015/?adults=1&cabinclass=economy&currency=vnd",
      );
    });
  });

  describe("buildKayakUrl: aggregator URL builder", () => {
    it("builds round-trip Kayak URL with hyphenated codes and YYYY-MM-DD dates", () => {
      const url = buildKayakUrl(roundTripParams);
      expect(url).toBe(
        "https://www.kayak.com/flights/HAN-BKK/2026-09-01/2026-09-05?adults=1&currency=VND",
      );
    });

    it("builds one-way Kayak URL omitting return date path segment", () => {
      const url = buildKayakUrl(oneWayParams);
      expect(url).toBe(
        "https://www.kayak.com/flights/SGN-ICN/2026-10-15?adults=1&currency=VND",
      );
    });
  });

  describe("getBestBookingUrl: primary provider selection (NC-016)", () => {
    it("strictly uses Google Flights comparison and does not invent fragile airline deep links", () => {
      const url = getBestBookingUrl({ ...roundTripParams, airlineCode: "VN", airline: "Vietnam Airlines" });
      expect(url).toContain("https://www.google.com/travel/flights?q=");
      expect(url).not.toContain("vietnamairlines.com");
    });
  });

  describe("getAllBookingOptions: options panel array", () => {
    it("returns exactly 3 approved providers with Google Flights marked as primary", () => {
      const options = getAllBookingOptions(roundTripParams);
      expect(options).toHaveLength(3);

      const [google, skyscanner, kayak] = options;
      expect(google.label).toBe("Google Flights");
      expect(google.isPrimary).toBe(true);
      expect(google.icon).toBe("✈️");

      expect(skyscanner.label).toBe("Skyscanner");
      expect(skyscanner.isPrimary).toBeUndefined();
      expect(skyscanner.icon).toBe("🔍");

      expect(kayak.label).toBe("Kayak");
      expect(kayak.isPrimary).toBeUndefined();
      expect(kayak.icon).toBe("🛶");

      // Verify Traveloka is NOT included due to proprietary non-IATA code mappings
      const hasTraveloka = options.some((opt) => opt.label.toLowerCase().includes("traveloka"));
      expect(hasTraveloka).toBe(false);
    });

    it("handles leap year departure dates in Skyscanner (e.g. 2028-02-29 -> 280229)", () => {
      const leapParams: BookingParams = {
        fromCode: "HAN",
        toCode: "NRT",
        departDate: "2028-02-29",
      };
      const url = buildSkyscannerUrl(leapParams);
      expect(url).toContain("/han/nrt/280229/");
    });

    it("preserves immutability of input BookingParams on Object.freeze", () => {
      const frozenParams = Object.freeze({
        fromCode: "SGN",
        toCode: "SIN",
        departDate: "2026-11-15",
        returnDate: "2026-11-20",
      });

      expect(() => buildGoogleFlightsUrl(frozenParams)).not.toThrow();
      expect(() => buildSkyscannerUrl(frozenParams)).not.toThrow();
      expect(() => buildKayakUrl(frozenParams)).not.toThrow();
      expect(() => getAllBookingOptions(frozenParams)).not.toThrow();
    });

    it("ensures all options returned by getAllBookingOptions have valid HTTPS URLs", () => {
      const options = getAllBookingOptions(roundTripParams);
      for (const opt of options) {
        expect(opt.url.startsWith("https://")).toBe(true);
        expect(opt.note.length).toBeGreaterThan(0);
      }
    });

    it("high-volume booking URL generator benchmark: 5,000 URL builds in sub-50ms", () => {
      const start = performance.now();
      for (let i = 0; i < 5000; i++) {
        buildGoogleFlightsUrl(roundTripParams);
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });
});
