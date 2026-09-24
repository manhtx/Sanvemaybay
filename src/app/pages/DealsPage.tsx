import { useState, useMemo, useCallback } from "react";
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
  AlertTriangle,
  RefreshCw,
  LoaderCircle,
  CircleCheckBig,
} from "lucide-react";
import { DealCard } from "../components/DealCard";
import { Deal } from "../data/deals";
import { formatVND } from "../data/deals";
import { compareDeals } from "../domain/dealComparison";
import { Link } from "react-router";
import { getDealsResult, getObservedFares } from "../data/api";
import type { DealFeedResult, ObservedFarePage } from "../data/api";
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
  const [observedFares, setObservedFares] = useState<Deal[]>([]);
  const [observedTotal, setObservedTotal] = useState(0);
  const [nextObservedPage, setNextObservedPage] = useState<number | null>(null);
  const [observedUnavailable, setObservedUnavailable] = useState(false);
  const [observedHealth, setObservedHealth] = useState<Pick<ObservedFarePage, "status" | "feedAgeMinutes" | "latestObservedAt" | "retryable">>({ status: "provider_unavailable", retryable: true });
  const [mode, setMode] = useState<"observed" | "live">("observed");
  const [feed, setFeed] = useState<DealFeedResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState<RegionType>("all");
  const [sort, setSort] = useState<SortType>("discount");

  const loadDeals = useCallback(async () => {
    setIsLoading(true);
    const [result, observed] = await Promise.all([getDealsResult(), getObservedFares()]);
    setDeals(result.deals);
    setFeed(result);
    setObservedFares(observed.fares);
    setObservedTotal(observed.total);
    setNextObservedPage(observed.nextPage);
    setObservedUnavailable(observed.status === "provider_unavailable");
    setObservedHealth({ status: observed.status, feedAgeMinutes: observed.feedAgeMinutes, latestObservedAt: observed.latestObservedAt, retryable: observed.retryable });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadDeals();
    const timer = window.setInterval(() => void loadDeals(), 5 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [loadDeals]);
  const [flashOnly, setFlashOnly] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedWatchDest, setSelectedWatchDest] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const displayDeals = mode === "observed" ? observedFares : deals;
  const baseDestinations = useMemo(() => [...new Set(displayDeals.map((deal) => deal.to))], [displayDeals]);

  // Derive available months from actual deal dates — sorted chronologically
  const availableMonths = useMemo(() => {
    const monthSet = new Set(
      displayDeals.map((d: Deal) => {
        const date = new Date(d.departDate);
        return `${date.getMonth() + 1}/${date.getFullYear()}`;
      })
    );
    return (Array.from(monthSet) as string[]).sort((a, b) => {
      const [ma, ya] = a.split("/").map(Number);
      const [mb, yb] = b.split("/").map(Number);
      return ya !== yb ? ya - yb : ma - mb;
    });
  }, [displayDeals]);

  const filtered = displayDeals
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
            ? displayDeals.length
            : displayDeals.filter((d: Deal) => d.region === r.value).length;
        return acc;
      }, {} as Record<string, number>),
    [displayDeals]
  );
  const comparisonDeals = useMemo(
    () => filtered.filter((deal) => comparisonIds.includes(deal.id)),
    [comparisonIds, filtered],
  );
  const comparisonRows = useMemo(() => compareDeals(comparisonDeals), [comparisonDeals]);
  const isDegraded = feed?.status === "degraded_schema" || feed?.status === "provider_unavailable";
  const isStaleOnly = feed?.status === "stale_only";
  const isHealthyEmpty = feed?.status === "healthy_empty";
  const showInventoryControls = !isLoading && displayDeals.length > 0;
  const feedSummary = isLoading
    ? "Đang kiểm tra nguồn deal hiện tại…"
    : isDegraded
      ? "Nguồn deal đang tạm thời không khả dụng"
      : isHealthyEmpty
        ? "Nguồn dữ liệu hoạt động — hiện chưa có deal live đạt chuẩn"
      : isStaleOnly && deals.length === 0
        ? "Chưa có deal live còn hiệu lực"
        : `Hệ thống phát hiện ${deals.length} deal trên ${new Set(deals.map((d: Deal) => d.country)).size} quốc gia`;

  return (
    <main className="min-h-screen pb-16 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-pink-400" />
            <span className="text-xs font-bold tracking-[0.12em] text-pink-400">
              DỮ LIỆU QUAN SÁT
            </span>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1
                className="mb-2 text-white"
                style={{ fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em" }}
              >
            {mode === "observed" ? "Giá Vé Máy Bay Đang Giảm Mạnh" : "Deal Vé Máy Bay Được Xác Minh"}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-400" aria-live="polite">
                <span className={isDegraded ? "text-amber-300" : "text-sky-400"} style={{ fontWeight: 700 }}>
                  {mode === "observed" ? `${observedTotal} giá quan sát — ưu tiên mức giảm lớn nhất` : feedSummary}
                </span>{" "}
                {!isLoading && mode === "live" && !isDegraded && "— chỉ hiển thị các mức giá đạt ngưỡng so với dữ liệu lịch sử"}
              </p>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/[0.1] sm:hidden"
              style={{ fontWeight: 600 }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Bộ lọc
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="mb-6 inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1" role="tablist" aria-label="Loại giá vé">
          <button type="button" role="tab" aria-selected={mode === "observed"} onClick={() => setMode("observed")} className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold ${mode === "observed" ? "bg-white text-slate-950" : "text-slate-400"}`}>
            Giá đang giảm ({observedTotal})
          </button>
          <button type="button" role="tab" aria-selected={mode === "live"} onClick={() => setMode("live")} className={`min-h-11 rounded-lg px-4 py-2 text-sm font-semibold ${mode === "live" ? "bg-white text-slate-950" : "text-slate-400"}`}>
            Deal live ({deals.length})
          </button>
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

        {isLoading && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 text-sm text-sky-200" role="status">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Đang xác minh tình trạng nguồn deal…
          </div>
        )}

        {!isLoading && mode === "live" && (isDegraded || isStaleOnly || isHealthyEmpty) && (
          <section
            className={`mb-6 rounded-2xl border p-5 ${isDegraded ? "border-amber-500/30 bg-amber-500/10" : isHealthyEmpty ? "border-emerald-500/25 bg-emerald-500/10" : "border-violet-500/25 bg-violet-500/10"}`}
            role={isDegraded ? "alert" : "status"}
            aria-label="Trạng thái nguồn deal"
          >
            <div className="flex items-start gap-3">
              {isHealthyEmpty
                ? <CircleCheckBig className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                : <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${isDegraded ? "text-amber-300" : "text-violet-300"}`} />}
              <div className="flex-1">
                <h2 className="font-bold text-white">
                  {isDegraded
                    ? "Nguồn deal đang cần được khôi phục"
                    : isHealthyEmpty
                      ? "Chưa có deal live đạt chuẩn lúc này"
                      : "Chưa có deal live còn hiệu lực"}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">
                  {feed?.message} Hệ thống không hiển thị dữ liệu cũ hoặc chưa được xác minh thay cho deal thật. Bạn có thể đặt alert để nhận thông báo khi xuất hiện offer hợp lệ.
                </p>
                {feed?.generatedAt && (
                  <p className="mt-2 text-xs text-slate-500">Cập nhật nguồn gần nhất: {new Date(feed.generatedAt).toLocaleString("vi-VN")}</p>
                )}
              </div>
              {feed?.retryable && (
                <button
                  type="button"
                  onClick={() => void loadDeals()}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.07] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/[0.12]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Thử lại
                </button>
              )}
            </div>
          </section>
        )}

        {!isLoading && mode === "observed" && observedUnavailable && (
          <section className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5" role="alert">
            <h2 className="font-bold text-white">Nguồn giá quan sát đang tạm gián đoạn</h2>
            <p className="mt-1 text-sm text-slate-300">Hệ thống sẽ tự thử lại; dữ liệu archive không được dùng thay cho giá hiện tại.</p>
          </section>
        )}
        {!isLoading && mode === "observed" && !observedUnavailable && (observedHealth.status === "degraded_freshness" || observedHealth.status === "stale_only") && (
          <section className={`mb-6 rounded-2xl border p-5 ${observedHealth.status === "stale_only" ? "border-red-500/30 bg-red-500/10" : "border-amber-500/30 bg-amber-500/10"}`} role="alert">
            <h2 className="font-bold text-white">
              {observedHealth.status === "stale_only" ? "Dữ liệu giá đã quá cũ" : "Dữ liệu giá đang cập nhật chậm"}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Lần quan sát mới nhất cách đây {observedHealth.feedAgeMinutes == null ? "không xác định" : `${Math.max(1, Math.round(observedHealth.feedAgeMinutes / 60))} giờ`}.
              Các mức giá vẫn là dữ liệu tham khảo và phải được kiểm tra lại trên nguồn trước khi quyết định.
            </p>
            {observedHealth.latestObservedAt && (
              <p className="mt-2 text-xs text-slate-500">Quan sát mới nhất: {new Date(observedHealth.latestObservedAt).toLocaleString("vi-VN")}</p>
            )}
          </section>
        )}
        {!isLoading && mode === "observed" && !observedUnavailable && observedTotal === 0 && (
          <section className="mb-6 rounded-2xl border border-sky-500/25 bg-sky-500/10 p-5" role="status">
            <h2 className="font-bold text-white">Đang chờ lượt quét giá đầu tiên</h2>
            <p className="mt-1 text-sm text-slate-300">Pipeline chạy nền mỗi giờ; giá hợp lệ sẽ tự xuất hiện và được xếp theo mức giảm.</p>
          </section>
        )}

        {/* ── DESTINATION FILTER ── */}
        {showInventoryControls && <div className="mb-6 overflow-x-auto pb-1">
          <div className="flex items-center gap-3 flex-wrap">
              <span className="shrink-0 text-sm font-semibold text-slate-400">
              Lọc điểm đến đang có dữ liệu:
            </span>

            {baseDestinations.map((dest: string) => (
              <button
                key={dest}
                onClick={() => setSelectedWatchDest(selectedWatchDest === dest ? null : dest)}
                className={`flex min-h-11 items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-all ${
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
        </div>}

        {/* ── FILTER & SORT BAR ── */}
        {showInventoryControls && <div className={`mb-8 rounded-2xl border border-white/10 bg-[#171719] p-4 ${showFilters ? "" : "hidden sm:block"}`}>
          {/* Region tabs - scrollable on mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {allRegions
              .filter((r) => regionCounts[r.value] > 0 || r.value === "all")
              .map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRegion(r.value)}
                  className={`flex min-h-11 items-center gap-1.5 px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all shrink-0 ${
                    region === r.value
                        ? "bg-white text-slate-950 shadow-lg shadow-black/20"
                        : "bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] hover:text-white"
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
              className={`flex min-h-11 items-center gap-2 px-4 py-2 rounded-xl text-sm border transition-all ${
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
                aria-label="Lọc theo tháng khởi hành"
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
                  aria-label="Sắp xếp deal"
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
        </div>}

        {/* ── STATS ROW ── */}
        {showInventoryControls && <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { icon: TrendingDown, label: "Deals đang có", value: `${filtered.length}`, color: "text-sky-400" },
            { icon: Zap, label: "Flash deals", value: `${filtered.filter((d: Deal) => d.isFlashDeal).length}`, color: "text-orange-400" },
            { icon: Clock, label: mode === "observed" ? "Độ mới dữ liệu" : "Hết hạn sớm nhất", value: mode === "observed" ? (filtered[0]?.expiresIn ?? "—") : filtered.length > 0 ? [...filtered].sort((a: Deal, b: Deal) => a.expiresIn.localeCompare(b.expiresIn))[0]?.expiresIn.split(" ").slice(0, 2).join(" ") : "—", color: "text-red-400" },
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
        </div>}

        {comparisonRows.length > 0 && (
          <section className="mb-8 rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5" aria-label="So sánh deal">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-white font-bold">So sánh phương án</h2>
                <p className="text-slate-500 text-xs">So sánh theo tổng chi phí, không chỉ giá vé.</p>
              </div>
              <button type="button" onClick={() => setComparisonIds([])} className="text-slate-400 hover:text-white text-xs">Xóa lựa chọn</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-500 text-xs uppercase">
                  <tr><th className="py-2 pr-4">Route</th><th className="py-2 pr-4">Giá vé</th><th className="py-2 pr-4">Tổng cost</th><th className="py-2 pr-4">Thời lượng</th><th className="py-2 pr-4">Dừng</th><th className="py-2 pr-4">Hoàn/đổi</th><th className="py-2">Risk</th></tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.id} className="border-t border-white/5 text-slate-300">
                      <td className="py-3 pr-4 font-semibold text-white">{row.route}</td>
                      <td className="py-3 pr-4">{formatVND(row.ticketPrice)}</td>
                      <td className="py-3 pr-4 text-emerald-400 font-bold">{formatVND(row.totalCost)}</td>
                      <td className="py-3 pr-4">{row.durationMinutes == null ? "Chưa có dữ liệu" : `${Math.floor(row.durationMinutes / 60)}h ${row.durationMinutes % 60}m`}</td>
                      <td className="py-3 pr-4">{row.stops}</td>
                      <td className="py-3 pr-4">{row.refundPolicy ?? "Chưa có dữ liệu"}</td>
                      <td className="py-3">{row.risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

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
              <div key={deal.id} className="relative">
                <DealCard deal={deal} />
                <button
                  type="button"
                  aria-label={comparisonIds.includes(deal.id) ? `Bỏ ${deal.toCode} khỏi so sánh` : `So sánh ${deal.toCode}`}
                  aria-pressed={comparisonIds.includes(deal.id)}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setComparisonIds((current) => current.includes(deal.id)
                      ? current.filter((id) => id !== deal.id)
                      : current.length < 3 ? [...current, deal.id] : current);
                  }}
                  className={`absolute left-3 top-3 z-20 min-h-11 rounded-full border px-3 py-2 text-[10px] font-bold ${comparisonIds.includes(deal.id) ? "bg-sky-500 border-sky-400 text-white" : "bg-slate-950/80 border-white/20 text-slate-300"}`}
                >
                  {comparisonIds.includes(deal.id) ? "Đã chọn" : "So sánh"}
                </button>
              </div>
            ))}
          </div>
        ) : !isLoading && !isDegraded && !isStaleOnly && !isHealthyEmpty ? (
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
        ) : null}

        {mode === "observed" && nextObservedPage && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={async () => {
                const next = await getObservedFares(nextObservedPage);
                setObservedFares((current) => [...current, ...next.fares.filter((fare) => !current.some((existing) => existing.id === fare.id))]);
                setNextObservedPage(next.nextPage);
              }}
              className="rounded-xl bg-sky-500 px-6 py-3 text-sm font-bold text-white hover:bg-sky-400"
            >
              Xem thêm giá vé
            </button>
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
                {mode === "observed"
                  ? "Giá được quét nền mỗi giờ và xếp theo mức chênh lệch so với nhóm tương đương. Luôn kiểm tra lại giá hiện tại trên nguồn."
                  : "Chỉ các chuyến bay tương lai còn trong thời hạn xác minh mới được hiển thị. Giá có thể thay đổi khi bạn chuyển sang trang đặt vé."}
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
    </main>
  );
}
