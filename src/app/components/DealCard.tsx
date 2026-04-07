import { Link } from "react-router";
import { Plane, Clock, AlertTriangle, Zap, TrendingDown, Users, Calendar } from "lucide-react";
import { Deal, formatVND, getRecommendationColor, getRecommendationLabel, regionFlag } from "../data/mockDeals";

interface DealCardProps {
  deal: Deal;
  compact?: boolean;
}

function formatDepartDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", { month: "short", year: "numeric" });
}

export function DealCard({ deal, compact = false }: DealCardProps) {
  const priceDiff = deal.realTotal - deal.advertisedTotal;
  const hasHiddenCosts = priceDiff > 0;

  return (
    <Link to={`/deals/${deal.id}`} className="group block">
      <div className="relative bg-slate-900 border border-white/8 rounded-2xl overflow-hidden hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10 transition-all duration-300">
        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={deal.image}
            alt={deal.to}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
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
              <span className="text-slate-400 text-sm">{deal.airline}</span>
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
            <span className="text-slate-400 text-xs">Bay tháng </span>
            <span className="text-sky-300 text-xs" style={{ fontWeight: 700 }}>{formatDepartDate(deal.departDate)}</span>
          </div>

          {/* AI reason snippet */}
          <div className="bg-sky-500/5 border border-sky-500/10 rounded-lg p-3 mb-3">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center mt-0.5 shrink-0">
                <span className="text-white" style={{ fontSize: "9px", fontWeight: 800 }}>AI</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                {deal.aiInsight.reason}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-amber-400 text-xs">
              <Clock className="w-3 h-3" />
              <span style={{ fontWeight: 600 }}>Deal hết hạn: {deal.expiresIn}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <Users className="w-3 h-3" />
              <span>Còn {deal.seatsLeft} ghế</span>
            </div>
          </div>
        </div>

        {/* Saving score bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 text-xs whitespace-nowrap">AI Score</span>
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full"
                style={{ width: `${deal.aiInsight.savingScore}%` }}
              />
            </div>
            <span className="text-emerald-400 text-xs" style={{ fontWeight: 700 }}>
              {deal.aiInsight.savingScore}/100
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}