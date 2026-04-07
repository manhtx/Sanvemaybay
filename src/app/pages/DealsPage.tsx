import { useState, useMemo } from "react";
import {
  TrendingDown,
  Globe,
  MapPin,
  SlidersHorizontal,
  Zap,
  Clock,
  ArrowUpDown,
  Plus,
  X,
  Search,
  Bell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { DealCard } from "../components/DealCard";
import { mockDeals, regionFlag, Deal } from "../data/mockDeals";
import { Link } from "react-router";
import { getDeals } from "../data/api";
import { useEffect } from "react";

type RegionType = "all" | Deal["region"];
type SortType = "discount" | "price_asc" | "price_desc" | "score" | "date_near" | "date_far";

const sortOptions: { value: SortType; label: string }[] = [
  { value: "score", label: "AI Score cao nhất" },
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

// All unique destinations from deals + ability to add new ones
const baseDestinations = [...new Set(mockDeals.map((d) => d.to))];

const suggestedNewDests = [
  "Barcelona", "Rome", "Prague", "Vienna", "Lisbon", "Athens",
  "Toronto", "Vancouver", "São Paulo", "Buenos Aires",
  "Taipei", "Osaka", "Ho Chi Minh City", "Kuala Lumpur",
  "Cairo", "Nairobi", "Johannesburg",
  "Auckland", "Melbourne", "Brisbane",
  "Doha", "Riyadh", "Abu Dhabi", "Muscat",
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
  const [watchedDests, setWatchedDests] = useState<string[]>([]);
  const [showAddDest, setShowAddDest] = useState(false);
  const [destSearch, setDestSearch] = useState("");
  const [selectedWatchDest, setSelectedWatchDest] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

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

  const filteredSuggestions = suggestedNewDests
    .filter(
      (d) =>
        d.toLowerCase().includes(destSearch.toLowerCase()) &&
        !watchedDests.includes(d) &&
        !baseDestinations.includes(d)
    )
    .slice(0, 8);

  const addWatchDest = (dest: string) => {
    if (!watchedDests.includes(dest)) {
      setWatchedDests([...watchedDests, dest]);
    }
    setShowAddDest(false);
    setDestSearch("");
  };

  const removeWatchDest = (dest: string) => {
    setWatchedDests(watchedDests.filter((d: string) => d !== dest));
    if (selectedWatchDest === dest) setSelectedWatchDest(null);
  };

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
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
            <span className="text-red-400 text-xs" style={{ fontWeight: 700 }}>
              LIVE — CẬP NHẬT MỖI GIỜ
            </span>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1
                className="text-white mb-2"
                style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em" }}
              >
                Deal Vé Máy Bay Giá Rẻ Toàn Cầu
              </h1>
              <p className="text-slate-500">
                AI phát hiện{" "}
                <span className="text-sky-400" style={{ fontWeight: 700 }}>
                  {deals.length} deal
                </span>{" "}
                trên{" "}
                <span className="text-sky-400" style={{ fontWeight: 700 }}>
                  {new Set(deals.map((d: Deal) => d.country)).size} quốc gia
                </span>{" "}
                — giảm 44–60% bất kể ngày bay xa hay gần
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

        {/* ── WATCHED DESTINATIONS ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-500 text-sm shrink-0" style={{ fontWeight: 600 }}>
              Theo dõi điểm đến:
            </span>

            {/* Base active destinations */}
            {(Array.from(new Set(deals.map((d: Deal) => d.to))) as string[]).slice(0, 6).map((dest: string) => (
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

            {/* Custom watched destinations */}
            {watchedDests.map((dest: string) => (
              <div
                key={dest}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border bg-violet-500/15 border-violet-500/30 text-violet-300"
              >
                <button
                  onClick={() => setSelectedWatchDest(selectedWatchDest === dest ? null : dest)}
                  style={{ fontWeight: 600 }}
                >
                  {dest} <span className="text-violet-500 text-xs">(theo dõi)</span>
                </button>
                <button
                  onClick={() => removeWatchDest(dest)}
                  className="ml-1 text-violet-500 hover:text-violet-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add destination button */}
            <button
              onClick={() => setShowAddDest(!showAddDest)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-dashed border-sky-500/40 text-sky-400 hover:bg-sky-500/10 transition-all"
              style={{ fontWeight: 600 }}
            >
              <Plus className="w-3.5 h-3.5" />
              Thêm điểm đến
            </button>
          </div>

          {/* Add destination panel */}
          {showAddDest && (
            <div className="mt-4 p-4 bg-slate-900 border border-sky-500/20 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-sky-400" />
                <span className="text-white text-sm" style={{ fontWeight: 700 }}>
                  Thêm điểm đến muốn theo dõi
                </span>
                <button
                  onClick={() => setShowAddDest(false)}
                  className="ml-auto text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={destSearch}
                  onChange={(e) => setDestSearch(e.target.value)}
                  placeholder="Tìm điểm đến (vd: Barcelona, Toronto...)"
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/40"
                  autoFocus
                />
              </div>

              {/* Custom add */}
              {destSearch && !suggestedNewDests.some((d) => d.toLowerCase() === destSearch.toLowerCase()) && (
                <button
                  onClick={() => addWatchDest(destSearch)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 bg-sky-500/15 border border-sky-500/30 text-sky-300 rounded-xl text-sm mb-3 hover:bg-sky-500/25 transition-colors text-left"
                  style={{ fontWeight: 600 }}
                >
                  <Plus className="w-4 h-4" />
                  Thêm "{destSearch}" vào danh sách theo dõi
                </button>
              )}

              {/* Suggestions */}
              <div>
                <div className="text-slate-600 text-xs mb-2" style={{ fontWeight: 600 }}>
                  GỢI Ý ĐIỂM ĐẾN TOÀN CẦU
                </div>
                <div className="flex flex-wrap gap-2">
                  {(destSearch ? filteredSuggestions : suggestedNewDests.slice(0, 16)).map((dest) => (
                    <button
                      key={dest}
                      onClick={() => addWatchDest(dest)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-400 hover:text-white rounded-full text-xs transition-all"
                      style={{ fontWeight: 600 }}
                    >
                      <Plus className="w-3 h-3" />
                      {dest}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-slate-600 text-xs mt-4">
                💡 Khi có deal đến điểm đến bạn theo dõi, FlyCheap AI sẽ hiển thị ưu tiên. Đặt Alert để nhận thông báo tự động.
              </p>
            </div>
          )}
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
                to="/alerts"
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
                FlyCheap AI hiển thị mọi deal rẻ bất thường — dù chuyến bay cách đây 6 tháng hay 1.5 năm. Đặt vé sớm khi giá tốt luôn là chiến lược thông minh.
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
                Đặt alert để AI tự động thông báo qua Telegram hoặc Email — cho bất kỳ điểm đến nào trên thế giới.
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