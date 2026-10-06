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
    <main className="min-h-[75vh] pt-32 px-4 flex justify-center bg-[var(--canvas-bg)] text-stone-900">
      <section className="h-fit w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 text-center sm:p-8 shadow-sm">
        {state === "loading" && <LoaderCircle className="mx-auto mb-5 h-10 w-10 animate-spin text-blue-600" />}
        {state === "success" && <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-5" />}
        {state === "error" && <XCircle className="w-10 h-10 text-red-600 mx-auto mb-5" />}
        <h1 className="text-stone-900 text-2xl font-bold mb-2">
          {state === "loading"
            ? "Đang xử lý…"
            : state === "success"
              ? "Hoàn tất"
              : "Không thể xử lý"}
        </h1>
        <p className="text-stone-600 text-sm mb-6">{message || "Vui lòng chờ trong giây lát."}</p>
        {state !== "loading" && (
          <Link
            to="/"
            className="inline-flex rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition-colors shadow-sm"
          >
            Về trang chủ
          </Link>
        )}
      </section>
    </main>
  );
}
