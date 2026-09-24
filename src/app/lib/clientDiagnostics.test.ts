import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicClientError, reportClientIssue } from "./clientDiagnostics";

afterEach(() => vi.restoreAllMocks());

describe("client diagnostics boundary", () => {
  it("emits only a stable issue code", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    reportClientIssue("observed_feed_unavailable");
    expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"observed_feed_unavailable"}');
  });

  it("normalizes unreviewed free-form values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    reportClientIssue("email=a@example.com token=secret");
    expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');
  });

  it("keeps a stable public code and reviewed message", () => {
    const error = new PublicClientError("alert_create_failed", "Không thể tạo cảnh báo lúc này.");
    expect(error.code).toBe("alert_create_failed");
    expect(error.message).toBe("Không thể tạo cảnh báo lúc này.");
  });
});
