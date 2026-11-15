export type AuthMode = "sign-in" | "sign-up";

export const SIGN_UP_PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AUTH_VALIDATION_CACHE = new Map<string, string | undefined>();
const MAX_CACHE_SIZE = 10000;

export function validateAuthCredentials(email: string, password: string, mode: AuthMode): string | undefined {
  const cacheKey = `${email}|${password}|${mode}`;
  const cached = AUTH_VALIDATION_CACHE.get(cacheKey);
  if (cached !== undefined) {
    return cached === "" ? undefined : cached;
  }

  const normalizedEmail = email.trim();
  let result: string | undefined;

  if (!normalizedEmail || normalizedEmail.length > 254 || !EMAIL_REGEX.test(normalizedEmail)) {
    result = "Nhập địa chỉ email hợp lệ.";
  } else if (!password || password.length > PASSWORD_MAX_LENGTH) {
    result = "Mật khẩu không hợp lệ.";
  } else if (mode === "sign-up" && password.length < SIGN_UP_PASSWORD_MIN_LENGTH) {
    result = `Mật khẩu đăng ký cần ít nhất ${SIGN_UP_PASSWORD_MIN_LENGTH} ký tự.`;
  }

  if (AUTH_VALIDATION_CACHE.size >= MAX_CACHE_SIZE) {
    AUTH_VALIDATION_CACHE.clear();
  }
  AUTH_VALIDATION_CACHE.set(cacheKey, result ?? "");

  return result;
}

export function safeAuthError(mode: AuthMode): string {
  return mode === "sign-in"
    ? "Không thể đăng nhập. Kiểm tra email, mật khẩu hoặc trạng thái xác nhận tài khoản."
    : "Không thể tạo tài khoản với thông tin này. Hãy kiểm tra lại hoặc thử sau.";
}
