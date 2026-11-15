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

const PARSE_CACHE = new Map<string, OpportunityIdentityInput>();
const ID_CACHE = new WeakMap<object, string>();

export function generateOpportunityId(input: OpportunityIdentityInput): string {
  if (typeof input === "object" && input !== null) {
    const cached = ID_CACHE.get(input);
    if (cached !== undefined) return cached;
  }

  const o = input.originCode.trim().toUpperCase();
  const d = input.destinationCode.trim().toUpperCase();
  const dep = input.departDate.trim();
  const ret = input.returnDate ? input.returnDate.trim() : "";
  const a = input.airlineCode.trim().toUpperCase();
  const fn = input.flightNumber ? input.flightNumber.trim().toUpperCase() : "";
  const st = String(Math.max(0, input.stops ?? 0));

  const id = o + ":" + d + ":" + dep + ":" + ret + ":" + a + ":" + fn + ":" + st;
  if (typeof input === "object" && input !== null) {
    ID_CACHE.set(input, id);
  }
  return id;
}

export function parseOpportunityId(id: string): OpportunityIdentityInput | null {
  const cached = PARSE_CACHE.get(id);
  if (cached !== undefined) return cached;

  const clean = id.startsWith("observed-") ? id.slice(9).trim() : id.trim();
  const parts = clean.split(":");
  if (parts.length < 6) return null;

  const res: OpportunityIdentityInput = {
    originCode: parts[0],
    destinationCode: parts[1],
    departDate: parts[2],
    returnDate: parts[3] || null,
    airlineCode: parts[4],
    flightNumber: parts.length >= 7 ? parts[5] || null : null,
    stops: Number(parts.length >= 7 ? parts[6] : parts[5]) || 0,
  };

  ID_CACHE.set(res, id.startsWith("observed-") ? clean : id);
  if (PARSE_CACHE.size < 5000) {
    PARSE_CACHE.set(id, res);
  }
  return res;
}

export function isSameLogicalOpportunity(
  a: OpportunityIdentityInput | string,
  b: OpportunityIdentityInput | string,
): boolean {
  if (a === b) return true;
  const idA = typeof a === "string" ? a : generateOpportunityId(a);
  const idB = typeof b === "string" ? b : generateOpportunityId(b);
  if (idA === idB) return true;
  const cleanA = idA.startsWith("observed-") ? idA.slice(9) : idA;
  const cleanB = idB.startsWith("observed-") ? idB.slice(9) : idB;
  return cleanA === cleanB;
}
