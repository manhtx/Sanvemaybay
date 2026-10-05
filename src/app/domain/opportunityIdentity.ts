/**
 * Canonical Opportunity Identity
 * Guarantees stable logical Opportunity Identity decoupled from:
 * - snapshot generations
 * - observation UUIDs
 * - transient price points
 * - database primary keys
 */

export interface OpportunityIdentityInput {
  originCode: string;
  destinationCode: string;
  departDate: string;
  returnDate?: string | null;
  airlineCode: string;
  flightNumber?: string | null;
  stops?: number | null;
}

export function generateOpportunityId(input: OpportunityIdentityInput): string {
  const parts = [
    input.originCode.trim().toUpperCase(),
    input.destinationCode.trim().toUpperCase(),
    input.departDate.trim(),
    (input.returnDate || "").trim(),
    input.airlineCode.trim().toUpperCase(),
    (input.flightNumber || "").trim().toUpperCase(),
    String(Math.max(0, input.stops ?? 0)),
  ];
  return parts.join(":");
}

export function parseOpportunityId(id: string): OpportunityIdentityInput | null {
  const clean = id.replace(/^observed-/, "").trim();
  const parts = clean.split(":");
  if (parts.length < 6) return null;

  return {
    originCode: parts[0],
    destinationCode: parts[1],
    departDate: parts[2],
    returnDate: parts[3] || null,
    airlineCode: parts[4],
    flightNumber: parts.length >= 7 ? parts[5] || null : null,
    stops: Number(parts.length >= 7 ? parts[6] : parts[5]) || 0,
  };
}

export function isSameLogicalOpportunity(
  a: OpportunityIdentityInput | string,
  b: OpportunityIdentityInput | string,
): boolean {
  const idA = typeof a === "string" ? a : generateOpportunityId(a);
  const idB = typeof b === "string" ? b : generateOpportunityId(b);
  return idA.replace(/^observed-/, "") === idB.replace(/^observed-/, "");
}
