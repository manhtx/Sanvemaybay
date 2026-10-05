import { Link } from "react-router";
import { Clock, AlertTriangle, Calendar, Bookmark, ShieldCheck } from "lucide-react";
import { Deal, formatVND, regionFlag } from "../data/deals";
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

export function DealCard({ deal }: DealCardProps) {
  const [bookmarked, setBookmarked] = useState(() => isBookmarkedDeal(deal.id));
  const cardTarget = `/deals/${deal.id}`;
  const priceDiff = deal.realTotal - deal.advertisedTotal;
  const hasHiddenCosts = priceDiff > 0;

  const discountTone = deal.discount >= 30
    ? "bg-red-500/95 text-white"
    : deal.discount >= 15
      ? "bg-amber-400 text-slate-950"
      : "bg-emerald-500/95 text-white";

  return (
    <div className="relative group">
      <Link
        aria-label={`Chi tiết cơ hội ${deal.fromCode} đến ${deal.toCode}, ${formatVND(deal.price)}, ${deal.aiReasoning || deal.aiInsight.reason}`}
        to={cardTarget}
        className="block"
      >
        <div className="relative flex flex-col justify-between rounded-xl border border-white/[0.08] bg-[#121620] p-5 transition-all duration-200 hover:border-white/20 hover:bg-[#161b27] hover:shadow-lg">
          
          {/* Top Line: Route & Flags */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-white tracking-tight">{deal.fromCode} → {deal.toCode}</span>
                  <span className="text-xs text-slate-400 font-medium">({deal.to})</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <span>{deal.airline}</span>
                  {deal.airlineCode && (
                    <span className="px-1.5 py-0.2 rounded bg-white/[0.06] text-[10px] text-slate-300 font-mono">
                      {deal.airlineCode}
                    </span>
                  )}
                  <span>· {deal.country}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm" title={deal.region}>{regionFlag[deal.region]}</span>
                {deal.discount > 0 && (
                  <span className={`px-2 py-0.5 rounded-md font-bold text-xs tabular-nums ${discountTone}`}>
                    ↓ {deal.discount.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* Price Line */}
            <div className="my-3 py-3 border-y border-white/[0.06]">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <div className="text-2xl font-black text-white tracking-tight tabular-nums">
                    {formatVND(deal.price)}
                  </div>
                  {deal.normalPrice > deal.price && (
                    <div className="text-xs text-slate-400 line-through tabular-nums mt-0.5">
                      Mặt bằng: {formatVND(deal.normalPrice)}
                    </div>
                  )}
                </div>
                {deal.confidence !== undefined && (
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-white/[0.03] border border-white/[0.06] px-2 py-1 rounded-md">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    <span>{deal.confidence >= 0.8 ? "Bằng chứng cao" : deal.confidence >= 0.5 ? "Bằng chứng vừa" : "Đang tích luỹ"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Travel Context: Date, Stops, Duration */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">Bay: {formatDepartDate(deal.departDate)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {deal.duration} · {deal.stops === 0 ? "Bay thẳng" : `${deal.stops} điểm dừng`}
                </span>
              </div>
            </div>

            {/* Reasoning summary snippet */}
            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3 bg-white/[0.02] border border-white/[0.04] p-2.5 rounded-lg">
              {deal.aiReasoning || deal.aiInsight.reason}
            </p>
          </div>

          {/* Bottom Action & Cost Disclosure */}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              {hasHiddenCosts ? (
                <span className="text-amber-400 flex items-center gap-1 truncate text-[11px]">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  Ước tính: {formatVND(deal.realTotal)}
                </span>
              ) : (
                <span className="text-slate-400 truncate text-[11px]">
                  Đã gồm thuế sân bay
                </span>
              )}
            </div>
            <span className="font-semibold text-blue-400 group-hover:text-blue-300 transition-colors shrink-0 flex items-center gap-1">
              Xem chi tiết <span aria-hidden="true">→</span>
            </span>
          </div>

        </div>
      </Link>

      {/* Bookmark Button */}
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
          void trackProductEvent({
            eventType: "bookmark",
            entityId: deal.id,
            metadata: { bookmarked: next, route: `${deal.fromCode}-${deal.toCode}`, source: "deal_card" },
          });
        }}
        className="absolute right-3.5 top-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-[#121620]/90 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? "fill-blue-400 text-blue-400" : "text-slate-400"}`} />
      </button>
    </div>
  );
}
