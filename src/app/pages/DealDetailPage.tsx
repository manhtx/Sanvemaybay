import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { 
  Plane, Calendar, AlertTriangle,
  ChevronLeft, Share2, Bell, Zap, TrendingDown, 
  CheckCircle2, Globe, ArrowRight, ExternalLink, Bookmark
} from "lucide-react";
import { getDealById, getPriceHistory } from "../data/api";
import { Deal, formatVND, getRecommendationColor, getRecommendationLabel } from "../data/deals";
import { motion } from "motion/react";
import { getBestBookingUrl, getAllBookingOptions, getEffectiveDealBookingUrl } from "../lib/bookingUrls";
import { isBookmarkedDeal, saveRemoteBookmark, toggleBookmarkedDeal } from "../lib/bookmarks";
import { shareOrCopy } from "../lib/sharing";
import { HiddenCostAnalyzer } from "../components/HiddenCostAnalyzer";
import { assessRoute } from "../domain/routeOptimization";
import { trackProductEvent } from "../lib/analytics";
import { reportClientIssue } from "../lib/clientDiagnostics";

const PriceHistoryChart = React.lazy(async () => ({
  default: (await import("../components/PriceHistoryChart")).PriceHistoryChart,
}));

export function DealDetailPage() {
  const { id } = useParams();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [priceHistory, setPriceHistory] = useState<Awaited<ReturnType<typeof getPriceHistory>>>([]);

  useEffect(() => {
    async function loadDeal() {
      if (!id) return;
      const data = await getDealById(id);
      if (data) {
        setDeal(data);
        void trackProductEvent({ eventType: "detail_view", entityId: data.id, metadata: { route: `${data.fromCode}-${data.toCode}`, source: "deal_detail" } });
        setBookmarked(isBookmarkedDeal(data.id));
        setPriceHistory(await getPriceHistory(data.fromCode, data.toCode));
      }
      setLoading(false);
    }
    loadDeal();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
    </div>
  );

  if (!deal) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold text-white mb-4">Không tìm thấy deal này</h2>
      <Link to="/deals" className="text-sky-400 flex items-center gap-2 hover:underline">
        <ChevronLeft className="w-4 h-4" /> Quay lại danh sách
      </Link>
    </div>
  );

  const aiReasoning = deal.aiReasoning || deal.aiInsight.reason;
  const confidence = deal.confidence == null ? null : Math.round(deal.confidence * 100);
  const durationMinutes = (() => {
    const match = deal.duration.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/i);
    return match && (Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0)) > 0
      ? Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0)
      : 1;
  })();
  const routeAssessment = assessRoute({
    type: "DIRECT",
    legs: [{
      origin: deal.fromCode,
      destination: deal.toCode,
      price: deal.price,
      extraCost: Math.max(0, deal.realTotal - deal.price),
      durationMinutes,
      departureAt: `${deal.departDate}T00:00:00Z`,
      arrivalAt: `${deal.departDate}T00:00:00Z`,
      baggageIncluded: deal.hiddenCosts.every((cost) => !/hành lý|baggage/i.test(cost.label) || cost.amount === 0),
    }],
    dataFresh: deal.validUntil ? new Date(deal.validUntil).getTime() > Date.now() : undefined,
  });
  const shareDeal = async () => {
    const shareData = {
      title: `${deal.fromCode} → ${deal.toCode}`,
      text: `${deal.from} → ${deal.to}: ${formatVND(deal.price)}`,
      url: window.location.href,
    };
    try {
      await shareOrCopy(shareData, navigator);
      await trackProductEvent({ eventType: "share", entityId: deal.id, metadata: { route: `${deal.fromCode}-${deal.toCode}` } });
    } catch {
      reportClientIssue("deal_share_failed");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      {/* ── TOP NAV ── */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0d0f]/90 px-4 py-3 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/deals" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Danh sách deal</span>
          </Link>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void shareDeal()}
              aria-label="Chia sẻ deal"
              className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label={bookmarked ? "Bỏ lưu deal" : "Lưu deal"}
              aria-pressed={bookmarked}
              onClick={() => {
                if (!deal) return;
                const next = toggleBookmarkedDeal(deal.id);
                setBookmarked(next);
                void saveRemoteBookmark(deal.id, next);
                void trackProductEvent({ eventType: "bookmark", entityId: deal.id, metadata: { bookmarked: next, route: `${deal.fromCode}-${deal.toCode}` } });
              }}
              className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors"
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-sky-400 text-sky-400" : ""}`} />
            </button>
            <Link
              to={`/alerts?destination=${encodeURIComponent(deal.toCode)}&origin=${encodeURIComponent(deal.fromCode)}`}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              <Bell className="w-4 h-4" />
              Theo dõi giá
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ── LEFT COLUMN: IMAGES & CORE INFO ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-2xl sm:aspect-[16/9]">
              {deal.image ? (
                <img src={deal.image} alt={deal.to} className="w-full h-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-slate-800 via-[#171719] to-violet-950" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex flex-wrap gap-3 mb-4">
                  {deal.isFlashDeal && (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-lg shadow-orange-500/20">
                      <Zap className="w-3 h-3" /> FLASH DEAL
                    </span>
                  )}
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg shadow-emerald-500/20">
                    GIẢM {deal.discount}%
                  </span>
                </div>
                <h1 className="mb-2 text-3xl font-black leading-tight text-white sm:text-6xl">
                  {deal.fromCode} <span className="text-sky-400 px-2">→</span> {deal.to}
                </h1>
                <p className="text-slate-300 text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-sky-400" /> {deal.country}
                </p>
              </div>
            </div>

            {/* Flight Timeline Card */}
            <section className="rounded-2xl border border-white/10 bg-[#171719] p-5 sm:p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Plane className="w-5 h-5 text-sky-400" />
                Chi tiết chuyến bay
              </h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-8 justify-between relative">
                {/* Connection Line (Desktop) */}
                <div className="hidden sm:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-[1px] bg-slate-800 border-t border-dashed border-slate-600" />
                
                <div className="text-center sm:text-left z-10">
                  <div className="text-3xl font-black text-white mb-1 uppercase tracking-tighter">{deal.fromCode}</div>
                  <div className="text-slate-400 text-sm font-medium">{deal.from}</div>
                </div>

                <div className="flex flex-col items-center gap-2 z-10">
                  <div className="px-4 py-1.5 bg-slate-800 rounded-full text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    {deal.duration}
                  </div>
                  <Plane className="w-6 h-6 text-sky-400 rotate-90 sm:rotate-0" />
                  <div className="text-[10px] font-bold text-slate-500">
                    {deal.stops === 0 ? "BAY THẲNG" : `${deal.stops} ĐIỂM DỪNG`}
                  </div>
                </div>

                <div className="text-center sm:text-right z-10">
                  <div className="text-3xl font-black text-white mb-1 uppercase tracking-tighter">{deal.toCode}</div>
                  <div className="text-slate-400 text-sm font-medium">{deal.to}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 p-5 bg-slate-950/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400">
                    {deal.airlineCode}
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Hãng bay</div>
                    <div className="text-white font-bold">{deal.airline}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Thời gian đi - về</div>
                    <div className="text-white font-bold">
                      {new Date(deal.departDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {deal.returnDate && ` - ${new Date(deal.returnDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Data-backed explanation */}
            {priceHistory.length > 0 ? (
              <React.Suspense fallback={(
                <section className="rounded-2xl border border-white/10 bg-[#171719] p-6" aria-busy="true">
                  <h3 className="text-white font-bold">Lịch sử giá</h3>
                  <p className="mt-2 text-sm text-slate-500">Đang tải biểu đồ lịch sử…</p>
                </section>
              )}>
                <PriceHistoryChart data={priceHistory} currentPrice={deal.price} normalPrice={deal.normalPrice} />
              </React.Suspense>
            ) : (
              <section className="rounded-2xl border border-white/10 bg-[#171719] p-6">
                <h3 className="text-white font-bold">Lịch sử giá</h3>
                <p className="text-slate-500 text-sm mt-2">Chưa có đủ quan sát lịch sử cho tuyến {deal.fromCode} → {deal.toCode}. Hệ thống không suy đoán biểu đồ khi thiếu dữ liệu.</p>
              </section>
            )}

            <section className="rounded-2xl border border-white/10 bg-[#171719] p-6">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-white font-bold">Đánh giá phương án hiện tại</h3>
                  <p className="text-slate-500 text-xs mt-1">Tính trên itinerary được nhà cung cấp trả về; chưa suy đoán phương án thay thế.</p>
                </div>
                <span className={`text-xs font-black uppercase ${routeAssessment.riskLevel === "low" ? "text-emerald-400" : routeAssessment.riskLevel === "medium" ? "text-amber-400" : "text-red-400"}`}>
                  Risk {routeAssessment.riskLevel}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                <span>Tổng cost: <strong className="text-emerald-400">{formatVND(routeAssessment.totalCost)}</strong></span>
                <span>Thời lượng: <strong className="text-white">{routeAssessment.totalDurationMinutes} phút</strong></span>
              </div>
              {routeAssessment.riskReasons.length > 0 && <p className="text-amber-300 text-xs mt-3">{routeAssessment.riskReasons.join(" ")}</p>}
            </section>

            <HiddenCostAnalyzer deal={deal} />

            {/* Data-backed explanation */}
            <section className="relative overflow-hidden rounded-2xl border border-sky-500/15 bg-sky-500/[0.06] p-6 sm:p-8">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-500/10 blur-3xl rounded-full" />
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 shadow-lg shadow-sky-500/30">
                     <span className="text-white font-black text-sm">DATA</span>
                   </div>
                   <h3 className="text-xl font-black text-sky-300">Vì sao hệ thống đánh dấu là deal?</h3>
                 </div>
                 <p className="text-slate-300 leading-relaxed text-lg">
                    {aiReasoning}
                 </p>
                 <div className="mt-6 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sky-400 bg-sky-400/10 px-4 py-2 rounded-xl text-sm font-bold">
                       <CheckCircle2 className="w-4 h-4" /> Điểm deal {deal.dealScore ?? deal.aiInsight.savingScore}/100
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl text-sm font-bold">
                       <TrendingDown className="w-4 h-4" /> Thấp hơn mức tham chiếu {deal.discount}%
                    </div>
                 </div>
               </div>
            </section>
          </div>

          {/* ── RIGHT COLUMN: PRICING & RECOMMENDATION ── */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <div className="sticky top-24 rounded-2xl border border-white/10 bg-[#171719] p-6 shadow-2xl shadow-black/20">
              <div className="mb-6 pb-6 border-b border-white/5">
                <div className="text-slate-500 text-sm line-through mb-1">{formatVND(deal.normalPrice)}</div>
                <div className="text-5xl font-black text-emerald-400 tracking-tighter mb-2">
                  {formatVND(deal.price)}
                </div>
                <p className="mb-4 text-xs text-slate-500">
                  {deal.observedAt
                    ? `Quan sát lúc ${new Date(deal.observedAt).toLocaleString("vi-VN")}`
                    : "Giá tham khảo — kiểm tra lại trên trang đặt vé"}
                </p>
                
                <button 
                  onClick={() => {
                    const fallbackUrl = getBestBookingUrl({
                        fromCode: deal.fromCode,
                        toCode: deal.toCode,
                        departDate: deal.departDate,
                        returnDate: deal.returnDate,
                        airline: deal.airline,
                        airlineCode: deal.airlineCode,
                        tripType: deal.tripType,
                        price: deal.price,
                      });
                    const bookingUrl = getEffectiveDealBookingUrl(deal, fallbackUrl);
                    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
                    void trackProductEvent({ eventType: "booking_click", entityId: deal.id, metadata: { provider: deal.affiliateNetwork ?? deal.linkKind ?? "booking_link", route: `${deal.fromCode}-${deal.toCode}` } });
                  }}
                  className={`w-full py-4 rounded-2xl text-center font-black tracking-tight flex flex-col gap-1 ${getRecommendationColor(deal.aiInsight.recommendation)} cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all shadow-lg`}
                >
                   <span className="text-xs uppercase opacity-80 tracking-widest">
                     {getRecommendationLabel(deal.aiInsight.recommendation)}
                   </span>
                   <span className="text-lg">
                     {deal.linkKind === "indicative" ? "Kiểm tra giá hiện tại trên Google Flights" : "Kiểm tra giá trên trang đặt vé"}
                   </span>
                </button>
              </div>

              {/* Confidence Meter */}
              {confidence != null && (
                <div className="mb-8">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-400">Độ tin cậy của dữ liệu</span>
                    <span className="text-sky-400 font-black">{confidence}%</span>
                 </div>
                 <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${confidence}%` }}
                       className="h-full bg-gradient-to-r from-pink-500 to-violet-500"
                    />
                 </div>
                 <p className="text-[11px] text-slate-500 mt-2 leading-tight">
                    Phân tích dựa trên các lần quan sát giá trong 30 ngày gần nhất.
                 </p>
                </div>
              )}

              {/* Price breakdown: only display costs supplied by the provider. */}
              <div className="space-y-4 mb-8">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Chi phí đã biết</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Giá vé cơ bản</span>
                    <span className="text-white font-medium">{formatVND(deal.price)}</span>
                  </div>
                  {deal.hiddenCosts.map((cost) => (
                    <div key={cost.label} className="flex justify-between text-sm">
                      <span className="text-slate-400">{cost.label}</span>
                      <span className="text-white font-medium">{formatVND(cost.amount)}</span>
                    </div>
                  ))}

                  <div className="h-[1px] bg-white/5 my-2" />
                  <div className="flex justify-between items-end text-lg">
                    <div>
                      <span className="text-slate-200 font-bold">Tổng đã biết</span>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight max-w-[200px] mt-1">
                        Hành lý, chỗ ngồi và phí thanh toán có thể chưa được nhà cung cấp trả về.
                      </p>
                    </div>
                    <span className="text-emerald-400 font-black">
                      {formatVND(deal.realTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Options Panel */}
              {(() => {
                const bookingOptions = getAllBookingOptions({
                  fromCode: deal.fromCode,
                  toCode: deal.toCode,
                  departDate: deal.departDate,
                  returnDate: deal.returnDate,
                  airline: deal.airline,
                  airlineCode: deal.airlineCode,
                  tripType: deal.tripType,
                  price: deal.price,
                });
                return (
                  <div className="space-y-2 mb-4">
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-3">Chọn nơi đặt vé:</p>
                    {bookingOptions.map((opt) => (
                  <button
                        key={opt.label}
                        onClick={() => window.open(opt.url, '_blank', 'noopener,noreferrer')}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-white/8 hover:border-sky-500/30 rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{opt.icon}</span>
                          <div className="text-left">
                            <div className="text-white text-sm font-bold">{opt.label}</div>
                            <div className="text-slate-500 text-xs">{opt.note}</div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                );
              })()}

              <button 
                onClick={() => {
                  const fallbackUrl = getBestBookingUrl({
                      fromCode: deal.fromCode,
                      toCode: deal.toCode,
                      departDate: deal.departDate,
                      returnDate: deal.returnDate,
                      airline: deal.airline,
                      airlineCode: deal.airlineCode,
                      tripType: deal.tripType,
                      price: deal.price,
                    });
                  const bookingUrl = getEffectiveDealBookingUrl(deal, fallbackUrl);
                  window.open(bookingUrl, '_blank', 'noopener,noreferrer');
                }}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 py-5 text-xl font-black text-white shadow-lg shadow-pink-500/20 transition-all hover:opacity-90 active:scale-[0.98]">
                ✈️ SĂN VÉ NGAY
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Risk Warning (Module 3.3) */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <div className="text-amber-500 font-bold text-sm uppercase tracking-wide">Lưu ý rủi ro</div>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Giá vé có thể thay đổi nhanh chóng tùy thuộc vào hãng hàng không. Hãy đặt vé ngay khi có thể để giữ giá tốt nhất.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </main>
  );
}
