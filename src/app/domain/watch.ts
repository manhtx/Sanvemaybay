export type WatchStatus =
  | "monitoring"
  | "matched"
  | "paused"
  | "needs_attention"
  | "expired";

export interface WatchIntent {
  id: string;
  userId?: string;
  originCode: string;
  originName: string;
  destinationCode: string;
  destinationName: string;
  dateFrom?: string | null;
  dateTo?: string | null;
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
  stops?: number;
}

export function evaluateWatchMatch(
  watch: Pick<WatchIntent, "originCode" | "destinationCode" | "targetPrice" | "dateFrom" | "dateTo" | "maxStops" | "status">,
  candidate: WatchEvaluationInput,
): boolean {
  if (watch.status === "paused" || watch.status === "expired") {
    return false;
  }
  if (watch.originCode && watch.originCode !== candidate.originCode) {
    return false;
  }
  if (watch.destinationCode && watch.destinationCode !== candidate.destinationCode) {
    return false;
  }
  if (watch.targetPrice && candidate.price > watch.targetPrice) {
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

  // Check if matched
  if (
    watch.targetPrice &&
    watch.latestPrice &&
    watch.latestPrice <= watch.targetPrice
  ) {
    return "matched";
  }

  if (watch.lastMatchAt) {
    const hoursSinceMatch =
      (Date.now() - new Date(watch.lastMatchAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceMatch <= 48) {
      return "matched";
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
        colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
        description: "Phát hiện giá bằng hoặc thấp hơn mục tiêu bạn đặt.",
      };
    case "monitoring":
      return {
        label: "ĐANG THEO DÕI",
        colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        description: "Farely sẽ thông báo khi một lần quét phát hiện cơ hội phù hợp.",
      };
    case "paused":
      return {
        label: "TẠM DỪNG",
        colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/30",
        description: "Cảnh báo tạm ngưng nhận thông báo.",
      };
    case "needs_attention":
      return {
        label: "CẦN CẬP NHẬT",
        colorClass: "bg-rose-500/10 text-rose-400 border-rose-500/30",
        description: "Email chưa xác nhận hoặc tuyến bay cần điều chỉnh.",
      };
    case "expired":
      return {
        label: "ĐÃ HẾT HẠN",
        colorClass: "bg-slate-500/10 text-slate-400 border-slate-500/30",
        description: "Khoảng thời gian bay dự kiến đã qua.",
      };
  }
}
