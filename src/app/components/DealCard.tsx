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

  return (
    <div className="relative group">
      <Link to={`/deals/${deal.id}`} className="block">
      <div className="relative bg-slate-900 border border-white/8 rounded-2xl overflow-hidden hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300">
        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          {deal.image ? (
            <img
              src={deal.image}
              alt={deal.to}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-sky-950 via-slate-900 to-indigo-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {deal.isFlashDeal && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-orange-500 text-white text-xs rounded-full" style={{ fontWeight: 700 }}>
                <Zap className="w-3 h-3" />
                FLASH
              </span>
            )}
            {deal.isTrending && (
              <span className="flex items-center gap-1 px-2.5 py-1 bg-violet-500/90 text-white text-xs rounded-full" style={{ fontWeight: 600 }}>
                <TrendingDown className="w-3 h-3" />
                TRENDING
              </span>
            )}
          </div>

          {/* Discount badge */}
          <div className="absolute top-3 right-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white text-xs leading-tight text-center" style={{ fontWeight: 800 }}>
                -{deal.discount}%
              </span>
            </div>
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
        <div className="p-4">
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
          <div className="flex items-end justify-between mb-3">
            <div>
              <div className="text-slate-500 text-xs line-through">{formatVND(deal.normalPrice)}</div>
              <div className="text-2xl text-emerald-400" style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
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
            <div className={`px-3 py-1.5 rounded-lg text-xs ${getRecommendationColor(deal.aiInsight.recommendation)}`} style={{ fontWeight: 700 }}>
              {getRecommendationLabel(deal.aiInsight.recommendation)}
            </div>
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
          <div className="bg-sky-500/5 border border-sky-500/10 rounded-lg p-3 mb-3">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                <span className="text-white" style={{ fontSize: "8px", fontWeight: 800 }}>DATA</span>
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
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <Users className="w-3 h-3" />
              <span>{deal.seatsLeft > 0 ? `Còn ${deal.seatsLeft} ghế` : "Chưa có dữ liệu ghế"}</span>
            </div>
          </div>
          {formatObservedAt(deal.observedAt) && (
            <p className="text-slate-600 text-[10px] mt-2">
              Giá ghi nhận: {formatObservedAt(deal.observedAt)}
            </p>
          )}
        </div>

        {/* Intelligence Stats Bar */}
        <div className="px-4 pb-4 space-y-2">
          {/* Saving Score */}
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-[10px] uppercase tracking-wider font-bold whitespace-nowrap">Saving Score</span>
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                style={{ width: `${deal.dealScore ?? deal.aiInsight.savingScore}%` }}
              />
            </div>
            <span className="text-emerald-400 text-xs font-bold">
              {deal.dealScore ?? deal.aiInsight.savingScore}/100
            </span>
          </div>
          
          {deal.confidence != null && (
            <div className="flex items-center gap-2">
              <span className="text-slate-600 text-[10px] uppercase tracking-wider font-bold whitespace-nowrap">Confidence</span>
              <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-400 rounded-full opacity-60"
                  style={{ width: `${deal.confidence * 100}%` }}
                />
              </div>
              <span className="text-sky-300 text-[10px] font-bold">
                {Math.round(deal.confidence * 100)}%
              </span>
            </div>
          )}
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
        className="absolute top-3 right-16 z-10 p-2 rounded-full bg-slate-950/70 text-white hover:bg-sky-500 transition-colors"
      >
        <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-sky-400 text-sky-400" : "text-slate-300"}`} />
      </button>
    </div>
  );
}
