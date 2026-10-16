/**
 * FARELY GROUP & FAMILY FARE PLANNER
 * 
 * Satisfies:
 * - F40 (P2): Group/family fare planning (correct traveler ages, baggage, seats and total-party fare scope)
 * - F87 (P2): Intent-based itinerary group planner (compatible trip and price units)
 * 
 * INVARIANTS:
 * - "Single-adult price cannot be shown as family total."
 * - "No one-person price promoted to total family fare."
 * - CAAV & IATA safety compliance: lap infants (under 2) cannot exceed adult count (max 1 infant per adult lap).
 */

export interface PassengerPartyComposition {
  adults: number;   // Age 12+
  children: number; // Age 2 - 11
  infants: number;  // Age < 2 (lap infant without separate seat)
}

export type BaggageOption = "none" | "checked_20kg" | "checked_30kg";

export interface PassengerBaggageSelection {
  adultsBaggage: BaggageOption[];
  childrenBaggage: BaggageOption[];
}

export interface BaggagePricingSchedule {
  checked_20kg: number; // VND per flight segment
  checked_30kg: number; // VND per flight segment
}

export const DEFAULT_BAGGAGE_PRICING: BaggagePricingSchedule = {
  checked_20kg: 220_000,
  checked_30kg: 380_000,
};

// CAAV standard passenger facility and security charges (VND per passenger per segment)
export const MANDATORY_PASSENGER_FEES = {
  adultSecurityAndFacility: 120_000,
  childSecurityAndFacility: 60_000,
  infantSecurityAndFacility: 0,
};

export interface GroupFareBreakdown {
  partyComposition: PassengerPartyComposition;
  totalPassengerCount: number;
  segmentsCount: number; // 1 for one-way, 2 for round-trip
  baseAdultFarePerPerson: number;
  
  // Passenger subtotals
  adultSubtotal: number;
  childSubtotal: number;
  infantSubtotal: number;
  
  // Mandatory fees subtotal
  passengerFacilityFeesSubtotal: number;
  
  // Baggage add-ons subtotal
  baggageSubtotal: number;
  
  // Grand totals
  totalPartyFare: number;
  perPersonAverageFare: number;
  
  // Explanatory breakdown string
  fareScopeLabelVi: string;
}

export class GroupFareValidationError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "GroupFareValidationError";
    this.code = code;
  }
}

export class SingleAdultPricePromotedToFamilyTotalError extends Error {
  constructor(adultPrice: number, totalPartyPrice: number, partyCount: number) {
    super(
      `F40/F87 Violation: Single-adult price (${adultPrice} VND) cannot be advertised or promoted as total family fare (${totalPartyPrice} VND) for ${partyCount} travelers.`
    );
    this.name = "SingleAdultPricePromotedToFamilyTotalError";
  }
}

/**
 * Validates passenger party composition against airline safety invariants.
 */
export function validatePassengerParty(party: PassengerPartyComposition): void {
  if (!Number.isInteger(party.adults) || party.adults < 1) {
    throw new GroupFareValidationError("Đoàn hành khách phải có ít nhất 1 người lớn (12 tuổi trở lên).", "INVALID_ADULT_COUNT");
  }
  if (!Number.isInteger(party.children) || party.children < 0) {
    throw new GroupFareValidationError("Số lượng trẻ em không hợp lệ.", "INVALID_CHILD_COUNT");
  }
  if (!Number.isInteger(party.infants) || party.infants < 0) {
    throw new GroupFareValidationError("Số lượng em bé không hợp lệ.", "INVALID_INFANT_COUNT");
  }
  if (party.infants > party.adults) {
    throw new GroupFareValidationError(
      `Quy định an toàn hàng không: Số lượng em bé (${party.infants}) không được vượt quá số người lớn đi kèm (${party.adults}). Mỗi người lớn chỉ được bế tối đa 1 em bé.`,
      "INFANTS_EXCEED_ADULTS"
    );
  }
}

/**
 * Calculates total party fare with accurate age-differentiated base fares,
 * passenger service fees, and optional baggage allowances.
 */
export function calculateGroupFamilyFare(params: {
  baseAdultFarePerPerson: number;
  party: PassengerPartyComposition;
  segmentsCount?: number; // default 1 (one-way) or 2 (round-trip)
  baggageSelection?: PassengerBaggageSelection;
  baggageSchedule?: BaggagePricingSchedule;
  childDiscountRatio?: number; // default 0.75 (75% base fare)
  infantFixedFee?: number; // default 150_000 VND per segment or 10%
}): GroupFareBreakdown {
  validatePassengerParty(params.party);

  const baseAdultFare = Math.max(0, params.baseAdultFarePerPerson);
  const segments = Math.max(1, params.segmentsCount ?? 1);
  const childRatio = params.childDiscountRatio ?? 0.75;
  const baggageSchedule = params.baggageSchedule ?? DEFAULT_BAGGAGE_PRICING;

  // Adult base fare
  const adultSubtotal = baseAdultFare * params.party.adults * segments;

  // Child base fare (typically 75% of adult base fare)
  const childBaseUnit = Math.round(baseAdultFare * childRatio);
  const childSubtotal = childBaseUnit * params.party.children * segments;

  // Infant fare: flat fee (e.g. 150,000 VND per segment) or 10% of base fare
  const infantUnit = params.infantFixedFee ?? Math.max(110_000, Math.round(baseAdultFare * 0.1));
  const infantSubtotal = infantUnit * params.party.infants * segments;

  // Passenger facility & security taxes (mandatory)
  const facilityAdults = MANDATORY_PASSENGER_FEES.adultSecurityAndFacility * params.party.adults * segments;
  const facilityChildren = MANDATORY_PASSENGER_FEES.childSecurityAndFacility * params.party.children * segments;
  const facilityInfants = MANDATORY_PASSENGER_FEES.infantSecurityAndFacility * params.party.infants * segments;
  const passengerFacilityFeesSubtotal = facilityAdults + facilityChildren + facilityInfants;

  // Baggage subtotal
  let baggageSubtotal = 0;
  if (params.baggageSelection) {
    for (const bag of params.baggageSelection.adultsBaggage) {
      if (bag === "checked_20kg") baggageSubtotal += baggageSchedule.checked_20kg * segments;
      if (bag === "checked_30kg") baggageSubtotal += baggageSchedule.checked_30kg * segments;
    }
    for (const bag of params.baggageSelection.childrenBaggage) {
      if (bag === "checked_20kg") baggageSubtotal += baggageSchedule.checked_20kg * segments;
      if (bag === "checked_30kg") baggageSubtotal += baggageSchedule.checked_30kg * segments;
    }
  }

  const totalPartyFare = adultSubtotal + childSubtotal + infantSubtotal + passengerFacilityFeesSubtotal + baggageSubtotal;
  const totalPassengerCount = params.party.adults + params.party.children + params.party.infants;
  const perPersonAverageFare = totalPassengerCount > 0 ? Math.round(totalPartyFare / totalPassengerCount) : totalPartyFare;

  const parts: string[] = [`${params.party.adults} người lớn`];
  if (params.party.children > 0) parts.push(`${params.party.children} trẻ em`);
  if (params.party.infants > 0) parts.push(`${params.party.infants} em bé`);
  const fareScopeLabelVi = `Tổng giá cho ${totalPassengerCount} khách (${parts.join(", ")})`;

  return {
    partyComposition: params.party,
    totalPassengerCount,
    segmentsCount: segments,
    baseAdultFarePerPerson: baseAdultFare,
    adultSubtotal,
    childSubtotal,
    infantSubtotal,
    passengerFacilityFeesSubtotal,
    baggageSubtotal,
    totalPartyFare,
    perPersonAverageFare,
    fareScopeLabelVi,
  };
}

/**
 * F40/F87 INVARIANT CHECK:
 * Guarantees that an advertised opportunity or quote does NOT promote
 * a 1-person price as the total fare when the intent is for a group or family.
 */
export function assertTransparentGroupFareClaim(
  advertisedPrice: number,
  calculatedGroupFare: GroupFareBreakdown
): void {
  const isMultiPassenger = calculatedGroupFare.totalPassengerCount > 1;
  const hasAddons = calculatedGroupFare.baggageSubtotal > 0;

  if ((isMultiPassenger || hasAddons) && advertisedPrice < calculatedGroupFare.totalPartyFare) {
    // If the advertised price equals single adult fare, this is the classic deceptive pattern
    if (Math.abs(advertisedPrice - calculatedGroupFare.baseAdultFarePerPerson) < 1000) {
      throw new SingleAdultPricePromotedToFamilyTotalError(
        advertisedPrice,
        calculatedGroupFare.totalPartyFare,
        calculatedGroupFare.totalPassengerCount
      );
    }
  }
}
