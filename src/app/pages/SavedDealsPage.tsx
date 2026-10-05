import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Bookmark, Bell, Trash2, ArrowRight, ExternalLink, Calendar, Plane } from "lucide-react";
import { Deal, formatVND } from "../data/deals";
import { getObservedFares } from "../data/api";
import {
  loadRemoteSavedOpportunities,
  getBookmarkedDealIds,
  getLocalSavedRecord,
  saveRemoteBookmark,
  toggleBookmarkedDeal,
  SavedOpportunityRecord,
} from "../lib/bookmarks";
import { WatchModal } from "../components/WatchModal";

interface DisplaySavedItem {
  opportunityId: string;
  fromCode: string;
  toCode: string;
  fromCity: string;
  toCity: string;
  departDate: string;
  returnDate?: string | null;
  savedPrice: number;
  airline?: string;
  stops?: number;
  savedAt: string;
  currentPrice: number | null;
  priceDiff: number | null;
  priceDiffPercent: number | null;
  freshnessText: string;
  activeDealId?: string;
}

export function SavedDealsPage() {
  const [items, setItems] = useState<DisplaySavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWatchItem, setSelectedWatchItem] = useState<DisplaySavedItem | null>(null);

  async function loadSavedData() {
    setLoading(true);
    try {
      // 1. Load remote saved opportunities and local bookmarks
      const [remoteRes, localIds, observedRes] = await Promise.all([
        loadRemoteSavedOpportunities().catch(() => ({ entries: [] as SavedOpportunityRecord[] })),
        Promise.resolve(getBookmarkedDealIds()),
        getObservedFares({ page: 1, pageSize: 120 }).catch(() => ({ fares: [] as Deal[] })),
      ]);

      const recordsMap = new Map<string, SavedOpportunityRecord>();
      for (const entry of remoteRes.entries) {
        recordsMap.set(entry.opportunityId, entry);
      }
      for (const id of localIds) {
        if (!recordsMap.has(id)) {
          const localRecord = getLocalSavedRecord(id);
          if (localRecord) {
            recordsMap.set(id, localRecord);
          } else {
            // Minimal entry if only ID is known
            recordsMap.set(id, { opportunityId: id, savedAt: new Date().toISOString() });
          }
        }
      }

      // 2. Index active observed fares by opportunityId and route
      const activeByOppId = new Map<string, Deal>();
      const activeByRouteDate = new Map<string, Deal>();
      for (const fare of observedRes.fares) {
        if (fare.opportunityId) activeByOppId.set(fare.opportunityId, fare);
        activeByOppId.set(fare.id, fare);
        if (fare.id.startsWith("observed-")) {
          activeByOppId.set(fare.id.slice("observed-".length), fare);
        }
        const routeKey = `${fare.fromCode}:${fare.toCode}:${fare.departDate}`;
        if (!activeByRouteDate.has(routeKey)) {
          activeByRouteDate.set(routeKey, fare);
        }
      }

      // 3. Construct display items
      const displayItems: DisplaySavedItem[] = [];
      for (const [oppId, record] of recordsMap.entries()) {
        const snap = record.snapshotData;
        const matchedActive =
          activeByOppId.get(oppId) ||
          (snap ? activeByRouteDate.get(`${snap.fromCode}:${snap.toCode}:${snap.departDate}`) : undefined);

        const fromCode = snap?.fromCode || matchedActive?.fromCode || oppId.split(":")[0] || "---";
        const toCode = snap?.toCode || matchedActive?.toCode || oppId.split(":")[1] || "---";
        const fromCity = snap?.fromCity || matchedActive?.from || fromCode;
        const toCity = snap?.toCity || matchedActive?.to || toCode;
        const departDate = snap?.departDate || matchedActive?.departDate || oppId.split(":")[2] || "";
        const returnDate = snap?.returnDate || matchedActive?.returnDate || null;
        const savedPrice = Number(snap?.savedPrice) || Number(matchedActive?.price) || 0;
        const airline = snap?.airline || matchedActive?.airline || "";
        const stops = snap?.stops ?? matchedActive?.stops ?? 0;
        const savedAt = record.savedAt;

        let currentPrice: number | null = null;
        let priceDiff: number | null = null;
        let priceDiffPercent: number | null = null;
        let freshnessText = "Lưu trữ lịch sử";

        if (matchedActive && matchedActive.price > 0) {
          currentPrice = matchedActive.price;
          if (savedPrice > 0) {
            priceDiff = currentPrice - savedPrice;
            priceDiffPercent = Math.round((priceDiff / savedPrice) * 100);
          }
          freshnessText = matchedActive.expiresIn || "Quan sát gần đây";
        }

        displayItems.push({
          opportunityId: oppId,
          fromCode,
          toCode,
          fromCity,
          toCity,
          departDate,
          returnDate,
          savedPrice,
          airline,
          stops,
          savedAt,
          currentPrice,
          priceDiff,
          priceDiffPercent,
          freshnessText,
          activeDealId: matchedActive?.id,
        });
      }

      // Sort newest saved first
      displayItems.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      setItems(displayItems);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSavedData();
  }, []);

  const handleRemove = (opportunityId: string) => {
    toggleBookmarkedDeal(opportunityId);
    void saveRemoteBookmark(opportunityId, false);
    setItems((prev) => prev.filter((item) => item.opportunityId !== opportunityId));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Cơ hội đã lưu</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Ghi nhớ mức giá theo thời gian. So sánh biến động giữa thời điểm lưu và quan sát mới nhất.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {items.length} cơ hội
          </span>
        </div>

        {loading ? (
          <div className="text-slate-400 text-sm py-16 text-center font-mono">Đang nạp dữ liệu lưu trữ…</div>
        ) : items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => {
              const formattedDate = item.departDate
                ? new Date(item.departDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
                : "---";
              const formattedSavedAt = new Date(item.savedAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
              });

              return (
                <div
                  key={item.opportunityId}
                  className="rounded-xl border border-white/10 bg-slate-900/50 p-5 hover:border-white/20 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    {/* Route & Flight Metadata */}
                    <div className="space-y-1.5 min-w-[240px]">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white font-mono">
                          {item.fromCode} <span className="text-sky-400">→</span> {item.toCode}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({item.fromCity} - {item.toCity})
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {formattedDate}
                        </span>
                        {item.airline && (
                          <span className="inline-flex items-center gap-1">
                            <Plane className="w-3.5 h-3.5 text-slate-500" />
                            {item.airline} · {item.stops === 0 ? "Bay thẳng" : `${item.stops} điểm dừng`}
                          </span>
                        )}
                        <span className="text-slate-500 font-mono text-[11px]">
                          Lưu ngày {formattedSavedAt}
                        </span>
                      </div>
                    </div>

                    {/* Longitudinal Price Comparison: SAVED vs CURRENT */}
                    <div className="grid grid-cols-2 gap-6 bg-slate-950/60 rounded-lg p-3 border border-white/5 md:min-w-[300px]">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          Giá lúc lưu
                        </div>
                        <div className="text-base font-bold text-slate-300 font-mono mt-0.5">
                          {item.savedPrice > 0 ? formatVND(item.savedPrice) : "---"}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          Giá hiện tại
                        </div>
                        {item.currentPrice !== null ? (
                          <div>
                            <div className="text-base font-bold text-white font-mono mt-0.5">
                              {formatVND(item.currentPrice)}
                            </div>
                            {item.priceDiff !== null && item.priceDiff !== 0 && (
                              <div
                                className={`text-[11px] font-mono font-semibold ${
                                  item.priceDiff < 0 ? "text-emerald-400" : "text-amber-400"
                                }`}
                              >
                                {item.priceDiff < 0 ? "↓ " : "↑ "}
                                {formatVND(Math.abs(item.priceDiff))} ({item.priceDiffPercent}%)
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-500 italic mt-1">
                            Chưa có giá mới
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Xem mới nhất, Theo dõi, Bỏ lưu */}
                    <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                      {item.activeDealId ? (
                        <Link
                          to={`/deals/${item.activeDealId}`}
                          className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1"
                        >
                          <span>Xem chi tiết</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <Link
                          to={`/search?from=${item.fromCode}&destination=${item.toCode}&departureFrom=${item.departDate}`}
                          className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1"
                        >
                          <span>Tìm chuyến mới</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedWatchItem(item)}
                        className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Theo dõi chặng này"
                      >
                        <Bell className="w-3.5 h-3.5 text-sky-400" />
                        <span>Theo dõi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.opportunityId)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Bỏ lưu cơ hội"
                        aria-label="Bỏ lưu cơ hội"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-slate-900/20 p-12 text-center">
            <Bookmark className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-4">Chưa có cơ hội nào được lưu vào danh sách theo dõi.</p>
            <Link
              to="/deals"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
            >
              Khám phá cơ hội hôm nay
            </Link>
          </div>
        )}
      </div>

      {selectedWatchItem && (
        <WatchModal
          isOpen={Boolean(selectedWatchItem)}
          onClose={() => setSelectedWatchItem(null)}
          initialOrigin={selectedWatchItem.fromCode}
          initialDestination={selectedWatchItem.toCode}
          currentPrice={selectedWatchItem.currentPrice ?? selectedWatchItem.savedPrice}
          sourceContext="saved_deals"
        />
      )}
    </main>
  );
}
