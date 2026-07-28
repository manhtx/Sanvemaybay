import { describe, expect, it } from "vitest";
import {
  buildGoogleFlightsUrl,
  buildSkyscannerUrl,
  getBestBookingUrl,
} from "./bookingUrls";

const params = {
  fromCode: "HAN",
  toCode: "BKK",
  departDate: "2026-09-01",
  returnDate: "2026-09-05",
};

describe("booking URL builders", () => {
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
