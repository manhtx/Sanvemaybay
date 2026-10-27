/**
 * Trip Budget Estimator & Ground Component Bounds
 * Satisfies F46: Total trip budget estimation with typed uncertainty (ESTIMATED vs KNOWN)
 */

export interface DestinationBenchmarkCost {
  destinationCode: string;
  destinationName: string;
  lodgingPerNight: {
    budget: number; // e.g. homestay/hostel/mini hotel
    standard: number; // 3-star hotel
    comfort: number; // 4-5 star resort
  };
  airportTransferOneWay: {
    budget: number; // bus / shuttle
    standard: number; // taxi / grab car
  };
  dailyFoodAndActivity: {
    budget: number;
    standard: number;
    comfort: number;
  };
}

export const DESTINATION_BENCHMARK_COSTS: Record<string, DestinationBenchmarkCost> = {
  PQC: {
    destinationCode: "PQC",
    destinationName: "Phú Quốc",
    lodgingPerNight: { budget: 400_000, standard: 1_000_000, comfort: 2_500_000 },
    airportTransferOneWay: { budget: 50_000, standard: 180_000 },
    dailyFoodAndActivity: { budget: 300_000, standard: 600_000, comfort: 1_200_000 },
  },
  DAD: {
    destinationCode: "DAD",
    destinationName: "Đà Nẵng",
    lodgingPerNight: { budget: 350_000, standard: 800_000, comfort: 2_000_000 },
    airportTransferOneWay: { budget: 30_000, standard: 100_000 },
    dailyFoodAndActivity: { budget: 250_000, standard: 500_000, comfort: 1_000_000 },
  },
  CXR: {
    destinationCode: "CXR",
    destinationName: "Nha Trang (Cam Ranh)",
    lodgingPerNight: { budget: 350_000, standard: 850_000, comfort: 2_200_000 },
    airportTransferOneWay: { budget: 60_000, standard: 300_000 }, // Cam Ranh to Nha Trang ~35km
    dailyFoodAndActivity: { budget: 250_000, standard: 500_000, comfort: 1_100_000 },
  },
  DLI: {
    destinationCode: "DLI",
    destinationName: "Đà Lạt (Liên Khương)",
    lodgingPerNight: { budget: 300_000, standard: 750_000, comfort: 1_800_000 },
    airportTransferOneWay: { budget: 50_000, standard: 250_000 }, // Lien Khuong to Da Lat ~30km
    dailyFoodAndActivity: { budget: 250_000, standard: 450_000, comfort: 900_000 },
  },
  HAN: {
    destinationCode: "HAN",
    destinationName: "Hà Nội",
    lodgingPerNight: { budget: 400_000, standard: 900_000, comfort: 2_200_000 },
    airportTransferOneWay: { budget: 45_000, standard: 280_000 }, // Noi Bai to Old Quarter ~30km
    dailyFoodAndActivity: { budget: 250_000, standard: 500_000, comfort: 1_000_000 },
  },
  SGN: {
    destinationCode: "SGN",
    destinationName: "TP. Hồ Chí Minh",
    lodgingPerNight: { budget: 400_000, standard: 900_000, comfort: 2_200_000 },
    airportTransferOneWay: { budget: 20_000, standard: 150_000 },
    dailyFoodAndActivity: { budget: 250_000, standard: 500_000, comfort: 1_000_000 },
  },
};

/**
 * Domestic airline ancillary surcharges (checked baggage 20kg + payment fee in VND).
 * Enables true landed cost monotonicity so low-cost carriers don't mislead users.
 */
export const DOMESTIC_ANCILLARY_SURCHARGES: Record<string, { baggage20kg: number; fee: number }> = {
  VJ: { baggage20kg: 350_000, fee: 55_000 },
  QH: { baggage20kg: 320_000, fee: 45_000 },
  VU: { baggage20kg: 300_000, fee: 50_000 },
  VN: { baggage20kg: 0, fee: 0 },
};

/**
 * Calculates total landed flight cost including baggage and payment processing fees.
 */
export function calculateLandedFlightCost(params: {
  airlineCode: string;
  baseFare: number;
  includeBaggage?: boolean;
}): number {
  const code = (params.airlineCode || "").toUpperCase();
  const surcharges = DOMESTIC_ANCILLARY_SURCHARGES[code] || { baggage20kg: 0, fee: 0 };
  const baggageCost = params.includeBaggage ? surcharges.baggage20kg : 0;
  return Math.round(Number(params.baseFare) + baggageCost + surcharges.fee);
}

/**
 * Estimates round-trip baggage fees for a carrier.
 */
export function estimateRoundTripBaggageCost(airlineCode: string, checkedBags: number = 1): number {
  const code = (airlineCode || "").toUpperCase();
  const surcharges = DOMESTIC_ANCILLARY_SURCHARGES[code];
  if (!surcharges) return 0;
  const safeBags = Math.floor(Math.max(1, Number.isFinite(checkedBags) ? checkedBags : 1));
  return Math.round(surcharges.baggage20kg * safeBags * 2);
}

/**
 * Calculates carrier landed surcharges scaled by integer passenger and leg quantities.
 */
export function calculateCarrierLandedSurcharges(
  airlineCode: string,
  passengers: number = 1,
  flightLegs: number = 1
): { baggageFee: number; ticketingFee: number } {
  const safePassengers = Math.floor(Math.max(1, Number.isFinite(passengers) ? passengers : 1));
  const safeLegs = Math.floor(Math.max(1, Number.isFinite(flightLegs) ? flightLegs : 1));
  const code = (airlineCode || "").toUpperCase();
  const surcharges = DOMESTIC_ANCILLARY_SURCHARGES[code] || { baggage20kg: 0, fee: 0 };
  return {
    baggageFee: Math.round(surcharges.baggage20kg * safePassengers * safeLegs),
    ticketingFee: Math.round(surcharges.fee * safePassengers * safeLegs),
  };
}


/**
 * Calculates seasonal price inflation multiplier for Vietnamese tourist destinations.
 * - Tet peak (January - February): +50% (1.5x)
 * - Summer peak (June - July): +25% (1.25x)
 * - Regular baseline season: 1.0x
 */
export function getSeasonalGroundMultiplier(departureDate?: string): number {
  if (!departureDate) return 1.0;
  const parsed = Date.parse(departureDate);
  if (!Number.isFinite(parsed)) return 1.0;
  const month = new Date(parsed).getUTCMonth() + 1; // 1-12 in UTC
  if (month === 1 || month === 2) return 1.5;
  if (month === 6 || month === 7) return 1.25;
  return 1.0;
}

export interface TripBudgetEstimate {
  destinationCode: string;
  destinationName: string;
  airfareTotal: number;
  lodgingTotalEstimated: number;
  groundTransferEstimated: number;
  dailyExpensesEstimated: number;
  grandTotalEstimated: number;
  nights: number;
  travelers: number;
  style: "budget" | "standard" | "comfort";
  uncertainty: "ESTIMATED";
  isBenchmarkEstimated: boolean;
  disclosureVi: string;
}

export function estimateTotalTripCost(params: {
  destinationCode: string;
  airfareTotal: number;
  nights?: number;
  travelers?: number;
  style?: "budget" | "standard" | "comfort";
  departureDate?: string;
}): TripBudgetEstimate {
  const code = (params.destinationCode || "").trim().toUpperCase();
  const hasKnownBenchmark = Object.prototype.hasOwnProperty.call(DESTINATION_BENCHMARK_COSTS, code);
  const benchmark = hasKnownBenchmark ? DESTINATION_BENCHMARK_COSTS[code] : {
    destinationCode: code,
    destinationName: code,
    lodgingPerNight: { budget: 350_000, standard: 800_000, comfort: 2_000_000 },
    airportTransferOneWay: { budget: 40_000, standard: 200_000 },
    dailyFoodAndActivity: { budget: 250_000, standard: 500_000, comfort: 1_000_000 },
  };

  const rawNights = params.nights !== undefined ? Number(params.nights) : 3;
  const nights = Math.max(0, Math.min(90, Math.floor(Number.isFinite(rawNights) ? rawNights : 3)));
  const rawTravelers = params.travelers !== undefined ? Number(params.travelers) : 1;
  const travelers = Math.max(1, Math.min(20, Math.floor(Number.isFinite(rawTravelers) ? rawTravelers : 1)));
  const style = params.style ?? "standard";
  const seasonalMultiplier = getSeasonalGroundMultiplier(params.departureDate);

  // Approximate hotel rooms needed (1 room per 2 travelers). Zero nights = 0 lodging.
  const roomsNeeded = Math.ceil(travelers / 2);
  const lodgingRate = benchmark.lodgingPerNight[style] ?? benchmark.lodgingPerNight.standard;
  const lodgingTotalEstimated = nights === 0
    ? 0
    : Math.round(lodgingRate * nights * roomsNeeded * seasonalMultiplier);

  // Round trip transfer (to and from airport)
  const transferStyle = style === "budget" ? "budget" : "standard";
  const transferCost = benchmark.airportTransferOneWay[transferStyle] ?? benchmark.airportTransferOneWay.standard;
  const groundTransferEstimated = Math.round(transferCost * 2 * roomsNeeded);

  // Daily expenses per traveler
  const dailyFoodRate = benchmark.dailyFoodAndActivity[style] ?? benchmark.dailyFoodAndActivity.standard;
  const days = nights === 0 ? 1 : nights + 1;
  const dailyExpensesEstimated = Math.round(dailyFoodRate * days * travelers * seasonalMultiplier);

  const safeAirfare = Math.max(0, Math.round(Number(params.airfareTotal) || 0));
  const rawGrandTotal = safeAirfare + lodgingTotalEstimated + groundTransferEstimated + dailyExpensesEstimated;
  const grandTotalEstimated = Math.min(Number.MAX_SAFE_INTEGER, rawGrandTotal);

  return {
    destinationCode: code,
    destinationName: benchmark.destinationName,
    airfareTotal: safeAirfare,
    lodgingTotalEstimated,
    groundTransferEstimated,
    dailyExpensesEstimated,
    grandTotalEstimated,
    nights,
    travelers,
    style,
    uncertainty: "ESTIMATED",
    isBenchmarkEstimated: !hasKnownBenchmark,
    disclosureVi:
      "Chi phí vé máy bay là số liệu ghi nhận thực tế. Các chi phí khách sạn, di chuyển mặt đất và sinh hoạt là ước tính tham khảo (ESTIMATED) dựa trên mức giá trung bình của điểm đến.",
  };
}

/**
 * SOL-BUDGET-01: Provides an itemized seasonal trip budget breakdown with VAT and transfer clarity.
 */
export function estimateSeasonalTripBudgetBreakdown(params: {
  destinationCode: string;
  airfareTotal: number;
  nights?: number;
  travelers?: number;
  style?: "budget" | "standard" | "comfort";
  departureDate?: string;
}): TripBudgetEstimate & {
  vatAndFeesIncluded: boolean;
  perPersonAverageVND: number;
} {
  const estimate = estimateTotalTripCost(params);
  const perPersonAverageVND = Math.round(estimate.grandTotalEstimated / estimate.travelers);
  return {
    ...estimate,
    vatAndFeesIncluded: true,
    perPersonAverageVND,
  };
}
