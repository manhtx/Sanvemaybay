import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Bookmark, Bell, Trash2, ArrowRight, ExternalLink, Calendar, Plane, Sparkles } from "lucide-react";
import { Deal, formatStops, formatVND } from "../data/deals";
import { getObservedFares, batchResolveSavedOpportunities } from "../data/api";
import {
  syncSavedWithRemote,
  mutateBookmarkOptimistic,
  SavedOpportunityRecord,
} from "../lib/bookmarks";
import { WatchModal } from "../components/WatchModal";
import { SavedComparisonModal } from "../components/SavedComparisonModal";
import { compareSavedOpportunities } from "../domain/dealComparison";

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
  stops?: number | null;
  savedAt: string;
  currentPrice: number | null;
  priceDiff: number | null;
  priceDiffPercent: number | null;
  freshnessText: string;
  activeDealId?: string;
  rawDeal?: Deal;
  snapshotData?: Record<string, any> | null;
}

export function SavedDealsPage() {
  const [items, setItems] = useState<DisplaySavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWatchItem, setSelectedWatchItem] = useState<DisplaySavedItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  async function loadSavedData() {
    setLoading(true);
    try {
      const [syncRes, observedRes] = await Promise.all([
        syncSavedWithRemote().catch(() => ({ entries: [] as SavedOpportunityRecord[], authenticated: false })),
        getObservedFares({ page: 1, pageSize: 120 }).catch(() => ({ fares: [] as Deal[] })),
      ]);

      const recordsMap = new Map<string, SavedOpportunityRecord>();
      for (const entry of syncRes.entries) {
        recordsMap.set(entry.opportunityId, entry);
      }

      const activeByOppId = new Map<string, Deal>();
      for (const fare of observedRes.fares) {
        if (fare.opportunityId) activeByOppId.set(fare.opportunityId, fare);
        activeByOppId.set(fare.id, fare);
        if (fare.id.startsWith("observed-")) {
          activeByOppId.set(fare.id.slice("observed-".length), fare);
        }
      }

      // AUD-V34-05 & EV34-17: Exact-ID batch resolution independent of feed pagination
      const missingOppIds = [...recordsMap.keys()].filter((oppId) => !activeByOppId.has(oppId));
      if (missingOppIds.length > 0) {
        const resolvedBatch = await batchResolveSavedOpportunities(missingOppIds);
        for (const [key, deal] of resolvedBatch.entries()) {
          activeByOppId.set(key, deal);
        }
      }

      const displayItems: DisplaySavedItem[] = [];
      for (const [oppId, record] of recordsMap.entries()) {
        const snap = record.snapshotData;
        // AUD-03: Strictly match by exact opportunity ID. Do not fall back to generic route/date matching,
        // which falsely associates different airline flights and fabricates erroneous price changes.
        const matchedActive = activeByOppId.get(oppId);

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
          rawDeal: matchedActive,
          snapshotData: snap,
        });
      }

      displayItems.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      setItems(displayItems);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSavedData();
  }, []);

  const toggleSelect = (oppId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(oppId)) {
        next.delete(oppId);
      } else {
        if (next.size < 4) {
          next.add(oppId);
        }
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleRemove = async (opportunityId: string) => {
    const previousItems = items;
    setItems((prev) => prev.filter((item) => item.opportunityId !== opportunityId));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(opportunityId);
      return next;
    });
    const result = await mutateBookmarkOptimistic(opportunityId, false, undefined, undefined, {
      onRollback: () => {
        setItems(previousItems);
      },
    });
    if (!result.success) {
      setItems(previousItems);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--canvas-bg)] text-stone-900 pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">Cơ hội đã lưu</h1>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              Ghi nhớ mức giá theo thời gian. So sánh biến động giữa thời điểm lưu và quan sát mới nhất.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {items.length >= 2 && (
              <button
                type="button"
                onClick={() => {
                  if (selectedIds.size >= 2) {
                    setIsCompareOpen(true);
                  } else {
                    const firstN = items.slice(0, Math.min(items.length, 4)).map((i) => i.opportunityId);
                    setSelectedIds(new Set(firstN));
                    setIsCompareOpen(true);
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>{selectedIds.size >= 2 ? `Mở bảng so sánh (${selectedIds.size})` : "So sánh 2–4 cơ hội"}</span>
              </button>
            )}
            <span className="text-xs font-mono text-stone-500">
              {items.length} cơ hội
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-stone-500 text-sm py-16 text-center font-mono">Đang nạp dữ liệu lưu trữ…</div>
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

              const isSelected = selectedIds.has(item.opportunityId);

              return (
                <div
                  key={item.opportunityId}
                  className={`rounded-xl border p-5 transition-all shadow-sm ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500"
                      : "border-stone-200 bg-white hover:border-stone-300"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Checkbox & Route & Flight Metadata */}
                    <div className="flex items-start gap-3 min-w-[240px]">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          id={`select-${item.opportunityId}`}
                          checked={isSelected}
                          disabled={!isSelected && selectedIds.size >= 4}
                          onChange={() => toggleSelect(item.opportunityId)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-stone-300 cursor-pointer disabled:opacity-40"
                          aria-label={`Chọn so sánh ${item.fromCode} đi ${item.toCode}`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`select-${item.opportunityId}`}
                            className="text-lg font-bold text-stone-900 font-mono cursor-pointer hover:text-blue-600 transition-colors"
                          >
                            {item.fromCode} <span className="text-blue-600 font-light">→</span> {item.toCode}
                          </label>
                          <span className="text-xs text-stone-500">
                            ({item.fromCity} - {item.toCity})
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            {formattedDate}
                          </span>
                          {item.airline && (
                            <span className="inline-flex items-center gap-1">
                              <Plane className="w-3.5 h-3.5 text-stone-400" />
                              {item.airline} · {formatStops(item.stops)}
                            </span>
                          )}
                          <span className="text-stone-500 font-mono text-[11px]">
                            Lưu ngày {formattedSavedAt}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Price Comparison: SAVED vs CURRENT */}
                    <div className="grid grid-cols-2 gap-6 bg-stone-50 rounded-lg p-3 border border-stone-200 md:min-w-[300px]">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                          Giá lúc lưu
                        </div>
                        <div className="text-base font-bold text-stone-800 font-mono mt-0.5">
                          {item.savedPrice > 0 ? formatVND(item.savedPrice) : "---"}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                          Giá hiện tại
                        </div>
                        {item.currentPrice !== null ? (
                          <div>
                            <div className="text-base font-bold text-stone-900 font-mono mt-0.5">
                              {formatVND(item.currentPrice)}
                            </div>
                            {item.priceDiff !== null && item.priceDiff !== 0 && (
                              <div
                                className={`text-[11px] font-mono font-semibold ${
                                  item.priceDiff < 0 ? "text-emerald-700" : "text-amber-700"
                                }`}
                              >
                                {item.priceDiff < 0 ? "↓ " : "↑ "}
                                {formatVND(Math.abs(item.priceDiff))} ({item.priceDiffPercent}%)
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-stone-500 italic mt-1">
                            Chưa có giá mới
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100">
                      {item.activeDealId ? (
                        <Link
                          to={`/deals/${item.activeDealId}`}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center gap-1 shadow-sm"
                        >
                          <span>Xem chi tiết</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <Link
                          to={`/search?from=${item.fromCode}&destination=${item.toCode}&departureFrom=${item.departDate}`}
                          className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors flex items-center gap-1"
                        >
                          <span>Tìm chuyến mới</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedWatchItem(item)}
                        className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Theo dõi chặng này"
                      >
                        <Bell className="w-3.5 h-3.5 text-blue-600" />
                        <span>Theo dõi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemove(item.opportunityId)}
                        className="p-2 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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
          <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center shadow-sm">
            <Bookmark className="w-8 h-8 text-stone-400 mx-auto mb-3" />
            <p className="text-stone-600 text-sm mb-4">Chưa có cơ hội nào được lưu vào danh sách theo dõi.</p>
            <Link
              to="/deals"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm"
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

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900/95 backdrop-blur text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-stone-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="text-xs sm:text-sm">
            <span className="font-bold text-blue-400 font-mono">{selectedIds.size}/4</span>{" "}
            <span className="text-stone-200">cơ hội được chọn</span>
            {selectedIds.size < 2 && (
              <span className="text-stone-400 text-xs ml-2 hidden sm:inline">
                (Chọn tối thiểu 2 để mở bảng so sánh)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedIds.size < 2}
              onClick={() => setIsCompareOpen(true)}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-stone-800 disabled:text-stone-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              Mở bảng so sánh
            </button>

            <button
              type="button"
              onClick={clearSelection}
              className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-xs transition-colors cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {isCompareOpen && (
        <SavedComparisonModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          rows={compareSavedOpportunities(items.filter((it) => selectedIds.has(it.opportunityId)))}
          activeDealMap={new Map(items.filter((it) => it.activeDealId).map((it) => [it.opportunityId, it.activeDealId!]))}
        />
      )}
    </main>
  );
}
