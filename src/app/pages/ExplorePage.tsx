import React, { useState, useEffect } from "react";
import { Map, ChevronRight, Globe, Calendar, DollarSign, RotateCcw } from "lucide-react";
import { Link } from "react-router";
import { getDeals } from "../data/api";
import { Deal, formatVND } from "../data/deals";
import { motion } from "motion/react";
import { buildDestinationInsights, isWeekendFlightDate } from "../domain/destinationInsights";

const BUDGET_PRESETS = [
  { label: "Tất cả", value: null },
  { label: "≤ 1,5 tr", value: 1_500_000 },
  { label: "≤ 2,5 tr", value: 2_500_000 },
  { label: "≤ 4 tr", value: 4_000_000 },
  { label: "≤ 6 tr", value: 6_000_000 },
];

const REGION_OPTIONS = [
  { label: "Tất cả khu vực", value: "all" },
  { label: "Nội địa", value: "domestic" },
  { label: "Châu Á", value: "asia" },
  { label: "Quốc tế khác", value: "other" },
];

export function ExplorePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [query, setQuery] = useState("");
  const [maxBudget, setMaxBudget] = useState<number | null>(null);
  const [weekendOnly, setWeekendOnly] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getDeals();
      setDeals(data);
      setLoading(false);
    }
    load();
  }, []);

  const hasActiveFilters = Boolean(query.trim() || maxBudget !== null || weekendOnly || selectedRegion !== "all");

  const resetFilters = () => {
    setQuery("");
    setMaxBudget(null);
    setWeekendOnly(false);
    setSelectedRegion("all");
  };

  const filteredDeals = deals.filter((deal) => {
    const matchesQuery = `${deal.to} ${deal.toCode} ${deal.country}`
      .toLocaleLowerCase("vi")
      .includes(query.trim().toLocaleLowerCase("vi"));
    if (!matchesQuery) return false;

    if (maxBudget !== null && deal.realTotal > maxBudget) {
      return false;
    }

    if (weekendOnly && !isWeekendFlightDate(deal.departDate)) {
      return false;
    }

    if (selectedRegion === "domestic" && deal.region !== "domestic") {
      return false;
    }
    if (selectedRegion === "asia" && deal.region !== "asia") {
      return false;
    }
    if (selectedRegion === "other" && (deal.region === "domestic" || deal.region === "asia")) {
      return false;
    }

    return true;
  });

  const destinationInsights = buildDestinationInsights(filteredDeals);

  return (
    <main className="min-h-screen bg-slate-950 pb-20 text-slate-200">
      {/* ── HERO DISCOVERY ── */}
      <section className="relative min-h-[460px] flex items-center justify-center overflow-hidden py-12">
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-gradient-to-b from-pink-500/10 via-slate-950 to-slate-950" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/5 blur-[120px] rounded-full animate-pulse" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-pink-400">
              <Globe className="w-4 h-4" /> Khám phá từ dữ liệu deal hiện có
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tight">
              Bạn muốn đi đâu <br />
              với <span className="text-pink-400">ngân sách tốt nhất?</span>
            </h1>
          </motion.div>

          <div className="mx-auto flex max-w-xl rounded-2xl border border-white/10 bg-[#171719] p-2 shadow-2xl mb-5">
            <div className="flex-1 px-4 flex items-center gap-3">
              <Globe className="w-5 h-5 text-slate-500 shrink-0" />
              <input 
                aria-label="Tìm điểm đến"
                type="text" 
                placeholder="Tìm điểm đến, quốc gia..." 
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="bg-transparent border-none outline-none text-white w-full text-sm font-medium"
              />
            </div>
          </div>

          {/* ── BUDGET & FILTER CONTROLS ── */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 bg-white/5 rounded-full border border-white/10">
              <DollarSign className="w-3.5 h-3.5 text-pink-400" />
              <span>Ngân sách:</span>
              <div className="flex items-center gap-1">
                {BUDGET_PRESETS.map((preset) => {
                  const isActive = maxBudget === preset.value;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setMaxBudget(preset.value)}
                      className={`px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                        isActive
                          ? "bg-pink-500 text-white shadow-sm"
                          : "text-slate-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setWeekendOnly(!weekendOnly)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border transition-colors ${
                weekendOnly
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Cuối tuần (T7, CN)</span>
            </button>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-1 text-xs font-bold rounded-full border border-white/10 bg-[#171719] text-slate-300 outline-none hover:border-pink-500/40 cursor-pointer"
              aria-label="Lọc theo khu vực"
            >
              {REGION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                  {opt.label}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </section>


      <div className="max-w-7xl mx-auto px-4">
        {!loading && destinationInsights.length > 0 && (
          <section className="mb-10" aria-label="Destination insights">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="text-2xl font-black text-white">Cơ hội theo điểm đến</h2>
                <p className="text-slate-500 text-sm">Tổng hợp từ các deal đã được hệ thống ghi nhận.</p>
              </div>
              <span className="text-slate-500 text-xs">{destinationInsights.length} điểm đến</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {destinationInsights.slice(0, 4).map((insight) => (
                <Link key={insight.destinationCode} to={`/deals/${insight.topDealId}`} className="rounded-2xl border border-white/10 bg-[#171719] p-4 transition-colors hover:border-pink-500/40">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white font-bold">{insight.destination}</span>
                    {insight.hasWeekendDeal && <span className="text-[10px] text-emerald-400">Cuối tuần</span>}
                  </div>
                  <div className="text-slate-500 text-xs mb-1">Giá thực tế thấp nhất</div>
                  <div className="text-emerald-400 text-xl font-black">{formatVND(insight.cheapestPrice)}</div>
                  <div className="flex justify-between mt-3 text-xs text-slate-500">
                    <span>{insight.dealCount} deal</span>
                    <span>Giảm TB {Math.round(insight.averageDiscount)}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        {/* ── DISCOVERY GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
             Array(8).fill(0).map((_, i) => (
                <div key={i} className="h-[400px] bg-slate-900/50 rounded-3xl animate-pulse border border-white/5" />
             ))
          ) : (
            filteredDeals.map((deal, idx) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link to={`/deals/${deal.id}`} className="group relative block h-[400px] overflow-hidden rounded-3xl border border-white/10 bg-[#171719] shadow-xl transition-all hover:border-pink-500/50">
                  {deal.image ? (
                    <img
                      src={deal.image}
                      alt={deal.to}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-80"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-sky-950 via-slate-900 to-indigo-950" />
                  )}
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                  
                  <div className="absolute top-4 right-4">
                    <div className="px-3 py-1 bg-emerald-500 text-[10px] font-black text-white rounded-full shadow-lg">
                      -{deal.discount}%
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 text-sky-400 text-[10px] font-black tracking-widest uppercase mb-1">
                      <Map className="w-3 h-3" /> {deal.country}
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 leading-tight group-hover:text-sky-300 transition-colors">
                      {deal.to}
                    </h3>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-slate-500 text-[10px] font-bold line-through">{formatVND(deal.normalPrice)}</div>
                        <div className="text-xl font-black text-white">{formatVND(deal.price)}</div>
                      </div>
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
        {!loading && filteredDeals.length === 0 && (
          <div className="py-16 text-center text-slate-500">
            Không có deal nào khớp với tìm kiếm hiện tại.
          </div>
        )}
      </div>
    </main>
  );
}
