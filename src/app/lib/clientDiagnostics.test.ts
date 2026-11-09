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

    it("accepts valid codes with alphanumeric characters and underscores", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      reportClientIssue("feed_v2_cache_miss");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"feed_v2_cache_miss"}');

      reportClientIssue("route_han_bkk_001");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"route_han_bkk_001"}');
    });

    it("accepts codes at exact minimum length boundary (3 characters)", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      reportClientIssue("abc");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"abc"}');

      reportClientIssue("a_1");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"a_1"}');
    });

    it("accepts codes at exact maximum length boundary (64 characters)", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const code64 = "a" + "b".repeat(63);
      reportClientIssue(code64);
      expect(warn).toHaveBeenCalledWith(JSON.stringify({ event: "client_issue", code: code64 }));
    });

    it("normalizes unreviewed free-form strings containing PII, spaces, or tokens (NC-025)", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      reportClientIssue("email=a@example.com token=secret");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');

      reportClientIssue("user_id=12345&access_token=xyz");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');
    });

    it("normalizes SQL injection payloads to client_issue_invalid_code", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      reportClientIssue("SELECT * FROM users WHERE id=1");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');

      reportClientIssue("DROP TABLE subscriptions;--");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');
    });

    it("normalizes uppercase letters to client_issue_invalid_code", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      reportClientIssue("Observed_Feed_Unavailable");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');

      reportClientIssue("INVALID_CODE");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');
    });

    it("normalizes hyphens, periods, colons, and special characters", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      reportClientIssue("feed-cache-error");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');

      reportClientIssue("feed.cache.error");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');

      reportClientIssue("feed:cache:error");
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
    });

    it("rejects codes above maximum length boundary (> 64 characters) (NC-026)", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
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

    it("normalizes newline, tab, and control characters defensively", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      reportClientIssue("code_with\nnewline");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');

      reportClientIssue("code_with\ttab");
      expect(warn).toHaveBeenCalledWith('{"event":"client_issue","code":"client_issue_invalid_code"}');
    });

    it("performance benchmark: 10,000 issue reports execute in < 50ms", () => {
      vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const codes = [
        "valid_code_one",
        "valid_code_two",
        "invalid CODE",
        "too_short",
        "client_issue_invalid_code",
      ];

      const start = performance.now();
      for (let i = 0; i < 10000; i++) {
        reportClientIssue(codes[i % codes.length]);
      }
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50);
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

    it("preserves stack trace and error serialization without leaking unexpected properties", () => {
      const error = new PublicClientError("network_timeout", "Kết nối mạng quá thời gian.");
      expect(typeof error.stack).toBe("string");
      expect(error.toString()).toContain("PublicClientError: Kết nối mạng quá thời gian.");
    });
  });
});
