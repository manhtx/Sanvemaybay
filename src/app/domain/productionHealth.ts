/**
 * Production Health & Execution-backed Coverage Model.
 * Implements Sections 16, 18, 30, 31, 34, 54.
 */

export type HealthStatus = "GREEN" | "AMBER" | "RED";

export type CapabilityName =
  | "SERVICE_AVAILABILITY"
  | "OBSERVED_OPPORTUNITY_HEALTH"
  | "LIVE_VERIFY_HEALTH"
  | "WATCH_HEALTH"
  | "NOTIFICATION_HEALTH"
  | "DATA_FRESHNESS"
  | "ROUTE_COVERAGE";

export type FailureReason =
  | "VALID_ZERO"
  | "PROVIDER_ERROR"
  | "NETWORK_ERROR"
  | "PARSER_ERROR"
  | "UNSUPPORTED_ROUTE"
  | "UNKNOWN";

export interface RouteExecutionRecord {
  route_id: string;
  origin_code: string;
  destination_code: string;
  last_attempt_at: string | null;
  last_success_at: string | null;
  attempt_count: number;
  success_count: number;
  failure_count: number;
  last_failure_reason: FailureReason | null;
  next_due_at?: string | null;
}

export interface RouteFreshnessInfo {
  route_id: string;
  last_attempt_at: string | null;
  last_success_at: string | null;
  age_minutes: number | null;
  status: "FRESH" | "DEGRADED" | "STALE" | "NEVER_ATTEMPTED";
}

export interface CapabilityHealth {
  capability: CapabilityName;
  status: HealthStatus;
  summary: string;
  evidence: Record<string, unknown>;
}

export interface SystemHealthReport {
  overall_status: HealthStatus;
  evaluated_at: string;
  capabilities: Record<CapabilityName, CapabilityHealth>;
}

/**
 * Evaluates route-specific freshness.
 * Section 30: One fresh route cannot make stale routes appear healthy.
 */
export function evaluateRouteFreshness(
  record: RouteExecutionRecord,
  nowIso = new Date().toISOString(),
): RouteFreshnessInfo {
  if (!record.last_success_at) {
    return {
      route_id: record.route_id,
      last_attempt_at: record.last_attempt_at,
      last_success_at: null,
      age_minutes: null,
      status: "NEVER_ATTEMPTED",
    };
  }

  const nowMs = new Date(nowIso).getTime();
  const lastSuccessMs = new Date(record.last_success_at).getTime();
  const ageMinutes = Math.max(0, Math.floor((nowMs - lastSuccessMs) / 60000));

  let status: "FRESH" | "DEGRADED" | "STALE" = "FRESH";
  if (ageMinutes > 720) {
    status = "STALE"; // > 12h
  } else if (ageMinutes > 240) {
    status = "DEGRADED"; // 4h - 12h
  }

  return {
    route_id: record.route_id,
    last_attempt_at: record.last_attempt_at,
    last_success_at: record.last_success_at,
    age_minutes: ageMinutes,
    status,
  };
}

/**
 * Calculates Route Coverage capability based purely on real execution,
 * not static configuration claims. (Section 31 & 34)
 */
export function evaluateRouteCoverageHealth(
  configuredCount: number,
  routes: RouteExecutionRecord[],
): CapabilityHealth {
  if (configuredCount <= 0 || routes.length === 0) {
    return {
      capability: "ROUTE_COVERAGE",
      status: "RED",
      summary: "Chưa có tuyến bay nào được quét thành công từ lần triển khai gần nhất.",
      evidence: { configured: configuredCount, attempted: 0, successful: 0, failure_rate: 1 },
    };
  }

  let attempted = 0;
  let successful = 0;
  let failed = 0;
  const failureBreakdown: Record<FailureReason, number> = {
    VALID_ZERO: 0,
    PROVIDER_ERROR: 0,
    NETWORK_ERROR: 0,
    PARSER_ERROR: 0,
    UNSUPPORTED_ROUTE: 0,
    UNKNOWN: 0,
  };

  for (const r of routes) {
    if (r.attempt_count > 0) {
      attempted++;
      if (r.success_count > 0) {
        successful++;
      } else {
        failed++;
        if (r.last_failure_reason) {
          failureBreakdown[r.last_failure_reason] = (failureBreakdown[r.last_failure_reason] || 0) + 1;
        }
      }
    }
  }

  const failureRate = attempted > 0 ? failed / attempted : 1;
  const executionCoverageRate = configuredCount > 0 ? successful / configuredCount : 0;

  let status: HealthStatus = "GREEN";
  let summary = `Đã kiểm tra thành công ${successful}/${configuredCount} tuyến bay đang theo dõi.`;

  // Negative control (Section 54): large route-failure ratio -> capability cannot report healthy coverage
  if (failureRate >= 0.3 || executionCoverageRate < 0.5) {
    status = "RED";
    summary = `Tỷ lệ lỗi quét tuyến bay cao (${Math.round(failureRate * 100)}% lỗi trên các lượt quét).`;
  } else if (failureRate >= 0.1 || executionCoverageRate < 0.8) {
    status = "AMBER";
    summary = `Một số tuyến gặp sự cố gián đoạn từ nhà cung cấp dữ liệu (${Math.round(failureRate * 100)}% lỗi).`;
  }

  return {
    capability: "ROUTE_COVERAGE",
    status,
    summary,
    evidence: {
      configured: configuredCount,
      attempted,
      successful,
      failed,
      failure_rate: failureRate,
      execution_coverage_rate: executionCoverageRate,
      failure_breakdown: failureBreakdown,
    },
  };
}

/**
 * Evaluates Live Verify Health.
 * Section 34: Do not let live provider HTTP 503 turn the customer capability GREEN.
 */
export function evaluateLiveVerifyHealth(params: {
  recentChecksCount: number;
  provider503Count: number;
  successCount: number;
  averageLatencyMs: number;
}): CapabilityHealth {
  const { recentChecksCount, provider503Count, successCount } = params;

  if (recentChecksCount === 0) {
    return {
      capability: "LIVE_VERIFY_HEALTH",
      status: "AMBER",
      summary: "Đang chờ lượt xác minh trực tiếp đầu tiên.",
      evidence: params,
    };
  }

  const errorRate = (recentChecksCount - successCount) / recentChecksCount;

  // If provider returns HTTP 503s or high error rate, must downgrade
  if (provider503Count > 0 || errorRate >= 0.2) {
    return {
      capability: "LIVE_VERIFY_HEALTH",
      status: errorRate >= 0.5 ? "RED" : "AMBER",
      summary: `Xác minh trực tiếp bị gián đoạn do phản hồi từ đối tác bán vé (HTTP 503: ${provider503Count}).`,
      evidence: params,
    };
  }

  return {
    capability: "LIVE_VERIFY_HEALTH",
    status: "GREEN",
    summary: "Xác minh trực tiếp đang hoạt động ổn định.",
    evidence: params,
  };
}

/**
 * Evaluates Observed Opportunity Health.
 * Section 34: healthy_empty cannot mask as all-green capability.
 */
export function evaluateObservedOpportunityHealth(params: {
  opportunityCount: number;
  oldestAgeMinutes: number;
  feedStatus: string;
}): CapabilityHealth {
  if (params.opportunityCount === 0) {
    return {
      capability: "OBSERVED_OPPORTUNITY_HEALTH",
      status: "AMBER",
      summary: "Chưa có cơ hội hợp lệ nào đáp ứng ngưỡng so sánh (kho dữ liệu trống).",
      evidence: params,
    };
  }

  if (params.feedStatus === "degraded_freshness" || params.oldestAgeMinutes > 720) {
    return {
      capability: "OBSERVED_OPPORTUNITY_HEALTH",
      status: "AMBER",
      summary: "Các cơ hội quan sát hiện tại đã quá 12 giờ chưa có lượt quét mới.",
      evidence: params,
    };
  }

  return {
    capability: "OBSERVED_OPPORTUNITY_HEALTH",
    status: "GREEN",
    summary: `Hiện có ${params.opportunityCount} cơ hội giá vé đang được cập nhật liên tục.`,
    evidence: params,
  };
}
