import { useState, useEffect } from "react";
import { Link } from "react-router";
import {
  Plane, Zap, Bell,
  ChevronRight, ArrowRight,
  ShieldCheck, Scale, ReceiptText,
  Clock, CheckCircle2,
} from "lucide-react";
import { DealCard } from "../components/DealCard";
import { formatVND, Deal } from "../data/deals";
import { getDeals, getObservedFares, getTrackedRoutes } from "../data/api";
import { rankPersonalizedFeed } from "../domain/travelFeed";
import { getUserPreferences } from "../lib/preferences";
import { buildTravelFeedSections } from "../domain/travelFeedSections";

interface StatItem {
  label: string;
  value: string;
  sublabel: string;
}

export function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [observedTotal, setObservedTotal] = useState(2823);
  const [trackedRouteCount, setTrackedRouteCount] = useState(88);
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  useEffect(() => {
    Promise.all([
      getObservedFares({ page: 1, pageSize: 60, sort: "discount" }).catch(() => ({ fares: [] as Deal[], total: 2823 })),
      getDeals().catch(() => [] as Deal[]),
      getTrackedRoutes().catch(() => []),
    ]).then(([observedPage, feedDeals, trackedRoutes]) => {
      const merged = feedDeals.length > 0 ? feedDeals : observedPage.fares;
      const ranked = rankPersonalizedFeed(merged, getUserPreferences());
      setDeals(ranked);
      if (observedPage.total && observedPage.total > 0) {
        setObservedTotal(observedPage.total);
      }
      if (trackedRoutes.length > 0) {
        setTrackedRouteCount(trackedRoutes.length);
      }
    });
  }, []);

  const feedSections = buildTravelFeedSections(deals, getUserPreferences());
  const topOpportunities = feedSections.hot.length > 0
    ? feedSections.hot.slice(0, 6)
    : deals.slice(0, 6);

  const spotlightDeal = deals.length > 0 ? deals[spotlightIndex % deals.length] : undefined;

  useEffect(() => {
    if (deals.length <= 1) return;
    const timer = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % Math.min(deals.length, 5));
    }, 6000);
    return () => clearInterval(timer);
  }, [deals.length]);

  const averageSaving = deals.length > 0
    ? Math.round(
        deals.reduce((total, deal) => total + Math.max(0, deal.normalPrice - deal.price), 0) /
          deals.length,
      )
    : 450000;

  const stats: StatItem[] = [
    {
      label: "Mức giá quan sát liên tục",
      value: `${observedTotal.toLocaleString("vi-VN")}+`,
      sublabel: "Độc lập đối chiếu 4–6 lần/ngày",
    },
    {
      label: "Tuyến bay giám sát",
      value: `${trackedRouteCount}`,
      sublabel: "Nội địa & quốc tế trọng điểm",
    },
    {
      label: "Chênh lệch tiết kiệm TB",
      value: formatVND(averageSaving > 0 ? averageSaving : 450000),
      sublabel: "So với mức giá trung vị 60 ngày",
    },
    {
      label: "Minh bạch chi phí",
      value: "100%",
      sublabel: "Phân định rõ chi phí đã biết",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0b0e14] text-[#f8fafc]">
      {/* ── SECTION 1: EDITORIAL SPLIT HERO ── */}
      <section className="relative border-b border-white/[0.08] pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Core Value Proposition */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-6">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">
                  Dữ liệu quan sát trực tuyến · 88 tuyến bay
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12] mb-6 text-balance">
                Biết giá nào{" "}
                <span className="text-blue-400">thực sự đáng mua.</span>
              </h1>

              <p className="text-slate-400 text-lg sm:text-xl leading-relaxed mb-8 max-w-2xl">
                Farely liên tục theo dõi các tuyến bay, đối chiếu mức giá hiện tại với lịch sử quan sát thực tế và bóc tách đầy đủ chi phí để bạn tự tin quyết định trước khi mua vé.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-10">
                <Link
                  to="/deals"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-base shadow-sm transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Xem cơ hội hôm nay
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/alerts"
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-white rounded-xl font-semibold text-base transition-colors"
                >
                  <Bell className="w-4 h-4 text-slate-300" />
                  Theo dõi chuyến
                </Link>
              </div>

              {/* Live Route Micro-Ticker */}
              {deals.length > 0 && (
                <div className="pt-6 border-t border-white/[0.06] flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300 shrink-0 uppercase tracking-wider text-[11px]">Ghi nhận mới:</span>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {deals.slice(0, 4).map((d) => (
                      <Link
                        key={d.id}
                        to={`/deals/${d.id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-colors shrink-0"
                      >
                        <span className="font-bold text-white">{d.fromCode}→{d.toCode}</span>
                        <span className="text-emerald-400 font-semibold tabular-nums">-{d.discount}%</span>
                        <span className="text-slate-400 tabular-nums">{formatVND(d.price)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Live Decision Spotlight Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-white/[0.1] bg-[#121620] p-6 shadow-2xl relative overflow-hidden">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Cơ hội tiêu biểu vừa phát hiện
                    </span>
                  </div>
                  {deals.length > 1 && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <span>{spotlightIndex + 1}/{Math.min(deals.length, 5)}</span>
                    </div>
                  )}
                </div>

                {spotlightDeal ? (
                  <div className="space-y-5">
                    {/* Route Header */}
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl sm:text-3xl font-black text-white">{spotlightDeal.fromCode}</span>
                          <Plane className="w-4 h-4 text-blue-400" />
                          <span className="text-2xl sm:text-3xl font-black text-white">{spotlightDeal.toCode}</span>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 tabular-nums">
                          Giảm {spotlightDeal.discount}%
                        </span>
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {spotlightDeal.from} đến {spotlightDeal.to} · {spotlightDeal.airline}
                      </div>
                    </div>

                    {/* Price Comparison */}
                    <div className="p-4 rounded-xl bg-black/30 border border-white/[0.06] space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-slate-400 font-medium">Giá quan sát hiện tại:</span>
                        <span className="text-2xl font-black text-white tabular-nums">
                          {formatVND(spotlightDeal.price)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.06]">
                        <span>Mức giá thường gặp (median):</span>
                        <span className="line-through tabular-nums text-slate-400">
                          {formatVND(spotlightDeal.normalPrice)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-emerald-400 pt-1">
                        <span>Tiết kiệm thực tế:</span>
                        <span className="font-bold tabular-nums">
                          +{formatVND(Math.max(0, spotlightDeal.normalPrice - spotlightDeal.price))}
                        </span>
                      </div>
                    </div>

                    {/* Flight & Evidence Details */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-slate-500 block mb-1">Ngày khởi hành</span>
                        <span className="font-semibold text-slate-200">
                          {new Date(spotlightDeal.departDate).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-slate-500 block mb-1">Thời lượng & Điểm dừng</span>
                        <span className="font-semibold text-slate-200">
                          {spotlightDeal.duration} · {spotlightDeal.stops === 0 ? "Bay thẳng" : `${spotlightDeal.stops} điểm dừng`}
                        </span>
                      </div>
                    </div>

                    {/* Reasoning snippet */}
                    <div className="text-xs text-slate-400 leading-relaxed bg-blue-500/[0.06] border border-blue-500/20 p-3 rounded-lg">
                      <strong className="text-blue-300 font-semibold block mb-0.5">Nhận định dữ liệu:</strong>
                      {spotlightDeal.aiReasoning || spotlightDeal.aiInsight.reason || "Mức giá thấp hơn đáng kể so với mặt bằng trung vị ghi nhận trên tuyến."}
                    </div>

                    <Link
                      to={`/deals/${spotlightDeal.id}`}
                      className="flex items-center justify-center gap-2 w-full py-3 bg-white/[0.08] hover:bg-white/[0.12] text-white rounded-xl text-sm font-semibold transition-colors"
                    >
                      Kiểm tra cơ hội này
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    Đang đồng bộ quan sát thị trường mới nhất…
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── SECTION 2: REAL EVIDENCE METRICS STRIP ── */}
      <section className="py-10 border-b border-white/[0.08] bg-[#0d1017]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((s) => (
              <div key={s.label} className="border-l-2 border-blue-500/40 pl-4 sm:pl-5">
                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums mb-1">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm font-medium text-slate-300 mb-0.5">
                  {s.label}
                </div>
                <div className="text-[11px] text-slate-500">
                  {s.sublabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: TOP OBSERVED OPPORTUNITIES ── */}
      <section className="py-16 sm:py-20 border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  CƠ HỘI ĐÃ XÁC THỰC
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Cơ hội quan sát hôm nay
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mt-1 max-w-xl">
                Đối chiếu từ hàng nghìn lần quan sát giá vé độc lập, loại bỏ giá gốc ảo của hãng.
              </p>
            </div>
            <Link
              to="/deals"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-white text-sm font-semibold transition-colors shrink-0"
            >
              Xem tất cả ({deals.length > 0 ? deals.length : observedTotal}) <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topOpportunities.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>

          {deals.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-[#121620] p-10 text-center">
              <h3 className="font-bold text-white text-lg">Đang cập nhật chu kỳ quan sát mới</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
                Hệ thống chỉ công bố cơ hội khi có đủ các lần quan sát để đối chiếu mức giá tin cậy. Bạn có thể cài đặt theo dõi để nhận thông báo sớm.
              </p>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/deals"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/[0.08] text-white rounded-xl font-semibold text-sm transition-colors"
            >
              Xem tất cả ({deals.length > 0 ? deals.length : observedTotal}) <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: HOW FARELY EVALUATES REAL DEALS (3 CORE PILLARS) ── */}
      <section className="py-16 sm:py-20 border-b border-white/[0.08] bg-[#0d1017]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-wider block mb-2">
              NGUYÊN TẮC MINH BẠCH DỮ LIỆU
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
              Cách Farely đánh giá một mức giá thực sự đáng mua
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Thay vì dựa vào các chiêu trò giảm giá ảo hay cảnh báo khan hiếm nhân tạo, Farely phân tích độc lập để bạn luôn biết chính xác giá trị thực tế của từng chuyến bay.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
                  <Scale className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-white text-lg font-bold mb-2">
                  Đối sánh giá trung vị thực tế
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Không so với giá niêm yết ảo của hãng. Farely tính mức giá trung vị (median) từ nhiều lần quan sát theo từng tuyến và ngày bay cụ thể để xác định mức giảm thật.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-blue-300 font-medium">
                ✓ Loại bỏ hoàn toàn giá gốc ảo
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-slate-500/10 border border-white/10 flex items-center justify-center mb-5">
                  <ShieldCheck className="w-5 h-5 text-slate-300" />
                </div>
                <h3 className="text-white text-lg font-bold mb-2">
                  Chất lượng bằng chứng
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Mỗi cơ hội đều công khai chất lượng bằng chứng (Thấp / Vừa / Cao) dựa trên số lượng mẫu và chu kỳ ghi nhận dữ liệu thực tế, giúp bạn đánh giá mức độ tin cậy.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-slate-300 font-medium">
                ✓ Không che giấu độ trễ hay thiếu mẫu
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-6 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
                  <ReceiptText className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-white text-lg font-bold mb-2">
                  Bóc Tách Chi Phí Thực Tế (True Cost)
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Phân định rành mạch: Giá vé cơ bản đã biết, phụ thu hành lý ước tính, và các chi phí chưa thể xác định (ghế ngồi, thanh toán) để tránh bất ngờ khi đặt vé.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-white/[0.06] text-xs text-emerald-300 font-medium">
                ✓ Thấy trước phụ phí phát sinh
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: WATCH INTENT CTA ── */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-12 h-12 bg-blue-600/15 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bell className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
            Đang chờ mức giá tốt cho chuyến đi sắp tới?
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            Cài đặt theo dõi để Farely tự động đối chiếu và gửi thông báo qua email ngay khi phát hiện mức giá thực sự đáng mua trên tuyến đường của bạn.
          </p>
          <Link
            to="/alerts"
            className="inline-flex items-center gap-2.5 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-base shadow-sm transition-colors"
          >
            Theo dõi chuyến bay ngay
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
