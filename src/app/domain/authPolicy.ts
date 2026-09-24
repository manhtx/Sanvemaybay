export type AuthMode = "sign-in" | "sign-up";

export const SIGN_UP_PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export function validateAuthCredentials(email: string, password: string, mode: AuthMode): string | undefined {
  const normalizedEmail = email.trim();
  if (!normalizedEmail || normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return "Nhập địa chỉ email hợp lệ.";
  }
  if (!password || password.length > PASSWORD_MAX_LENGTH) return "Mật khẩu không hợp lệ.";
  if (mode === "sign-up" && password.length < SIGN_UP_PASSWORD_MIN_LENGTH) {
    return `Mật khẩu đăng ký cần ít nhất ${SIGN_UP_PASSWORD_MIN_LENGTH} ký tự.`;
  }
  return undefined;
}

export function safeAuthError(mode: AuthMode): string {
  return mode === "sign-in"
    ? "Không thể đăng nhập. Kiểm tra email, mật khẩu hoặc trạng thái xác nhận tài khoản."
    : "Không thể tạo tài khoản với thông tin này. Hãy kiểm tra lại hoặc thử sau.";
}
