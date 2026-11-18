import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { PASSWORD_MAX_LENGTH, safeAuthError, SIGN_UP_PASSWORD_MIN_LENGTH, validateAuthCredentials } from "../domain/authPolicy";
import { DataRightsPanel } from "../components/DataRightsPanel";

type AuthMode = "sign-in" | "sign-up" | "forgot-password" | "reset-password";

export function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(Boolean(data.session));
      setUserEmail(data.session?.user?.email ?? null);
    });

    // Check for password recovery hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setMode("reset-password");
    }
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!isSupabaseConfigured) {
      setError("Đăng nhập chưa khả dụng vì Supabase Auth chưa được cấu hình.");
      return;
    }

    if (mode === "forgot-password") {
      if (!email.trim() || !email.includes("@")) {
        setError("Vui lòng nhập địa chỉ email hợp lệ.");
        return;
      }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth#type=recovery`,
      });
      if (resetError) {
        setError("Không thể gửi email đặt lại mật khẩu lúc này. Hãy thử lại sau.");
      } else {
        setMessage("Đã gửi email hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.");
      }
      return;
    }

    if (mode === "reset-password") {
      if (!newPassword || newPassword.length < SIGN_UP_PASSWORD_MIN_LENGTH) {
        setError(`Mật khẩu mới phải có ít nhất ${SIGN_UP_PASSWORD_MIN_LENGTH} ký tự.`);
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError("Không thể cập nhật mật khẩu mới. Phiên đặt lại có thể đã hết hạn.");
      } else {
        setMessage("Đặt lại mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới.");
        setMode("sign-in");
        setPassword("");
        setNewPassword("");
      }
      return;
    }

    const validationError = validateAuthCredentials(email, password, mode);
    if (validationError) {
      setError(validationError);
      return;
    }

    const result = mode === "sign-in"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });

    if (result.error) {
      setError(safeAuthError(mode));
      return;
    }

    if (mode === "sign-up" && !result.data.session) {
      setMessage("Tài khoản đã tạo. Hãy kiểm tra email để xác nhận trước khi đăng nhập.");
    } else {
      setSignedIn(true);
      setUserEmail(result.data.session?.user?.email ?? email.trim());
      setMessage("Đăng nhập thành công.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSignedIn(false);
    setUserEmail(null);
    setMessage("Đã đăng xuất.");
  }

  return (
    <main className="min-h-screen bg-white pt-28 pb-20 px-4 text-[#222222]">
      <div className="mx-auto max-w-md rounded-[14px] border border-[#dddddd] bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#222222] mb-2 tracking-tight">Tài khoản Farely</h1>
        <p className="text-[#6a6a6a] text-xs sm:text-sm mb-6 leading-relaxed">
          Đồng bộ danh sách theo dõi (Watch) và cơ hội đã lưu (Saved) an toàn trên các thiết bị.
        </p>

        {signedIn ? (
          <div className="space-y-5">
            <div className="rounded-[14px] border border-emerald-200 bg-emerald-50/70 p-4">
              <span className="text-xs text-[#6a6a6a] block mb-1">Đang đăng nhập với email:</span>
              <p className="text-emerald-800 font-bold text-sm" role="status">
                {userEmail || "Tài khoản người dùng"}
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                to="/watch"
                className="flex-1 text-center rounded-lg bg-[#f7f7f7] hover:bg-[#ebebeb] py-2.5 text-xs font-bold text-[#222222] transition border border-[#dddddd]"
              >
                Quản lý theo dõi
              </Link>
              <Link
                to="/saved"
                className="flex-1 text-center rounded-lg bg-[#f7f7f7] hover:bg-[#ebebeb] py-2.5 text-xs font-bold text-[#222222] transition border border-[#dddddd]"
              >
                Cơ hội đã lưu
              </Link>
            </div>

            <button
              type="button"
              onClick={() => void signOut()}
              className="w-full rounded-lg bg-[#f7f7f7] hover:bg-[#ebebeb] py-2.5 text-xs font-bold text-[#222222] transition border border-[#dddddd] cursor-pointer"
            >
              Đăng xuất
            </button>

            {/* Account Deletion and Data Export */}
            <DataRightsPanel />
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            {mode === "reset-password" ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6a6a6a] mb-1.5">
                  Mật khẩu mới
                </label>
                <input
                  aria-label="Mật khẩu mới"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={SIGN_UP_PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={`Ít nhất ${SIGN_UP_PASSWORD_MIN_LENGTH} ký tự`}
                  className="w-full bg-white border border-[#dddddd] rounded-lg px-3 py-2 text-sm text-[#222222] focus:outline-none focus:border-[#0084e6] focus:ring-1 focus:ring-[#0084e6]"
                />
              </div>
            ) : mode === "forgot-password" ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#6a6a6a] mb-1.5">
                  Email tài khoản
                </label>
                <input
                  aria-label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full bg-white border border-[#dddddd] rounded-lg px-3 py-2 text-sm text-[#222222] focus:outline-none focus:border-[#0084e6] focus:ring-1 focus:ring-[#0084e6]"
                />
                <p className="text-xs text-[#6a6a6a] mt-2">
                  Chúng tôi sẽ gửi đường dẫn đặt lại mật khẩu đến email này.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="auth-email-input" className="block text-xs font-bold uppercase tracking-wider text-[#6a6a6a] mb-1.5">
                    Email
                  </label>
                  <input
                    id="auth-email-input"
                    aria-label="Email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    className="w-full bg-white border border-[#dddddd] rounded-lg px-3 py-2 text-sm text-[#222222] focus:outline-none focus:border-[#0084e6] focus:ring-1 focus:ring-[#0084e6]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="auth-password-input" className="block text-xs font-bold uppercase tracking-wider text-[#6a6a6a]">
                      Mật khẩu
                    </label>
                    {mode === "sign-in" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot-password");
                          setError("");
                          setMessage("");
                        }}
                        className="text-xs text-[#0084e6] hover:underline font-medium"
                      >
                        Quên mật khẩu?
                      </button>
                    )}
                  </div>
                  <input
                    id="auth-password-input"
                    aria-label="Mật khẩu"
                    type="password"
                    autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                    required
                    minLength={mode === "sign-up" ? SIGN_UP_PASSWORD_MIN_LENGTH : 1}
                    maxLength={PASSWORD_MAX_LENGTH}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-[#dddddd] rounded-lg px-3 py-2 text-sm text-[#222222] focus:outline-none focus:border-[#0084e6] focus:ring-1 focus:ring-[#0084e6]"
                  />
                </div>

                {mode === "sign-up" && (
                  <p className="text-xs text-[#6a6a6a]">
                    Mật khẩu yêu cầu ít nhất {SIGN_UP_PASSWORD_MIN_LENGTH} ký tự.
                  </p>
                )}
              </>
            )}

            {error && (
              <p role="alert" className="text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg text-xs font-medium">
                {error}
              </p>
            )}
            {message && (
              <p role="status" className="text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-xs font-medium">
                {message}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-[#0084e6] hover:bg-[#006ec4] active:bg-[#005ba3] py-2.5 text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer shadow-sm"
            >
              {mode === "sign-in"
                ? "Đăng nhập"
                : mode === "sign-up"
                ? "Tạo tài khoản"
                : mode === "forgot-password"
                ? "Gửi liên kết đặt lại mật khẩu"
                : "Lưu mật khẩu mới"}
            </button>

            <div className="pt-2 text-center space-y-2">
              {mode === "sign-in" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("sign-up");
                    setError("");
                    setMessage("");
                  }}
                  className="text-xs text-[#0084e6] hover:underline font-medium"
                >
                  Chưa có tài khoản? Đăng ký
                </button>
              )}

              {mode === "sign-up" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("sign-in");
                    setError("");
                    setMessage("");
                  }}
                  className="text-xs text-[#0084e6] hover:underline font-medium"
                >
                  Đã có tài khoản? Đăng nhập
                </button>
              )}

              {mode === "forgot-password" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("sign-in");
                    setError("");
                    setMessage("");
                  }}
                  className="text-xs text-[#6a6a6a] hover:text-[#222222]"
                >
                  Quay lại đăng nhập
                </button>
              )}
            </div>
          </form>
        )}

        <Link
          to="/deals"
          className="block text-center text-[#6a6a6a] text-xs mt-6 hover:text-[#222222]"
        >
          Tiếp tục xem cơ hội mà không cần đăng nhập
        </Link>
      </div>
    </main>
  );
}
