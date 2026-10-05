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
} from "lucide-react";
import { DealCard } from "../components/DealCard";
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
        const observed = await getObservedFares({ page: 1, pageSize: 12, sort: "discount" });
        if (observed.fares.length > 0) {
          setDeals(observed.fares);
        } else {
          const fallback = await getDeals();
          setDeals(fallback);
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    void loadInitial();
  }, []);

  // Section 45: ONE real Opportunity shown steadily in hero (no auto-rotation while user reads)
  const primaryOpportunity = deals.length > 0 ? deals[0] : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* ── SECTION 45: FIRST VIEWPORT (VALUE PROP + ONE REAL OPPORTUNITY + CTAS) ── */}
      <section className="relative border-b border-white/10 pt-24 pb-16 sm:pt-28 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Value Proposition */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-xs font-bold text-sky-400 uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span>Giám sát cước & đối chiếu giá vé độc lập</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Biết mức giá nào{" "}
                <span className="text-sky-400">thực sự đáng chú ý.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
                Farely không bán vé. Farely liên tục quan sát các chặng bay, đối chiếu mức giá hiện tại với nhóm chuyến bay tương đương và làm rõ bằng chứng trước khi bạn quyết định mua.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  to="/deals"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-sky-500/20"
                >
                  <span>Xem các cơ hội hôm nay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  type="button"
                  onClick={() => setWatchOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 border border-white/10 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-sky-400" />
                  <span>Cài đặt theo dõi chặng bay</span>
                </button>
              </div>

              <div className="flex items-center gap-6 pt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Không giá ảo
                </span>
                <span className="flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-sky-400" /> So sánh trung vị
                </span>
                <span className="flex items-center gap-1.5">
                  <ReceiptText className="w-4 h-4 text-slate-400" /> Minh bạch chi phí
                </span>
              </div>
            </div>

            {/* ONE Real Opportunity (Section 45: Product Proof, Not Startup Theater) */}
            <div className="lg:col-span-5">
              {isLoading ? (
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-8 text-center text-slate-500">
                  <Clock className="w-6 h-6 animate-spin text-sky-400 mx-auto mb-2" />
                  <span className="text-xs">Đang tải cơ hội thực tế…</span>
                </div>
              ) : primaryOpportunity ? (
                <div className="relative rounded-2xl border border-white/15 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-7 shadow-2xl space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                      Cơ hội quan sát nổi bật
                    </span>
                    <span className="text-xs text-slate-400">
                      {primaryOpportunity.airline}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                      {primaryOpportunity.from} → {primaryOpportunity.to}
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-white">
                      {primaryOpportunity.fromCode} <span className="text-sky-400 font-light">→</span> {primaryOpportunity.toCode}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      Ngày bay: {new Date(primaryOpportunity.departDate).toLocaleDateString("vi-VN")}
                      {primaryOpportunity.returnDate && ` – ${new Date(primaryOpportunity.returnDate).toLocaleDateString("vi-VN")}`}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-baseline justify-between">
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                        {formatVND(primaryOpportunity.price)}
                      </div>
                      {primaryOpportunity.discount > 0 && (
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 mt-0.5">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Thấp hơn {primaryOpportunity.discount}% so với mức giá thường gặp</span>
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/deals/${primaryOpportunity.id}`}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                    >
                      Chi tiết cơ hội
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

          </div>
        </div>
      </section>

      {/* ── CORE METHODOLOGY PRINCIPLES ── */}
      <section className="py-16 border-b border-white/10 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              3 nguyên tắc đánh giá giá vé tại Farely
            </h2>
            <p className="text-slate-400 text-sm mt-2">
              Chúng tôi xây dựng hệ thống giám sát để trả lời câu hỏi: Giá này có thực sự đáng chú ý không, bằng chứng là gì và bạn nên làm gì tiếp theo?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">So sánh theo nhóm tương đương</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Không đối chiếu với &quot;giá gốc&quot; tự phong. Mọi tỷ lệ phần trăm đều được tính từ mức trung vị của các chuyến bay cùng chặng, thời điểm và điều kiện tương đồng.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                <ReceiptText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Phân định chi phí rõ ràng</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tách biệt các khoản đã biết, ước tính thêm, tùy chọn và các khoản chưa rõ. Chưa biết không đồng nghĩa với bằng 0 hoặc miễn phí.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Bằng chứng theo chu kỳ quét</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Minh bạch số lần quan sát, số chu kỳ quét và độ tươi của dữ liệu. Không dùng thuật toán dự đoán xác suất khi chưa được chứng minh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOTABLE RECENT OPPORTUNITIES ── */}
      {deals.length > 1 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">
                  Cơ hội quan sát gần đây
                </h2>
                <p className="text-xs text-slate-400 mt-1">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {deals.slice(1, 7).map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
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
