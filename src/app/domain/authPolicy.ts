export type AuthMode = "sign-in" | "sign-up";

export const SIGN_UP_PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_VALIDATION_CACHE = new Map<string, boolean>();
const MAX_CACHE_SIZE = 5000;

function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const cached = EMAIL_VALIDATION_CACHE.get(email);
  if (cached !== undefined) return cached;

  const normalizedEmail = email.trim();
  const valid =
    normalizedEmail.length > 0 &&
    normalizedEmail.length <= 254 &&
    EMAIL_REGEX.test(normalizedEmail);

  if (EMAIL_VALIDATION_CACHE.size >= MAX_CACHE_SIZE) {
    EMAIL_VALIDATION_CACHE.clear();
  }
  EMAIL_VALIDATION_CACHE.set(email, valid);
  return valid;
}

export function validateAuthCredentials(email: string, password: string, mode: AuthMode): string | undefined {
  if (!isValidEmail(email)) {
    return "Nhập địa chỉ email hợp lệ.";
  }
  const passLen = typeof password === "string" ? password.length : 0;
  if (!passLen || passLen > PASSWORD_MAX_LENGTH) {
    return "Mật khẩu không hợp lệ.";
  }
  if (mode === "sign-up" && passLen < SIGN_UP_PASSWORD_MIN_LENGTH) {
    return `Mật khẩu đăng ký cần ít nhất ${SIGN_UP_PASSWORD_MIN_LENGTH} ký tự.`;
  }
  return undefined;
}

export function safeAuthError(mode: AuthMode): string {
  return mode === "sign-in"
    ? "Không thể đăng nhập. Kiểm tra email, mật khẩu hoặc trạng thái xác nhận tài khoản."
    : "Không thể tạo tài khoản với thông tin này. Hãy kiểm tra lại hoặc thử sau.";
}
