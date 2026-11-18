import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import {
  Plane,
  ChevronLeft,
  Share2,
  Bell,
  TrendingDown,
  ExternalLink,
  Heart,
  ShieldCheck,
  Clock,
  Star,
  CheckCircle2,
  Luggage,
  Sparkles,
} from "lucide-react";
import { getDealById, getPriceHistory, getObservedFares, getFareObservations } from "../data/api";
import { Deal, formatVND } from "../data/deals";
import { getBestBookingUrl, getEffectiveDealBookingUrl } from "../lib/bookingUrls";
import {
  isBookmarkedDeal,
  mutateBookmarkOptimistic,
  createOpportunitySnapshot,
} from "../lib/bookmarks";
import { shareOrCopy } from "../lib/sharing";
import { HiddenCostAnalyzer } from "../components/HiddenCostAnalyzer";
import { trackProductEvent } from "../lib/analytics";
import { reportClientIssue } from "../lib/clientDiagnostics";
import { WatchModal } from "../components/WatchModal";
import { buildComparableCohort } from "../domain/opportunityCohort";
import { createTravelIntent, selectRouteBest, type RouteOffer } from "../../domain/farely";

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
  const [fareObservations, setFareObservations] = useState<Awaited<ReturnType<typeof getFareObservations>>>([]);
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
        const [history, observations] = await Promise.all([
          getPriceHistory(data.fromCode, data.toCode),
          getFareObservations(data.fromCode, data.toCode),
        ]);
        setPriceHistory(history);
        setFareObservations(observations);

        try {
          const intent = createTravelIntent({
            origin: data.fromCode,
            destination: data.toCode,
            journeyType: data.returnDate ? "ROUND_TRIP" : "ONE_WAY",
            outboundDate: data.departDate,
            returnDate: data.returnDate || undefined,
            cabin: "ECONOMY",
            maxStops: data.stops === 0 ? 0 : undefined,
          });

          const candidatesPage = await getObservedFares({
            origin: data.fromCode,
            destination: data.toCode,
            departDateFrom: data.departDate,
            departDateTo: data.departDate,
            returnDate: data.returnDate || undefined,
            directOnly: data.stops === 0 ? true : undefined,
            maxStops: data.stops != null && data.stops >= 0 ? data.stops : undefined,
            sort: "price_asc",
            pageSize: 60,
          });

          const candidateOffers: RouteOffer[] = (candidatesPage?.fares || []).map((f) => ({
            id: f.id,
            origin: f.fromCode,
            destination: f.toCode,
            departDate: f.departDate,
            returnDate: f.returnDate,
            airline: f.airline,
            price: f.price,
            stops: f.stops,
            currency: f.currency,
            cabin: "ECONOMY",
          }));

          const canonicalRouteBest = selectRouteBest(candidateOffers, intent);
          if (canonicalRouteBest && canonicalRouteBest.id !== data.id && canonicalRouteBest.price < data.price) {
            setCheaperAlternative({
              airline: canonicalRouteBest.airline,
              price: canonicalRouteBest.price,
              id: canonicalRouteBest.id,
              stops: canonicalRouteBest.stops ?? 0,
            });
          } else {
            setCheaperAlternative(null);
          }
        } catch {
          // Gracefully omit banner
        }
      }
      setLoading(false);
    }
    void loadDeal();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0084e6] border-t-transparent" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 pt-20">
        <h2 className="text-xl font-bold text-[#222222] mb-4">Không tìm thấy cơ hội này</h2>
        <Link to="/deals" className="text-[#0084e6] flex items-center gap-2 hover:underline font-semibold text-sm">
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

  const rawCohortObservations = fareObservations;
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
    rawCohortObservations
  );

  const formattedDepartTime = new Date(deal.departDate).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const formattedReturnTime = deal.returnDate
    ? new Date(deal.returnDate).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const dealScore = deal.dealScore ?? deal.aiInsight?.savingScore ?? 75;
  const dealRating = ((dealScore / 100) * 1.5 + 3.5).toFixed(2);

  return (
    <main className="min-h-screen bg-white text-[#222222] pt-24 pb-24 lg:pb-16">

      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">

        {/* ── AIRBNB LISTING HEADER ── */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#222222]">
                {deal.fromCode} <span className="text-[#0084e6] font-light">→</span> {deal.toCode}
              </h1>
              <p className="text-sm text-[#6a6a6a] mt-0.5">
                Chuyến bay {deal.from} ({deal.fromCode}) đến {deal.to} ({deal.toCode}) · {deal.country}
              </p>
            </div>

            {/* Actions: Share & Save */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => void shareDeal()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-[#222222] hover:bg-[#f7f7f7] underline"
              >
                <Share2 className="w-4 h-4" />
                <span>Chia sẻ</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  const targetId = deal.opportunityId || deal.id;
                  const snapshot = createOpportunitySnapshot(deal);
                  const next = !bookmarked;
                  setBookmarked(next);
                  await mutateBookmarkOptimistic(targetId, next, snapshot);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold text-[#222222] hover:bg-[#f7f7f7] underline"
              >
                <Heart className={`w-4 h-4 ${bookmarked ? "fill-[#0084e6] text-[#0084e6]" : "text-[#222222]"}`} />
                <span>{bookmarked ? "Đã lưu" : "Lưu"}</span>
              </button>
            </div>
          </div>

          {/* Subheader: Rating & Meta */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-[#6a6a6a]">
            <div className="flex items-center gap-1 font-semibold text-[#222222]">
              <Star className="w-4 h-4 fill-[#222222] text-[#222222]" />
              <span>{dealRating}</span>
              <span className="font-normal text-[#6a6a6a]">· Điểm tín nhiệm {dealScore}/100</span>
            </div>
            <span>·</span>
            <span className="text-[#222222] font-semibold">{deal.airline}</span>
            <span>·</span>
            <span>{deal.stops === 0 ? "Bay thẳng" : `${deal.stops} điểm dừng`}</span>
            <span>·</span>
            <span className="text-[#0084e6] font-medium flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Giá đã xác minh</span>
            </span>
          </div>
        </div>

        {/* ── PHOTO HERO / SHOWCASE (Airbnb 14px rounded container) ── */}
        <div className="relative aspect-[16/8] sm:aspect-[21/9] w-full overflow-hidden rounded-[14px] bg-[#f2f2f2] mb-10 shadow-xs">
          <img
            src={deal.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"}
            alt={`${deal.to} - Chuyến bay`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-6">
            <div className="text-white">
              <span className="px-3 py-1 rounded-full bg-[#0084e6] text-xs font-bold shadow-xs">
                {deal.stops === 0 ? "Chuyến bay thẳng" : `${deal.stops} chặng dừng`}
              </span>
              <p className="text-sm font-medium mt-1 text-white/90">
                {deal.from} ({deal.fromCode}) → {deal.to} ({deal.toCode}) · {deal.duration}
              </p>
            </div>
          </div>
        </div>

        {/* ── TWO-COLUMN AIRBNB LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

          {/* LEFT COLUMN: 2 Cols — Details, Timeline, Amenities, History */}
          <div className="lg:col-span-2 space-y-10">

            {/* Airline & Itinerary Overview Header */}
            <div className="pb-8 border-b border-[#ebebeb]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#222222]">
                    Khai thác bởi {deal.airline} {deal.airlineCode && `(${deal.airlineCode})`}
                  </h2>
                  <p className="text-sm text-[#6a6a6a] mt-1">
                    Hạng vé Phổ thông (Economy) · {deal.returnDate ? "Khứ hồi" : "Một chiều"}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#f7f7f7] border border-[#dddddd] flex items-center justify-center text-[#0084e6] shrink-0">
                  <Plane className="w-6 h-6 -rotate-45" />
                </div>
              </div>
            </div>

            {/* Cheaper Alternative Banner */}
            {cheaperAlternative && (
              <div className="rounded-[14px] border border-[#bae6fd] bg-[#f0f9ff] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-[#0369a1] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0084e6]" />
                    <span>Lựa chọn vé rẻ hơn cho hành trình này</span>
                  </div>
                  <p className="text-xs text-[#0284c7] mt-1">
                    {cheaperAlternative.airline} ({cheaperAlternative.stops === 0 ? "Bay thẳng" : `${cheaperAlternative.stops} điểm dừng`}) ·{" "}
                    <span className="font-bold">{formatVND(cheaperAlternative.price)}</span> (Thấp hơn {formatVND(deal.price - cheaperAlternative.price)})
                  </p>
                </div>
                <Link
                  to={`/deals/${cheaperAlternative.id}`}
                  className="px-4 py-2 rounded-xl bg-[#0084e6] hover:bg-[#006ec4] text-white text-xs font-bold shrink-0 transition-colors"
                >
                  Xem ngay
                </Link>
              </div>
            )}

            {/* Flight Amenities Row (Airbnb Amenity Style) */}
            <div className="py-6 border-b border-[#ebebeb]">
              <h3 className="text-base font-bold text-[#222222] mb-4">Tiện ích chuyến bay</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm text-[#222222]">
                <div className="flex items-center gap-3">
                  <Luggage className="w-5 h-5 text-[#6a6a6a]" />
                  <span>Hành lý xách tay 7kg</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#6a6a6a]" />
                  <span>Thời gian {deal.duration}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#0084e6]" />
                  <span>Xác nhận vé tức thì</span>
                </div>
              </div>
            </div>

            {/* Timeline Segment Card */}
            <div className="py-6 border-b border-[#ebebeb]">
              <h3 className="text-base font-bold text-[#222222] mb-4">Lịch trình chi tiết</h3>
              <div className="rounded-[14px] border border-[#dddddd] p-5 space-y-4 bg-white">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-[#0084e6]" />
                    <div className="w-0.5 h-12 bg-[#dddddd] my-1" />
                    <div className="w-3 h-3 rounded-full border-2 border-[#0084e6] bg-white" />
                  </div>
                  <div className="flex-1 space-y-6 text-sm">
                    <div>
                      <span className="font-bold text-[#222222]">{deal.from} ({deal.fromCode})</span>
                      <p className="text-xs text-[#6a6a6a]">{formattedDepartTime}</p>
                    </div>
                    <div>
                      <span className="font-bold text-[#222222]">{deal.to} ({deal.toCode})</span>
                      <p className="text-xs text-[#6a6a6a]">{formattedReturnTime || "Hạ cánh cùng ngày"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* True Cost Analyzer (Hidden fees & Baggage breakdown) */}
            <div className="py-6 border-b border-[#ebebeb]">
              <HiddenCostAnalyzer deal={deal} />
            </div>

            {/* Price History Chart */}
            <div className="py-6 border-b border-[#ebebeb]">
              <h3 className="text-base font-bold text-[#222222] mb-2">Lịch sử biến động giá</h3>
              <p className="text-xs text-[#6a6a6a] mb-4">
                So sánh mức giá quan sát hiện tại với đường trung vị 30 ngày gần nhất của thị trường.
              </p>
              {priceHistory.length > 0 ? (
                <React.Suspense fallback={<div className="h-48 rounded-[14px] bg-[#f7f7f7] animate-pulse" />}>
                  <PriceHistoryChart
                    data={priceHistory}
                    currentPrice={deal.price}
                    normalPrice={cohort.cohortMedian || deal.normalPrice}
                  />
                </React.Suspense>
              ) : (
                <div className="rounded-[14px] border border-[#ebebeb] bg-[#f7f7f7] p-6 text-center text-xs text-[#6a6a6a]">
                  Chưa ghi nhận đủ chu kỳ mẫu độc lập cho chặng bay này.
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: 1 Col — Airbnb Sticky Reservation Card */}
          <div className="lg:col-span-1 lg:sticky lg:top-28">
            <div className="rounded-[14px] border border-[#dddddd] shadow-[0_6px_20px_rgba(0,0,0,0.08)] p-6 bg-white space-y-6">

              {/* Card Header: Price per person */}
              <div className="flex items-baseline justify-between border-b border-[#ebebeb] pb-4">
                <div>
                  <span className="text-2xl font-bold text-[#222222] tabular-nums">
                    {formatVND(deal.price)}
                  </span>
                  <span className="text-sm text-[#6a6a6a]"> / khách</span>
                </div>
                {cohort.isDiscounted && (
                  <span className="text-xs font-bold text-[#0084e6] flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>Giảm {cohort.deltaPercent}%</span>
                  </span>
                )}
              </div>

              {/* Segmented Reservation Input Box */}
              <div className="rounded-xl border border-[#c1c1c1] overflow-hidden text-xs">
                <div className="p-3 border-b border-[#c1c1c1] bg-white">
                  <span className="block text-[10px] font-bold text-[#222222] uppercase tracking-wider">Hành trình</span>
                  <span className="text-sm font-semibold text-[#222222]">{deal.fromCode} → {deal.toCode}</span>
                </div>
                <div className="p-3 bg-white">
                  <span className="block text-[10px] font-bold text-[#222222] uppercase tracking-wider">Ngày bay</span>
                  <span className="text-xs text-[#222222]">{formattedDepartTime}</span>
                </div>
              </div>

              {/* Primary CTA Button: Airbnb Sky Blue */}
              <button
                type="button"
                onClick={handleVerifyClick}
                className="w-full py-3.5 px-6 rounded-xl bg-[#0084e6] hover:bg-[#006ec4] text-white font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <span>
                  {deal.linkKind === "live_affiliate"
                    ? "Kiểm tra giá chuyến này"
                    : "Kiểm tra giá trên Google Flights"}
                </span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-[#6a6a6a]">
                Bạn sẽ không bị trừ tiền trên trang này. Farely chuyển hướng bạn tới đối tác đã kiểm chứng.
              </p>

              {/* Price Calculation Breakdown */}
              <div className="space-y-3 pt-4 border-t border-[#ebebeb] text-sm text-[#222222]">
                <div className="flex justify-between">
                  <span className="underline text-[#6a6a6a]">Giá vé cơ sở</span>
                  <span>{formatVND(deal.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="underline text-[#6a6a6a]">Thuế & phụ phí sân bay</span>
                  <span className="text-emerald-700 font-medium">Đã bao gồm</span>
                </div>
                {deal.normalPrice > deal.price && (
                  <div className="flex justify-between text-[#0084e6]">
                    <span>Tiết kiệm ước tính</span>
                    <span className="font-semibold">-{formatVND(deal.normalPrice - deal.price)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-[#ebebeb] flex justify-between font-bold text-base">
                  <span>Tổng thanh toán</span>
                  <span>{formatVND(deal.price)}</span>
                </div>
              </div>

              {/* Watch alert button */}
              <button
                type="button"
                onClick={() => setWatchOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-[#dddddd] text-xs font-semibold text-[#222222] hover:bg-[#f7f7f7] transition-colors flex items-center justify-center gap-2"
              >
                <Bell className="w-3.5 h-3.5 text-[#0084e6]" />
                <span>Theo dõi khi giá giảm thêm</span>
              </button>

            </div>
          </div>

        </div>

        {/* ── METHODOLOGY & DECISION EVIDENCE DETAILS ── */}
        <section className="mt-12 rounded-[14px] border border-[#dddddd] bg-[#f7f7f7] p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#222222]">
            <ShieldCheck className="w-5 h-5 text-[#0084e6]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#222222]">Căn cứ đánh dấu cơ hội</h3>
          </div>
          <p className="text-[#3f3f3f] text-sm leading-relaxed">
            {deal.aiReasoning || deal.aiInsight?.reason || cohort.comparisonExplanation}
          </p>
          <div className="text-xs text-[#6a6a6a] border-t border-[#dddddd] pt-3 leading-relaxed">
            Nguyên tắc Farely: Giá vé máy bay biến động theo từng đợt mở bán của hãng hàng không. Bấm &quot;Kiểm tra giá hiện tại&quot; để xác minh tình trạng chỗ và giá thực tế trực tiếp với đơn vị bán trước khi tiến hành thanh toán.
          </div>
        </section>

      </div>

      {/* ── MOBILE STICKY BOTTOM BAR (Viewport < lg) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#ebebeb] px-6 py-3 flex items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="text-lg font-bold text-[#222222] tabular-nums">
            {formatVND(deal.price)}
            <span className="text-xs font-normal text-[#6a6a6a]"> / khách</span>
          </div>
          <div className="text-[11px] text-[#0084e6] font-medium">
            {cohort.isDiscounted ? `Tiết kiệm ${cohort.deltaPercent}%` : "Giá quan sát"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWatchOpen(true)}
            className="p-3 rounded-xl border border-[#dddddd] text-[#222222] hover:bg-[#f7f7f7]"
            aria-label="Theo dõi biến động giá"
          >
            <Bell className="w-4 h-4 text-[#0084e6]" />
          </button>

          <button
            type="button"
            onClick={handleVerifyClick}
            className="px-5 py-3 rounded-xl bg-[#0084e6] hover:bg-[#006ec4] text-white text-sm font-bold flex items-center gap-1.5 shadow-xs"
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
