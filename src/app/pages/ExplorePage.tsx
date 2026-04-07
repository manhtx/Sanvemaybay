import React, { useState, useEffect } from "react";
import { 
  Compass, Map, Sparkles, TrendingDown, 
  ChevronRight, Globe, Plane, Filter, 
  Palmtree, Mountain, Building2, Coffee
} from "lucide-react";
import { Link } from "react-router";
import { getDeals } from "../data/api";
import { Deal, formatVND } from "../data/mockDeals";
import { motion, AnimatePresence } from "motion/react";

const CATEGORIES = [
  { id: "all", label: "Tất cả", icon: Compass },
  { id: "beach", label: "Biển đảo", icon: Palmtree },
  { id: "mountain", label: "Núi rừng", icon: Mountain },
  { id: "city", label: "Thành phố", icon: Building2 },
  { id: "short", label: "Ngắn ngày", icon: Coffee },
];

export function ExplorePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getDeals();
      setDeals(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      {/* ── HERO DISCOVERY ── */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 via-slate-950 to-slate-950" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sky-500/5 blur-[120px] rounded-full animate-pulse" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-black tracking-widest uppercase mb-6">
              <Sparkles className="w-4 h-4" /> Khám phá thế giới cùng AI
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tight">
              Bạn muốn đi đâu <br />
              với <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">ngân sách tốt nhất?</span>
            </h1>
          </motion.div>

          <div className="flex bg-slate-900/50 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl max-w-xl mx-auto">
            <div className="flex-1 px-4 flex items-center gap-3">
              <Globe className="w-5 h-5 text-slate-500" />
              <input 
                type="text" 
                placeholder="Tìm điểm đến, quốc gia..." 
                className="bg-transparent border-none outline-none text-white w-full text-sm font-medium"
              />
            </div>
            <button className="bg-sky-500 hover:bg-sky-400 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-sky-500/20">
              Tìm kiếm
            </button>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4">
        {/* ── CATEGORIES ── */}
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar mb-12">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all border ${
                category === cat.id 
                  ? "bg-white text-slate-950 border-white shadow-xl shadow-white/10" 
                  : "bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/10"
              }`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── DISCOVERY GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
             Array(8).fill(0).map((_, i) => (
                <div key={i} className="h-[400px] bg-slate-900/50 rounded-3xl animate-pulse border border-white/5" />
             ))
          ) : (
            deals.map((deal, idx) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link to={`/deals/${deal.id}`} className="group block relative h-[400px] rounded-3xl overflow-hidden bg-slate-900 border border-white/5 hover:border-sky-500/50 transition-all shadow-xl">
                  <img 
                    src={deal.image} 
                    alt={deal.to} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-80" 
                  />
                  
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

        {/* ── AI CURATED SECTION ── */}
        <section className="mt-20 p-8 sm:p-12 bg-gradient-to-br from-indigo-500/10 via-sky-500/5 to-transparent border border-white/5 rounded-[40px] relative overflow-hidden">
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-sky-500/10 blur-[100px] rounded-full" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <div>
              <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 mb-6">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight">
                Gợi ý dựa trên <br />
                <span className="text-sky-400">hành vi của bạn.</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Hệ thống AI của FlyCheap phân tích hàng triệu dữ liệu để tìm ra những điểm đến phù hợp nhất với sở thích và ngân sách lịch sử của bạn.
              </p>
              <button className="flex items-center gap-2 text-white font-black hover:text-sky-400 transition-colors">
                Xem thêm <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {[1, 2].map(i => (
                 <div key={i} className="space-y-4">
                    <div className="aspect-[3/4] bg-slate-900 rounded-3xl border border-white/5 overflow-hidden relative group">
                       <div className="absolute inset-0 bg-slate-800 animate-pulse" />
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
