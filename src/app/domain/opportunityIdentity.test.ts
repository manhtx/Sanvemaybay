import { describe, it, expect } from "vitest";
import {
  generateOpportunityId,
  parseOpportunityId,
  isSameLogicalOpportunity,
} from "./opportunityIdentity";

describe("opportunityIdentity - Stable Logical Identity", () => {
  it("builds identical opportunity IDs regardless of transient observation UUID or price", () => {
    const offer1 = {
      originCode: "han",
      destinationCode: "bkk",
      departDate: "2026-11-10",
      returnDate: "2026-11-15",
      airlineCode: "vj",
      flightNumber: "VJ901",
      stops: 0,
    };

    const offer2 = {
      originCode: "HAN",
      destinationCode: "BKK",
      departDate: "2026-11-10",
      returnDate: "2026-11-15",
      airlineCode: "VJ",
      flightNumber: "vj901",
      stops: 0,
    };

    const id1 = generateOpportunityId(offer1);
    const id2 = generateOpportunityId(offer2);

    expect(id1).toBe("HAN:BKK:2026-11-10:2026-11-15:VJ:VJ901:0");
    expect(id1).toBe(id2);
    expect(isSameLogicalOpportunity(offer1, offer2)).toBe(true);
  });

  it("distinguishes different itineraries even on the same route and dates", () => {
    const directOffer = {
      originCode: "HAN",
      destinationCode: "BKK",
      departDate: "2026-11-10",
      returnDate: "2026-11-15",
      airlineCode: "VJ",
      flightNumber: "VJ901",
      stops: 0,
    };

    const connectingOffer = {
      originCode: "HAN",
      destinationCode: "BKK",
      departDate: "2026-11-10",
      returnDate: "2026-11-15",
      airlineCode: "AK",
      flightNumber: "AK513",
      stops: 1,
    };

    expect(generateOpportunityId(directOffer)).not.toBe(generateOpportunityId(connectingOffer));
    expect(isSameLogicalOpportunity(directOffer, connectingOffer)).toBe(false);
  });

  it("correctly parses canonical opportunity id", () => {
    const id = "SGN:NRT:2026-12-01:2026-12-08:VN:VN300:0";
    const parsed = parseOpportunityId(id);
    expect(parsed).toEqual({
      originCode: "SGN",
      destinationCode: "NRT",
      departDate: "2026-12-01",
      returnDate: "2026-12-08",
      airlineCode: "VN",
      flightNumber: "VN300",
      stops: 0,
    });
  });
});
