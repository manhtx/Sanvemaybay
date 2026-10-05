import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  TrendingUp,
  MapPin,
  SlidersHorizontal,
  ChevronRight,
  Info,
  RefreshCw,
  Bell,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router";
import { formatVND, Deal } from "../data/deals";
import { getTrackedRoutes, searchDeals } from "../data/api";
import { uniqueOrigins } from "../data/origins";
import { DealCard } from "../components/DealCard";
import { getUserPreferences, loadRemoteUserPreferences, saveRemoteUserPreferences, saveUserPreferences } from "../lib/preferences";

const defaultDepartureCities = [
  { code: "HAN", name: "Hà Nội" },
  { code: "SGN", name: "TP. Hồ Chí Minh" },
  { code: "DAD", name: "Đà Nẵng" },
];

export function SearchPage() {
  const [departureCities, setDepartureCities] = useState(defaultDepartureCities);
  const [budget, setBudget] = useState(() => getUserPreferences().budget);
  const [fromCity, setFromCity] = useState(() => getUserPreferences().homeAirport);
  const [destination, setDestination] = useState("");
  const [maxStops, setMaxStops] = useState(() => getUserPreferences().maxStops);
  const [departureFrom, setDepartureFrom] = useState(() => getUserPreferences().departureFrom ?? "");
  const [departureTo, setDepartureTo] = useState(() => getUserPreferences().departureTo ?? "");
  const [maxFlightTimeMinutes, setMaxFlightTimeMinutes] = useState(() => getUserPreferences().maxFlightTimeMinutes);
  const [results, setResults] = useState<Deal[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    getTrackedRoutes().then((routes) => {
      const origins = uniqueOrigins(routes);
      if (origins.length) setDepartureCities(origins);
    });
    loadRemoteUserPreferences().then((remote) => {
      if (!remote) return;
      setBudget(remote.budget);
      setFromCity(remote.homeAirport);
      setMaxStops(remote.maxStops);
      setDepartureFrom(remote.departureFrom ?? "");
      setDepartureTo(remote.departureTo ?? "");
      setMaxFlightTimeMinutes(remote.maxFlightTimeMinutes);
      saveUserPreferences(remote);
    });
  }, []);

  const stats = useMemo(() => {
    return {
      totalFound: results.length,
      bestPrice: results.length > 0 ? Math.min(...results.map(r => r.price)) : 0,
      maxDiscount: results.length > 0 ? Math.max(...results.map(r => r.discount), 0) : 0,
      avgSaving: results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.discount, 0) / results.length) : 0,
    };
  }, [results]);

  const runSearch = useCallback(async (isManual = false) => {
    if (isManual) setIsScanning(true);
    
    const found = await searchDeals({
      budget,
      from: fromCity,
      destination,
      maxStops,
      departureFrom: departureFrom || undefined,
      departureTo: departureTo || undefined,
      maxFlightTimeMinutes,
    });
    
    setResults(found);
    setIsScanning(false);
  }, [budget, fromCity, destination, maxStops, departureFrom, departureTo, maxFlightTimeMinutes]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  return (
    <main className="min-h-screen bg-[#0b0e14] text-[#f8fafc] pb-20 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Công Cụ Lọc Cơ Hội Chuyến Bay
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Tìm Kiếm <span className="text-blue-400">Cơ Hội Vé</span>
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Lọc các mức giá quan sát thực tế theo điểm khởi hành, điểm đến và ngân sách dự kiến của bạn. Mọi kết quả đều được đối chiếu với lịch sử giá trung vị.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: CONTROLS */}
          <div className="lg:col-span-5 space-y-5">
            {/* From City */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-5">
              <label className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                Điểm khởi hành
              </label>
              <div className="grid grid-cols-3 gap-2">
                {departureCities.map((city) => (
                  <button
                    key={city.code}
                    onClick={() => {
                      setFromCity(city.code);
                      saveUserPreferences({ homeAirport: city.code });
                      void saveRemoteUserPreferences({ ...getUserPreferences(), homeAirport: city.code });
                    }}
                    className={`py-2.5 px-2 rounded-lg text-xs font-semibold transition-all border ${
                      fromCity === city.code 
                        ? "bg-blue-600 border-blue-500 text-white shadow-sm" 
                        : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Destination Input */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-5">
              <label htmlFor="search-destination" className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">
                Điểm đến (tuỳ chọn)
              </label>
              <input
                id="search-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Mã sân bay (BKK, DAD) hoặc tên thành phố"
                className="w-full bg-black/40 border border-white/[0.1] text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              />
              <p className="text-slate-400 text-xs mt-2">Để trống để xem tất cả các điểm đến có mức giá tốt nhất.</p>
            </div>

            {/* Date Range */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-5">
              <label className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">
                Khoảng ngày khởi hành
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  aria-label="Ngày khởi hành từ"
                  type="date"
                  value={departureFrom}
                  max={departureTo || undefined}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDepartureFrom(value);
                    saveUserPreferences({ departureFrom: value || undefined });
                    void saveRemoteUserPreferences({ ...getUserPreferences(), departureFrom: value || undefined });
                  }}
                  className="w-full bg-black/40 border border-white/[0.1] text-white rounded-lg px-3 py-2 text-xs"
                />
                <input
                  aria-label="Ngày khởi hành đến"
                  type="date"
                  value={departureTo}
                  min={departureFrom || undefined}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDepartureTo(value);
                    saveUserPreferences({ departureTo: value || undefined });
                    void saveRemoteUserPreferences({ ...getUserPreferences(), departureTo: value || undefined });
                  }}
                  className="w-full bg-black/40 border border-white/[0.1] text-white rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </div>

            {/* Budget Slider & Presets */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-5">
              <div className="flex justify-between items-center mb-3">
                <label className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                  Ngân sách tối đa
                </label>
                <span className="text-emerald-400 text-base font-bold tabular-nums">{formatVND(budget)}</span>
              </div>
              
              <div className="flex gap-1.5 flex-wrap mb-4">
                {[
                  { label: "< 1.5M", val: 1500000 },
                  { label: "3M", val: 3000000 },
                  { label: "5M", val: 5000000 },
                  { label: "10M", val: 10000000 },
                  { label: "Tất cả", val: 50000000 },
                ].map(({ label, val }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setBudget(val);
                      saveUserPreferences({ budget: val });
                      void saveRemoteUserPreferences({ ...getUserPreferences(), budget: val });
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-colors ${
                      budget === val
                        ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                        : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <input
                aria-label="Ngân sách tối đa"
                type="range"
                min={1500000}
                max={50000000}
                step={500000}
                value={budget}
                onChange={(e) => {
                  const nextBudget = Number(e.target.value);
                  setBudget(nextBudget);
                  saveUserPreferences({ budget: nextBudget });
                  void saveRemoteUserPreferences({ ...getUserPreferences(), budget: nextBudget });
                }}
                className="w-full"
              />
            </div>

            {/* Stops */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-5">
              <label htmlFor="search-max-stops" className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">
                Số điểm dừng tối đa
              </label>
              <select
                id="search-max-stops"
                value={maxStops}
                onChange={(e) => {
                  const nextStops = Number(e.target.value);
                  setMaxStops(nextStops);
                  saveUserPreferences({ maxStops: nextStops });
                  void saveRemoteUserPreferences({ ...getUserPreferences(), maxStops: nextStops });
                }}
                className="w-full bg-black/40 border border-white/[0.1] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value={0}>Bay thẳng</option>
                <option value={1}>Tối đa 1 điểm dừng</option>
                <option value={2}>Tối đa 2 điểm dừng</option>
                <option value={3}>Tối đa 3 điểm dừng</option>
              </select>
            </div>

            {/* Flight Time */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-5">
              <label htmlFor="search-max-flight-time" className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-2">
                Thời lượng bay tối đa
              </label>
              <select
                id="search-max-flight-time"
                value={maxFlightTimeMinutes ?? ""}
                onChange={(event) => {
                  const value = event.target.value ? Number(event.target.value) : undefined;
                  setMaxFlightTimeMinutes(value);
                  saveUserPreferences({ maxFlightTimeMinutes: value });
                  void saveRemoteUserPreferences({ ...getUserPreferences(), maxFlightTimeMinutes: value });
                }}
                className="w-full bg-black/40 border border-white/[0.1] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Không giới hạn</option>
                <option value="180">Tối đa 3 giờ</option>
                <option value="360">Tối đa 6 giờ</option>
                <option value="720">Tối đa 12 giờ</option>
              </select>
            </div>

            {/* Search Trigger Button */}
            <button
              onClick={() => runSearch(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-base font-semibold text-white shadow-sm transition-all disabled:opacity-50"
              disabled={isScanning}
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Tìm cơ hội phù hợp
                </>
              )}
            </button>
          </div>

          {/* RIGHT COLUMN: INTELLIGENCE SUMMARY & RESULTS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Search Intelligence Summary Card */}
            <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Tổng kết kết quả quan sát
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {fromCity} → {destination.trim() ? destination.toUpperCase() : "Tất cả"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3.5 rounded-lg bg-black/30 border border-white/[0.04]">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Cơ hội tìm thấy</span>
                  <span className="text-xl font-black text-white tabular-nums">{stats.totalFound} Deal Khớp</span>
                </div>
                <div className="p-3.5 rounded-lg bg-black/30 border border-white/[0.04]">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Giá thấp nhất</span>
                  <span className="text-xl font-black text-emerald-400 tabular-nums">
                    {stats.bestPrice > 0 ? formatVND(stats.bestPrice) : "—"}
                  </span>
                </div>
                <div className="p-3.5 rounded-lg bg-black/30 border border-white/[0.04]">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Mức giảm sâu nhất</span>
                  <span className="text-xl font-black text-blue-400 tabular-nums">
                    {stats.maxDiscount > 0 ? `-${stats.maxDiscount}%` : "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/[0.02] border border-white/[0.04] p-3 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Các mức giá được ghi nhận từ nhiều lần quan sát độc lập và so sánh với giá trung vị tương đương.
                </span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Danh sách chuyến bay phù hợp ({results.length})
                </h2>
                <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                  <Info className="w-3.5 h-3.5" />
                  Sắp xếp theo độ tin cậy và mức giảm
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.length > 0 ? (
                  results.map((deal) => (
                    <div key={deal.id}>
                      <DealCard deal={deal} />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full rounded-xl border border-white/[0.08] bg-[#121620] py-16 text-center">
                    <div className="w-12 h-12 bg-white/[0.04] rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <h3 className="text-white font-bold text-base mb-1">Không có deal nào phù hợp</h3>
                    <p className="text-slate-400 max-w-sm mx-auto text-xs">
                      Hãy thử nâng mức ngân sách hoặc mở rộng khoảng ngày để tìm thấy nhiều lựa chọn hơn.
                    </p>
                  </div>
                )}
              </div>
              
              {results.length > 0 && (
                <div className="rounded-xl border border-white/[0.08] bg-[#121620] p-6 text-center">
                  <p className="text-slate-300 text-sm mb-3">Bạn muốn nhận thông báo khi có thêm mức giá giảm sâu hơn?</p>
                  <Link 
                    to="/alerts" 
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    Cài đặt theo dõi tuyến này
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
