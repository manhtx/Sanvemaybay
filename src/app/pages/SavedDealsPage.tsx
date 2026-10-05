import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Bookmark, Clock, Bell, Trash2, ArrowRight } from "lucide-react";
import { Deal } from "../data/deals";
import { getDeals, getObservedFares, getDealById } from "../data/api";
import { getBookmarkedDealIds, loadRemoteBookmarkedDealIds, saveRemoteBookmark, toggleBookmarkedDeal } from "../lib/bookmarks";
import { DealCard } from "../components/DealCard";
import { WatchModal } from "../components/WatchModal";

export function SavedDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWatchDeal, setSelectedWatchDeal] = useState<Deal | null>(null);

  async function loadSavedDeals() {
    setLoading(true);
    const remoteIds = await loadRemoteBookmarkedDealIds();
    const savedIds = Array.from(new Set(remoteIds ?? getBookmarkedDealIds()));
    if (savedIds.length === 0) {
      setDeals([]);
      setLoading(false);
      return;
    }
    const [allFeedDeals, observedPage] = await Promise.all([
      getDeals().catch(() => [] as Deal[]),
      getObservedFares(1, 120).catch(() => ({ fares: [] as Deal[] })),
    ]);
    const knownDeals = new Map<string, Deal>();
    for (const d of allFeedDeals) {
      knownDeals.set(d.id, d);
      if (d.opportunityId) knownDeals.set(d.opportunityId, d);
      if (d.observationId) knownDeals.set(d.observationId, d);
    }
    for (const d of observedPage.fares) {
      knownDeals.set(d.id, d);
      if (d.id.startsWith("observed-")) {
        knownDeals.set(d.id.slice("observed-".length), d);
      }
      if (d.opportunityId) {
        knownDeals.set(d.opportunityId, d);
        knownDeals.set(`observed-${d.opportunityId}`, d);
      }
      if (d.observationId) {
        knownDeals.set(d.observationId, d);
        knownDeals.set(`observed-${d.observationId}`, d);
      }
    }

    const resolved: Deal[] = [];
    for (const id of savedIds) {
      const found = knownDeals.get(id) || knownDeals.get(`observed-${id}`);
      if (found) {
        resolved.push(found);
      } else {
        const fetched = await getDealById(id);
        if (fetched) resolved.push(fetched);
      }
    }
    setDeals(resolved);
    setLoading(false);
  }

  useEffect(() => {
    void loadSavedDeals();
  }, []);

  const handleRemove = (id: string) => {
    toggleBookmarkedDeal(id);
    void saveRemoteBookmark(id, false);
    setDeals((prev) => prev.filter((d) => d.id !== id && d.opportunityId !== id));
  };

  const isDealStale = (deal: Deal) => {
    const depTime = new Date(deal.departDate).getTime();
    if (depTime < Date.now()) return true;
    if (deal.observedAt && Date.now() - new Date(deal.observedAt).getTime() > 48 * 60 * 60 * 1000) {
      return true;
    }
    return false;
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Bookmark className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Cơ hội đã lưu</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Lưu trữ các mức giá bạn quan tâm. Tự động đồng bộ trên mọi thiết bị khi đăng nhập.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-slate-400 text-sm py-12 text-center">Đang tải danh sách đã lưu…</div>
        ) : deals.length ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.map((deal) => {
                const stale = isDealStale(deal);
                return (
                  <div key={deal.id} className="relative flex flex-col justify-between">
                    <DealCard deal={deal} />
                    {stale && (
                      <div className="mt-2 p-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] text-xs space-y-2">
                        <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Mức giá đã lưu không còn là quan sát mới.</span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <Link
                            to={`/search?from=${deal.fromCode}&destination=${deal.toCode}`}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300"
                          >
                            Xem giá mới nhất <ArrowRight className="w-3 h-3" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setSelectedWatchDeal(deal)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 ml-auto"
                          >
                            <Bell className="w-3 h-3" /> Theo dõi chặng này
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemove(deal.id)}
                            className="text-[11px] text-slate-500 hover:text-rose-400 pl-2 border-l border-white/10"
                            title="Bỏ lưu"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-slate-400 mb-4">Chưa có cơ hội nào được lưu vào danh sách.</p>
            <Link
              to="/deals"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition"
            >
              Khám phá cơ hội hôm nay
            </Link>
          </div>
        )}
      </div>

      {selectedWatchDeal && (
        <WatchModal
          isOpen={Boolean(selectedWatchDeal)}
          onClose={() => setSelectedWatchDeal(null)}
          opportunity={{
            id: selectedWatchDeal.id,
            originCode: selectedWatchDeal.fromCode,
            originName: selectedWatchDeal.from,
            destinationCode: selectedWatchDeal.toCode,
            destinationName: selectedWatchDeal.to,
            price: selectedWatchDeal.price,
            departDate: selectedWatchDeal.departDate,
            returnDate: selectedWatchDeal.returnDate,
            stops: selectedWatchDeal.stops,
          }}
        />
      )}
    </main>
  );
}
