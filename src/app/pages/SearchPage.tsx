import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  TrendingUp,
  MapPin,
  Zap,
  SlidersHorizontal,
  ChevronRight,
  Info,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router";
import { formatVND, Deal } from "../data/deals";
import { getTrackedRoutes, searchDeals } from "../data/api";
import { uniqueOrigins } from "../data/origins";
import { motion, AnimatePresence } from "motion/react";
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

  // Stats for the radar
  const stats = useMemo(() => {
    return {
      totalFound: results.length,
      bestPrice: results.length > 0 ? Math.min(...results.map(r => r.price)) : 0,
      avgSaving: results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.discount, 0) / results.length) : 0
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
    <main className="relative min-h-screen overflow-hidden pb-20 pt-24">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* LEFT COLUMN: CONTROLS */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-3 py-1">
                <Search className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-400">Dữ liệu quan sát đa nguồn</span>
              </div>
              <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-white">
                Tìm Kiếm <span className="text-pink-400">Cơ Hội Vé</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-md">
                Lọc các mức giá quan sát thực tế theo điểm khởi hành, điểm đến và mức ngân sách dự kiến của bạn.
              </p>
            </motion.div>

            {/* From City */}
            <div className="rounded-2xl border border-white/10 bg-[#171719] p-5">
              <label className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">
                <MapPin className="w-4 h-4 text-sky-500" />
                Điểm khởi hành
              </label>
              <div className="grid grid-cols-3 gap-3">
                {departureCities.map(city => (
                  <button
                    key={city.code}
                    onClick={() => {
                      setFromCity(city.code);
                  saveUserPreferences({ homeAirport: city.code });
                  void saveRemoteUserPreferences({ ...getUserPreferences(), homeAirport: city.code });
                    }}
                    className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all border ${
                      fromCity === city.code 
                        ? "bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/25" 
                        : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#171719] p-5">
              <label htmlFor="search-destination" className="text-slate-500 text-xs font-bold uppercase tracking-widest block mb-3">
                Điểm đến (tuỳ chọn)
              </label>
              <input id="search-destination" value={destination} onChange={(event) => setDestination(event.target.value)}
                placeholder="Ví dụ: BKK, Bangkok, Đà Nẵng, Phú Quốc" className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/40" />
              <p className="text-slate-500 text-xs mt-2">Tìm theo mã sân bay, tên thành phố hoặc quốc gia.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#171719] p-5">
              <label className="text-slate-500 text-xs font-bold uppercase tracking-widest block mb-3">Khoảng ngày khởi hành</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input aria-label="Ngày khởi hành từ" type="date" value={departureFrom} max={departureTo || undefined}
                  onChange={(e) => { const value = e.target.value; setDepartureFrom(value); saveUserPreferences({ departureFrom: value || undefined }); void saveRemoteUserPreferences({ ...getUserPreferences(), departureFrom: value || undefined }); }}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm" />
                <input aria-label="Ngày khởi hành đến" type="date" value={departureTo} min={departureFrom || undefined}
                  onChange={(e) => { const value = e.target.value; setDepartureTo(value); saveUserPreferences({ departureTo: value || undefined }); void saveRemoteUserPreferences({ ...getUserPreferences(), departureTo: value || undefined }); }}
                  className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm" />
              </div>
              <p className="text-slate-500 text-xs mt-2">Bao gồm cả ngày bắt đầu và ngày kết thúc.</p>
            </div>

            {/* Budget Slider & Presets */}
            <div className="rounded-2xl border border-white/10 bg-[#171719] p-5">
              <div className="flex justify-between items-center mb-4">
                <label className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                  Ngân sách tối đa
                </label>
                <span className="text-emerald-400 text-lg font-black">{formatVND(budget)}</span>
              </div>
              
              {/* Presets */}
              <div className="flex gap-2 flex-wrap mb-4">
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
                    className={`px-2.5 py-1 text-xs rounded-lg border font-semibold transition-colors ${budget === val ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" : "bg-slate-800 border-white/5 text-slate-400 hover:text-white"}`}
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
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-600 uppercase">
                <span>1.5M</span>
                <span>25M</span>
                <span>50M</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#171719] p-5">
              <label htmlFor="search-max-stops" className="text-slate-500 text-xs font-bold uppercase tracking-widest block mb-3">
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
                className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/40"
              >
                <option value={0}>Bay thẳng</option>
                <option value={1}>Tối đa 1 điểm dừng</option>
                <option value={2}>Tối đa 2 điểm dừng</option>
                <option value={3}>Tối đa 3 điểm dừng</option>
              </select>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#171719] p-5">
              <label htmlFor="search-max-flight-time" className="text-slate-500 text-xs font-bold uppercase tracking-widest block mb-3">
                Thời lượng bay tối đa
              </label>
              <select id="search-max-flight-time" value={maxFlightTimeMinutes ?? ""}
                onChange={(event) => {
                  const value = event.target.value ? Number(event.target.value) : undefined;
                  setMaxFlightTimeMinutes(value);
                  saveUserPreferences({ maxFlightTimeMinutes: value });
                  void saveRemoteUserPreferences({ ...getUserPreferences(), maxFlightTimeMinutes: value });
                }}
                className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/40"
              >
                <option value="">Không giới hạn</option>
                <option value="180">Tối đa 3 giờ</option>
                <option value="360">Tối đa 6 giờ</option>
                <option value="720">Tối đa 12 giờ</option>
              </select>
            </div>

            {/* CTA Refresh */}
            <button
              onClick={() => runSearch(true)}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-lg font-bold text-white shadow-lg shadow-pink-500/15 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isScanning}
            >
              {isScanning ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Tìm cơ hội
                </>
              )}
            </button>
          </div>

          {/* RIGHT COLUMN: RADAR & RESULTS */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Visual Radar */}
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#171719] sm:aspect-video lg:h-[400px] lg:aspect-auto">
              {/* Radar Background Lines */}
              <div className="absolute inset-0 opacity-20">
                {[10, 30, 50, 70, 90].map(size => (
                  <div 
                    key={size}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-500"
                    style={{ width: `${size}%`, height: `${size}%` }}
                  />
                ))}
                <div className="absolute top-1/2 left-0 w-full h-px bg-sky-500" />
                <div className="absolute left-1/2 top-0 w-px h-full bg-sky-500" />
              </div>

              {/* Pulsing Scanner */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute w-[150%] h-[150%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none origin-center"
                style={{
                  background: "conic-gradient(from 0deg, transparent 0deg, rgba(14, 165, 233, 0.2) 30deg, transparent 60deg)"
                }}
              />

              {/* Deal Dots */}
              <AnimatePresence>
                {results.slice(0, 15).map((deal, idx) => {
                  // Random-ish but deterministic positions
                  const hue = (idx * 137.5) % 360;
                  const dist = 20 + (idx * 7) % 65;
                  const angle = (idx * 45 + (idx % 3) * 15) % 360;
                  
                  return (
                    <motion.div
                      key={deal.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="absolute w-3 h-3 rounded-full cursor-pointer hover:scale-150 transition-transform"
                      style={{
                        backgroundColor: `hsl(${hue}, 70%, 60%)`,
                        boxShadow: `0 0 15px hsl(${hue}, 70%, 60%)`,
                        top: `calc(50% + ${Math.sin(angle * Math.PI / 180) * dist/2}%)`,
                        left: `calc(50% + ${Math.cos(angle * Math.PI / 180) * dist/2}%)`
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/20 text-white text-[10px] px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {deal.to} - {formatVND(deal.price)}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Status Overlay */}
              <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Bộ lọc đang hoạt động</span>
                  </div>
                  <div className="text-white text-2xl font-black">{stats.totalFound} Deal Khớp</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Giá thấp nhất</div>
                  <div className="text-sky-400 text-2xl font-black">{formatVND(stats.bestPrice)}</div>
                </div>
              </div>

              {/* Center Icon */}
              <div className="relative z-20 flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-[#202023] shadow-2xl">
                <Zap className="w-8 h-8 text-sky-400 fill-sky-400/20" />
              </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-xl font-bold flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Kết quả phù hợp
                </h2>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Info className="w-4 h-4" />
                  Kết quả khớp bộ lọc
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {results.length > 0 ? (
                  results.map((deal, idx) => (
                    <motion.div
                      key={deal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <DealCard deal={deal} />
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/[0.03] py-20 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Search className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-white font-bold mb-2">Không tìm thấy deal khớp</h3>
                    <p className="text-slate-500 max-w-xs mx-auto text-sm">
                      Hãy thử tăng ngân sách hoặc bỏ bớt tiêu chí để mở rộng kết quả.
                    </p>
                  </div>
                )}
              </div>
              
              {results.length > 0 && (
                <div className="rounded-2xl border border-pink-500/20 bg-gradient-to-br from-orange-500/10 via-pink-500/10 to-violet-500/10 p-8 text-center">
                  <p className="text-slate-400 text-sm mb-4">Bạn muốn nhận thông báo khi có thêm mức giá phù hợp?</p>
                  <Link 
                    to="/alerts" 
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold hover:bg-slate-100 transition-colors"
                  >
                    Cài Báo Giá Ngay
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
