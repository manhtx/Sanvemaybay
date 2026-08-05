import { calculateTotalCost } from "./flightIntelligence";

export interface RouteLeg {
  origin: string;
  destination: string;
  price: number;
  extraCost?: number;
  durationMinutes: number;
  arrivalAt: string;
  departureAt: string;
  baggageIncluded: boolean;
}

export interface RouteOption {
  type: "DIRECT" | "MULTI_LEG" | "SELF_TRANSFER";
  legs: RouteLeg[];
  connectionMinutes?: number;
  requiresVisaTransit?: boolean;
  airportChange?: boolean;
  dataFresh?: boolean;
  airlineReliability?: "reliable" | "unknown" | "low";
  overnightTransit?: boolean;
}

export interface OptimizedRoute {
  option: RouteOption;
  totalCost: number;
  totalDurationMinutes: number;
  riskLevel: "low" | "medium" | "high";
  riskReasons: string[];
  requiresUserConfirmation: boolean;
}

function parseTime(value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid route time: ${value}`);
  return parsed;
}

export function assessRoute(option: RouteOption): OptimizedRoute {
  if (!option.legs.length) throw new Error("A route must contain at least one leg.");
  const riskReasons: string[] = [];
  const totalCost = calculateTotalCost(option.legs.flatMap((leg) => [leg.price, leg.extraCost ?? 0]));
  const totalDurationMinutes = option.legs.reduce((sum, leg) => sum + leg.durationMinutes, 0);
  let derivedConnectionMinutes: number | undefined;

  option.legs.forEach((leg, index) => {
    if (leg.price < 0 || leg.durationMinutes <= 0) throw new Error("Route leg values are invalid.");
    if (index === 0) return;
    const previous = option.legs[index - 1];
    const connectionMinutes = Math.floor((parseTime(leg.departureAt) - parseTime(previous.arrivalAt)) / 60000);
    if (connectionMinutes < 0) throw new Error("A later leg departs before the previous leg arrives.");
    if (option.connectionMinutes == null && derivedConnectionMinutes == null) {
      derivedConnectionMinutes = connectionMinutes;
    }
  });

  if (option.type === "SELF_TRANSFER") riskReasons.push("Tách vé: hãng bay có thể không bảo vệ chặng tiếp theo.");
  const connectionMinutes = option.connectionMinutes ?? derivedConnectionMinutes;
  if (connectionMinutes != null && connectionMinutes < 120) riskReasons.push("Thời gian nối chuyến dưới 120 phút.");
  if (option.requiresVisaTransit) riskReasons.push("Cần xác minh visa transit.");
  if (option.airportChange) riskReasons.push("Phải đổi sân bay trong hành trình.");
  if (option.legs.some((leg) => !leg.baggageIncluded)) riskReasons.push("Có chặng chưa bao gồm hành lý ký gửi.");
  if (option.dataFresh === false) riskReasons.push("Dữ liệu một hoặc nhiều chặng đã cũ.");
  if (option.overnightTransit) riskReasons.push("Có transit qua đêm; cần kiểm tra nghỉ ngơi và giờ hoạt động sân bay.");
  if (option.airlineReliability === "low") riskReasons.push("Dữ liệu cho thấy độ tin cậy hãng bay thấp.");
  if (option.airlineReliability === "unknown") riskReasons.push("Chưa có dữ liệu độ tin cậy hãng bay.");

  const riskLevel = riskReasons.length === 0 ? "low" : riskReasons.length <= 2 ? "medium" : "high";
  return {
    option: connectionMinutes == null ? option : { ...option, connectionMinutes },
    totalCost,
    totalDurationMinutes,
    riskLevel,
    riskReasons,
    requiresUserConfirmation: option.type === "SELF_TRANSFER" || riskLevel === "high",
  };
}

export function chooseLowestCostRoute(routes: RouteOption[]): OptimizedRoute | undefined {
  const assessed = routes.map(assessRoute).filter((route) => route.riskLevel !== "high");
  return assessed.sort((a, b) => a.totalCost - b.totalCost)[0];
}

/** Build safe self-transfer candidates from independently observed options. */
export function combineSelfTransferOptions(options: RouteOption[], minimumBufferMinutes = 120): RouteOption[] {
  if (!Number.isFinite(minimumBufferMinutes) || minimumBufferMinutes < 0) return [];
  const combinations: RouteOption[] = [];
  for (const first of options) {
    const firstLeg = first.legs[first.legs.length - 1];
    for (const second of options) {
      if (first === second || !firstLeg || !second.legs[0] || firstLeg.destination !== second.legs[0].origin) continue;
      const buffer = Math.floor((parseTime(second.legs[0].departureAt) - parseTime(firstLeg.arrivalAt)) / 60000);
      if (buffer < minimumBufferMinutes) continue;
      combinations.push({
        type: "SELF_TRANSFER",
        legs: [...first.legs, ...second.legs],
        connectionMinutes: buffer,
        requiresVisaTransit: Boolean(first.requiresVisaTransit || second.requiresVisaTransit),
        airportChange: Boolean(first.airportChange || second.airportChange),
        dataFresh: first.dataFresh !== false && second.dataFresh !== false,
      });
    }
  }
  return combinations;
}
