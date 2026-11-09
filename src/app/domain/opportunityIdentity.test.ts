import { describe, expect, it } from "vitest";
import {
  generateOpportunityId,
  parseOpportunityId,
  isSameLogicalOpportunity,
  OpportunityIdentityInput
} from "./opportunityIdentity";

describe("Farely Pure Domain — Canonical Opportunity Identity (REQ-ID-002, REQ-DOM-011)", () => {
  const baseInput: OpportunityIdentityInput = {
    originCode: "HAN",
    destinationCode: "BKK",
    departDate: "2026-10-15",
    returnDate: "2026-10-20",
    airlineCode: "VJ",
    flightNumber: "VJ901",
    stops: 0
  };

  it("generates 7-part canonical colon-separated opportunity ID", () => {
    const id = generateOpportunityId(baseInput);
    expect(id).toBe("HAN:BKK:2026-10-15:2026-10-20:VJ:VJ901:0");
  });

  it("REQ-ID-002: Opportunity ID is decoupled from price and remains identical across price changes", () => {
    // Flight offers observed at 2,000,000 VND vs 3,500,000 VND have identical OpportunityId
    const offer1 = { ...baseInput, price: 2_000_000 };
    const offer2 = { ...baseInput, price: 3_500_000 };

    const id1 = generateOpportunityId(offer1);
    const id2 = generateOpportunityId(offer2);

    expect(id1).toBe(id2);
  });

  it("normalizes airport codes, airline codes, and flight numbers to uppercase", () => {
    const lowercaseInput: OpportunityIdentityInput = {
      originCode: "han",
      destinationCode: "bkk",
      departDate: "2026-10-15",
      returnDate: "2026-10-20",
      airlineCode: "vj",
      flightNumber: "vj901",
      stops: 0
    };

    const id = generateOpportunityId(lowercaseInput);
    expect(id).toBe("HAN:BKK:2026-10-15:2026-10-20:VJ:VJ901:0");
  });

  it("clamps negative stops or undefined to 0", () => {
    const negativeStops: OpportunityIdentityInput = {
      ...baseInput,
      stops: -2
    };
    expect(generateOpportunityId(negativeStops)).toBe("HAN:BKK:2026-10-15:2026-10-20:VJ:VJ901:0");

    const undefinedStops: OpportunityIdentityInput = {
      ...baseInput,
      stops: undefined
    };
    expect(generateOpportunityId(undefinedStops)).toBe("HAN:BKK:2026-10-15:2026-10-20:VJ:VJ901:0");
  });

  it("parses 7-part canonical opportunity ID into typed object", () => {
    const id = "HAN:BKK:2026-10-15:2026-10-20:VJ:VJ901:0";
    const parsed = parseOpportunityId(id);

    expect(parsed).toEqual({
      originCode: "HAN",
      destinationCode: "BKK",
      departDate: "2026-10-15",
      returnDate: "2026-10-20",
      airlineCode: "VJ",
      flightNumber: "VJ901",
      stops: 0
    });
  });

  it("parses legacy 6-part opportunity ID without flightNumber", () => {
    // 6-token format: ORIGIN:DEST:DEPART:RETURN:AIRLINE:STOPS
    const legacyId = "HAN:BKK:2026-10-15:2026-10-20:VJ:0";
    const parsed = parseOpportunityId(legacyId);

    expect(parsed).toEqual({
      originCode: "HAN",
      destinationCode: "BKK",
      departDate: "2026-10-15",
      returnDate: "2026-10-20",
      airlineCode: "VJ",
      flightNumber: null,
      stops: 0
    });
  });

  it("safely returns null on malformed or truncated ID strings", () => {
    expect(parseOpportunityId("")).toBeNull();
    expect(parseOpportunityId("random-uuid-string")).toBeNull();
    expect(parseOpportunityId("HAN:BKK:2026-10-15")).toBeNull();
  });

  it("isSameLogicalOpportunity performs polymorphic comparison and ignores legacy observed- prefix", () => {
    const canonicalId = "HAN:BKK:2026-10-15:2026-10-20:VJ:VJ901:0";
    const legacyPrefixedId = "observed-HAN:BKK:2026-10-15:2026-10-20:VJ:VJ901:0";

    // string vs string with legacy prefix
    expect(isSameLogicalOpportunity(canonicalId, legacyPrefixedId)).toBe(true);

    // object vs string with legacy prefix
    expect(isSameLogicalOpportunity(baseInput, legacyPrefixedId)).toBe(true);

    // object vs object
    expect(isSameLogicalOpportunity(baseInput, { ...baseInput })).toBe(true);

    // different destination
    expect(isSameLogicalOpportunity(baseInput, { ...baseInput, destinationCode: "NRT" })).toBe(false);
  });

  it("normalizes one-way flights with null, undefined, or empty string returnDate identically", () => {
    const oneWayNull: OpportunityIdentityInput = {
      ...baseInput,
      returnDate: null
    };
    const oneWayUndefined: OpportunityIdentityInput = {
      ...baseInput,
      returnDate: undefined
    };
    const oneWayEmpty: OpportunityIdentityInput = {
      ...baseInput,
      returnDate: "   "
    };

    const idNull = generateOpportunityId(oneWayNull);
    const idUndefined = generateOpportunityId(oneWayUndefined);
    const idEmpty = generateOpportunityId(oneWayEmpty);

    expect(idNull).toBe(idUndefined);
    expect(idNull).toBe(idEmpty);
    expect(idNull).toBe("HAN:BKK:2026-10-15::VJ:VJ901:0");
  });

  it("symmetric polymorphic equality comparison (string first, object second)", () => {
    const id = "HAN:BKK:2026-10-15:2026-10-20:VJ:VJ901:0";
    expect(isSameLogicalOpportunity(id, baseInput)).toBe(true);
    expect(isSameLogicalOpportunity(id, { ...baseInput, airlineCode: "VN" })).toBe(false);
  });

  it("verifies round-trip fidelity: parse(generate(input)) preserves all attributes", () => {
    const input: OpportunityIdentityInput = {
      originCode: "SGN",
      destinationCode: "NRT",
      departDate: "2026-11-20",
      returnDate: "2026-11-28",
      airlineCode: "JL",
      flightNumber: "JL750",
      stops: 1
    };

    const serialized = generateOpportunityId(input);
    const parsed = parseOpportunityId(serialized);

    expect(parsed).toEqual(input);
  });

  it("guarantees referential transparency and object immutability", () => {
    const frozenInput = Object.freeze({
      originCode: "DAD",
      destinationCode: "ICN",
      departDate: "2026-12-01",
      returnDate: "2026-12-07",
      airlineCode: "KE",
      flightNumber: "KE464",
      stops: 0
    });

    expect(() => generateOpportunityId(frozenInput)).not.toThrow();
    expect(() => isSameLogicalOpportunity(frozenInput, "DAD:ICN:2026-12-01:2026-12-07:KE:KE464:0")).not.toThrow();
    expect(frozenInput.airlineCode).toBe("KE");
  });
});
