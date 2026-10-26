import { describe, expect, it } from "vitest";
import {
  buildGoogleFlightsUrl,
  buildSkyscannerUrl,
  getBestBookingUrl,
  getEffectiveDealBookingUrl,
  isSafeOutboundBookingUrl,
} from "./bookingUrls";

const params = {
  fromCode: "HAN",
  toCode: "BKK",
  departDate: "2026-09-01",
  returnDate: "2026-09-05",
};

describe("booking URL builders", () => {
  it("uses affiliate links only for server-labelled live affiliate deals", () => {
    expect(getEffectiveDealBookingUrl({
      affiliateUrl: "https://partner.example/deal",
      affiliateNetwork: "approved-network",
      linkKind: "live_affiliate",
      bookingUrl: "https://www.google.com/travel/flights?q=source",
    }, "fallback")).toBe("https://partner.example/deal");
    expect(getEffectiveDealBookingUrl({
      affiliateUrl: "https://partner.example/deal",
      affiliateNetwork: "approved-network",
      linkKind: "live_source",
      bookingUrl: "https://www.google.com/travel/flights?q=source",
    }, "fallback")).toContain("google.com");
  });

  it("builds a Google Flights query with route and dates", () => {
    const url = decodeURIComponent(buildGoogleFlightsUrl(params));
    expect(url).toContain("Flights to BKK from HAN on 2026-09-01 through 2026-09-05");
  });

  it("converts Skyscanner dates to YYMMDD", () => {
    expect(buildSkyscannerUrl(params)).toContain("/han/bkk/260901/260905/");
  });

  it("uses a stable comparison search instead of an airline deep link", () => {
    expect(getBestBookingUrl({ ...params, airlineCode: "VN" })).toContain(
      "google.com/travel/flights",
    );
  });

  it("validates outbound booking URLs against whitelist and HTTPS protocol", () => {
    expect(isSafeOutboundBookingUrl("https://www.google.com/travel/flights")).toBe(true);
    expect(isSafeOutboundBookingUrl("https://vietjetair.com/vi/flights")).toBe(true);
    expect(isSafeOutboundBookingUrl("https://booking.bambooairways.com/search")).toBe(true);
    expect(isSafeOutboundBookingUrl("https://google.com./travel/flights")).toBe(true); // Trailing dot FQDN
    
    // Insecure / spoofed / malicious protocols
    expect(isSafeOutboundBookingUrl("http://www.google.com/travel/flights")).toBe(false); // Insecure HTTP
    expect(isSafeOutboundBookingUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeOutboundBookingUrl("https://evilvietjetair.com/search")).toBe(false);
    expect(isSafeOutboundBookingUrl("https://vietjetair.com.attacker.com/steal")).toBe(false);
    expect(isSafeOutboundBookingUrl("")).toBe(false);
  });
});
