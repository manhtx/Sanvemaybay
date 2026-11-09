import { afterEach, describe, expect, it, vi } from "vitest";
import { PublicClientError, reportClientIssue } from "./clientDiagnostics";

afterEach(() => vi.restoreAllMocks());

describe("client diagnostics boundary (REQ-SEC-002, NC-025, NC-026, REQ-DOM-001)", () => {
  describe("reportClientIssue: format, structure, and low-cardinality regex gating", () => {
    it("emits structured JSON with exact issue code when code conforms to pattern", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      reportClientIssue("observed_feed_unavailable");
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"observed_feed_unavailable"}');

      reportClientIssue("deal_redirect_missing_params");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"deal_redirect_missing_params"}');
    });

    it("normalizes unreviewed free-form strings containing PII, spaces, or tokens (NC-025)", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      reportClientIssue("email=a@example.com token=secret");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');

      reportClientIssue("SELECT * FROM users WHERE id=1");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');
    });

    it("normalizes uppercase letters, spaces, hyphens, and special characters", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      reportClientIssue("Observed_Feed_Unavailable");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');

      reportClientIssue("feed-cache-error");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');

      reportClientIssue("feed.cache.error");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');
    });

    it("rejects codes below minimum length boundary (< 3 characters)", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      reportClientIssue("");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');

      reportClientIssue("a");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');

      reportClientIssue("ab");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');

      // Length 3 is valid
      reportClientIssue("abc");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"abc"}');
    });

    it("rejects codes above maximum length boundary (> 64 characters) (NC-026)", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      // Length 64 is valid
      const code64 = "a" + "b".repeat(63);
      reportClientIssue(code64);
      expect(warn).toHaveBeenCalledWith(JSON.stringify({ event: "client_issue", code: code64 }));

      // Length 65 is invalid
      const code65 = "a" + "b".repeat(64);
      reportClientIssue(code65);
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');
    });

    it("rejects codes starting with a number or underscore", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      reportClientIssue("1_invalid_start");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');

      reportClientIssue("_invalid_start");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');
    });
  });

  describe("PublicClientError: error hierarchy and message review", () => {
    it("subclasses Error and sets name property to PublicClientError", () => {
      const error = new PublicClientError("alert_create_failed", "Không thể tạo cảnh báo lúc này.");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(PublicClientError);
      expect(error.name).toBe("PublicClientError");
    });

    it("keeps stable programmatic code and reviewed user-facing message (NC-025)", () => {
      const error = new PublicClientError("auth_session_expired", "Phiên đăng nhập đã hết hạn. Vui lòng thử lại.");
      expect(error.code).toBe("auth_session_expired");
      expect(error.message).toBe("Phiên đăng nhập đã hết hạn. Vui lòng thử lại.");
    });
  });
});
