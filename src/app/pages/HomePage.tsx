import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Bell,
  ArrowRight,
  ShieldCheck,
  Scale,
  ReceiptText,
  Clock,
  TrendingDown,
  Calendar,
} from "lucide-react";

import { formatVND, Deal } from "../data/deals";
import { getObservedFares, getDeals } from "../data/api";
import { WatchModal } from "../components/WatchModal";

export function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [watchOpen, setWatchOpen] = useState(false);

  useEffect(() => {
    async function loadInitial() {
      try {
        const observed = await getObservedFares({ page: 1, pageSize: 8, sort: "discount" });
        if (observed.fares.length > 0) {
          setDeals(observed.fares);
        } else {
          const fallback = await getDeals();
          setDeals(fallback.slice(0, 8));
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    void loadInitial();
  }, []);

  // Section 52: ONE real Opportunity shown steadily in hero as product proof
  const primaryOpportunity = deals.length > 0 ? deals[0] : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      
      {/* ── FIRST VIEWPORT: VALUE PROP + ONE REAL OPPORTUNITY + CTAS ── */}
      <section className="relative border-b border-white/10 pt-20 pb-14 sm:pt-24 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Value Proposition */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-white/10 text-[11px] font-mono font-bold text-sky-400 uppercase tracking-wider">
                <span>Giám sát & đối chiếu cước bay độc lập</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.15]">
                Biết mức giá nào{" "}
                <span className="text-sky-400">thực sự đáng chú ý.</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
                Farely không bán vé và không nhận tiền hoa hồng để đẩy giá. Farely liên tục quét và đối chiếu mức giá hiện tại với nhóm chuyến bay tương đương, làm rõ bằng chứng trước khi bạn quyết định mua.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <Link
                  to="/deals"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg font-bold text-xs transition-colors shadow-sm"
                >
                  <span>Xem sổ cơ hội hôm nay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => setWatchOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-sky-400" />
                  <span>Cài đặt theo dõi chặng</span>
                </button>
              </div>

              <div className="flex items-center gap-6 pt-2 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Không giá ảo
                </span>
                <span className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-sky-400" /> Đối sánh trung vị
                </span>
                <span className="flex items-center gap-1.5">
                  <ReceiptText className="w-4 h-4 text-slate-400" /> Minh bạch chi phí
                </span>
              </div>
            </div>

            {/* ONE Real Opportunity (Product Proof) */}
            <div className="lg:col-span-5">
              {isLoading ? (
                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-8 text-center text-slate-500 font-mono text-xs">
                  <Clock className="w-5 h-5 animate-spin text-sky-400 mx-auto mb-2" />
                  <span>Đang nạp dữ liệu quan sát…</span>
                </div>
              ) : primaryOpportunity ? (
                <div className="rounded-xl border border-white/15 bg-slate-900/70 p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-400">
                      Cơ hội quan sát tiêu biểu
                    </span>
                    <span className="text-slate-400">
                      {primaryOpportunity.airline}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">
                      {primaryOpportunity.from} → {primaryOpportunity.to}
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
                      {primaryOpportunity.fromCode} <span className="text-sky-400 font-light">→</span> {primaryOpportunity.toCode}
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ngày bay: {new Date(primaryOpportunity.departDate).toLocaleDateString("vi-VN")}</span>
                      {primaryOpportunity.returnDate && (
                        <span> – {new Date(primaryOpportunity.returnDate).toLocaleDateString("vi-VN")}</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
                        {formatVND(primaryOpportunity.price)}
                      </div>
                      {primaryOpportunity.discount > 0 && (
                        <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-400 mt-0.5">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Thấp hơn {primaryOpportunity.discount}% so với trung vị chặng</span>
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/deals/${primaryOpportunity.id}`}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                    >
                      Chi tiết
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

          </div>
        </div>
      </section>

      {/* ── CORE METHODOLOGY PRINCIPLES ── */}
      <section className="py-12 border-b border-white/10 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              3 nguyên tắc đánh giá giá vé tại Farely
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Hệ thống trả lời minh bạch: Giá này có đáng chú ý không, bằng chứng gồm những gì và nên làm gì tiếp theo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                <Scale className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">So sánh theo nhóm tương đương</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Không dùng &quot;giá gốc&quot; tự phong. Tỷ lệ phần trăm tính từ trung vị các chuyến bay cùng chặng, thời điểm và điều kiện tương đồng. Khi chưa đủ mẫu, hiển thị rõ &quot;Đang tích lũy&quot;.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <ReceiptText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Phân định chi phí rõ ràng</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tách biệt các khoản đã biết, ước tính thêm, tùy chọn và các khoản chưa rõ. Chưa biết không đồng nghĩa với bằng 0 hoặc miễn phí.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Bằng chứng theo chu kỳ quét</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Minh bạch số lượt quan sát, số chu kỳ quét và độ tươi dữ liệu. Không dùng thuật toán dự đoán xác suất chưa được chứng minh bằng thực nghiệm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOTABLE RECENT OPPORTUNITIES (LEDGER) ── */}
      {deals.length > 1 && (
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Cơ hội quan sát gần đây
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Các chặng bay có mức chênh lệch đáng chú ý so với mặt bằng trung vị
                </p>
              </div>

              <Link
                to="/deals"
                className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Desktop Ledger Table */}
            <div className="hidden md:block rounded-xl border border-white/10 bg-slate-900/40 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Chặng bay</th>
                    <th className="py-3 px-3">Ngày bay</th>
                    <th className="py-3 px-3">Hãng / Dừng</th>
                    <th className="py-3 px-4 text-right">Giá quan sát</th>
                    <th className="py-3 px-3 text-right">Đối sánh</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {deals.slice(1, 7).map((deal) => {
                    const formattedDate = new Date(deal.departDate).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                    });
                    const hasComparator = deal.discount > 0 && deal.normalPrice > deal.price;

                    return (
                      <tr key={deal.id} className="hover:bg-white/[0.03] transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            to={`/deals/${deal.id}`}
                            className="font-mono font-bold text-white text-sm hover:text-sky-400 transition-colors"
                          >
                            {deal.fromCode} <span className="text-sky-400 font-light">→</span> {deal.toCode}
                          </Link>
                          <div className="text-[11px] text-slate-400">
                            {deal.from} – {deal.to}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                          {formattedDate}
                        </td>

                        <td className="py-3 px-3 text-slate-300">
                          <div>{deal.airline}</div>
                          <div className="text-[10px] text-slate-500">
                            {deal.stops === 0 ? "Bay thẳng" : `${deal.stops} điểm dừng`}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                          {formatVND(deal.price)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono">
                          {hasComparator ? (
                            <span className="text-emerald-400 font-bold">
                              ↓{deal.discount}% vs median
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Mặt bằng chung</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/deals/${deal.id}`}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] transition-colors"
                          >
                            Chi tiết
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2.5">
              {deals.slice(1, 7).map((deal) => {
                const formattedDate = new Date(deal.departDate).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                });
                const hasComparator = deal.discount > 0 && deal.normalPrice > deal.price;

                return (
                  <div key={deal.id} className="rounded-xl border border-white/10 bg-slate-900/50 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/deals/${deal.id}`}
                        className="font-mono font-bold text-white text-sm hover:text-sky-400"
                      >
                        {deal.fromCode} <span className="text-sky-400 font-light">→</span> {deal.toCode}
                      </Link>
                      <div className="font-mono font-bold text-white text-sm">
                        {formatVND(deal.price)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{formattedDate} · {deal.airline}</span>
                      {hasComparator && (
                        <span className="text-emerald-400 font-bold font-mono">
                          ↓{deal.discount}% vs median
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <WatchModal
        isOpen={watchOpen}
        onClose={() => setWatchOpen(false)}
        sourceContext="home"
      />
    </main>
  );
}
