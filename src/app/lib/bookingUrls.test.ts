import { describe, expect, it } from "vitest";
import {
  buildGoogleFlightsUrl,
  buildSkyscannerUrl,
  getBestBookingUrl,
  getEffectiveDealBookingUrl,
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
});
