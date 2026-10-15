import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { X, AlertTriangle, CheckCircle, Info, Calendar, Plane, Clock, Sparkles, ExternalLink, HelpCircle } from "lucide-react";
import { formatVND, formatStops } from "../data/deals";
import {
  DealComparisonRow,
  checkOpportunitiesCompatibility,
  explainTradeoff,
} from "../domain/dealComparison";

export interface SavedComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: DealComparisonRow[];
  activeDealMap?: Map<string, string>; // opportunityId -> dealId for navigation
}

export function SavedComparisonModal({
  isOpen,
  onClose,
  rows,
  activeDealMap = new Map(),
}: SavedComparisonModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || rows.length < 2) return null;

  const compatibility = checkOpportunitiesCompatibility(rows);

  // Find cheapest option for tradeoff baseline
  const sortedByCost = [...rows].sort((a, b) => (a.totalCost ?? a.ticketPrice) - (b.totalCost ?? b.ticketPrice));
  const cheapest = sortedByCost[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-board-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-sm overflow-y-auto"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50/80">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 id="comparison-board-title" className="text-lg sm:text-xl font-bold text-stone-900">
                Bảng so sánh cơ hội đã lưu
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-100 text-blue-800">
                {rows.length} phương án
              </span>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 mt-0.5">
              Đối chiếu chi phí thực tế, thời lượng, điểm dừng và mức độ tin cậy. Không tự suy đoán thông tin chưa rõ.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Đóng bảng so sánh"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Compatibility Notice Banner */}
          {compatibility.isCompatible ? (
            <div className="rounded-xl p-3.5 bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900 leading-relaxed">
                <span className="font-bold">Các phương án tương thích:</span> Cùng chặng bay (
                {compatibility.routeSummary}). Các tiêu chí về giá và thời lượng có thể so sánh trực tiếp một cách công bằng.
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-3.5 bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <div className="font-bold">Lưu ý về tính tương thích:</div>
                {compatibility.notes.map((note, idx) => (
                  <div key={idx}>• {note}</div>
                ))}
                <div className="text-amber-800 mt-1 italic">
                  Khuyến nghị: Việc so sánh giữa các lộ trình hoặc ngày bay cách xa nhau chỉ mang tính tham khảo tương đối về ngân sách.
                </div>
              </div>
            </div>
          )}

          {/* Comparison Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-${Math.min(rows.length, 4)} gap-4`}>
            {rows.map((row, idx) => {
              const activeDealId = activeDealMap.get(row.id);
              const formattedDate = row.departDate
                ? new Date(row.departDate).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "---";

              return (
                <div
                  key={row.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                    row.isDominated
                      ? "border-amber-200 bg-amber-50/30"
                      : "border-stone-200 bg-white hover:border-blue-300 shadow-sm"
                  }`}
                >
                  <div className="space-y-4">
                    {/* Card Header: Route & Airline */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-stone-900 font-mono">
                          {row.route}
                        </span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-600 mt-1">
                        <Plane className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-medium">{row.airline || "Hãng chưa rõ"}</span>
                        {row.flightNumber && <span className="font-mono">({row.flightNumber})</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>Khởi hành: {formattedDate}</span>
                      </div>
                    </div>

                    {/* Price Block */}
                    <div className="rounded-lg bg-stone-50 p-3 border border-stone-200 space-y-1.5">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                          {row.totalCost !== undefined ? "Tổng chi phí thực tế" : "Giá vé gốc (Chưa rõ phụ phí)"}
                        </div>
                        <div className="text-lg font-bold text-blue-700 font-mono">
                          {formatVND(row.totalCost ?? row.ticketPrice)}
                        </div>
                      </div>
                      {row.totalCost !== undefined && row.ticketPrice !== row.totalCost && (
                        <div className="text-xs text-stone-500">
                          Giá vé gốc: <span className="font-mono">{formatVND(row.ticketPrice)}</span>
                        </div>
                      )}
                    </div>

                    {/* Flight Specs */}
                    <div className="space-y-2 text-xs divide-y divide-stone-100">
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-stone-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" /> Thời gian bay
                        </span>
                        <span className="font-mono font-medium text-stone-800">
                          {row.durationText || "Chưa có dữ liệu"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1.5">
                        <span className="text-stone-500">Điểm dừng</span>
                        <span className="font-medium text-stone-800">
                          {row.stops !== null ? formatStops(row.stops) : "Chưa rõ"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1.5">
                        <span className="text-stone-500">Hoàn / Đổi vé</span>
                        <span className="font-medium text-stone-800 text-right max-w-[140px] truncate" title={row.refundPolicy}>
                          {row.refundPolicy || "Chưa xác minh"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1.5">
                        <span className="text-stone-500">Rủi ro giá</span>
                        <span
                          className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                            row.risk === "low"
                              ? "bg-emerald-100 text-emerald-800"
                              : row.risk === "medium"
                              ? "bg-amber-100 text-amber-800"
                              : row.risk === "high"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {row.risk === "low"
                            ? "Thấp"
                            : row.risk === "medium"
                            ? "Vừa"
                            : row.risk === "high"
                            ? "Cao"
                            : "Chưa đánh giá"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1.5">
                        <span className="text-stone-500">Độ mới</span>
                        <span className="text-stone-600 font-mono text-[11px]">
                          {row.freshnessText || "Lưu trữ lịch sử"}
                        </span>
                      </div>
                    </div>

                    {/* Pareto Dominance Tag */}
                    <div>
                      {row.isDominated ? (
                        <div className="rounded-lg bg-amber-100/70 border border-amber-300 p-2 text-xs text-amber-900 flex items-start gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Bị phương án khác vượt trội</span>
                            <div className="text-[11px] text-amber-800 mt-0.5">
                              Có lựa chọn khác rẻ hơn hoặc bằng giá, nhưng bay nhanh hơn và ít điểm dừng hơn.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-xs text-blue-900 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-semibold">Phương án tối ưu Pareto</span>
                        </div>
                      )}
                    </div>

                    {/* Unverified Information Warning */}
                    {row.unverifiedFields && row.unverifiedFields.length > 0 && (
                      <div className="rounded-lg bg-stone-50 border border-stone-200 p-2 text-xs text-stone-600 space-y-1">
                        <div className="flex items-center gap-1 text-stone-700 font-semibold text-[11px]">
                          <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
                          Thông tin chưa xác minh:
                        </div>
                        <ul className="list-disc list-inside text-[11px] text-stone-500 space-y-0.5">
                          {row.unverifiedFields.map((field, fIdx) => (
                            <li key={fIdx}>{field}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Link */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end">
                    {activeDealId ? (
                      <Link
                        to={`/deals/${activeDealId}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <span>Chi tiết cơ hội</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <span className="text-[11px] text-stone-400 italic">Dữ liệu lưu trữ lịch sử</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trade-off Analysis Section */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-stone-900">
                Phân tích đánh đổi (Trade-off Analysis)
              </h3>
            </div>
            <div className="space-y-2 text-xs text-stone-700">
              <div className="font-medium text-stone-800">
                Lựa chọn có chi phí thấp nhất:{" "}
                <span className="font-bold text-blue-700 font-mono">
                  {cheapest.route} ({cheapest.airline || "Hãng"}) — {formatVND(cheapest.totalCost ?? cheapest.ticketPrice)}
                </span>
              </div>
              <div className="space-y-1.5 pl-2 border-l-2 border-blue-400">
                {rows
                  .filter((r) => r.id !== cheapest.id)
                  .map((other) => {
                    const explanation = explainTradeoff(cheapest, other);
                    return (
                      <div key={other.id} className="leading-relaxed">
                        <span className="font-semibold text-stone-900">
                          So với {other.route} ({other.airline || "Hãng"} - {formatVND(other.totalCost ?? other.ticketPrice)}):
                        </span>{" "}
                        <span className="text-stone-700">{explanation}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>* Dữ liệu đối chiếu từ thời điểm quan sát. Không cam kết giữ giá khi hãng thay đổi.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
