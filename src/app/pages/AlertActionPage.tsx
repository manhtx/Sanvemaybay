import { useEffect, useState } from "react";
import { CheckCircle, LoaderCircle, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { manageAlert } from "../data/api";

export function AlertActionPage({ action }: { action: "confirm" | "unsubscribe" }) {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token") ?? undefined;
    const alertId = searchParams.get("id") ?? undefined;
    const signature = searchParams.get("signature") ?? undefined;
    if ((action === "confirm" && !token) || (action === "unsubscribe" && (!alertId || !signature))) {
      setState("error");
      setMessage("Liên kết không có mã xác thực.");
      return;
    }
    manageAlert(action, { token, alert_id: alertId, signature })
      .then(() => {
        setState("success");
        setMessage(
          action === "confirm"
            ? "Cảnh báo đã được xác nhận và bắt đầu hoạt động."
            : "Bạn đã hủy nhận cảnh báo này.",
        );
      })
      .catch((error) => {
        setState("error");
        setMessage(error instanceof Error ? error.message : "Không thể xử lý liên kết.");
      });
  }, [action, searchParams]);

  return (
    <main className="min-h-[75vh] pt-32 px-4 flex justify-center">
      <section className="w-full max-w-lg h-fit bg-slate-900 border border-white/10 rounded-3xl p-8 text-center">
        {state === "loading" && <LoaderCircle className="w-12 h-12 text-sky-400 animate-spin mx-auto mb-5" />}
        {state === "success" && <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-5" />}
        {state === "error" && <XCircle className="w-12 h-12 text-red-400 mx-auto mb-5" />}
        <h1 className="text-white text-2xl font-bold mb-3">
          {state === "loading"
            ? "Đang xử lý…"
            : state === "success"
              ? "Hoàn tất"
              : "Không thể xử lý"}
        </h1>
        <p className="text-slate-400 mb-7">{message || "Vui lòng chờ trong giây lát."}</p>
        {state !== "loading" && (
          <Link to="/" className="inline-flex px-5 py-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-400">
            Về trang chủ
          </Link>
        )}
      </section>
    </main>
  );
}
