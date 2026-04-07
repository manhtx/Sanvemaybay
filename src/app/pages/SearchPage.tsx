import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Brain,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle,
  Zap,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Palmtree,
  UtensilsCrossed,
  Music,
  Mountain,
  ShoppingBag,
  Info,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router";
import { formatVND, Deal } from "../data/mockDeals";
import { getDeals, searchDeals } from "../data/api";
import { motion, AnimatePresence } from "motion/react";
import { DealCard } from "../components/DealCard";

const vibes = [
  { label: "Bãi biển", icon: Palmtree, color: "bg-cyan-500" },
  { label: "Ẩm thực", icon: UtensilsCrossed, color: "bg-orange-500" },
  { label: "Mua sắm", icon: ShoppingBag, color: "bg-pink-500" },
  { label: "Khám phá", icon: Mountain, color: "bg-emerald-500" },
  { label: "Lễ hội", icon: Music, color: "bg-purple-500" },
];

const departureCities = [
  { code: "HAN", name: "Hà Nội" },
  { code: "SGN", name: "TP. Hồ Chí Minh" },
  { code: "DAD", name: "Đà Nẵng" },
];

export function SearchPage() {
  const [budget, setBudget] = useState(15000000);
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [fromCity, setFromCity] = useState("HAN");
  const [results, setResults] = useState<Deal[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Stats for the radar
  const stats = useMemo(() => {
    return {
      totalFound: results.length,
      bestPrice: results.length > 0 ? Math.min(...results.map(r => r.price)) : 0,
      avgSaving: results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.discount, 0) / results.length) : 0
    };
  }, [results]);

  const runSearch = async (isManual = false) => {
    if (isManual) setIsScanning(true);
    
    const found = await searchDeals({
      budget,
      vibes: selectedVibes,
      from: fromCity
    });
    
    // Simulate thinking/scanning delay
    if (isManual) {
      await new Promise(r => setTimeout(r, 1500));
    }
    
    setResults(found);
    setIsScanning(false);
    setIsInitialLoad(false);
  };

  useEffect(() => {
    runSearch();
  }, [budget, fromCity, selectedVibes]);

  const toggleVibe = (vibe: string) => {
    setSelectedVibes(prev => 
      prev.includes(vibe) ? prev.filter(v => v !== vibe) : [...prev, vibe]
    );
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-slate-950 overflow-hidden relative">
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
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full mb-6">
                <Brain className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-sky-400 text-[10px] font-bold uppercase tracking-wider">AI Search Radar v2.0</span>
              </div>
              <h1 className="text-white text-4xl font-extrabold tracking-tight mb-4 leading-tight">
                Quét Deal <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-500">Thông Minh</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-md">
                Đừng tìm vé theo ngày. Hãy quét theo <span className="text-white font-medium">ngân sách</span> và <span className="text-white font-medium">phong cách</span> nghỉ dưỡng của bạn.
              </p>
            </motion.div>

            {/* From City */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
              <label className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">
                <MapPin className="w-4 h-4 text-sky-500" />
                Điểm khởi hành
              </label>
              <div className="grid grid-cols-3 gap-3">
                {departureCities.map(city => (
                  <button
                    key={city.code}
                    onClick={() => setFromCity(city.code)}
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

            {/* Budget Slider */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
              <div className="flex justify-between items-center mb-6">
                <label className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-500" />
                  Ngân sách tối đa
                </label>
                <span className="text-emerald-400 text-lg font-black">{formatVND(budget)}</span>
              </div>
              <input
                type="range"
                min={2000000}
                max={50000000}
                step={1000000}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-600 uppercase">
                <span>2M</span>
                <span>25M</span>
                <span>50M</span>
              </div>
            </div>

            {/* Vibes */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md">
              <label className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Phong cách chuyến đi
              </label>
              <div className="flex flex-wrap gap-2">
                {vibes.map(vibe => {
                  const Icon = vibe.icon;
                  const isActive = selectedVibes.includes(vibe.label);
                  return (
                    <button
                      key={vibe.label}
                      onClick={() => toggleVibe(vibe.label)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all border ${
                        isActive 
                          ? `${vibe.color} border-white/20 text-white shadow-lg` 
                          : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {vibe.label}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* CTA Refresh */}
            <button
              onClick={() => runSearch(true)}
              className="w-full h-16 bg-gradient-to-r from-sky-500 to-blue-600 rounded-3xl flex items-center justify-center gap-3 text-white font-black text-lg hover:shadow-2xl hover:shadow-sky-500/40 transition-all border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed group"
              disabled={isScanning}
            >
              {isScanning ? (
                <RefreshCw className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Search className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  QUÉT DEAL NGAY
                </>
              )}
            </button>
          </div>

          {/* RIGHT COLUMN: RADAR & RESULTS */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Visual Radar */}
            <div className="relative aspect-square sm:aspect-video lg:aspect-auto lg:h-[400px] bg-slate-900 border border-white/5 rounded-[40px] overflow-hidden flex items-center justify-center">
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
                    <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Radar Active</span>
                  </div>
                  <div className="text-white text-2xl font-black">{stats.totalFound} Deal Khớp</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Giá thấp nhất</div>
                  <div className="text-sky-400 text-2xl font-black">{formatVND(stats.bestPrice)}</div>
                </div>
              </div>

              {/* Center Icon */}
              <div className="w-16 h-16 bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center relative z-20 shadow-2xl">
                <Zap className="w-8 h-8 text-sky-400 fill-sky-400/20" />
              </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-white text-xl font-bold flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Hành trình tối ưu nhất
                </h2>
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Info className="w-4 h-4" />
                  Sắp xếp theo độ phù hợp AI
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
                  <div className="col-span-full py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[32px]">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Search className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-white font-bold mb-2">Không tìm thấy deal khớp</h3>
                    <p className="text-slate-500 max-w-xs mx-auto text-sm">
                      Hãy thử tăng ngân sách hoặc bỏ bớt vibe để AI có thêm không gian tìm kiếm.
                    </p>
                  </div>
                )}
              </div>
              
              {results.length > 0 && (
                <div className="p-8 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-[32px] text-center">
                  <p className="text-slate-400 text-sm mb-4">Bạn muốn nhận thông báo khi có thêm deal mới cho phong cách này?</p>
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
    </div>
  );
}