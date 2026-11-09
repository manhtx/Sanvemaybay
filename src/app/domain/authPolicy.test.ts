import { describe, expect, it } from "vitest";
import {
  PASSWORD_MAX_LENGTH,
  safeAuthError,
  SIGN_UP_PASSWORD_MIN_LENGTH,
  validateAuthCredentials,
} from "./authPolicy";

describe("auth policy credential validation", () => {
  describe("email validation", () => {
    it("accepts valid standard email addresses", () => {
      expect(validateAuthCredentials("user@example.com", "validPassword123", "sign-up")).toBeUndefined();
      expect(validateAuthCredentials("first.last+promo@sub.domain.co.uk", "validPassword123", "sign-up")).toBeUndefined();
    });

    it("trims whitespace from email input before validating", () => {
      expect(validateAuthCredentials("  user@example.com  ", "validPassword123", "sign-up")).toBeUndefined();
    });

    it("rejects empty or whitespace-only email", () => {
      expect(validateAuthCredentials("", "validPassword123", "sign-up")).toBe("Nhập địa chỉ email hợp lệ.");
      expect(validateAuthCredentials("   ", "validPassword123", "sign-up")).toBe("Nhập địa chỉ email hợp lệ.");
    });

    it("enforces RFC 5321 254-character upper bound for email length", () => {
      const longLocal = "a".repeat(240);
      const validEmail = `${longLocal}@example.com`; // 252 chars
      expect(validEmail.length).toBeLessThanOrEqual(254);
      expect(validateAuthCredentials(validEmail, "validPassword123", "sign-up")).toBeUndefined();

      const excessiveLocal = "a".repeat(245);
      const excessiveEmail = `${excessiveLocal}@example.com`; // 257 chars
      expect(excessiveEmail.length).toBeGreaterThan(254);
      expect(validateAuthCredentials(excessiveEmail, "validPassword123", "sign-up")).toBe("Nhập địa chỉ email hợp lệ.");
    });

    it("rejects malformed email formats", () => {
      const invalidEmails = [
        "not-an-email",
        "@missing-local.com",
        "missing-domain@",
        "missing-tld@domain",
        "spaces in@local.com",
        "user@spaces in domain.com",
      ];
      for (const email of invalidEmails) {
        expect(validateAuthCredentials(email, "validPassword123", "sign-up")).toBe("Nhập địa chỉ email hợp lệ.");
      }
    });
  });

  describe("password validation", () => {
    it("rejects empty or missing passwords in both modes", () => {
      expect(validateAuthCredentials("user@example.com", "", "sign-in")).toBe("Mật khẩu không hợp lệ.");
      expect(validateAuthCredentials("user@example.com", "", "sign-up")).toBe("Mật khẩu không hợp lệ.");
    });

    it("enforces 128-character upper bound in both modes", () => {
      const atLimit = "a".repeat(PASSWORD_MAX_LENGTH);
      const overLimit = "a".repeat(PASSWORD_MAX_LENGTH + 1);

      expect(validateAuthCredentials("user@example.com", atLimit, "sign-up")).toBeUndefined();
      expect(validateAuthCredentials("user@example.com", overLimit, "sign-up")).toBe("Mật khẩu không hợp lệ.");
      expect(validateAuthCredentials("user@example.com", overLimit, "sign-in")).toBe("Mật khẩu không hợp lệ.");
    });

    it("enforces 12-character minimum strictly for sign-up", () => {
      const elevenChars = "a".repeat(SIGN_UP_PASSWORD_MIN_LENGTH - 1);
      const twelveChars = "a".repeat(SIGN_UP_PASSWORD_MIN_LENGTH);

      expect(validateAuthCredentials("user@example.com", elevenChars, "sign-up")).toBe(
        `Mật khẩu đăng ký cần ít nhất ${SIGN_UP_PASSWORD_MIN_LENGTH} ký tự.`,
      );
      expect(validateAuthCredentials("user@example.com", twelveChars, "sign-up")).toBeUndefined();
    });

    it("permits shorter legacy passwords during sign-in to prevent lockout", () => {
      // Legacy passwords shorter than 12 characters are accepted during sign-in
      expect(validateAuthCredentials("user@example.com", "legacy6", "sign-in")).toBeUndefined();
      expect(validateAuthCredentials("user@example.com", "short", "sign-in")).toBeUndefined();
    });
  });

  describe("safeAuthError generic messaging", () => {
    it("returns sanitized, user-friendly messages for both authentication modes", () => {
      expect(safeAuthError("sign-in")).toBe(
        "Không thể đăng nhập. Kiểm tra email, mật khẩu hoặc trạng thái xác nhận tài khoản.",
      );
      expect(safeAuthError("sign-up")).toBe(
        "Không thể tạo tài khoản với thông tin này. Hãy kiểm tra lại hoặc thử sau.",
      );
    });

    it("never discloses vendor identifiers, database internals, or user enumeration hints", () => {
      const forbiddenTokens = ["supabase", "postgres", "sql", "exception", "already exists", "not found"];
      const signInMsg = safeAuthError("sign-in").toLowerCase();
      const signUpMsg = safeAuthError("sign-up").toLowerCase();

      for (const token of forbiddenTokens) {
        expect(signInMsg).not.toContain(token);
        expect(signUpMsg).not.toContain(token);
      }
    });
  });
});
