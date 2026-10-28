import { useState, useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Send, MessageSquare, ShieldAlert } from "lucide-react";
import { formatVND } from "../data/deals";
import {
  createRecheckFeedback,
  getFeedbackForOpportunity,
  RecheckFeedbackRecord,
  RecheckOutcome,
  saveRecheckFeedback,
} from "../domain/recheckFeedback";
import { trackProductEvent } from "../lib/analytics";

export interface RecheckFeedbackWidgetProps {
  opportunityId: string;
  route: string;
  observedPrice: number;
}

export function RecheckFeedbackWidget({
  opportunityId,
  route,
  observedPrice,
}: RecheckFeedbackWidgetProps) {
  const [existingFeedback, setExistingFeedback] = useState<RecheckFeedbackRecord | null>(null);
  const [outcome, setOutcome] = useState<RecheckOutcome>("MATCHED");
  const [actualPrice, setActualPrice] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const existing = getFeedbackForOpportunity(opportunityId);
    if (existing) {
      setExistingFeedback(existing);
    }
  }, [opportunityId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const parsedPrice = actualPrice ? Number(actualPrice.replace(/\D/g, "")) : undefined;
      const record = createRecheckFeedback({
        opportunityId,
        route,
        observedPrice,
        reportedOutcome: outcome,
        reportedPrice: parsedPrice,
        note: note.trim() || undefined,
      });

      saveRecheckFeedback(record);
      setExistingFeedback(record);

      void trackProductEvent({
        eventType: "verify_result",
        entityId: opportunityId,
        metadata: {
          opportunity_id: opportunityId,
          route,
          value: parsedPrice || observedPrice,
          source: "user_feedback",
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingFeedback) {
    const outcomeLabel =
      existingFeedback.reportedOutcome === "MATCHED"
        ? "Khớp chính xác mức giá quan sát"
        : existingFeedback.reportedOutcome === "PRICE_CHANGED"
        ? `Giá đã thay đổi (Báo cáo: ${existingFeedback.reportedPrice ? formatVND(existingFeedback.reportedPrice) : "Khác giá"})`
        : "Chuyến bay không còn khả dụng / Hết vé";

    return (
      <section className="rounded-xl border border-blue-200 bg-blue-50/60 p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600 shrink-0" />
          <h3 className="text-sm font-bold text-stone-900">
            Đã ghi nhận phản hồi đối chiếu của bạn
          </h3>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-200 text-blue-900 ml-auto">
            USER_REPORTED
          </span>
        </div>
        <p className="text-xs text-stone-700 leading-relaxed">
          Kết quả bạn báo cáo: <span className="font-semibold text-stone-900">{outcomeLabel}</span>
        </p>
        <div className="flex items-start gap-2 pt-2 border-t border-blue-200/60 text-[11px] text-stone-600 leading-relaxed">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            Theo tiêu chuẩn kiểm định F30, dữ liệu này được bảo toàn trung thực ở trạng thái{" "}
            <strong>USER_REPORTED</strong> và không tự động được nâng cấp thành VERIFIED cho đến khi hệ thống thực hiện quét độc lập.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 space-y-4 shadow-sm">
      <div>
        <div className="flex items-center gap-2 text-stone-900">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Phản hồi kết quả đối chiếu giá vé (Fare Recheck)
          </h3>
        </div>
        <p className="text-xs text-stone-600 mt-1 leading-relaxed">
          Bạn vừa kiểm tra giá trên hệ thống đối tác? Hãy chia sẻ kết quả thực tế để cộng đồng cùng theo dõi độ chính xác.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Outcome Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setOutcome("MATCHED")}
            className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
              outcome === "MATCHED"
                ? "border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600 font-semibold"
                : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700"
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 mt-0.5 shrink-0 ${
                outcome === "MATCHED" ? "text-emerald-600" : "text-stone-400"
              }`}
            />
            <div className="text-xs">
              <div className="font-bold">Khớp giá chính xác</div>
              <div className="text-[11px] opacity-80 mt-0.5">
                Vẫn còn giá {formatVND(observedPrice)}
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setOutcome("PRICE_CHANGED")}
            className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
              outcome === "PRICE_CHANGED"
                ? "border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-600 font-semibold"
                : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700"
            }`}
          >
            <AlertTriangle
              className={`w-4 h-4 mt-0.5 shrink-0 ${
                outcome === "PRICE_CHANGED" ? "text-amber-600" : "text-stone-400"
              }`}
            />
            <div className="text-xs">
              <div className="font-bold">Giá đã thay đổi</div>
              <div className="text-[11px] opacity-80 mt-0.5">
                Hãng đã cập nhật giá khác
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setOutcome("UNAVAILABLE")}
            className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
              outcome === "UNAVAILABLE"
                ? "border-rose-600 bg-rose-50 text-rose-950 ring-1 ring-rose-600 font-semibold"
                : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700"
            }`}
          >
            <XCircle
              className={`w-4 h-4 mt-0.5 shrink-0 ${
                outcome === "UNAVAILABLE" ? "text-rose-600" : "text-stone-400"
              }`}
            />
            <div className="text-xs">
              <div className="font-bold">Hết vé / Không khả dụng</div>
              <div className="text-[11px] opacity-80 mt-0.5">
                Không tìm thấy chuyến hoặc hết chỗ
              </div>
            </div>
          </button>
        </div>

        {/* Conditional Price Input */}
        {outcome === "PRICE_CHANGED" && (
          <div className="space-y-1.5 p-3 rounded-xl bg-amber-50/50 border border-amber-200">
            <label htmlFor="recheck-actual-price" className="text-xs font-bold text-amber-950">
              Mức giá thực tế bạn thấy trên hãng (₫)
            </label>
            <input
              id="recheck-actual-price"
              type="text"
              value={actualPrice}
              onChange={(e) => setActualPrice(e.target.value)}
              placeholder="Ví dụ: 1.850.000"
              className="w-full sm:w-64 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 font-mono focus:border-amber-600 focus:outline-none"
            />
          </div>
        )}

        {/* Optional note */}
        <div>
          <label htmlFor="recheck-note" className="text-xs text-stone-600 font-medium block mb-1">
            Ghi chú thêm (tùy chọn)
          </label>
          <input
            id="recheck-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Giá chưa gồm phí xuất vé, chỉ áp dụng giờ bay sáng sớm..."
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-blue-600 focus:outline-none"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-stone-500">
            * Dữ liệu đối chiếu được lưu trữ với nhãn trung thực USER_REPORTED.
          </span>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi phản hồi</span>
          </button>
        </div>
      </form>
    </section>
  );
}
