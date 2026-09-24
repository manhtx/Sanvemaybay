import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Bookmark } from "lucide-react";
import { Deal } from "../data/deals";
import { getDeals } from "../data/api";
import { getBookmarkedDealIds, loadRemoteBookmarkedDealIds } from "../lib/bookmarks";
import { DealCard } from "../components/DealCard";

export function SavedDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDeals(), loadRemoteBookmarkedDealIds()]).then(([allDeals, remoteIds]) => {
      const saved = new Set(remoteIds ?? getBookmarkedDealIds());
      setDeals(allDeals.filter((deal) => saved.has(deal.id)));
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="h-7 w-7 text-pink-400" />
          <div>
            <h1 className="text-3xl font-black text-white">Deal đã lưu</h1>
            <p className="text-slate-500 text-sm">Các deal được lưu trên thiết bị này.</p>
          </div>
        </div>
        {loading ? (
          <div className="text-slate-500">Đang tải deal đã lưu…</div>
        ) : deals.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deals.map((deal) => <DealCard key={deal.id} deal={deal} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-slate-400 mb-4">Chưa có deal nào được lưu hoặc deal đã hết hạn.</p>
            <Link to="/deals" className="font-semibold text-pink-400 hover:text-pink-300">Khám phá deal</Link>
          </div>
        )}
      </div>
    </main>
  );
}
