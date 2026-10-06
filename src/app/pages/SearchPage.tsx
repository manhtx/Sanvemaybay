import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router";
import {
  Search,
  Bell,
  Bookmark,
  LoaderCircle,
} from "lucide-react";
import { formatVND, Deal } from "../data/deals";
import { getTrackedRoutes, searchDealsWithStatus, SearchStatus } from "../data/api";
import { uniqueOrigins } from "../data/origins";
import {
  getUserPreferences,
  loadRemoteUserPreferences,
  saveRemoteUserPreferences,
  saveUserPreferences,
} from "../lib/preferences";
import {
  isBookmarkedDeal,
  saveRemoteBookmark,
  toggleBookmarkedDeal,
  createOpportunitySnapshot,
} from "../lib/bookmarks";
import { WatchModal } from "../components/WatchModal";



const defaultDepartureCities = [
  { code: "HAN", name: "Hà Nội (HAN)" },
  { code: "SGN", name: "TP. Hồ Chí Minh (SGN)" },
  { code: "DAD", name: "Đà Nẵng (DAD)" },
];

const destinationEntities = [
  { code: "", label: "Tất cả điểm đến" },
  { code: "BKK_ALL", label: "Bangkok - Tất cả sân bay (BKK, DMK)" },
  { code: "BKK", label: "Bangkok - Suvarnabhumi (BKK)" },
  { code: "DMK", label: "Bangkok - Don Mueang (DMK)" },
  { code: "SIN", label: "Singapore - Changi (SIN)" },
  { code: "KUL", label: "Kuala Lumpur (KUL)" },
  { code: "TYO_ALL", label: "Tokyo - Tất cả sân bay (NRT, HND)" },
  { code: "NRT", label: "Tokyo - Narita (NRT)" },
  { code: "HND", label: "Tokyo - Haneda (HND)" },
  { code: "ICN", label: "Seoul - Incheon (ICN)" },
  { code: "TPE", label: "Đài Bắc - Taoyuan (TPE)" },
  { code: "HKG", label: "Hồng Kông (HKG)" },
  { code: "DAD", label: "Đà Nẵng (DAD)" },
  { code: "CXR", label: "Nha Trang - Cam Ranh (CXR)" },
  { code: "PQC", label: "Phú Quốc (PQC)" },
];

export function SearchPage() {
  const [departureCities, setDepartureCities] = useState(defaultDepartureCities);
  const [budget, setBudget] = useState(() => getUserPreferences().budget || 10000000);
  const [fromCity, setFromCity] = useState(() => getUserPreferences().homeAirport || "HAN");
  const [destination, setDestination] = useState("");
  const [maxStops, setMaxStops] = useState(() => getUserPreferences().maxStops ?? 1);
  const [maxFlightTimeMinutes, setMaxFlightTimeMinutes] = useState(() => getUserPreferences().maxFlightTimeMinutes);
  const [departureFrom, setDepartureFrom] = useState(() => getUserPreferences().departureFrom ?? "");
  const [departureTo, setDepartureTo] = useState(() => getUserPreferences().departureTo ?? "");
  const [results, setResults] = useState<Deal[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("healthy");
  const [isScanning, setIsScanning] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [selectedWatchDeal, setSelectedWatchDeal] = useState<Deal | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getTrackedRoutes().then((routes) => {
      const origins = uniqueOrigins(routes);
      if (origins.length) {
        setDepartureCities(origins.map((o) => ({ code: o.code, name: `${o.name} (${o.code})` })));
      }
    });
    loadRemoteUserPreferences().then((remote) => {
      if (!remote) return;
      if (remote.budget) setBudget(remote.budget);
      if (remote.homeAirport) setFromCity(remote.homeAirport);
      if (remote.maxStops != null) setMaxStops(remote.maxStops);
      if (remote.maxFlightTimeMinutes != null) setMaxFlightTimeMinutes(remote.maxFlightTimeMinutes);
      if (remote.departureFrom) setDepartureFrom(remote.departureFrom);
      if (remote.departureTo) setDepartureTo(remote.departureTo);
      saveUserPreferences(remote);
    });
  }, []);

  const runSearch = useCallback(
    async (isManual = false) => {
      if (isManual) setIsScanning(true);
      try {
        const outcome = await searchDealsWithStatus({
          budget,
          from: fromCity,
          destination: destination || undefined,
          maxStops,
          departureFrom: departureFrom || undefined,
          departureTo: departureTo || undefined,
          maxFlightTimeMinutes,
        });
        setResults(outcome.deals);
        setSearchStatus(outcome.status);
      } catch {
        setResults([]);
        setSearchStatus("provider_unavailable");
      } finally {
        setIsScanning(false);
      }
    },
    [budget, fromCity, destination, maxStops, departureFrom, departureTo, maxFlightTimeMinutes]
  );


  useEffect(() => {
    void runSearch();
  }, [runSearch]);

  const handleBookmarkToggle = (deal: Deal) => {
    const targetId = deal.opportunityId || deal.id;
    const snapshot = createOpportunitySnapshot(deal);
    const next = toggleBookmarkedDeal(targetId, undefined, snapshot);
    setBookmarkedIds((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(targetId);
      else updated.delete(targetId);
      return updated;
    });
    void saveRemoteBookmark(targetId, next, snapshot);
  };

  const destinationDisplay = useMemo(() => {
    if (!destination) return "Tất cả điểm đến";
    const found = destinationEntities.find((e) => e.code === destination);
    return found ? found.label : destination;
  }, [destination]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Page Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Tìm kiếm cơ hội vé
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Lọc các mức giá quan sát thực tế theo điểm khởi hành, điểm đến và ngân sách. Kết quả luôn được đối chiếu với nhóm tương đương.
          </p>
        </div>

        {/* SECTION 55: TRIP-INTENT COMPOSER (ONE UNIFIED COMPOSER, NO ISOLATED CARDS) */}
        <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            
            {/* 1. FROM */}
            <div>
              <label htmlFor="search-from" className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Điểm khởi hành
              </label>
              <select
                id="search-from"
                value={fromCity}
                onChange={(e) => {
                  const val = e.target.value;
                  setFromCity(val);
                  saveUserPreferences({ homeAirport: val });
                  void saveRemoteUserPreferences({ ...getUserPreferences(), homeAirport: val });
                }}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                {departureCities.map((city) => (
                  <option key={city.code} value={city.code}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. TO: Destination Input */}
            <div>
              <label htmlFor="search-destination" className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Điểm đến (tuỳ chọn)
              </label>
              <input
                id="search-destination"
                aria-label="Điểm đến (tuỳ chọn)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Mã sân bay (BKK, DAD) hoặc tên thành phố"
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* 3. WHEN: Date Range */}
            <div>
              <label htmlFor="search-depart-from" className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Khoảng ngày khởi hành
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  id="search-depart-from"
                  aria-label="Ngày khởi hành từ"
                  type="date"
                  value={departureFrom}
                  max={departureTo || undefined}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDepartureFrom(val);
                    saveUserPreferences({ departureFrom: val || undefined });
                    void saveRemoteUserPreferences({ ...getUserPreferences(), departureFrom: val || undefined });
                  }}
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
                <input
                  id="search-depart-to"
                  aria-label="Ngày khởi hành đến"
                  type="date"
                  value={departureTo}
                  min={departureFrom || undefined}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDepartureTo(val);
                    saveUserPreferences({ departureTo: val || undefined });
                    void saveRemoteUserPreferences({ ...getUserPreferences(), departureTo: val || undefined });
                  }}
                  className="w-full rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 4. BUDGET */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="search-budget-select" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Ngân sách tối đa
                </label>
                <span className="font-mono text-xs font-bold text-emerald-400">{formatVND(budget)}</span>
              </div>
              <select
                id="search-budget-select"
                value={budget}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBudget(val);
                  saveUserPreferences({ budget: val });
                }}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none font-mono"
              >
                <option value={1500000}>≤ 1.500.000₫</option>
                <option value={3000000}>≤ 3.000.000₫</option>
                <option value={5000000}>≤ 5.000.000₫</option>
                <option value={10000000}>≤ 10.000.000₫</option>
                <option value={20000000}>≤ 20.000.000₫</option>
                <option value={50000000}>Không giới hạn (≤ 50.000.000₫)</option>
              </select>
            </div>

          </div>

          {/* Secondary Controls: Stops, Flight Time & Trigger Button */}
          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <label htmlFor="search-max-stops" className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  Số điểm dừng tối đa:
                </label>
                <select
                  id="search-max-stops"
                  aria-label="Số điểm dừng tối đa"
                  value={maxStops}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxStops(val);
                    saveUserPreferences({ maxStops: val });
                    void saveRemoteUserPreferences({ ...getUserPreferences(), maxStops: val });
                  }}
                  className="rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value={0}>Bay thẳng</option>
                  <option value={1}>Tối đa 1 điểm dừng</option>
                  <option value={2}>Mọi điểm dừng</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="search-max-flight-time" className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  Thời lượng bay tối đa:
                </label>
                <select
                  id="search-max-flight-time"
                  aria-label="Thời lượng bay tối đa"
                  value={maxFlightTimeMinutes ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : undefined;
                    setMaxFlightTimeMinutes(val);
                    saveUserPreferences({ maxFlightTimeMinutes: val });
                    void saveRemoteUserPreferences({ ...getUserPreferences(), maxFlightTimeMinutes: val });
                  }}
                  className="rounded-lg border border-white/10 bg-slate-950 px-2.5 py-1 text-xs text-white focus:border-sky-500 focus:outline-none"
                >
                  <option value="">Không giới hạn</option>
                  <option value={180}>Tối đa 3 giờ</option>
                  <option value={360}>Tối đa 6 giờ</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void runSearch(true)}
              disabled={isScanning}
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tìm…</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Tìm kiếm cơ hội</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* SECTION 55: SEARCH INTENT CONNECTED TO WATCH */}
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/[0.04] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-mono font-bold text-white">
              {fromCity} → {destinationDisplay}
            </span>
            <span className="text-slate-500">·</span>
            <span>Ngân sách: ≤ {formatVND(budget)}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400 font-mono font-semibold">{results.length} Deal Khớp</span>
          </div>



          <button
            type="button"
            onClick={() => setWatchOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer self-start sm:self-center"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Theo dõi tìm kiếm này</span>
          </button>
        </div>

        {/* RESULTS: OPPORTUNITY LEDGER */}
        {isScanning ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <LoaderCircle className="w-8 h-8 animate-spin text-sky-400 mb-3" />
            <span className="text-xs font-mono">Đang quét các cơ hội phù hợp…</span>
          </div>
        ) : results.length === 0 ? (
          searchStatus === "provider_unavailable" ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-red-500/20 bg-red-950/20 p-8 space-y-3">
              <p className="text-red-400 text-sm font-medium">
                Dữ liệu quan sát hoặc nhà cung cấp tạm thời không phản hồi.
              </p>
              <p className="text-slate-400 text-xs max-w-md mx-auto">
                Hệ thống chưa thể lấy dữ liệu chuyến bay cho chặng này lúc này. Vui lòng thử lại sau ít phút hoặc bấm [Tìm kiếm lại].
              </p>
              <button
                type="button"
                onClick={() => void runSearch(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition-colors"
              >
                Tìm kiếm lại
              </button>
            </div>
          ) : (
            <div className="text-center py-16 rounded-xl border border-dashed border-white/10 bg-slate-900/20 p-8 space-y-3">
              <p className="text-slate-400 text-sm">
                Không tìm thấy chuyến bay nào khớp với tiêu chí tìm kiếm.
              </p>
              <p className="text-slate-500 text-xs max-w-md mx-auto">
                Bạn có thể mở rộng ngân sách hoặc bấm [Theo dõi tìm kiếm này] ở trên để Farely thông báo ngay khi có mức giá phù hợp.
              </p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            {searchStatus === "degraded" && (
              <div className="px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
                <span>Một số nguồn dữ liệu đang gián đoạn; đang hiển thị các cơ hội quan sát khả dụng.</span>
              </div>
            )}
            
            {/* Desktop Ledger Table */}
            <div className="hidden md:block rounded-xl border border-white/10 bg-slate-900/40 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Chặng bay</th>
                    <th className="py-3 px-3">Ngày bay</th>
                    <th className="py-3 px-3">Hãng / Dừng</th>
                    <th className="py-3 px-4 text-right">Giá quan sát</th>
                    <th className="py-3 px-3 text-right">Đối sánh</th>
                    <th className="py-3 px-3">Bằng chứng & Độ tươi</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {results.map((deal) => {
                    const targetId = deal.opportunityId || deal.id;
                    const isBookmarked = bookmarkedIds.has(targetId) || isBookmarkedDeal(targetId);
                    const formattedDate = new Date(deal.departDate).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                    });
                    const hasComparator = deal.discount > 0 && deal.normalPrice > deal.price;

                    return (
                      <tr
                        key={deal.id}
                        className="hover:bg-white/[0.03] transition-colors group"
                      >
                        {/* Route */}
                        <td className="py-3.5 px-4">
                          <Link
                            to={`/deals/${deal.id}`}
                            className="font-mono font-bold text-white text-sm hover:text-sky-400 transition-colors inline-flex items-center gap-1.5"
                          >
                            <span>{deal.fromCode}</span>
                            <span className="text-sky-400 font-light">→</span>
                            <span>{deal.toCode}</span>
                          </Link>
                          <div className="text-[11px] text-slate-400">
                            {deal.from} – {deal.to}
                          </div>
                        </td>

                        {/* Travel Dates */}
                        <td className="py-3.5 px-3 text-slate-300 font-mono text-[11px]">
                          {formattedDate}
                        </td>

                        {/* Airline & Stops */}
                        <td className="py-3.5 px-3 text-slate-300">
                          <div>{deal.airline}</div>
                          <div className="text-[10px] text-slate-500">
                            {deal.stops === 0 ? "Bay thẳng" : `${deal.stops} điểm dừng`}
                          </div>
                        </td>

                        {/* Observed Price */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-mono font-bold text-white text-sm">
                            {formatVND(deal.price)}
                          </div>
                        </td>

                        {/* Comparison */}
                        <td className="py-3.5 px-3 text-right font-mono">
                          {hasComparator ? (
                            <span className="text-emerald-400 font-bold">
                              ↓{deal.discount}% <span className="text-[10px] text-slate-400 font-normal">median</span>
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Mặt bằng chung</span>
                          )}
                        </td>

                        {/* Freshness */}
                        <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                          <div className="text-slate-300">
                            {deal.confidence && deal.confidence >= 0.6 ? "Bằng chứng tốt" : "Đang tích lũy"}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {deal.expiresIn || "Quan sát mới"}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              to={`/deals/${deal.id}`}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] transition-colors"
                            >
                              Chi tiết
                            </Link>
                            <button
                              type="button"
                              onClick={() => setSelectedWatchDeal(deal)}
                              className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-white/5 transition-colors cursor-pointer"
                              title="Theo dõi chặng này"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBookmarkToggle(deal)}
                              className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-white/5 transition-colors cursor-pointer"
                              title={isBookmarked ? "Bỏ lưu" : "Lưu"}
                            >
                              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-sky-400 text-sky-400" : ""}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Compact Cards */}
            <div className="md:hidden space-y-3">
              {results.map((deal) => {
                const targetId = deal.opportunityId || deal.id;
                const formattedDate = new Date(deal.departDate).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                });
                const hasComparator = deal.discount > 0 && deal.normalPrice > deal.price;

                return (
                  <div
                    key={deal.id}
                    className="rounded-xl border border-white/10 bg-slate-900/50 p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/deals/${deal.id}`}
                        className="font-mono font-bold text-white text-base hover:text-sky-400 transition-colors"
                      >
                        {deal.fromCode} <span className="text-sky-400 font-light">→</span> {deal.toCode}
                      </Link>
                      <div className="font-mono font-bold text-white text-base">
                        {formatVND(deal.price)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{formattedDate} · {deal.airline}</span>
                      {hasComparator && (
                        <span className="text-emerald-400 font-bold font-mono">
                          ↓{deal.discount}% vs median
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-slate-500">
                      <span>{deal.expiresIn || "Quan sát mới"}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedWatchDeal(deal)}
                          className="px-2 py-1 rounded bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1"
                        >
                          <Bell className="w-3 h-3 text-sky-400" />
                          <span>Theo dõi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBookmarkToggle(deal)}
                          className="p-1 rounded text-slate-400 hover:text-sky-400"
                          title={bookmarkedIds.has(targetId) || isBookmarkedDeal(targetId) ? "Bỏ lưu" : "Lưu"}
                        >
                          <Bookmark
                            className={`w-3.5 h-3.5 ${
                              bookmarkedIds.has(targetId) || isBookmarkedDeal(targetId)
                                ? "fill-sky-400 text-sky-400"
                                : ""
                            }`}
                          />
                        </button>
                        <Link
                          to={`/deals/${deal.id}`}
                          className="px-2.5 py-1 rounded bg-sky-500 text-slate-950 text-xs font-bold"
                        >
                          Chi tiết
                        </Link>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>

      {/* Watch Modal from Search intent or individual result */}
      {(watchOpen || selectedWatchDeal) && (
        <WatchModal
          isOpen={watchOpen || Boolean(selectedWatchDeal)}
          onClose={() => {
            setWatchOpen(false);
            setSelectedWatchDeal(null);
          }}
          initialOrigin={selectedWatchDeal ? selectedWatchDeal.fromCode : fromCity}
          initialDestination={
            selectedWatchDeal
              ? selectedWatchDeal.toCode
              : destination && destination !== "BKK_ALL" && destination !== "TYO_ALL"
              ? destination
              : destination === "BKK_ALL"
              ? "BKK"
              : destination === "TYO_ALL"
              ? "NRT"
              : undefined
          }
          currentPrice={selectedWatchDeal ? selectedWatchDeal.price : undefined}
          targetPrice={selectedWatchDeal ? selectedWatchDeal.price : budget < 50000000 ? budget : undefined}
          sourceContext="search_page"
        />

      )}
    </main>
  );
}
