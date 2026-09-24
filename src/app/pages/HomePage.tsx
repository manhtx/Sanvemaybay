import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Plane, Zap, Bell,
  ChevronRight, ArrowRight,
} from "lucide-react";
import { DealCard } from "../components/DealCard";
import { formatVND, Deal } from "../data/deals";
import { getDeals, getTrackedRoutes } from "../data/api";
import { rankPersonalizedFeed } from "../domain/travelFeed";
import { getUserPreferences } from "../lib/preferences";
import { buildTravelFeedSections } from "../domain/travelFeedSections";

// ─────────────────────────────────────────────────
// ANIMATED COUNTER HOOK
// ─────────────────────────────────────────────────
function useCounter(end: number, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return count;
}

// ─────────────────────────────────────────────────
// TWINKLING STAR CANVAS
// ─────────────────────────────────────────────────
function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.3 + 0.2,
      base: Math.random() * 0.55 + 0.1,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.025 + 0.008,
    }));
    let raf: number, t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t++;
      stars.forEach((s) => {
        const m = Math.sin(t * s.speed + s.twinkle) * 0.3 + 0.7;
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(148,163,184,${s.base * m})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ─────────────────────────────────────────────────
// FLIGHT MAP SVG OVERLAY
// ─────────────────────────────────────────────────
const CITIES = [
  { code: "HAN", x: 790, y: 268, label: "Hà Nội", primary: true },
  { code: "SGN", x: 795, y: 318, label: "TP.HCM", primary: true },
  { code: "ICN", x: 880, y: 215, label: "Seoul" },
  { code: "NRT", x: 945, y: 222, label: "Tokyo" },
  { code: "SIN", x: 784, y: 342, label: "Singapore" },
  { code: "BKK", x: 758, y: 292, label: "Bangkok" },
  { code: "CDG", x: 452, y: 182, label: "Paris" },
  { code: "LHR", x: 437, y: 167, label: "London" },
  { code: "JFK", x: 112, y: 218, label: "New York" },
  { code: "DXB", x: 612, y: 252, label: "Dubai" },
  { code: "SYD", x: 985, y: 438, label: "Sydney" },
  { code: "AMS", x: 462, y: 172, label: "Amsterdam" },
  { code: "IST", x: 538, y: 210, label: "Istanbul" },
];

const PATHS = [
  { d: "M790,268 Q835,230 880,215", active: true },
  { d: "M790,268 Q867,226 945,222", active: false },
  { d: "M790,268 Q621,178 452,182", active: true },
  { d: "M795,318 Q890,372 985,438", active: true },
  { d: "M790,268 Q451,118 112,218", active: true },
  { d: "M795,318 Q703,272 612,252", active: false },
  { d: "M880,215 Q496,102 112,218", active: false },
  { d: "M790,268 Q664,228 538,210", active: true },
  { d: "M945,222 Q965,328 985,438", active: false },
  { d: "M452,182 Q437,170 437,167", active: false },
];

function FlightMapOverlay() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity: 0.22 }}
      aria-hidden="true"
    >
      <defs>
        <filter id="glow-soft">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-strong">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Flight paths */}
      {PATHS.map((p, i) => (
        <g key={i}>
          {/* Glow layer */}
          <path
            d={p.d} fill="none"
            stroke={p.active ? "#38bdf8" : "#818cf8"}
            strokeWidth={p.active ? "1.5" : "0.8"}
            strokeOpacity="0.3"
            filter="url(#glow-soft)"
          />
          {/* Animated dashes */}
          <path
            d={p.d} fill="none"
            stroke={p.active ? "#38bdf8" : "#818cf8"}
            strokeWidth={p.active ? "1" : "0.6"}
            strokeDasharray={p.active ? "5 8" : "3 10"}
            style={{
              animation: `flightDash ${p.active ? 3 + i * 0.4 : 5 + i * 0.3}s linear infinite`,
            }}
          />
        </g>
      ))}

      {/* City dots */}
      {CITIES.map((city) => (
        <g key={city.code} filter="url(#glow-soft)">
          {/* Ping ring */}
          {city.primary && (
            <>
              <circle cx={city.x} cy={city.y} r="12" fill="none" stroke="#38bdf8" strokeWidth="1"
                style={{ animation: `cityPing 2.4s ease-out infinite`, transformOrigin: `${city.x}px ${city.y}px` }} />
              <circle cx={city.x} cy={city.y} r="18" fill="none" stroke="#38bdf8" strokeWidth="0.5"
                style={{ animation: `cityPing 2.4s 0.8s ease-out infinite`, transformOrigin: `${city.x}px ${city.y}px` }} />
            </>
          )}
          {/* Core dot */}
          <circle cx={city.x} cy={city.y}
            r={city.primary ? 4 : 2.5}
            fill={city.primary ? "#38bdf8" : "#818cf8"}
          />
          {/* Label */}
          <text x={city.x + 7} y={city.y + 4}
            fill={city.primary ? "#bae6fd" : "#c4b5fd"}
            fontSize={city.primary ? "10" : "8"}
            style={{ fontWeight: city.primary ? 700 : 500 }}
          >
            {city.code}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────
// SINGLE FLYING PLANE
// ─────────────────────────────────────────────────
interface PlaneProps {
  top: string;
  duration: number;
  delay: number;
  size?: number;
  opacity?: number;
  animKey: string;
}
function FloatingPlane({ top, duration, delay, size = 24, opacity = 0.5, animKey }: PlaneProps) {
  const trailWidth = size * 3.5;
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        top,
        left: 0,
        zIndex: 4,
        opacity,
        animation: `planeFly ${duration}s ${delay}s linear infinite`,
      }}
    >
      <div style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        animation: `planeBob ${(duration * 0.28).toFixed(1)}s ease-in-out ${delay}s infinite`,
      }}>
        {/* Contrail */}
        <div style={{
          position: "absolute",
          right: size - 2,
          top: "50%",
          transform: "translateY(-50%)",
          width: trailWidth,
          height: animKey === "p1" ? 2 : 1.5,
          background: "linear-gradient(to left, rgba(56,189,248,0.7), rgba(56,189,248,0.1), transparent)",
          borderRadius: 2,
        }} />
        <Plane
          style={{ width: size, height: size, color: "#7dd3fc", filter: "drop-shadow(0 0 6px rgba(56,189,248,0.8))" }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// DATA & CONSTANTS
// ─────────────────────────────────────────────────
// ─────────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────────
function StatCard({ label, value, suffix, isPrice }: { label: string; value: number; suffix: string; isPrice?: boolean }) {
  const count = useCounter(value, 1500);
  const display = isPrice ? formatVND(count) : count.toLocaleString("vi-VN");
  return (
    <div className="text-center">
      <div className="text-white mb-1" style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
        {display}{suffix && !isPrice ? suffix : ""}
      </div>
      <div className="text-slate-500 text-sm">{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// HOMEPAGE
// ─────────────────────────────────────────────────
export function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [trackedRouteCount, setTrackedRouteCount] = useState(0);
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    Promise.all([getDeals(), getTrackedRoutes()]).then(([loadedDeals, trackedRoutes]) => {
      setDeals(rankPersonalizedFeed(loadedDeals, getUserPreferences()));
      setTrackedRouteCount(trackedRoutes.length);
    });
  }, []);
  const feedSections = buildTravelFeedSections(deals, getUserPreferences());

  useEffect(() => {
    if (deals.length < 2) return;
    const t = setInterval(() => setTickerIndex((i) => (i + 1) % deals.length), 2800);
    return () => clearInterval(t);
  }, [deals.length]);

  const currentTicker = deals.length ? deals[tickerIndex % deals.length] : undefined;
  const averageSaving =
    deals.length > 0
      ? Math.round(
          deals.reduce((total, deal) => total + (deal.normalPrice - deal.price), 0) /
            deals.length,
        )
      : 0;
  const stats = [
    { label: "Deal đang hoạt động", value: deals.length, suffix: "" },
    { label: "Tiết kiệm trung bình/vé", value: averageSaving, suffix: "₫", isPrice: true },
    { label: "Tuyến bay đang theo dõi", value: trackedRouteCount, suffix: "" },
    { label: "Deal có độ tin cậy cao", value: deals.filter((deal) => (deal.confidence ?? 0) >= 0.8).length, suffix: "" },
  ];

  return (
    <main className="pb-0 pt-16">
      {/* ── CSS KEYFRAMES ── */}
      <style>{`
        @keyframes planeFly {
          0%   { transform: translateX(-220px); }
          100% { transform: translateX(calc(100vw + 220px)); }
        }
        @keyframes planeBob {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-9px); }
        }
        @keyframes flightDash {
          0%   { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -26; }
        }
        @keyframes cityPing {
          0%   { transform: scale(1);   opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes orbDrift {
          0%,100% { transform: translate(0px, 0px) scale(1); }
          33%      { transform: translate(35px, -25px) scale(1.08); }
          66%      { transform: translate(-20px, 18px) scale(0.94); }
        }
        @keyframes orbDrift2 {
          0%,100% { transform: translate(0px, 0px) scale(1); }
          33%      { transform: translate(-40px, 20px) scale(1.06); }
          66%      { transform: translate(25px, -15px) scale(0.96); }
        }
        @keyframes shimmer {
          0%   { background-position: -400% center; }
          100% { background-position: 400% center; }
        }
        @keyframes borderGlow {
          0%,100% { opacity:0.4; }
          50%      { opacity:1; }
        }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 20px rgba(14,165,233,0.15), 0 0 60px rgba(14,165,233,0.05); }
          50%      { box-shadow: 0 0 40px rgba(14,165,233,0.3),  0 0 100px rgba(14,165,233,0.1); }
        }
      `}</style>

      {/* ═══════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 50%, #03091f 0%, #020617 60%, #010310 100%)" }} />
        <StarCanvas />
        <FlightMapOverlay />
        <div className="absolute pointer-events-none rounded-full" style={{ top: "12%", left: "8%", width: 600, height: 600, background: "radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%)", filter: "blur(60px)", animation: "orbDrift 18s ease-in-out infinite" }} />
        <div className="absolute pointer-events-none rounded-full" style={{ bottom: "10%", right: "6%", width: 700, height: 700, background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)", filter: "blur(80px)", animation: "orbDrift2 22s ease-in-out infinite" }} />
        
        {/* Layer 5 — Perspective grid */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] overflow-hidden pointer-events-none">
          <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(rgba(14,165,233,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(14,165,233,0.07) 1px, transparent 1px)`, backgroundSize: "80px 80px", transform: "perspective(500px) rotateX(65deg) translateY(20%)", transformOrigin: "center top", maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)" }} />
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(14,165,233,0.4), transparent)" }} />
        </div>

        {/* Layer 6 — Flying planes */}
        <FloatingPlane top="16%" duration={32} delay={0}  size={30} opacity={0.65} animKey="p1" />
        <FloatingPlane top="30%" duration={48} delay={12} size={18} opacity={0.38} animKey="p2" />
        <FloatingPlane top="54%" duration={24} delay={6}  size={38} opacity={0.7}  animKey="p3" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="mb-10 flex max-w-full items-center gap-2 overflow-hidden rounded-full px-3 py-2.5 sm:gap-3 sm:px-5" style={{ background: "rgba(2,6,23,0.85)", border: "1px solid rgba(14,165,233,0.25)", backdropFilter: "blur(16px)", animation: "borderGlow 3s ease-in-out infinite" }}>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-sky-400 rounded-full" /><span className="text-sky-400 text-xs" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>DỮ LIỆU</span></div>
            <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.12)" }} />
            <div className="flex min-w-0 items-center gap-2 overflow-hidden text-sm" style={{ height: 20 }}>
              <Plane className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <AnimatePresence mode="wait">
                <motion.span key={tickerIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="truncate whitespace-nowrap font-semibold text-slate-300">
                  {currentTicker ? (
                    <>
                      {currentTicker.fromCode} → {currentTicker.toCode}
                      <span className="text-emerald-400 ml-1.5 font-bold">-{currentTicker.discount}%</span>
                      <span className="text-slate-500 ml-1.5">từ {formatVND(currentTicker.price)}</span>
                    </>
                  ) : (
                    "Đang thu thập dữ liệu giá đã xác minh"
                  )}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mx-auto mb-6 max-w-4xl text-balance text-[clamp(2.45rem,7.5vw,5rem)] font-black leading-[1.05] tracking-tight text-white">
            Không cần biết <span style={{ background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 60%, #e879f9 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 6s linear infinite" }}>đi đâu.</span><br />
            Chỉ cần biết khi nào <span style={{ background: "linear-gradient(135deg, #34d399 0%, #06b6d4 60%, #38bdf8 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", animation: "shimmer 5s 1s linear infinite" }}>rẻ.</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }} className="text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed text-lg">
            FlyCheap AI theo dõi các tuyến bay đang được hỗ trợ — phát hiện cơ hội giá thấp, <span className="text-slate-300">giải thích dựa trên lịch sử</span>, và đưa ra <span className="text-slate-300">mức độ tin cậy rõ ràng</span>.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.38 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link to="/deals" className="relative flex items-center gap-3 px-9 py-4 text-white rounded-2xl font-bold text-lg shadow-xl shadow-sky-500/35 hover:scale-105 transition-all" style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)", animation: "glowPulse 3s ease-in-out infinite" }}>
              <Zap className="w-5 h-5" />
              Xem Deal Ngay
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/alerts" className="flex items-center gap-3 px-9 py-4 text-white rounded-2xl font-semibold bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all">
              <Bell className="w-5 h-5 text-sky-400" />
              Đặt Alert Miễn Phí
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════ */}
      <section className="py-14 border-y bg-slate-900/60 border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOT DEALS PREVIEW
      ═══════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-1.5 h-1.5 rounded-full ${deals.length ? "bg-emerald-400" : "bg-slate-500"}`} />
                <span className={`text-xs font-bold ${deals.length ? "text-emerald-400" : "text-slate-500"}`}>
                  {deals.length ? "ĐANG CÓ DEAL" : "ĐANG TÍCH LŨY DỮ LIỆU"}
                </span>
              </div>
              <h2 className="text-white text-3xl font-extrabold tracking-tight">Deal Nóng Hôm Nay</h2>
              <p className="text-slate-500 mt-1">
                Phát hiện {deals.length} deal đạt ngưỡng dựa trên lịch sử giá
              </p>
            </div>
            <Link to="/deals" className="hidden sm:flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {feedSections.hot.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
          {deals.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-10 text-center">
              <h3 className="font-bold text-white">Chưa có deal đủ điều kiện</h3>
              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
                Hệ thống cần ít nhất ba lần quét lịch sử trước khi công bố một
                mức giá là deal. Bạn có thể đặt cảnh báo trong lúc dữ liệu được
                tích lũy.
              </p>
            </div>
          )}
        </div>
      </section>

      {deals.length > 0 && (
        <section className="py-16 border-t border-white/5" aria-label="Các section feed dữ liệu">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
            {[
              ["Mới phát hiện", feedSections.newlyDetected],
              ["Giảm giá lớn nhất", feedSections.biggestDrops],
              ["Đề xuất theo preference", feedSections.recommendations],
              ["Điểm đến đang nổi bật", feedSections.trendingDestinations],
            ].map(([title, items]) => (
              <div key={title as string}>
                <h2 className="text-white text-2xl font-extrabold mb-5">{title as string}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {(items as Deal[]).map((deal) => <DealCard key={`${title}-${deal.id}`} deal={deal} />)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          ALERT CTA
      ═══════════════════════════════════════════ */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-lg shadow-sky-500/20"><Bell className="w-8 h-8 text-white" /></div>
          <h2 className="text-white text-4xl font-black mb-6 tracking-tight">Không bỏ lỡ deal nào nữa</h2>
          <p className="text-slate-400 text-lg mb-12 max-w-lg mx-auto">Đặt alert một lần — hệ thống tự động theo dõi và báo cho bạn khi có deal phù hợp qua Telegram/Email.</p>
          <Link to="/alerts" className="inline-flex items-center gap-3 px-10 py-5 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-black text-xl transition-all shadow-2xl shadow-sky-500/30">
            Đặt Alert Miễn Phí <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </main>
  );
}
