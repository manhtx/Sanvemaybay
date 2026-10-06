import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  Plane,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Share2,
  Bell,
  TrendingDown,
  ExternalLink,
  Bookmark,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { getDealById, getPriceHistory, getObservedFares } from "../data/api";
import { Deal, formatVND } from "../data/deals";
import { getBestBookingUrl, getEffectiveDealBookingUrl } from "../lib/bookingUrls";
import {
  isBookmarkedDeal,
  saveRemoteBookmark,
  toggleBookmarkedDeal,
  createOpportunitySnapshot,
} from "../lib/bookmarks";
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
  const [cheaperAlternative, setCheaperAlternative] = useState<{
    airline: string;
    price: number;
    id: string;
    stops: number;
  } | null>(null);

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

        // Check if a cheaper eligible option exists for this travel intent
        try {
          const candidatesPage = await getObservedFares({
            origin: data.fromCode,
            destination: data.toCode,
            departDateFrom: data.departDate,
            departDateTo: data.departDate,
            pageSize: 30,
          });
          const eligibleCandidates = (candidatesPage?.fares || []).filter(
            (f) =>
              f.id !== data.id &&
              f.opportunityId !== data.opportunityId &&
              f.fromCode.toUpperCase() === data.fromCode.toUpperCase() &&
              f.toCode.toUpperCase() === data.toCode.toUpperCase() &&
              f.departDate === data.departDate &&
              f.price < data.price &&
              (data.stops === 0 ? f.stops === 0 : true)
          );
          if (eligibleCandidates.length > 0) {
            eligibleCandidates.sort((a, b) => a.price - b.price);
            const bestCheaper = eligibleCandidates[0];
            setCheaperAlternative({
              airline: bestCheaper.airline,
              price: bestCheaper.price,
              id: bestCheaper.id,
              stops: bestCheaper.stops,
            });
          } else {
            setCheaperAlternative(null);
          }
        } catch {
          // Gracefully omit banner if query fails
        }
      }
      setLoading(false);
    }
    loadDeal();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--canvas-bg)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-[var(--canvas-bg)] flex flex-col items-center justify-center p-4">
        <h2 className="text-xl font-bold text-stone-900 mb-4">Không tìm thấy cơ hội này</h2>
        <Link to="/deals" className="text-blue-600 flex items-center gap-2 hover:underline font-medium">
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
    <main className="min-h-screen bg-[var(--canvas-bg)] text-stone-900 pb-24 lg:pb-12">
      {/* ── TOP NAV ── */}
      <nav className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link
            to="/deals"
            className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Cơ hội theo dõi</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void shareDeal()}
              aria-label="Chia sẻ cơ hội"
              className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 hover:text-stone-900 transition-colors"
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
              className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 hover:text-stone-900 transition-colors"
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-blue-600 text-blue-600" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setWatchOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-800 border border-stone-300 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-blue-600" />
              <span>Theo dõi</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* ── CHEAPER ELIGIBLE ALTERNATIVE BANNER ── */}
        {cheaperAlternative && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-950 shadow-sm">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-600 mt-1 sm:mt-0 animate-pulse shrink-0" />
              <div>
                <div className="text-sm font-bold text-amber-950 flex items-center gap-2">
                  <span>Đang có lựa chọn rẻ hơn cho chặng bay này</span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5">
                  <span>{cheaperAlternative.airline} ({cheaperAlternative.stops === 0 ? "Bay thẳng" : `${cheaperAlternative.stops} điểm dừng`})</span>
                  {" · "}
                  <span className="font-bold tabular-nums">{formatVND(cheaperAlternative.price)}</span>
                  {" · "}
                  <span>Thấp hơn {formatVND(deal.price - cheaperAlternative.price)} so với chuyến đang xem</span>
                </p>
              </div>
            </div>
            <Link
              to={`/deals/${cheaperAlternative.id}`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs transition-colors shrink-0 shadow-sm cursor-pointer"
            >
              <span>Xem lựa chọn {formatVND(cheaperAlternative.price)}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ── SECTION 58: FLAGSHIP SCREEN DECISION HERO ── */}
        <section className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-3">
              {/* Route Lockup */}
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-500">
                <span>{deal.from}</span>
                <span className="text-blue-600">→</span>
                <span>{deal.to}</span>
                <span className="text-stone-300">·</span>
                <span className="text-stone-700">{deal.country}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight">
                {deal.fromCode} <span className="text-blue-600 font-light">→</span> {deal.toCode}
              </h1>

              {/* Flight Characteristics */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-stone-700">
                <span className="inline-flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-md font-medium text-stone-800 border border-stone-200">
                  <Calendar className="w-3.5 h-3.5 text-stone-500" />
                  {formattedDepartTime}
                  {formattedReturnTime && ` – ${formattedReturnTime}`}
                </span>

                <span className="inline-flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-md font-medium text-stone-800 border border-stone-200">
                  <Plane className="w-3.5 h-3.5 text-stone-500" />
                  {deal.airline} · {deal.stops === 0 ? "Bay thẳng" : `${deal.stops} điểm dừng`}
                </span>

                {deal.duration && (
                  <span className="inline-flex items-center gap-1 text-stone-500">
                    <Clock className="w-3 h-3 text-stone-400" />
                    {deal.duration}
                  </span>
                )}
              </div>
            </div>

            {/* Price & Primary CTAs */}
            <div className="flex flex-col md:items-end justify-between gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
              <div>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight tabular-nums font-mono">
                  {formatVND(deal.price)}
                </div>
                {cohort.isDiscounted && (
                  <div className="flex items-center md:justify-end gap-1.5 text-xs font-bold text-emerald-700 mt-1">
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
                  className="px-4 py-2.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-bold text-stone-800 transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <Bell className="w-4 h-4 text-blue-600" />
                  Theo dõi chặng này
                </button>
                <button
                  type="button"
                  onClick={handleVerifyClick}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <span>
                    {deal.linkKind === "live_affiliate"
                      ? "Kiểm tra giá chuyến này"
                      : "Kiểm tra giá trên Google Flights"}
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Evidence Spine Banner */}
          <div className="mt-6 pt-5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4 text-xs text-stone-600">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                cohort.evidence.tier === "STRONG"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : cohort.evidence.tier === "MODERATE"
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-stone-100 text-stone-700 border-stone-200"
              }`}>
                {cohort.evidence.label}
              </span>
              <span>{cohort.evidence.summaryText}</span>
            </div>

            <div className="text-stone-500 text-[11px]">
              {freshnessLabel}
            </div>
          </div>
        </section>

        {/* ── TRUE COST ANALYSIS ── */}
        <HiddenCostAnalyzer deal={deal} />

        {/* ── PRICE HISTORY & COHORT CONTEXT ── */}
        {priceHistory.length > 0 ? (
          <React.Suspense
            fallback={
              <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm" aria-busy="true">
                <h3 className="text-stone-900 font-bold text-sm">Lịch sử quan sát</h3>
                <p className="mt-2 text-xs text-stone-500">Đang tải lịch sử giá…</p>
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
          <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h3 className="text-stone-900 font-bold text-sm">Lịch sử quan sát</h3>
            <p className="text-stone-600 text-xs mt-2 leading-relaxed">
              Chưa có đủ chu kỳ quan sát độc lập cho chặng {deal.fromCode} → {deal.toCode}. Hệ thống ghi nhận trung thực và không ngoại suy dữ liệu khi chưa đủ số mẫu.
            </p>
          </section>
        )}

        {/* ── METHODOLOGY & DECISION EVIDENCE DETAILS ── */}
        <section className="rounded-xl border border-stone-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-stone-800">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">Căn cứ đánh dấu cơ hội</h3>
          </div>
          <p className="text-stone-700 text-sm leading-relaxed">
            {deal.aiReasoning || deal.aiInsight?.reason || cohort.comparisonExplanation}
          </p>
          <div className="text-xs text-stone-500 border-t border-stone-100 pt-3 leading-relaxed">
            Nguyên tắc Farely: Giá vé máy bay biến động theo từng đợt mở bán của hãng hàng không. Bấm &quot;Kiểm tra giá hiện tại&quot; để xác minh tình trạng chỗ và giá thực tế trực tiếp với đơn vị bán trước khi tiến hành thanh toán.
          </div>
        </section>
      </div>

      {/* ── MOBILE STICKY BOTTOM ACTION BAR (Viewport < sm) ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-stone-200 px-4 py-3 backdrop-blur-xl flex items-center justify-between gap-3 shadow-lg">
        <div>
          <div className="text-lg font-bold text-emerald-700 leading-tight tabular-nums font-mono">
            {formatVND(deal.price)}
          </div>
          <div className="text-[10px] text-stone-500 font-medium">
            {cohort.isDiscounted ? `↓${cohort.deltaPercent}% so với median` : "Giá quan sát"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWatchOpen(true)}
            className="p-2.5 rounded-lg border border-stone-300 bg-stone-100 text-stone-800 text-xs font-bold"
            aria-label="Theo dõi"
          >
            <Bell className="w-4 h-4 text-blue-600" />
          </button>
          <button
            type="button"
            onClick={handleVerifyClick}
            className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <span>
              {deal.linkKind === "live_affiliate" ? "Kiểm tra giá chuyến này" : "Kiểm tra giá"}
            </span>
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
