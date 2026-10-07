import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router";
import {
  Search,
  Bell,
  Bookmark,
  LoaderCircle,
  Calendar,
  TrendingDown,
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
  mutateBookmarkOptimistic,
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

  const handleBookmarkToggle = async (deal: Deal) => {
    const targetId = deal.opportunityId || deal.id;
    const snapshot = createOpportunitySnapshot(deal);
    const wasBookmarked = bookmarkedIds.has(targetId);
    const next = !wasBookmarked;

    setBookmarkedIds((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(targetId);
      else updated.delete(targetId);
      return updated;
    });

    await mutateBookmarkOptimistic(targetId, next, snapshot, undefined, {
      onRollback: (rolledState) => {
        setBookmarkedIds((prev) => {
          const updated = new Set(prev);
          if (rolledState) updated.add(targetId);
          else updated.delete(targetId);
          return updated;
        });
      },
    });
  };

  const destinationDisplay = useMemo(() => {
    if (!destination) return "Tất cả điểm đến";
    const found = destinationEntities.find((e) => e.code === destination);
    return found ? found.label : destination;
  }, [destination]);

  return (
    <main className="min-h-screen bg-[var(--canvas-bg)] text-stone-900 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
            Tìm kiếm cơ hội vé
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
            Lọc các mức giá quan sát thực tế ({destinationDisplay}) theo điểm khởi hành và ngân sách. Kết quả luôn được đối chiếu với nhóm tương đương.
          </p>
        </div>

        {/* Unified Search Composer */}
        <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            {/* 1. FROM */}
            <div>
              <label htmlFor="search-from" className="block text-[11px] font-bold text-stone-600 mb-1 uppercase tracking-wider">
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
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-blue-600 focus:outline-none"
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
              <label htmlFor="search-destination" className="block text-[11px] font-bold text-stone-600 mb-1 uppercase tracking-wider">
                Điểm đến (tuỳ chọn)
              </label>
              <input
                id="search-destination"
                aria-label="Điểm đến (tuỳ chọn)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Mã sân bay (BKK, DAD) hoặc tên thành phố"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* 3. WHEN: Date Range */}
            <div>
              <label htmlFor="search-depart-from" className="block text-[11px] font-bold text-stone-600 mb-1 uppercase tracking-wider">
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
                  className="w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-900 focus:border-blue-600 focus:outline-none"
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
                  className="w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* 4. BUDGET */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="search-budget-select" className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                  Ngân sách tối đa
                </label>
                <span className="font-mono text-xs font-bold text-emerald-700">{formatVND(budget)}</span>
              </div>
              <select
                id="search-budget-select"
                value={budget}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBudget(val);
                  saveUserPreferences({ budget: val });
                  void saveRemoteUserPreferences({ ...getUserPreferences(), budget: val });
                }}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 focus:border-blue-600 focus:outline-none"
              >
                <option value={3000000}>3.000.000₫</option>
                <option value={5000000}>5.000.000₫</option>
                <option value={7000000}>7.000.000₫</option>
                <option value={10000000}>10.000.000₫</option>
                <option value={15000000}>15.000.000₫</option>
                <option value={20000000}>20.000.000₫</option>
                <option value={30000000}>30.000.000₫</option>
              </select>
            </div>
          </div>

          {/* Secondary Filters row */}
          <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Max Stops */}
              <div className="flex items-center gap-2">
                <label htmlFor="search-stops" className="text-xs text-stone-600 font-medium">
                  Số điểm dừng tối đa
                </label>
                <select
                  id="search-stops"
                  aria-label="Số điểm dừng tối đa"
                  value={maxStops}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMaxStops(val);
                    saveUserPreferences({ maxStops: val });
                    void saveRemoteUserPreferences({ ...getUserPreferences(), maxStops: val });
                  }}
                  className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs text-stone-900 focus:border-blue-600"
                >
                  <option value={0}>0 (Bay thẳng)</option>
                  <option value={1}>1 điểm dừng</option>
                  <option value={2}>2+ điểm dừng</option>
                </select>
              </div>

              {/* Max Flight Duration */}
              <div className="flex items-center gap-2">
                <label htmlFor="search-duration" className="text-xs text-stone-600 font-medium">
                  Thời lượng bay tối đa
                </label>
                <select
                  id="search-duration"
                  aria-label="Thời lượng bay tối đa"
                  value={maxFlightTimeMinutes ?? ""}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : undefined;
                    setMaxFlightTimeMinutes(val);
                    saveUserPreferences({ maxFlightTimeMinutes: val });
                    void saveRemoteUserPreferences({ ...getUserPreferences(), maxFlightTimeMinutes: val });
                  }}
                  className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs text-stone-900 focus:border-blue-600"
                >
                  <option value="">Không giới hạn</option>
                  <option value={180}>3 giờ (180 phút)</option>
                  <option value={300}>5 giờ (300 phút)</option>
                  <option value={480}>8 giờ (480 phút)</option>
                  <option value={720}>12 giờ (720 phút)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void runSearch(true)}
                disabled={isScanning}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer"
              >
                {isScanning ? (
                  <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                <span>{isScanning ? "Đang quét..." : "Lọc kết quả"}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Results Header / Counter */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-stone-800">
            <span>
              {results.length} Deal Khớp
            </span>
            <span className="text-xs text-stone-500 font-normal ml-2">
              (Khởi hành: {fromCity} {destination ? `→ ${destination}` : ""} · Ngân sách ≤ {formatVND(budget)})
            </span>
          </div>

          {searchStatus === "provider_unavailable" && (
            <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
              Nhà cung cấp dữ liệu tạm thời không phản hồi. Hiển thị dữ liệu snapshot gần nhất.
            </div>
          )}
        </div>

        {/* Results List */}
        {results.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-12 text-center space-y-3 shadow-sm">
            <p className="text-stone-700 font-semibold text-sm">
              Không tìm thấy cơ hội nào phù hợp với bộ lọc hiện tại.
            </p>
            <p className="text-stone-500 text-xs max-w-md mx-auto">
              Thử nâng mức ngân sách hoặc chọn khoảng ngày rộng hơn để hệ thống hiển thị nhiều chặng bay quan sát hơn.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((deal) => {
              const targetId = deal.opportunityId || deal.id;
              const isSaved = bookmarkedIds.has(targetId) || isBookmarkedDeal(targetId);

              return (
                <div
                  key={deal.id}
                  className="rounded-xl border border-stone-200 bg-white p-4 space-y-3 shadow-sm hover:border-stone-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {deal.airline}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={isSaved ? "Bỏ lưu cơ hội" : "Lưu cơ hội"}
                          onClick={() => handleBookmarkToggle(deal)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-blue-600 text-blue-600" : ""}`} />
                        </button>
                        <button
                          type="button"
                          aria-label="Theo dõi"
                          onClick={() => {
                            setSelectedWatchDeal(deal);
                            setWatchOpen(true);
                          }}
                          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-stone-500 mb-0.5">
                        {deal.from} → {deal.to}
                      </div>
                      <Link
                        to={`/deals/${deal.id}`}
                        className="text-xl font-bold font-mono text-stone-900 hover:text-blue-600 transition-colors"
                      >
                        {deal.fromCode} <span className="text-blue-600 font-light">→</span> {deal.toCode}
                      </Link>
                      <div className="text-xs text-stone-600 mt-1 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          {new Date(deal.departDate).toLocaleDateString("vi-VN")}
                        </span>
                        <span>·</span>
                        <span>{deal.stops === 0 ? "Bay thẳng" : `${deal.stops} điểm dừng`}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-baseline justify-between">
                    <div>
                      <div className="text-lg font-bold font-mono text-emerald-700 tabular-nums">
                        {formatVND(deal.price)}
                      </div>
                      {deal.discount > 0 && (
                        <div className="text-[11px] font-mono font-bold text-emerald-700 flex items-center gap-0.5">
                          <TrendingDown className="w-3 h-3" />
                          <span>↓{deal.discount}% vs median</span>
                        </div>
                      )}
                    </div>

                    <Link
                      to={`/deals/${deal.id}`}
                      className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs transition-colors border border-stone-200"
                    >
                      Chi tiết
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <WatchModal
        isOpen={watchOpen}
        onClose={() => {
          setWatchOpen(false);
          setSelectedWatchDeal(null);
        }}
        opportunity={
          selectedWatchDeal
            ? {
                id: selectedWatchDeal.id,
                originCode: selectedWatchDeal.fromCode,
                destinationCode: selectedWatchDeal.toCode,
                price: selectedWatchDeal.price,
                departDate: selectedWatchDeal.departDate,
                returnDate: selectedWatchDeal.returnDate,
                stops: selectedWatchDeal.stops,
              }
            : undefined
        }
        initialOrigin={fromCity}
        initialDestination={destination || "BKK"}
        sourceContext="search"
      />
    </main>
  );
}
