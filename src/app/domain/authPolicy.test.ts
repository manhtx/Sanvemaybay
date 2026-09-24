import { describe, expect, it } from "vitest";
import { safeAuthError, SIGN_UP_PASSWORD_MIN_LENGTH, validateAuthCredentials } from "./authPolicy";

describe("auth policy", () => {
  it("requires stronger new passwords without locking out existing sign-ins", () => {
    expect(validateAuthCredentials("user@example.com", "legacy6", "sign-in")).toBeUndefined();
    expect(validateAuthCredentials("user@example.com", "short", "sign-up")).toContain(String(SIGN_UP_PASSWORD_MIN_LENGTH));
    expect(validateAuthCredentials("user@example.com", "a-secure-password", "sign-up")).toBeUndefined();
  });

  it("rejects malformed or excessive credentials", () => {
    expect(validateAuthCredentials("not-email", "a-secure-password", "sign-up")).toBeTruthy();
    expect(validateAuthCredentials("user@example.com", "x".repeat(129), "sign-in")).toBeTruthy();
  });

  it("never returns provider error details to the user", () => {
    expect(safeAuthError("sign-in")).not.toContain("Supabase");
    expect(safeAuthError("sign-up")).not.toContain("already registered");
  });
});
