/**
 * FARELY MULTI-CITY ITINERARY COHERENCE
 * 
 * Satisfies:
 * - F41 (P2): Multi-city itinerary
 * 
 * INVARIANTS:
 * - "No joining unrelated one-way tickets into a fictitious single purchasable offer."
 * - Explicit chronological ordering across flight slices.
 * - Explicit open-jaw / ground transfer disclosure when leg(i).to != leg(i+1).from.
 * - Independent non-interline tickets cannot be promoted as a single protected ticket (must be SELF_TRANSFER_UNPROTECTED).
 */

export interface ItinerarySlice {
  sliceIndex: number;
  originCode: string;
  destinationCode: string;
  departDate: string; // YYYY-MM-DD
  airlineCode: string;
  airlineName: string;
  price: number;
}

export type TicketingCoherenceType =
  | "SINGLE_THROUGH_TICKET" // Same carrier or validated interline alliance
  | "SELF_TRANSFER_UNPROTECTED"; // Distinct independent one-ways

export interface MultiCityItineraryValidation {
  isValid: boolean;
  coherenceType: TicketingCoherenceType;
  totalPrice: number;
  slicesCount: number;
  hasOpenJawSurfaceSegment: boolean;
  openJawNotices: string[];
  selfTransferWarningVi?: string;
  isFictitiousJoinedOffer: boolean;
  connectionRisk?: "NONE" | "MODERATE" | "HIGH";
  dealScorePenalty?: number;
}

export class FictitiousSingleOfferError extends Error {
  constructor(message: string) {
    super(`F41 Invariant Violation: ${message}`);
    this.name = "FictitiousSingleOfferError";
  }
}

export class InvalidMultiCitySequenceError extends Error {
  constructor(message: string) {
    super(`MultiCitySequenceError: ${message}`);
    this.name = "InvalidMultiCitySequenceError";
  }
}

// Known airline alliances / interline codes for VN market
const ALLIANCE_PARTNERS: Record<string, Set<string>> = {
  VN: new Set(["VN", "AF", "KL", "KE", "DL", "CI", "GA"]), // SkyTeam
  VJ: new Set(["VJ"]), // Point-to-point LCC
  QH: new Set(["QH"]), // Bamboo Airways
};

/**
 * Validates and evaluates coherence of a multi-city itinerary.
 */
export function validateMultiCityItinerary(params: {
  slices: ItinerarySlice[];
  claimedAsSingleTicket?: boolean;
}): MultiCityItineraryValidation {
  if (!params.slices || params.slices.length < 2) {
    throw new InvalidMultiCitySequenceError("Hành trình nhiều chặng (Multi-city) phải có ít nhất 2 chặng bay.");
  }

  const sorted = [...params.slices].sort((a, b) => a.sliceIndex - b.sliceIndex);
  let totalPrice = 0;
  const openJawNotices: string[] = [];
  let hasInterlineCoherence = true;
  const primaryCarrier = sorted[0].airlineCode.toUpperCase();
  const allowedPartners = ALLIANCE_PARTNERS[primaryCarrier] || new Set([primaryCarrier]);

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    totalPrice += current.price;

    // Check interline partner compatibility
    if (!allowedPartners.has(current.airlineCode.toUpperCase())) {
      hasInterlineCoherence = false;
    }

    if (i > 0) {
      const prev = sorted[i - 1];

      // Chronological check
      if (current.departDate < prev.departDate) {
        throw new InvalidMultiCitySequenceError(
          `Chặng ${current.sliceIndex + 1} (${current.departDate}) không thể khởi hành trước chặng ${prev.sliceIndex + 1} (${prev.departDate}).`
        );
      }

      // Open-jaw check: prev.destination != current.origin
      if (prev.destinationCode.toUpperCase() !== current.originCode.toUpperCase()) {
        openJawNotices.push(
          `Chặng di chuyển tự túc trên mặt đất (Open-jaw): ${prev.destinationCode} → ${current.originCode}. Hành khách tự chịu trách nhiệm di chuyển giữa 2 điểm này.`
        );
      }
    }
  }

  const coherenceType: TicketingCoherenceType = hasInterlineCoherence
    ? "SINGLE_THROUGH_TICKET"
    : "SELF_TRANSFER_UNPROTECTED";

  // F41 INVARIANT ENFORCEMENT:
  // If claimed as a single guaranteed offer but carriers are non-interline, reject fictitious join
  if (params.claimedAsSingleTicket && coherenceType === "SELF_TRANSFER_UNPROTECTED") {
    throw new FictitiousSingleOfferError(
      "Không được ghép các vé một chiều riêng lẻ không có liên danh (interline) thành một gói vé liền mạch giả định. Khi nối chuyến tự túc, hãng sau không chịu trách nhiệm nếu hãng trước chậm chuyến."
    );
  }

  const selfTransferWarningVi =
    coherenceType === "SELF_TRANSFER_UNPROTECTED"
      ? "Lưu ý nối chuyến tự túc (Self-transfer): Các chặng bay thuộc các hãng độc lập không có thỏa thuận bảo lưu khi trễ chuyến. Bạn cần tự lấy hành lý và làm thủ tục lại cho từng chặng."
      : undefined;

  const isSelfTransfer = coherenceType === "SELF_TRANSFER_UNPROTECTED";

  return {
    isValid: true,
    coherenceType,
    totalPrice,
    slicesCount: sorted.length,
    hasOpenJawSurfaceSegment: openJawNotices.length > 0,
    openJawNotices,
    selfTransferWarningVi,
    isFictitiousJoinedOffer: false,
    connectionRisk: isSelfTransfer ? "HIGH" : "NONE",
    dealScorePenalty: isSelfTransfer ? 25 : 0,
  };
}

/**
 * Recognized metropolitan airport pairs requiring surface transfer.
 */
export const METROPOLITAN_AIRPORT_PAIRS = new Set([
  "HND-NRT", "NRT-HND", // Tokyo
  "DMK-BKK", "BKK-DMK", // Bangkok
  "GMP-ICN", "ICN-GMP", // Seoul
  "LHR-LGW", "LGW-LHR", // London
  "JFK-EWR", "EWR-JFK", // New York
]);

/**
 * Checks whether two airports are distinct airports within the same metropolitan area,
 * requiring ground surface transit between airports (e.g. Haneda to Narita).
 */
export function isMetropolitanAirportChange(fromAirport: string, toAirport: string): boolean {
  if (!fromAirport || !toAirport) return false;
  const key = `${fromAirport.trim().toUpperCase()}-${toAirport.trim().toUpperCase()}`;
  return METROPOLITAN_AIRPORT_PAIRS.has(key);
}

