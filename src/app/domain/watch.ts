export type WatchStatus =
  | "monitoring"
  | "matched"
  | "paused"
  | "degraded"
  | "sync_failed"
  | "needs_attention"
  | "expired";

export const METRO_AIRPORT_MAP: Record<string, string[]> = {
  BKK_ALL: ["BKK", "DMK"],
  TYO_ALL: ["NRT", "HND"],
  LON_ALL: ["LHR", "LGW", "STN"],
  PAR_ALL: ["CDG", "ORY"],
  NYC_ALL: ["JFK", "EWR", "LGA"],
};

export function matchLocationScope(targetCode: string | null | undefined, candidateCode: string | null | undefined, scope?: string | null): boolean {
  if (!targetCode) return true;
  if (!candidateCode) return false;
  const targetUpper = targetCode.trim().toUpperCase();
  const candUpper = candidateCode.trim().toUpperCase();
  if (targetUpper === candUpper) return true;
  if (scope === "metro" || targetUpper.endsWith("_ALL")) {
    const served = METRO_AIRPORT_MAP[targetUpper];
    if (served && served.includes(candUpper)) return true;
  }
  return false;
}

export interface WatchIntent {
  id: string;
  userId?: string;
  originCode: string;
  originName: string;
  destinationCode: string;
  destinationName: string;
  dateFrom?: string | null;
  dateTo?: string | null;
  returnDate?: string | null;
  tripType?: "oneway" | "roundtrip" | null;
  cabin?: "economy" | "premium_economy" | "business" | "first" | null;
  passengers?: number | null;
  currency?: string | null;
  locationScope?: "exact" | "metro" | "nearby" | null;
  targetPrice?: number | null;
  latestPrice?: number | null;
  maxStops?: number | null;
  status: WatchStatus;
  frequency: "instant" | "daily";
  email: string;
  channel: "email" | "telegram";
  telegramId?: string | null;
  lastCheckedAt?: string | null;
  lastMatchAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WatchEvaluationInput {
  originCode: string;
  destinationCode: string;
  price: number;
  departDate?: string | null;
  returnDate?: string | null;
  stops?: number;
  cabin?: string;
  currency?: string;
}

export function evaluateWatchMatch(
  watch: Partial<WatchIntent> & Pick<WatchIntent, "originCode" | "destinationCode">,
  candidate: WatchEvaluationInput,
): boolean {
  if (watch.status === "paused" || watch.status === "expired" || watch.status === "sync_failed") {
    return false;
  }
  if (!matchLocationScope(watch.originCode, candidate.originCode, watch.locationScope)) {
    return false;
  }
  if (!matchLocationScope(watch.destinationCode, candidate.destinationCode, watch.locationScope)) {
    return false;
  }
  if (watch.targetPrice != null && candidate.price > watch.targetPrice) {
    return false;
  }
  if (typeof watch.maxStops === "number" && typeof candidate.stops === "number") {
    if (candidate.stops > watch.maxStops) return false;
  }
  if (watch.dateFrom && candidate.departDate && candidate.departDate < watch.dateFrom) {
    return false;
  }
  if (watch.dateTo && candidate.departDate && candidate.departDate > watch.dateTo) {
    return false;
  }
  if (watch.returnDate && candidate.returnDate && candidate.returnDate !== watch.returnDate) {
    return false;
  }
  if (watch.tripType === "roundtrip" && !candidate.returnDate) {
    return false;
  }
  if (watch.tripType === "oneway" && candidate.returnDate) {
    return false;
  }
  if (watch.cabin && candidate.cabin && candidate.cabin !== watch.cabin) {
    return false;
  }
  if (watch.currency && candidate.currency && candidate.currency !== watch.currency) {
    return false;
  }
  return true;
}

export function computeWatchStatus(watch: {
  status: string;
  dateTo?: string | null;
  lastMatchAt?: string | null;
  lastCheckedAt?: string | null;
  targetPrice?: number | null;
  latestPrice?: number | null;
}): WatchStatus {
  if (watch.status === "sync_failed") {
    return "sync_failed";
  }
  if (watch.status === "paused" || watch.status === "unsubscribed") {
    return "paused";
  }

  // Check expiration if date window has completely passed
  if (watch.dateTo) {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (watch.dateTo < todayStr) {
      return "expired";
    }
  }

  // Check if actively matched by latest price
  if (
    watch.targetPrice != null &&
    watch.latestPrice != null &&
    watch.latestPrice <= watch.targetPrice
  ) {
    return "matched";
  }

  // Check recent match within 48h only if price is not known to have risen above target
  if (watch.lastMatchAt && (!watch.latestPrice || (watch.targetPrice && watch.latestPrice <= watch.targetPrice))) {
    const hoursSinceMatch =
      (Date.now() - new Date(watch.lastMatchAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceMatch <= 48) {
      return "matched";
    }
  }

  // Check if check is degraded (> 24h since last check)
  if (watch.lastCheckedAt) {
    const hoursSinceCheck =
      (Date.now() - new Date(watch.lastCheckedAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceCheck > 24) {
      return "degraded";
    }
  }

  return "monitoring";
}

export function formatWatchStatusLabel(status: WatchStatus): {
  label: string;
  colorClass: string;
  description: string;
} {
  switch (status) {
    case "matched":
      return {
        label: "ĐÃ CÓ MỨC GIÁ MỤC TIÊU",
        colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        description: "Phát hiện giá bằng hoặc thấp hơn mục tiêu bạn đặt.",
      };
    case "monitoring":
      return {
        label: "ĐANG THEO DÕI",
        colorClass: "bg-blue-50 text-blue-700 border-blue-200",
        description: "Farely đang theo dõi các đợt quét để thông báo ngay khi có giá tốt.",
      };
    case "degraded":
      return {
        label: "THEO DÕI CHẬM",
        colorClass: "bg-amber-50 text-amber-700 border-amber-200",
        description: "Lần kiểm tra gần nhất hơn 24 giờ trước — hệ thống đang lập lại lịch quét.",
      };
    case "sync_failed":
      return {
        label: "ĐỒNG BỘ THẤT BẠI",
        colorClass: "bg-rose-50 text-rose-700 border-rose-200",
        description: "Chưa thể lưu theo dõi lên máy chủ — vui lòng thử lại.",
      };
    case "paused":
      return {
        label: "TẠM DỪNG",
        colorClass: "bg-stone-100 text-stone-600 border-stone-200",
        description: "Theo dõi đang tạm ngưng.",
      };
    case "needs_attention":
      return {
        label: "CẦN CẬP NHẬT",
        colorClass: "bg-rose-50 text-rose-700 border-rose-200",
        description: "Email chưa xác nhận hoặc tuyến bay cần điều chỉnh.",
      };
    case "expired":
      return {
        label: "ĐÃ HẾT HẠN",
        colorClass: "bg-stone-100 text-stone-600 border-stone-200",
        description: "Khoảng thời gian bay dự kiến đã qua.",
      };
  }
}
