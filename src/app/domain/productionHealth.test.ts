import { describe, expect, it } from "vitest";
import {
  evaluateRouteCoverageHealth,
  evaluateRouteFreshness,
  evaluateLiveVerifyHealth,
  evaluateObservedOpportunityHealth,
  RouteExecutionRecord,
} from "./productionHealth";

describe("Production Health & Execution-backed Coverage (Sections 30, 31, 34, 54)", () => {
  it("Negative Control: Large route-failure ratio prevents ROUTE_COVERAGE from reporting GREEN", () => {
    // 20 configured routes, 10 attempted, 5 provider errors (50% failure rate)
    const routes: RouteExecutionRecord[] = [
      { route_id: "r1", origin_code: "HAN", destination_code: "BKK", last_attempt_at: "2026-10-05T10:00:00Z", last_success_at: "2026-10-05T10:00:00Z", attempt_count: 3, success_count: 3, failure_count: 0, last_failure_reason: null },
      { route_id: "r2", origin_code: "SGN", destination_code: "SIN", last_attempt_at: "2026-10-05T10:00:00Z", last_success_at: "2026-10-05T10:00:00Z", attempt_count: 3, success_count: 3, failure_count: 0, last_failure_reason: null },
      { route_id: "r3", origin_code: "DAD", destination_code: "ICN", last_attempt_at: "2026-10-05T10:00:00Z", last_success_at: null, attempt_count: 3, success_count: 0, failure_count: 3, last_failure_reason: "PROVIDER_ERROR" },
      { route_id: "r4", origin_code: "HAN", destination_code: "NRT", last_attempt_at: "2026-10-05T10:00:00Z", last_success_at: null, attempt_count: 3, success_count: 0, failure_count: 3, last_failure_reason: "NETWORK_ERROR" },
    ];

    const result = evaluateRouteCoverageHealth(10, routes);

    // Negative control: cannot be GREEN
    expect(result.status).not.toBe("GREEN");
    expect(result.status).toBe("RED");
    expect(result.evidence.failure_rate).toBeGreaterThanOrEqual(0.3);
  });

  it("Section 34: Live provider HTTP 503 cannot turn LIVE_VERIFY_HEALTH to GREEN", () => {
    const health = evaluateLiveVerifyHealth({
      recentChecksCount: 10,
      provider503Count: 2,
      successCount: 8,
      averageLatencyMs: 1200,
    });

    // 503s must degrade capability
    expect(health.status).not.toBe("GREEN");
    expect(["AMBER", "RED"]).toContain(health.status);
    expect(health.summary).toContain("HTTP 503");
  });

  it("Section 34: healthy_empty (0 deals) reports AMBER, not masking as an active green feed", () => {
    const health = evaluateObservedOpportunityHealth({
      opportunityCount: 0,
      oldestAgeMinutes: 10,
      feedStatus: "healthy_empty",
    });

    expect(health.status).toBe("AMBER");
    expect(health.summary).toContain("kho dữ liệu trống");
  });

  it("Section 30: One fresh route cannot make a stale route appear healthy", () => {
    const baseNow = "2026-10-05T12:00:00.000Z";
    const freshRoute: RouteExecutionRecord = {
      route_id: "fresh-1",
      origin_code: "HAN",
      destination_code: "SGN",
      last_attempt_at: "2026-10-05T11:45:00.000Z",
      last_success_at: "2026-10-05T11:45:00.000Z", // 15 min ago
      attempt_count: 10,
      success_count: 10,
      failure_count: 0,
      last_failure_reason: null,
    };

    const staleRoute: RouteExecutionRecord = {
      route_id: "stale-1",
      origin_code: "HAN",
      destination_code: "CDG",
      last_attempt_at: "2026-10-04T12:00:00.000Z",
      last_success_at: "2026-10-04T12:00:00.000Z", // 24 hours ago
      attempt_count: 5,
      success_count: 1,
      failure_count: 4,
      last_failure_reason: "PROVIDER_ERROR",
    };

    const freshEval = evaluateRouteFreshness(freshRoute, baseNow);
    const staleEval = evaluateRouteFreshness(staleRoute, baseNow);

    expect(freshEval.status).toBe("FRESH");
    expect(freshEval.age_minutes).toBe(15);

    expect(staleEval.status).toBe("STALE");
    expect(staleEval.age_minutes).toBe(1440);
  });
});
