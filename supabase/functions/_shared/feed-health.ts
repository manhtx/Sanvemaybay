export type FeedStatus =
  | "healthy"
  | "healthy_empty"
  | "stale_only"
  | "degraded_schema"
  | "provider_unavailable";

export interface FeedEnvelope {
  deals: Record<string, unknown>[];
  status: FeedStatus;
  source: string;
  generated_at: string;
  retryable: boolean;
  message: string;
}

export function classifyFeedStatus(totalRows: number, activeRows: number): FeedStatus {
  if (activeRows > 0) return "healthy";
  return totalRows > 0 ? "stale_only" : "healthy_empty";
}

export function isSchemaContractError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown };
  return candidate.code === "42703" ||
    (typeof candidate.message === "string" && /link_kind.*does not exist|column.*link_kind/i.test(candidate.message));
}

export function feedEnvelope(
  status: FeedStatus,
  deals: Record<string, unknown>[],
  source: string,
  generatedAt = new Date().toISOString(),
): FeedEnvelope {
  const messages: Record<FeedStatus, string> = {
    healthy: "Deal live đã được xác minh.",
    healthy_empty: "Hiện chưa có deal live đạt tiêu chuẩn.",
    stale_only: "Dữ liệu hiện có đã cũ hoặc chưa đủ điều kiện công bố.",
    degraded_schema: "Hệ thống dữ liệu đang được đồng bộ phiên bản.",
    provider_unavailable: "Nguồn giá hiện tạm thời không khả dụng.",
  };
  return {
    deals,
    status,
    source,
    generated_at: generatedAt,
    retryable: status === "degraded_schema" || status === "provider_unavailable",
    message: messages[status],
  };
}
