import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!isSupabaseConfigured) {
      setError("Đăng nhập chưa khả dụng vì Supabase Auth chưa được cấu hình.");
      return;
    }
    const result = mode === "sign-in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (mode === "sign-up" && !result.data.session) {
      setMessage("Tài khoản đã tạo. Hãy kiểm tra email để xác nhận trước khi đăng nhập.");
    } else {
      setSignedIn(true);
      setMessage("Đăng nhập thành công.");
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSignedIn(false);
    setMessage("Đã đăng xuất.");
  }

  return (
    <main className="min-h-screen bg-slate-950 pt-28 pb-20 px-4">
      <div className="max-w-md mx-auto bg-slate-900 border border-white/10 rounded-3xl p-8">
        <h1 className="text-3xl font-black text-white mb-2">Tài khoản FlyCheap AI</h1>
        <p className="text-slate-400 text-sm mb-8">Đồng bộ preferences và deal đã lưu trên các thiết bị.</p>
        {signedIn ? (
          <div className="space-y-4">
            <p className="text-emerald-300" role="status">Bạn đã đăng nhập.</p>
            <button type="button" onClick={() => void signOut()} className="w-full py-3 rounded-xl bg-slate-800 text-white font-bold">Đăng xuất</button>
          </div>
        ) : (
          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            <label className="block text-sm text-slate-300">Email
              <input aria-label="Email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white" />
            </label>
            <label className="block text-sm text-slate-300">Mật khẩu
              <input aria-label="Mật khẩu" type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white" />
            </label>
            {error && <p role="alert" className="text-red-300 text-sm">{error}</p>}
            {message && <p role="status" className="text-emerald-300 text-sm">{message}</p>}
            <button type="submit" className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold">{mode === "sign-in" ? "Đăng nhập" : "Tạo tài khoản"}</button>
            <button type="button" onClick={() => { setMode(mode === "sign-in" ? "sign-up" : "sign-in"); setError(""); setMessage(""); }} className="w-full text-sky-300 text-sm">{mode === "sign-in" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}</button>
          </form>
        )}
        <Link to="/deals" className="block text-center text-slate-500 text-sm mt-6 hover:text-white">Tiếp tục không cần tài khoản</Link>
      </div>
    </main>
  );
}
