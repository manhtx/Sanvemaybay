import { useState, useMemo } from "react";
import {
  TrendingDown,
  Globe,
  SlidersHorizontal,
  Zap,
  Clock,
  ArrowUpDown,
  X,
  Bell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { DealCard } from "../components/DealCard";
import { Deal } from "../data/deals";
import { Link } from "react-router";
import { getDeals } from "../data/api";
import { useEffect } from "react";
import { isSupabaseConfigured } from "../lib/supabase";

type RegionType = "all" | Deal["region"];
type SortType = "discount" | "price_asc" | "price_desc" | "score" | "date_near" | "date_far";

const sortOptions: { value: SortType; label: string }[] = [
  { value: "score", label: "Điểm dữ liệu cao nhất" },
  { value: "discount", label: "Giảm giá nhiều nhất" },
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "price_desc", label: "Giá cao đến thấp" },
  { value: "date_near", label: "Bay sớm nhất" },
  { value: "date_far", label: "Bay xa nhất" },
];

const allRegions: { value: RegionType; label: string; flag: string }[] = [
  { value: "all", label: "Tất Cả", flag: "🌐" },
  { value: "asia", label: "Châu Á", flag: "🌏" },
  { value: "europe", label: "Châu Âu", flag: "🇪🇺" },
  { value: "americas", label: "Châu Mỹ", flag: "🌎" },
  { value: "oceania", label: "Châu Đại Dương", flag: "🦘" },
  { value: "middle_east", label: "Trung Đông", flag: "🕌" },
  { value: "africa", label: "Châu Phi", flag: "🌍" },
  { value: "domestic", label: "Nội Địa VN", flag: "🇻🇳" },
];

export function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [region, setRegion] = useState<RegionType>("all");
  const [sort, setSort] = useState<SortType>("discount");

  useEffect(() => {
    getDeals().then(setDeals);
  }, []);
  const [flashOnly, setFlashOnly] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedWatchDest, setSelectedWatchDest] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const baseDestinations = useMemo(
    () => [...new Set(deals.map((deal) => deal.to))],
    [deals],
  );

  // Derive available months from actual deal dates — sorted chronologically
  const availableMonths = useMemo(() => {
    const monthSet = new Set(
      deals.map((d: Deal) => {
        const date = new Date(d.departDate);
        return `${date.getMonth() + 1}/${date.getFullYear()}`;
      })
    );
    return (Array.from(monthSet) as string[]).sort((a, b) => {
      const [ma, ya] = a.split("/").map(Number);
      const [mb, yb] = b.split("/").map(Number);
      return ya !== yb ? ya - yb : ma - mb;
    });
  }, [deals]);

  const filtered = deals
    .filter((d: Deal) => {
      if (region !== "all" && d.region !== region) return false;
      if (flashOnly && !d.isFlashDeal) return false;
      if (selectedMonth !== "all") {
        const date = new Date(d.departDate);
        const dealMonth = `${date.getMonth() + 1}/${date.getFullYear()}`;
        if (dealMonth !== selectedMonth) return false;
      }
      if (selectedWatchDest) {
        return d.to === selectedWatchDest;
      }
      return true;
    })
    .sort((a: Deal, b: Deal) => {
      switch (sort) {
        case "discount": return b.discount - a.discount;
        case "price_asc": return a.price - b.price;
        case "price_desc": return b.price - a.price;
        case "score": return b.aiInsight.savingScore - a.aiInsight.savingScore;
        case "date_near": return new Date(a.departDate).getTime() - new Date(b.departDate).getTime();
        case "date_far": return new Date(b.departDate).getTime() - new Date(a.departDate).getTime();
        default: return 0;
      }
    });

  // Count by region — memoised so it doesn't recompute on every render
  const regionCounts = useMemo(
    () =>
      allRegions.reduce((acc, r) => {
        acc[r.value] =
          r.value === "all"
            ? deals.length
            : deals.filter((d: Deal) => d.region === r.value).length;
        return acc;
      }, {} as Record<string, number>),
    [deals]
  );

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
            <span className="text-sky-400 text-xs" style={{ fontWeight: 700 }}>
              DỮ LIỆU QUAN SÁT
            </span>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1
                className="text-white mb-2"
                style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em" }}
              >
            Deal Vé Máy Bay Được Xác Minh
              </h1>
              <p className="text-slate-500">
                Hệ thống phát hiện{" "}
                <span className="text-sky-400" style={{ fontWeight: 700 }}>
                  {deals.length} deal
                </span>{" "}
                trên{" "}
                <span className="text-sky-400" style={{ fontWeight: 700 }}>
                  {new Set(deals.map((d: Deal) => d.country)).size} quốc gia
                </span>{" "}
                — chỉ hiển thị các mức giá đạt ngưỡng so với dữ liệu lịch sử
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 rounded-xl text-sm transition-colors sm:hidden"
              style={{ fontWeight: 600 }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-sm">
            Chưa kết nối Supabase nên ứng dụng không thể tải deal thật. Hãy cấu hình
            <code className="mx-1 text-amber-100">VITE_SUPABASE_URL</code>
            và
            <code className="mx-1 text-amber-100">VITE_SUPABASE_ANON_KEY</code>
            trong file <code className="text-amber-100">.env</code>.
          </div>
        )}

        {/* ── DESTINATION FILTER ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-500 text-sm shrink-0" style={{ fontWeight: 600 }}>
              Lọc điểm đến đang có dữ liệu:
            </span>

            {baseDestinations.map((dest: string) => (
              <button
                key={dest}
                onClick={() => setSelectedWatchDest(selectedWatchDest === dest ? null : dest)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
                  selectedWatchDest === dest
                    ? "bg-sky-500/20 border-sky-500/40 text-sky-300"
                    : "bg-slate-800/50 border-white/10 text-slate-400 hover:border-sky-500/30 hover:text-slate-200"
                }`}
                style={{ fontWeight: 600 }}
              >
                {dest}
              </button>
            ))}

          </div>
        </div>

        {/* ── FILTER & SORT BAR ── */}
        <div className={`bg-slate-900/60 border border-white/8 rounded-2xl p-4 mb-8 ${showFilters ? "" : "hidden sm:block"}`}>
          {/* Region tabs - scrollable on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {allRegions
              .filter((r) => regionCounts[r.value] > 0 || r.value === "all")
              .map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRegion(r.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all shrink-0 ${
                    region === r.value
                      ? "bg-sky-500 text-white shadow-lg shadow-sky-500/20"
                      : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  <span>{r.flag}</span>
                  <span>{r.label}</span>
                  {regionCounts[r.value] > 0 && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${
                        region === r.value
                          ? "bg-white/20 text-white"
                          : "bg-slate-700 text-slate-500"
                      }`}
                    >
                      {regionCounts[r.value]}
                    </span>
                  )}
                </button>
              ))}
          </div>

          {/* Second row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Flash toggle */}
            <button
              onClick={() => setFlashOnly(!flashOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all ${
                flashOnly
                  ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                  : "bg-transparent border-white/10 text-slate-400 hover:border-white/20"
              }`}
              style={{ fontWeight: 600 }}
            >
              <Zap className="w-3.5 h-3.5" />
              Flash Deal
            </button>

            {/* Month & Sort selectors — pushed to the right as one group */}
            <div className="ml-auto flex items-center gap-3 flex-wrap">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-800 border border-white/10 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500/40 cursor-pointer"
                style={{ fontWeight: 500 }}
              >
                <option value="all">📅 Tất cả tháng</option>
                {availableMonths.map((month: string) => (
                  <option key={month} value={month}>Tháng {month}</option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortType)}
                  className="bg-slate-800 border border-white/10 text-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500/40 cursor-pointer"
                  style={{ fontWeight: 500 }}
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { icon: TrendingDown, label: "Deals đang có", value: `${filtered.length}`, color: "text-sky-400" },
            { icon: Zap, label: "Flash deals", value: `${filtered.filter((d: Deal) => d.isFlashDeal).length}`, color: "text-orange-400" },
            { icon: Clock, label: "Hết hạn sớm nhất", value: filtered.length > 0 ? [...filtered].sort((a: Deal, b: Deal) => a.expiresIn.localeCompare(b.expiresIn))[0]?.expiresIn.split(" ").slice(0, 2).join(" ") : "—", color: "text-red-400" },
            { icon: Globe, label: "Quốc gia / Vùng", value: `${new Set(filtered.map((d: Deal) => d.country)).size}`, color: "text-violet-400" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-slate-900/60 border border-white/8 rounded-xl p-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color} shrink-0`} />
              <div>
                <div className="text-white" style={{ fontWeight: 700, fontSize: "1.1rem" }}>{value}</div>
                <div className="text-slate-500 text-xs">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── ACTIVE FILTER INDICATOR ── */}
        {(region !== "all" || flashOnly || selectedWatchDest || selectedMonth !== "all") && (
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            <span className="text-slate-500 text-sm">Đang lọc:</span>
            {region !== "all" && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/15 border border-sky-500/30 text-sky-300 rounded-full text-xs" style={{ fontWeight: 600 }}>
                {allRegions.find((r) => r.value === region)?.flag} {allRegions.find((r) => r.value === region)?.label}
                <button onClick={() => setRegion("all")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedMonth !== "all" && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-full text-xs" style={{ fontWeight: 600 }}>
                📅 Tháng {selectedMonth}
                <button onClick={() => setSelectedMonth("all")}><X className="w-3 h-3" /></button>
              </span>
            )}
            {flashOnly && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/15 border border-orange-500/30 text-orange-300 rounded-full text-xs" style={{ fontWeight: 600 }}>
                ⚡ Flash Deal
                <button onClick={() => setFlashOnly(false)}><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedWatchDest && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-violet-500/15 border border-violet-500/30 text-violet-300 rounded-full text-xs" style={{ fontWeight: 600 }}>
                📍 {selectedWatchDest}
                <button onClick={() => setSelectedWatchDest(null)}><X className="w-3 h-3" /></button>
              </span>
            )}
            <button
              onClick={() => { setRegion("all"); setFlashOnly(false); setSelectedWatchDest(null); setSelectedMonth("all"); }}
              className="text-slate-500 hover:text-white text-xs transition-colors"
            >
              Xoá tất cả
            </button>
          </div>
        )}

        {/* ── DEALS GRID ── */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((deal: Deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <SlidersHorizontal className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500" style={{ fontWeight: 600 }}>Không có deal nào phù hợp</p>
            <p className="text-slate-600 text-sm mt-1">
              {selectedWatchDest
                ? `Chưa có deal đến ${selectedWatchDest} — hãy đặt alert để được thông báo ngay khi có!`
                : "Thử thay đổi bộ lọc"}
            </p>
            {selectedWatchDest && (
              <Link
                to={`/alerts?destination=${encodeURIComponent(selectedWatchDest)}`}
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm transition-colors"
                style={{ fontWeight: 600 }}
              >
                <Bell className="w-4 h-4" />
                Đặt Alert cho {selectedWatchDest}
              </Link>
            )}
          </div>
        )}

        {/* ── DISCLAIMER + ALERT CTA ── */}
        <div className="mt-12 space-y-4">
          {/* No date restriction note */}
          <div className="flex items-start gap-3 p-4 bg-slate-900/60 border border-white/8 rounded-2xl">
            <div className="w-8 h-8 bg-sky-500/10 rounded-lg flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <p className="text-white text-sm" style={{ fontWeight: 600 }}>
                Không giới hạn thời điểm bay
              </p>
              <p className="text-slate-500 text-sm">
                Chỉ các chuyến bay tương lai còn trong thời hạn xác minh mới được hiển thị. Giá có thể thay đổi khi bạn chuyển sang trang đặt vé.
              </p>
            </div>
          </div>

          {/* Alert CTA */}
          <div className="bg-gradient-to-r from-sky-500/10 to-violet-500/10 border border-sky-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center shrink-0">
              <TrendingDown className="w-6 h-6 text-sky-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="text-white text-sm mb-1" style={{ fontWeight: 700 }}>
                Muốn nhận thông báo khi có deal mới đến điểm đến bạn muốn?
              </div>
              <p className="text-slate-500 text-sm">
                Đặt alert để hệ thống thông báo qua Telegram hoặc Email cho các tuyến đang được theo dõi.
              </p>
            </div>
            <Link
              to="/alerts"
              className="flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm shrink-0 transition-colors"
              style={{ fontWeight: 600 }}
            >
              <Zap className="w-4 h-4" />
              Đặt Alert Miễn Phí
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
