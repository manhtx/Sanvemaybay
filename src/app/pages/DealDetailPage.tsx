import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { 
  Plane, Calendar,
  ChevronLeft, Share2, Bell, TrendingDown, 
  ExternalLink, Bookmark, ShieldCheck, Clock
} from "lucide-react";
import { getDealById, getPriceHistory } from "../data/api";
import { Deal, formatVND } from "../data/deals";
import { getBestBookingUrl, getEffectiveDealBookingUrl } from "../lib/bookingUrls";
import { isBookmarkedDeal, saveRemoteBookmark, toggleBookmarkedDeal, createOpportunitySnapshot } from "../lib/bookmarks";
import { shareOrCopy } from "../lib/sharing";
import { HiddenCostAnalyzer } from "../components/HiddenCostAnalyzer";
import { trackProductEvent } from "../lib/analytics";
import { reportClientIssue } from "../lib/clientDiagnostics";
import { WatchModal } from "../components/WatchModal";
import { buildComparableCohort } from "../domain/opportunityCohort";

const PriceHistoryChart = React.lazy(async () => ({
  default: (await import("../components/PriceHistoryChart")).PriceHistoryChart,
}));

export function DealDetailPage() {
  const { id } = useParams();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [priceHistory, setPriceHistory] = useState<Awaited<ReturnType<typeof getPriceHistory>>>([]);

  useEffect(() => {
    async function loadDeal() {
      if (!id) return;
      const data = await getDealById(id);
      if (data) {
        setDeal(data);
        void trackProductEvent({
          eventType: "opportunity_open",
          entityId: data.id,
          metadata: {
            opportunity_id: data.id,
            route: `${data.fromCode}-${data.toCode}`,
            source: "deal_detail",
          },
        });
        const targetId = data.opportunityId || data.id;
        setBookmarked(isBookmarkedDeal(targetId) || isBookmarkedDeal(data.id));
        const history = await getPriceHistory(data.fromCode, data.toCode);
        setPriceHistory(history);

      }
      setLoading(false);
    }
    loadDeal();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-sky-500" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-white mb-4">Không tìm thấy cơ hội này</h2>
        <Link to="/deals" className="text-sky-400 flex items-center gap-2 hover:underline">
          <ChevronLeft className="w-4 h-4" /> Quay lại danh sách cơ hội
        </Link>
      </div>
    );
  }

  const shareDeal = async () => {
    const shareData = {
      title: `${deal.fromCode} → ${deal.toCode} | Farely`,
      text: `${deal.from} → ${deal.to}: ${formatVND(deal.price)}`,
      url: window.location.href,
    };
    try {
      await shareOrCopy(shareData, navigator);
      await trackProductEvent({
        eventType: "share",
        entityId: deal.id,
        metadata: { route: `${deal.fromCode}-${deal.toCode}` },
      });
    } catch {
      reportClientIssue("deal_share_failed");
    }
  };

  const handleVerifyClick = () => {
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
    window.open(bookingUrl, "_blank", "noopener,noreferrer");
    void trackProductEvent({
      eventType: "verify_click",
      entityId: deal.id,
      metadata: {
        opportunity_id: deal.id,
        route: `${deal.fromCode}-${deal.toCode}`,
        provider: deal.affiliateNetwork ?? deal.linkKind ?? "booking_link",
      },
    });
  };

  // Build Comparable Cohort & Evidence
  const cohort = buildComparableCohort(
    {
      id: deal.id,
      originCode: deal.fromCode,
      destinationCode: deal.toCode,
      departDate: deal.departDate,
      returnDate: deal.returnDate,
      price: deal.price,
      stops: deal.stops,
      airlineCode: deal.airlineCode,
      observedAt: deal.observedAt || new Date().toISOString(),
    },
    priceHistory.map((ph, idx) => ({
      id: `ph-${idx}`,
      originCode: deal.fromCode,
      destinationCode: deal.toCode,
      departDate: ph.date,
      price: ph.price,
      stops: deal.stops,
      airlineCode: deal.airlineCode,
      observedAt: ph.date,
    }))
  );

  const formattedDepartTime = new Date(deal.departDate).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedReturnTime = deal.returnDate
    ? new Date(deal.returnDate).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const freshnessLabel = deal.observedAt
    ? `Ghi nhận lúc ${new Date(deal.observedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} · ${new Date(deal.observedAt).toLocaleDateString("vi-VN")}`
    : "Quan sát gần đây";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pb-24 lg:pb-12">
      {/* ── TOP NAV ── */}
      <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/90 px-4 py-3 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            to="/deals"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Cơ hội theo dõi</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void shareDeal()}
              aria-label="Chia sẻ cơ hội"
              className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label={bookmarked ? "Bỏ lưu cơ hội" : "Lưu cơ hội"}
              aria-pressed={bookmarked}
              onClick={() => {
                const targetId = deal.opportunityId || deal.id;
                const snapshot = createOpportunitySnapshot(deal);
                const next = toggleBookmarkedDeal(targetId, undefined, snapshot);
                setBookmarked(next);
                void saveRemoteBookmark(targetId, next, snapshot);
                void trackProductEvent({
                  eventType: "bookmark",
                  entityId: targetId,
                  metadata: {
                    opportunity_id: targetId,
                    bookmarked: next,
                    route: `${deal.fromCode}-${deal.toCode}`,
                  },
                });
              }}
              className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-sky-400 text-sky-400" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setWatchOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white border border-white/10 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-sky-400" />
              <span>Theo dõi</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* ── SECTION 40: ABOVE-THE-FOLD DECISION HERO ── */}
        <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-3">
              {/* Route Lockup */}
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <span>{deal.from}</span>
                <span className="text-sky-400">→</span>
                <span>{deal.to}</span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-300">{deal.country}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
                {deal.fromCode} <span className="text-sky-400 font-light">→</span> {deal.toCode}
              </h1>

              {/* Flight Characteristics */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-200 border border-white/5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formattedDepartTime}
                  {formattedReturnTime && ` – ${formattedReturnTime}`}
                </span>

                <span className="inline-flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md text-xs font-semibold text-slate-200 border border-white/5">
                  <Plane className="w-3.5 h-3.5 text-slate-400" />
                  {deal.airline} · {deal.stops === 0 ? "Bay thẳng" : `${deal.stops} điểm dừng`}
                </span>

                {deal.duration && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {deal.duration}
                  </span>
                )}
              </div>
            </div>

            {/* Price & Primary CTAs */}
            <div className="flex flex-col md:items-end justify-between gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-white/5">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                  {formatVND(deal.price)}
                </div>
                {cohort.isDiscounted && (
                  <div className="flex items-center md:justify-end gap-1.5 text-xs font-bold text-emerald-400 mt-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>{cohort.comparisonExplanation}</span>
                  </div>
                )}
              </div>

              {/* Desktop CTAs */}
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWatchOpen(true)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Bell className="w-4 h-4 text-sky-400" />
                  Theo dõi chặng này
                </button>
                <button
                  type="button"
                  onClick={handleVerifyClick}
                  className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-sm font-bold text-slate-950 transition-colors cursor-pointer flex items-center gap-2 shadow-lg shadow-sky-500/20"
                >
                  <span>Kiểm tra giá hiện tại</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Evidence Spine Banner */}
          <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                cohort.evidence.tier === "STRONG"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : cohort.evidence.tier === "MODERATE"
                  ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                  : "bg-slate-800 text-slate-300 border-white/10"
              }`}>
                {cohort.evidence.label}
              </span>
              <span>{cohort.evidence.summaryText}</span>
            </div>

            <div className="text-slate-500 text-[11px]">
              {freshnessLabel}
            </div>
          </div>
        </section>

        {/* ── SECTION 14 & 40: TRUE COST ANALYSIS ── */}
        <HiddenCostAnalyzer deal={deal} />

        {/* ── SECTION 11 & 40: DEFENSIBLE PRICE HISTORY & COHORT CONTEXT ── */}
        {priceHistory.length > 0 ? (
          <React.Suspense
            fallback={
              <section className="rounded-2xl border border-white/10 bg-[#171719] p-6" aria-busy="true">
                <h3 className="text-white font-bold text-sm">Lịch sử quan sát</h3>
                <p className="mt-2 text-xs text-slate-500">Đang tải lịch sử giá…</p>
              </section>
            }
          >
            <PriceHistoryChart
              data={priceHistory}
              currentPrice={deal.price}
              normalPrice={cohort.cohortMedian || deal.normalPrice}
            />
          </React.Suspense>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-[#171719] p-6">
            <h3 className="text-white font-bold text-sm">Lịch sử quan sát</h3>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Chưa có đủ chu kỳ quan sát độc lập cho chặng {deal.fromCode} → {deal.toCode}. Hệ thống ghi nhận trung thực và không ngoại suy dữ liệu khi chưa đủ số mẫu.
            </p>
          </section>
        )}

        {/* ── METHODOLOGY & DECISION EVIDENCE DETAILS ── */}
        <section className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-4">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Căn cứ đánh dấu cơ hội</h3>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            {deal.aiReasoning || deal.aiInsight?.reason || cohort.comparisonExplanation}
          </p>
          <div className="text-xs text-slate-500 border-t border-white/5 pt-3 leading-relaxed">
            Nguyên tắc Farely: Giá vé máy bay biến động theo từng đợt mở bán của hãng hàng không. Bấm &quot;Kiểm tra giá hiện tại&quot; để xác minh tình trạng chỗ và giá thực tế trực tiếp với đơn vị bán trước khi tiến hành thanh toán.
          </div>
        </section>
      </div>

      {/* ── SECTION 41: MOBILE STICKY BOTTOM ACTION BAR (Viewport < sm) ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-white/10 px-4 py-3 backdrop-blur-xl flex items-center justify-between gap-3">
        <div>
          <div className="text-lg font-black text-emerald-400 leading-tight">
            {formatVND(deal.price)}
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            {cohort.isDiscounted ? `↓${cohort.deltaPercent}% so với median` : "Giá hiện tại"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWatchOpen(true)}
            className="p-2.5 rounded-xl border border-white/10 bg-slate-800 text-white text-xs font-bold"
            aria-label="Theo dõi"
          >
            <Bell className="w-4 h-4 text-sky-400" />
          </button>
          <button
            type="button"
            onClick={handleVerifyClick}
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg shadow-sky-500/20"
          >
            <span>Kiểm tra giá</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <WatchModal
        isOpen={watchOpen}
        onClose={() => setWatchOpen(false)}
        initialOrigin={deal.fromCode}
        initialDestination={deal.toCode}
        currentPrice={deal.price}
        sourceContext="deal_detail"
      />
    </main>
  );
}
