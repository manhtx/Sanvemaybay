import { Deal } from "../data/deals";

export type PriceCertaintyStatus = "OBSERVED" | "VERIFIED" | "UNAVAILABLE";

export type FreshnessTier = "FRESH" | "ACCEPTABLE" | "STALE";

export interface DataProvenance {
  status: PriceCertaintyStatus;
  statusLabel: string;
  sourceName: string;
  sourceMode: "INDICATIVE_AGGREGATOR" | "AIRLINE_DIRECT" | "PARTNER_INTEGRATION";
  observedAt: string;
  ageMinutes: number;
  ageLabel: string;
  freshnessTier: FreshnessTier;
  confidenceScore: number;
  confidenceLabel: string;
  disclaimer: string;
  ctaMode: "INDICATIVE_RECHECK" | "EXACT_BOOKING";
  ctaLabel: string;
}

export function formatObservedAge(
  isoDate?: string,
  nowMs: number = Date.now()
): { ageMinutes: number; ageLabel: string; freshnessTier: FreshnessTier } {
  if (!isoDate) {
    return {
      ageMinutes: 9999,
      ageLabel: "Quan sát gần đây",
      freshnessTier: "ACCEPTABLE",
    };
  }

  const observedMs = new Date(isoDate).getTime();
  if (isNaN(observedMs)) {
    return {
      ageMinutes: 9999,
      ageLabel: "Thời điểm chưa rõ",
      freshnessTier: "STALE",
    };
  }

  const diffMs = Math.max(0, nowMs - observedMs);
  const diffMinutes = Math.floor(diffMs / 60000);

  let freshnessTier: FreshnessTier = "FRESH";
  if (diffMinutes > 1440) {
    // > 24 hours
    freshnessTier = "STALE";
  } else if (diffMinutes > 360) {
    // > 6 hours
    freshnessTier = "ACCEPTABLE";
  }

  let ageLabel = "";
  if (diffMinutes < 5) {
    ageLabel = "Vừa quét (Mới)";
  } else if (diffMinutes < 60) {
    ageLabel = `${diffMinutes} phút trước`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    ageLabel = `${hours} giờ trước`;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    ageLabel = `${days} ngày trước`;
  }

  return {
    ageMinutes: diffMinutes,
    ageLabel,
    freshnessTier,
  };
}

export function buildDataProvenance(deal: Deal, nowMs?: number): DataProvenance {
  const { ageMinutes, ageLabel, freshnessTier } = formatObservedAge(deal.observedAt, nowMs);

  // Distinguish OBSERVED vs VERIFIED vs UNAVAILABLE (F35 acceptance criteria)
  let status: PriceCertaintyStatus = "OBSERVED";
  let statusLabel = "Giá quan sát chỉ dẫn";

  if (deal.linkKind === "live_source" || (deal as any).isRevalidated === true) {
    status = "VERIFIED";
    statusLabel = "Đã xác minh nguồn";
  } else if ((deal as any).isUnavailable === true || (deal as any).seatsLeft === 0) {
    status = "UNAVAILABLE";
    statusLabel = "Không còn khả dụng";
  }

  const sourceName = deal.affiliateNetwork
    ? deal.affiliateNetwork
    : deal.linkKind === "live_affiliate"
    ? "Đối tác thương mại"
    : "Google Flights / Hệ thống quét công khai";

  const sourceMode =
    deal.linkKind === "live_affiliate"
      ? "PARTNER_INTEGRATION"
      : deal.linkKind === "live_source"
      ? "AIRLINE_DIRECT"
      : "INDICATIVE_AGGREGATOR";

  // S03 / DEC-03: Confidence=0 must remain zero; missing confidence defaults to 0 (Đang tích luỹ bằng chứng), never pseudo-inflated to 0.7
  const confidenceScore = typeof deal.confidence === "number" ? deal.confidence : 0;
  const confidenceLabel =
    confidenceScore >= 0.8
      ? "Bằng chứng mạnh"
      : confidenceScore >= 0.5
      ? "Bằng chứng vừa"
      : "Đang tích luỹ bằng chứng";

  // F72: Exact booking link only when supported and approved; generic URL clearly indicative
  const isExactBooking = deal.linkKind === "live_affiliate" && Boolean(deal.affiliateUrl || deal.bookingUrl);
  const ctaMode = isExactBooking ? "EXACT_BOOKING" : "INDICATIVE_RECHECK";
  const ctaLabel = isExactBooking ? "Đặt vé qua đối tác" : "Kiểm tra giá tại nguồn";

  const disclaimer =
    status === "VERIFIED"
      ? "Mức giá đã được xác thực trực tiếp tại nguồn cung cấp gần đây."
      : status === "UNAVAILABLE"
      ? "Chuyến bay hoặc mức giá này đã hết chỗ hoặc không còn hiển thị trên hệ thống bán."
      : "Đây là mức giá quan sát được ghi nhận từ chu kỳ quét tự động. Mức giá thực tế phụ thuộc vào tình trạng ghế trống theo thời gian thực của hãng.";

  return {
    status,
    statusLabel,
    sourceName,
    sourceMode,
    observedAt: deal.observedAt || new Date().toISOString(),
    ageMinutes,
    ageLabel,
    freshnessTier,
    confidenceScore,
    confidenceLabel,
    disclaimer,
    ctaMode,
    ctaLabel,
  };
}
