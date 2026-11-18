import { Link } from "react-router";
import { Heart, Star, ShieldCheck, Plane } from "lucide-react";
import { Deal, formatVND } from "../data/deals";
import { isBookmarkedDeal, mutateBookmarkOptimistic, createOpportunitySnapshot } from "../lib/bookmarks";
import { useState } from "react";
import { trackProductEvent } from "../lib/analytics";

interface DealCardProps {
  deal: Deal;
}

function formatDepartDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function DealCard({ deal }: DealCardProps) {
  const targetId = deal.opportunityId || deal.id;
  const [bookmarked, setBookmarked] = useState(() => isBookmarkedDeal(targetId) || isBookmarkedDeal(deal.id));
  const cardTarget = `/deals/${deal.id}`;

  const toggleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !bookmarked;
    setBookmarked(next);
    mutateBookmarkOptimistic(targetId, next, createOpportunitySnapshot(deal));
    void trackProductEvent({
      eventType: "bookmark",
      entityId: deal.id,
      metadata: { bookmarked: next ? "true" : "false" },
    });
  };

  const dealScore = deal.dealScore ?? deal.aiInsight?.savingScore ?? 75;
  const isGuestFavorite = dealScore >= 80;
  const dealRating = ((dealScore / 100) * 1.5 + 3.5).toFixed(2);

  return (
    <div className="group relative flex flex-col cursor-pointer">
      <Link
        aria-label={`Chi tiết chuyến bay ${deal.fromCode} đến ${deal.toCode}, ${formatVND(deal.price)}, ${deal.aiReasoning || deal.aiInsight.reason}`}
        to={cardTarget}
        className="block"
      >
        {/* Photo Container: Airbnb property card photo with 14px rounded corners */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[14px] bg-[#f2f2f2] mb-3">
          <img
            src={deal.image || `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80`}
            alt={`${deal.to} - Chuyến bay từ ${deal.fromCode}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80";
            }}
          />

          {/* Floating Bookmark Heart Icon (Top Right) */}
          <button
            type="button"
            aria-label={bookmarked ? "Bỏ lưu deal này" : "Lưu deal này"}
            onClick={toggleBookmark}
            className="absolute top-3 right-3 p-2 rounded-full transition-transform active:scale-90 hover:scale-110 z-10"
          >
            <Heart
              className={`w-6 h-6 transition-colors drop-shadow-md ${
                bookmarked
                  ? "fill-[#0084e6] text-[#0084e6]"
                  : "fill-black/30 text-white hover:fill-black/40"
              }`}
            />
          </button>

          {/* Floating Guest Favorite / Top Deal Badge (Top Left) */}
          {isGuestFavorite && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[#222222] text-[11px] font-semibold tracking-tight shadow-sm border border-black/5">
              Khách yêu thích
            </div>
          )}

          {/* Discount Pill at bottom left of image */}
          {deal.discount > 0 && (
            <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded-full bg-[#0084e6] text-white text-[11px] font-bold shadow-xs">
              Tiết kiệm {deal.discount.toFixed(0)}%
            </div>
          )}
        </div>

        {/* Text Metadata Section — Airbnb Typography Hierarchy */}
        <div className="flex flex-col gap-1">
          {/* Line 1: Title (Route) & Rating */}
          <div className="flex items-center justify-between text-base font-semibold text-[#222222]">
            <span className="truncate">
              <span className="font-bold">{deal.fromCode} → {deal.toCode}</span>
              <span className="text-[#6a6a6a] font-normal text-sm ml-1.5">({deal.to})</span>
            </span>
            <div className="flex items-center gap-1 shrink-0 text-sm font-normal text-[#222222]">
              <Star className="w-3.5 h-3.5 fill-[#222222] text-[#222222]" />
              <span className="font-semibold">{dealRating}</span>
            </div>
          </div>

          {/* Line 2: Airline & Flight Type */}
          <div className="text-sm text-[#6a6a6a] flex items-center gap-1.5 truncate">
            <Plane className="w-3.5 h-3.5 text-[#0084e6] shrink-0" />
            <span className="truncate">{deal.airline}</span>
            <span>·</span>
            <span>{deal.stops === 0 ? "Bay thẳng" : `${deal.stops} điểm dừng`}</span>
            <span>·</span>
            <span>{deal.duration}</span>
          </div>

          {/* Line 3: Date Window */}
          <div className="text-sm text-[#6a6a6a]">
            Khởi hành ngày {formatDepartDate(deal.departDate)}
          </div>

          {/* Line 4: Price & Trust Signal */}
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-[#222222] tabular-nums">
                {formatVND(deal.price)}
              </span>
              <span className="text-xs text-[#6a6a6a] font-normal">/ khách</span>
              {deal.normalPrice > deal.price && (
                <span className="text-xs text-[#929292] line-through tabular-nums ml-1">
                  {formatVND(deal.normalPrice)}
                </span>
              )}
            </div>

            {deal.confidence !== undefined && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#0084e6] font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Giá thật</span>
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
