import { Link } from "react-router";
import { Plane, Clock, AlertTriangle, Zap, TrendingDown, Users, Calendar, Bookmark } from "lucide-react";
import { Deal, formatVND, getRecommendationColor, getRecommendationLabel, regionFlag } from "../data/deals";
import { isBookmarkedDeal, saveRemoteBookmark, toggleBookmarkedDeal } from "../lib/bookmarks";
import { useState } from "react";
import { trackProductEvent } from "../lib/analytics";

interface DealCardProps {
  deal: Deal;
}

function formatDepartDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN");
}

function formatObservedAt(dateStr?: string) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function DealCard({ deal }: DealCardProps) {
  const [bookmarked, setBookmarked] = useState(() => isBookmarkedDeal(deal.id));
  const priceDiff = deal.realTotal - deal.advertisedTotal;
  const hasHiddenCosts = priceDiff > 0;
  const discountTone = deal.discount >= 30
    ? "bg-red-500/95 text-white"
    : deal.discount >= 15
      ? "bg-amber-400 text-slate-950"
      : "bg-emerald-500/95 text-white";
  const cardTarget = `/deals/${deal.id}`;

  return (
    <div className="relative group">
      <Link aria-label={`${deal.linkKind === "indicative" ? "Chi tiết cơ hội" : "Xem deal"} ${deal.fromCode} đến ${deal.toCode}, ${formatVND(deal.price)}, ${deal.aiReasoning || deal.aiInsight.reason}`} to={cardTarget} className="block">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#171719] transition-all duration-300 hover:border-pink-500/35 hover:bg-[#1b1b1e] hover:shadow-xl hover:shadow-black/20">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          {deal.image ? (
            <img
              src={deal.image}
              alt={deal.to}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-800 via-[#171719] to-violet-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {deal.isFlashDeal && (
                <span className="flex items-center gap-1 rounded-full bg-orange-500/90 px-2.5 py-1 text-xs font-bold text-white">
                <Zap className="w-3 h-3" />
                GIẢM MẠNH
              </span>
            )}
            {deal.isTrending && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-violet-500/90 text-white text-xs rounded-full" style={{ fontWeight: 600 }}>
                <TrendingDown className="w-3 h-3" />
                ĐÁNG CHÚ Ý
              </span>
            )}
          </div>

          {/* Discount badge */}
          <div className="absolute top-3 right-3">
            {deal.linkKind === "indicative" ? (
              <span className={`block rounded-full px-2.5 py-1.5 text-[10px] shadow-lg uppercase tracking-wide ${discountTone}`} style={{ fontWeight: 800 }}>
                {deal.discount > 0 ? `↓ ${deal.discount.toFixed(1)}%` : "Đang tính mặt bằng"}
              </span>
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/90 shadow-lg shadow-emerald-900/20">
                <span className="text-white text-xs leading-tight text-center" style={{ fontWeight: 800 }}>
                  -{deal.discount}%
                </span>
              </div>
            )}
          </div>

          {/* Destination overlay */}
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center gap-1.5 text-white">
              <span className="text-xs text-slate-300">{deal.fromCode}</span>
              <Plane className="w-3 h-3 text-sky-400" />
              <span style={{ fontWeight: 700 }}>{deal.to}</span>
              <span className="text-xs text-slate-300 ml-1">{deal.toCode}</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">{deal.country}</div>
          </div>

          {/* Region badge */}
          <div className="absolute bottom-3 right-3">
            <span className="text-base">{regionFlag[deal.region]}</span>
          </div>
        </div>

        {/* Content */}
          <div className="p-4 sm:p-5">
          {/* Airline + flight info */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-slate-800 rounded-md flex items-center justify-center text-xs" style={{ fontWeight: 700, color: "#94a3b8" }}>
                {deal.airlineCode}
              </div>
              <span className="text-slate-400 text-sm">
                {deal.airline}{deal.flightNumber ? ` · ${deal.flightNumber}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {deal.duration}
              </span>
              <span>
                {deal.stops === 0 ? "Bay thẳng" : `${deal.stops} điểm dừng`}
              </span>
            </div>
          </div>

          {/* Price section */}
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              {deal.normalPrice > deal.price && (
                <div className="text-slate-500 text-xs line-through">Thường gặp {formatVND(deal.normalPrice)}</div>
              )}
              <div className="text-2xl font-extrabold tracking-tight text-emerald-300">
                {formatVND(deal.price)}
              </div>
              {hasHiddenCosts && (
                <div className="flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-400 text-xs">
                    Thực tế: {formatVND(deal.realTotal)}
                  </span>
                </div>
              )}
            </div>
            {deal.linkKind === "indicative" ? (
              <div className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-2.5 py-1.5 text-right text-xs font-bold text-sky-300">
                {deal.aiReasoning || "Giá quan sát"}
              </div>
            ) : (
              <div className={`rounded-lg px-2.5 py-1.5 text-right text-xs ${getRecommendationColor(deal.aiInsight.recommendation)}`} style={{ fontWeight: 700 }}>
                {getRecommendationLabel(deal.aiInsight.recommendation)}
              </div>
            )}
          </div>

          <div className={`mb-3 rounded-xl border px-3 py-2 text-xs leading-relaxed ${deal.linkKind === "live_affiliate" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300" : "border-amber-500/20 bg-amber-500/5 text-amber-300"}`}>
            {deal.linkKind === "live_affiliate"
              ? "Link đối tác đã được cấp — kiểm tra giá lần cuối trước khi đặt."
              : deal.linkKind === "indicative"
                ? "Giá lịch tham khảo từ provider; chưa phải cam kết còn chỗ."
                : "Giá ghi nhận từ nguồn; có thể thay đổi khi mở trang đặt vé."}
          </div>

          {/* Departure date */}
          <div className="flex items-center gap-1.5 mb-3 px-3 py-1.5 bg-slate-800/50 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="text-slate-400 text-xs">Khởi hành </span>
            <span className="text-sky-300 text-xs" style={{ fontWeight: 700 }}>{formatDepartDate(deal.departDate)}</span>
            {deal.returnDate && (
              <span className="text-slate-500 text-xs">
                · về {formatDepartDate(deal.returnDate)}
              </span>
            )}
          </div>

          {/* AI reasoning snippet */}
          <div className="mb-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sky-500/80">
                <span className="text-[7px] font-extrabold text-white">D</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                {deal.aiReasoning || deal.aiInsight.reason}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {deal.aiInsight.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 text-[10px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-amber-400 text-xs">
              <Clock className="w-3 h-3" />
              <span style={{ fontWeight: 600 }}>{deal.expiresIn}</span>
            </div>
            {deal.seatsLeft > 0 ? (
              <div className="flex items-center gap-1 text-slate-500 text-xs">
                <Users className="w-3 h-3" />
                <span>Còn {deal.seatsLeft} ghế</span>
              </div>
            ) : (
              <div className="text-slate-500 text-[10px]">
                {deal.stops === 0 ? "Bay thẳng" : `${deal.stops} điểm dừng`}
              </div>
            )}
          </div>
          {formatObservedAt(deal.observedAt) && (
            <p className="text-slate-600 text-[10px] mt-2">
              Giá ghi nhận: {formatObservedAt(deal.observedAt)}
            </p>
          )}
        </div>

        {/* True Cost & Intelligence Bar */}
        <div className="border-t border-white/5 bg-white/[0.02] px-4 py-3 sm:px-5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            {hasHiddenCosts ? (
              <div className="flex items-center gap-1.5 text-xs text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Thực tế ước tính: <strong>{formatVND(deal.realTotal)}</strong></span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 truncate">
                Đã bao gồm thuế & phí cơ bản
              </div>
            )}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-sky-400 group-hover:text-sky-300">
            {deal.linkKind === "indicative" ? "Chi tiết cơ hội" : "Xem chi tiết"}
            <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
      </Link>
      <button
        type="button"
        aria-label={bookmarked ? "Bỏ lưu deal" : "Lưu deal"}
        aria-pressed={bookmarked}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const next = toggleBookmarkedDeal(deal.id);
          setBookmarked(next);
          void saveRemoteBookmark(deal.id, next);
          void trackProductEvent({ eventType: "bookmark", entityId: deal.id, metadata: { bookmarked: next, route: `${deal.fromCode}-${deal.toCode}`, source: "deal_card" } });
        }}
        className="absolute right-16 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-pink-500"
      >
        <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-sky-400 text-sky-400" : "text-slate-300"}`} />
      </button>
    </div>
  );
}
