import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export function DataRightsPanel() {
  const [signedIn, setSignedIn] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void supabase.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);

  async function exportData() {
    setBusy(true);
    setStatus("");
    const { data, error } = await supabase.functions.invoke("manage-user-data", { body: { action: "export" } });
    if (error || !data?.export) {
      setStatus("Không thể xuất dữ liệu lúc này.");
    } else {
      const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `farely-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus("Đã tạo tệp xuất dữ liệu.");
    }
    setBusy(false);
  }

  async function deleteAccount() {
    if (confirmation !== "DELETE_MY_ACCOUNT") return;
    setBusy(true);
    setStatus("");
    const { data, error } = await supabase.functions.invoke("manage-user-data", {
      body: { action: "delete", confirmation },
    });
    if (error || data?.deleted !== true) {
      setStatus("Không thể xóa tài khoản lúc này. Dữ liệu không được coi là đã xóa.");
    } else {
      await supabase.auth.signOut();
      setSignedIn(false);
      setConfirmation("");
      setStatus("Tài khoản và dữ liệu gắn với tài khoản đã được xóa.");
    }
    setBusy(false);
  }

  return (
    <section className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-5" aria-labelledby="data-rights-heading">
      <h2 id="data-rights-heading" className="text-base font-bold text-stone-900">Xuất hoặc xóa dữ liệu tài khoản</h2>
      {!signedIn ? (
        <p className="mt-2 text-sm text-stone-600">Đăng nhập tại trang Tài khoản để xuất dữ liệu hoặc yêu cầu xóa tài khoản.</p>
      ) : (
        <div className="mt-4 space-y-5">
          <button
            type="button"
            disabled={busy}
            onClick={() => void exportData()}
            className="min-h-11 rounded-lg border border-blue-600 bg-blue-50 px-4 font-semibold text-xs text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition"
          >
            Tải dữ liệu của tôi
          </button>
          <div className="border-t border-stone-200 pt-5">
            <p className="text-xs text-stone-600">Xóa tài khoản là vĩnh viễn. Nhập <code className="text-red-700 font-mono font-bold">DELETE_MY_ACCOUNT</code> để xác nhận.</p>
            <input
              aria-label="Xác nhận xóa tài khoản"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-3 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-red-600 focus:outline-none"
            />
            <button
              type="button"
              disabled={busy || confirmation !== "DELETE_MY_ACCOUNT"}
              onClick={() => void deleteAccount()}
              className="mt-3 min-h-11 rounded-lg border border-red-300 bg-red-50 px-4 font-semibold text-xs text-red-700 hover:bg-red-100 disabled:opacity-40 transition"
            >
              Xóa vĩnh viễn tài khoản
            </button>
          </div>
        </div>
      )}
      {status && <p role="status" className="mt-4 text-xs text-stone-700">{status}</p>}
    </section>
  );
}
