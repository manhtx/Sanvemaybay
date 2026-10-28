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
  isSelfTransfer?: boolean;
  requiresGroundTransfer?: boolean;
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
  VU: new Set(["VU"]), // Vietravel Airlines
};

/**
 * Validates and evaluates coherence of a multi-city itinerary.
 */
export function validateMultiCityItinerary(params: {
  slices: ItinerarySlice[];
  claimedAsSingleTicket?: boolean;
}): MultiCityItineraryValidation {
  const validSlices = (params?.slices || []).filter(Boolean);
  if (validSlices.length < 2) {
    throw new InvalidMultiCitySequenceError("Hành trình nhiều chặng (Multi-city) phải có ít nhất 2 chặng bay.");
  }
  if (validSlices.length > 10) {
    throw new InvalidMultiCitySequenceError("Hành trình nhiều chặng (Multi-city) không được vượt quá 10 chặng bay.");
  }

  const sorted = [...validSlices].sort(
    (a, b) => (a.sliceIndex ?? 0) - (b.sliceIndex ?? 0) || (a.departDate || "").localeCompare(b.departDate || "")
  );
  let totalPrice = 0;
  const openJawNotices: string[] = [];
  let hasInterlineCoherence = true;
  const primaryCarrier = (sorted[0].airlineCode || "").trim().toUpperCase();
  const allowedPartners = ALLIANCE_PARTNERS[primaryCarrier] || new Set([primaryCarrier]);

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const orig = (current.originCode || "").trim().toUpperCase();
    const dest = (current.destinationCode || "").trim().toUpperCase();

    if (orig && dest && orig === dest) {
      throw new InvalidMultiCitySequenceError(
        `Chặng ${current.sliceIndex + 1} có điểm đi trùng với điểm đến (${orig} → ${dest}).`
      );
    }

    const safePrice = Number.isFinite(current.price) && current.price > 0 ? current.price : 0;
    totalPrice += Math.round(safePrice);

    // Check interline partner compatibility
    const currentCarrier = (current.airlineCode || "").trim().toUpperCase();
    if (!allowedPartners.has(currentCarrier)) {
      hasInterlineCoherence = false;
    }

    if (i > 0) {
      const prev = sorted[i - 1];
      const currDate = (current.departDate || "").slice(0, 10);
      const prevDate = (prev.departDate || "").slice(0, 10);

      // Chronological check
      if (currDate < prevDate) {
        throw new InvalidMultiCitySequenceError(
          `Chặng ${current.sliceIndex + 1} (${current.departDate}) không thể khởi hành trước chặng ${prev.sliceIndex + 1} (${prev.departDate}).`
        );
      }

      // Open-jaw check: prev.destination != current.origin
      const prevDest = (prev.destinationCode || "").trim().toUpperCase();
      const currOrig = (current.originCode || "").trim().toUpperCase();
      if (prevDest !== currOrig) {
        const isMetro = isMetropolitanAirportChange(prevDest, currOrig);
        if (isMetro) {
          const minMinutes = getMetropolitanMinimumTransitMinutes(prevDest, currOrig);
          openJawNotices.push(
            `Chuyển sân bay trong cùng đô thị (Metropolitan transfer: ${prevDest} → ${currOrig}): Yêu cầu tối thiểu ${minMinutes} phút trung chuyển mặt đất.`
          );
        } else {
          openJawNotices.push(
            `Chặng di chuyển tự túc trên mặt đất (Open-jaw): ${prevDest} → ${currOrig}. Hành khách tự chịu trách nhiệm di chuyển giữa 2 điểm này.`
          );
        }
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
  const hasMetroTransit = sorted.some((slice, i) => i > 0 && isMetropolitanAirportChange(sorted[i - 1].destinationCode, slice.originCode));

  return {
    isValid: true,
    coherenceType,
    totalPrice,
    slicesCount: sorted.length,
    hasOpenJawSurfaceSegment: openJawNotices.length > 0,
    openJawNotices,
    selfTransferWarningVi,
    isFictitiousJoinedOffer: false,
    connectionRisk: (isSelfTransfer || hasMetroTransit) ? "HIGH" : "NONE",
    dealScorePenalty: (isSelfTransfer || hasMetroTransit) ? 25 : 0,
    isSelfTransfer,
    requiresGroundTransfer: openJawNotices.length > 0,
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

/**
 * Returns required ground transit buffer in minutes for inter-airport metropolitan transfers.
 */
export function getMetropolitanMinimumTransitMinutes(fromAirport: string, toAirport: string): number {
  return isMetropolitanAirportChange(fromAirport, toAirport) ? 210 : 0;
}

/**
 * Computes elapsed connection layover in minutes between two UTC/ISO timestamps.
 * Returns 0 if invalid or non-chronological.
 */
export function computeSegmentLayoverMinutes(arrTimeUtc: string, depTimeUtc: string): number {
  const arrMs = new Date(arrTimeUtc).getTime();
  const depMs = new Date(depTimeUtc).getTime();
  if (isNaN(arrMs) || isNaN(depMs) || depMs <= arrMs) return 0;
  return Math.round((depMs - arrMs) / 60000);
}

