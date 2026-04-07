import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Plane, Zap, Bell, TrendingDown, Brain, Route, DollarSign, BarChart3,
  ShieldCheck, CheckCircle, X, ChevronRight, ArrowRight, Sparkles, Globe, Clock, Users,
} from "lucide-react";
import { DealCard } from "../components/DealCard";
import { mockDeals, formatVND } from "../data/mockDeals";

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
        {/* Small dot accent */}
        <div style={{
          position: "absolute",
          right: size + trailWidth * 0.6,
          top: "50%",
          transform: "translateY(-50%)",
          width: 3,
          height: 3,
          borderRadius: "50%",
          background: "rgba(56,189,248,0.5)",
          boxShadow: "0 0 4px rgba(56,189,248,0.8)",
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
const stats = [
  { label: "Deal được phát hiện", value: 247, suffix: "" },
  { label: "Tiết kiệm trung bình/vé", value: 3200000, suffix: "₫", isPrice: true },
  { label: "Người dùng theo dõi deal", value: 12840, suffix: "" },
  { label: "Nguồn giá quét mỗi giờ", value: 38, suffix: "" },
];

const features = [
  { icon: TrendingDown, color: "sky", title: "Deal Discovery Engine", description: "Quét giá vé từ 38+ nguồn, phát hiện giảm giá bất thường 20–50%. Không cần nhập điểm đến.", tag: "Core" },
  { icon: Brain, color: "violet", title: "Price Intelligence AI", description: "Phân tích ngày bay, seasonality, sự kiện, low demand. Giải thích vì sao giá rẻ bằng ngôn ngữ tự nhiên.", tag: "AI" },
  { icon: Route, color: "emerald", title: "Smart Route Builder", description: "Tự build multi-leg flight và self-transfer. Ví dụ: HAN → PVG → EU rẻ hơn bay thẳng đến 40%.", tag: "Smart" },
  { icon: DollarSign, color: "amber", title: "Hidden Cost Analyzer", description: "Bóc tách hành lý, chỗ ngồi, phí thanh toán. So sánh \"vé 89$\" thực tế có thể = 275$.", tag: "Transparency" },
  { icon: BarChart3, color: "rose", title: "Flexible Decision Engine", description: "Recommend: nên mua ngay / chờ / bỏ qua. Risk scoring cho từng deal. Refundable vs non-refundable.", tag: "Decision" },
  { icon: Bell, color: "orange", title: "Deal Alert System", description: "Nhận thông báo \"Hàn Quốc -35% trong 3 ngày tới\" qua Telegram hoặc Email. Cá nhân hoá theo budget.", tag: "Alert" },
  { icon: ShieldCheck, color: "slate", title: "Advanced Mode (Opt-in)", description: "Hidden city ticketing, complex routing. Cảnh báo rõ ràng trước khi dùng. Dành cho travel hacker.", tag: "Pro" },
];

const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
  sky: { bg: "bg-sky-500/10", border: "border-sky-500/20", text: "text-sky-400", iconBg: "bg-sky-500/20" },
  violet: { bg: "bg-violet-500/10", border: "border-violet-500/20", text: "text-violet-400", iconBg: "bg-violet-500/20" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", iconBg: "bg-emerald-500/20" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", iconBg: "bg-amber-500/20" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/20", text: "text-rose-400", iconBg: "bg-rose-500/20" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", iconBg: "bg-orange-500/20" },
  slate: { bg: "bg-slate-800/50", border: "border-slate-700/50", text: "text-slate-400", iconBg: "bg-slate-700/50" },
};

const comparisonData = [
  { feature: "Deal-first discovery", flycheap: true, skyscanner: false, google: false },
  { feature: "Giải thích vì sao rẻ", flycheap: true, skyscanner: false, google: false },
  { feature: "Multi-leg AI routing", flycheap: true, skyscanner: "partial", google: "partial" },
  { feature: "Hidden cost analysis", flycheap: true, skyscanner: false, google: false },
  { feature: "Risk scoring", flycheap: true, skyscanner: false, google: false },
  { feature: "Deal alert system", flycheap: true, skyscanner: "partial", google: "partial" },
  { feature: "Mua ngay / Chờ / Skip", flycheap: true, skyscanner: false, google: false },
  { feature: "Hoàn toàn miễn phí", flycheap: true, skyscanner: "partial", google: true },
];

const steps = [
  { number: "01", icon: Globe, title: "AI Quét Giá Toàn Cầu", description: "Hệ thống AI liên tục quét 38+ nguồn dữ liệu mỗi giờ, phát hiện giá bất thường dựa trên baseline 90 ngày.", color: "sky" },
  { number: "02", icon: Brain, title: "Phân Tích & Giải Thích", description: "AI phân tích nguyên nhân giảm giá, đánh giá rủi ro, và tính toán chi phí thực sự — không chỉ đưa số.", color: "violet" },
  { number: "03", icon: Bell, title: "Cảnh Báo Ngay Cho Bạn", description: "Nhận thông báo qua Telegram hoặc Email khi có deal phù hợp với budget và điểm đến bạn muốn.", color: "emerald" },
];

const liveDeals = [
  { from: "HAN", to: "ICN", discount: 44, price: "2.9M" },
  { from: "SGN", to: "CDG", discount: 55, price: "9.8M" },
  { from: "HAN", to: "NRT", discount: 51, price: "4.2M" },
  { from: "HAN", to: "SIN", discount: 58, price: "1.6M" },
  { from: "SGN", to: "SYD", discount: 56, price: "7.9M" },
  { from: "HAN", to: "JFK", discount: 59, price: "14.5M" },
];

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
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTickerIndex((i) => (i + 1) % liveDeals.length), 2800);
    return () => clearInterval(t);
  }, []);

  const currentTicker = liveDeals[tickerIndex];

  return (
    <div className="pt-16">
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
        @keyframes fadeSlideUp {
          0%   { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes scanLine {
          0%   { transform: scaleX(0) translateX(-50%); opacity: 0.8; }
          100% { transform: scaleX(1) translateX(0); opacity: 0; }
        }
        @keyframes tickerIn  { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes tickerOut { from { opacity:1; transform:translateY(0); }   to { opacity:0; transform:translateY(-12px); } }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 20px rgba(14,165,233,0.15), 0 0 60px rgba(14,165,233,0.05); }
          50%      { box-shadow: 0 0 40px rgba(14,165,233,0.3),  0 0 100px rgba(14,165,233,0.1); }
        }
        @keyframes borderGlow {
          0%,100% { opacity:0.4; }
          50%      { opacity:1; }
        }
        @keyframes radarSweep {
          0%   { transform: rotate(0deg);   opacity:0.6; }
          80%  { opacity:0.6; }
          100% { transform: rotate(360deg); opacity:0.6; }
        }
      `}</style>

      {/* ═══════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Layer 1 — Deep space background */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 50%, #03091f 0%, #020617 60%, #010310 100%)" }} />

        {/* Layer 2 — Twinkling stars */}
        <StarCanvas />

        {/* Layer 3 — Flight map SVG */}
        <FlightMapOverlay />

        {/* Layer 4 — Animated aurora orbs */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: "12%", left: "8%",
            width: 600, height: 600,
            background: "radial-gradient(circle, rgba(14,165,233,0.18) 0%, transparent 70%)",
            filter: "blur(60px)",
            animation: "orbDrift 18s ease-in-out infinite",
          }}
        />
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            bottom: "10%", right: "6%",
            width: 700, height: 700,
            background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "orbDrift2 22s ease-in-out infinite",
          }}
        />
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: "40%", left: "50%", transform: "translate(-50%, -50%)",
            width: 900, height: 400,
            background: "radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        {/* Layer 5 — Perspective grid */}
        <div className="absolute bottom-0 left-0 right-0 h-[45%] overflow-hidden pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(14,165,233,0.07) 1px, transparent 1px),
                linear-gradient(90deg, rgba(14,165,233,0.07) 1px, transparent 1px)
              `,
              backgroundSize: "80px 80px",
              transform: "perspective(500px) rotateX(65deg) translateY(20%)",
              transformOrigin: "center top",
              maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
            }}
          />
          {/* Horizon glow */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, rgba(14,165,233,0.4), transparent)" }}
          />
        </div>

        {/* Layer 6 — Flying planes */}
        <FloatingPlane top="16%" duration={32} delay={0}  size={30} opacity={0.65} animKey="p1" />
        <FloatingPlane top="30%" duration={48} delay={12} size={18} opacity={0.38} animKey="p2" />
        <FloatingPlane top="54%" duration={24} delay={6}  size={38} opacity={0.7}  animKey="p3" />
        <FloatingPlane top="72%" duration={38} delay={20} size={14} opacity={0.28} animKey="p4" />
        <FloatingPlane top="42%" duration={55} delay={35} size={12} opacity={0.22} animKey="p5" />

        {/* ── HERO CONTENT ── */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">

          {/* Animated live ticker */}
          <div
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full mb-10"
            style={{
              background: "rgba(2,6,23,0.85)",
              border: "1px solid rgba(14,165,233,0.25)",
              backdropFilter: "blur(16px)",
              animation: "borderGlow 3s ease-in-out infinite",
            }}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" style={{ boxShadow: "0 0 8px #4ade80" }} />
              <span className="text-emerald-400 text-xs" style={{ fontWeight: 700, letterSpacing: "0.05em" }}>LIVE</span>
            </div>
            <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.12)" }} />
            <div className="flex items-center gap-2 text-sm overflow-hidden" style={{ height: 20 }}>
              <Plane className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={tickerIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  className="text-slate-300 whitespace-nowrap"
                  style={{ fontWeight: 600 }}
                >
                  {currentTicker.from} → {currentTicker.to}
                  <span className="text-emerald-400 ml-1.5" style={{ fontWeight: 700 }}>
                    -{currentTicker.discount}%
                  </span>
                  <span className="text-slate-500 ml-1.5">từ {currentTicker.price}</span>
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-white mb-6"
            style={{
              fontSize: "clamp(2.8rem, 7.5vw, 5rem)",
              fontWeight: 900,
              letterSpacing: "-0.045em",
              lineHeight: 1.05,
            }}
          >
            Không cần biết{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #38bdf8 0%, #818cf8 60%, #e879f9 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 6s linear infinite",
              }}
            >
              đi đâu.
            </span>
            <br />
            Chỉ cần biết khi nào{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #34d399 0%, #06b6d4 60%, #38bdf8 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                animation: "shimmer 5s 1s linear infinite",
              }}
            >
              rẻ.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ fontSize: "1.15rem" }}
          >
            FlyCheap AI là radar giá vé máy bay toàn cầu — phát hiện cơ hội bay rẻ bất thường,{" "}
            <span className="text-slate-300">giải thích vì sao rẻ</span>, và cho bạn biết{" "}
            <span className="text-slate-300">có nên mua ngay không</span>.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            <Link
              to="/deals"
              className="relative flex items-center gap-3 px-9 py-4 text-white rounded-2xl transition-all overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
                fontWeight: 700,
                fontSize: "1rem",
                boxShadow: "0 0 30px rgba(14,165,233,0.35), 0 4px 20px rgba(0,0,0,0.4)",
                animation: "glowPulse 3s ease-in-out infinite",
              }}
            >
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)" }}
              />
              <Zap className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Xem Deal Ngay</span>
              <ArrowRight className="w-4 h-4 relative z-10" />
            </Link>
            <Link
              to="/alerts"
              className="flex items-center gap-3 px-9 py-4 text-white rounded-2xl transition-all hover:-translate-y-0.5 hover:bg-white/10"
              style={{
                fontWeight: 600,
                fontSize: "1rem",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
              }}
            >
              <Bell className="w-5 h-5 text-sky-400" />
              Đặt Alert Miễn Phí
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            {[
              { icon: ShieldCheck, label: "100% Miễn phí" },
              { icon: Globe, label: `${new Set(mockDeals.map(d => d.country)).size} quốc gia` },
              { icon: Zap, label: "Cập nhật mỗi giờ" },
              { icon: Users, label: "12,840 người dùng" },
              { icon: TrendingDown, label: `${mockDeals.length} deals active` },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-slate-500 text-sm">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.04)" }}>
                  <Icon className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <span>{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <div
            className="w-5 h-8 rounded-full flex justify-center pt-1.5"
            style={{ border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <div className="w-1 h-2 rounded-full animate-bounce" style={{ background: "rgba(255,255,255,0.4)" }} />
          </div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════
          STATS BAR
      ═══════════════════════════════════════════ */}
      <section className="py-14 border-y" style={{ background: "rgba(15,23,42,0.6)", borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TAGLINE / VISION
      ═══════════════════════════════════════════ */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-violet-400 text-xs" style={{ fontWeight: 600 }}>Đảo chiều logic tìm kiếm</span>
        </div>
        <h2 className="text-white mb-6" style={{ fontSize: "clamp(1.75rem, 4vw, 2.75rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
          Các nền tảng khác hỏi{" "}
          <span className="text-slate-500 line-through">"Bạn muốn đi đâu?"</span>
          <br />
          FlyCheap AI trả lời{" "}
          <span style={{ background: "linear-gradient(135deg, #38bdf8, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            "Bây giờ nên đi đâu vì đang rẻ"
          </span>
        </h2>
        <p className="text-slate-500 leading-relaxed" style={{ fontSize: "1.05rem" }}>
          Không cần biết điểm đến trước. Chỉ cần biết bạn có bao nhiêu ngày và budget bao nhiêu — AI sẽ tìm cơ hội tốt nhất cho bạn.
        </p>
      </section>

      {/* ═══════════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════════ */}
      <section className="py-16 bg-slate-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-white mb-3" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Hoạt động như thế nào?
            </h2>
            <p className="text-slate-500">3 bước đơn giản — AI làm hết, bạn chỉ cần đặt vé</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, idx) => {
              const colors = colorMap[step.color];
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative">
                  {idx < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-px bg-gradient-to-r from-white/10 to-transparent" />
                  )}
                  <div className={`${colors.bg} ${colors.border} border rounded-2xl p-6`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 ${colors.iconBg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${colors.text}`} />
                      </div>
                      <span className="text-slate-700" style={{ fontSize: "2.5rem", fontWeight: 900 }}>{step.number}</span>
                    </div>
                    <h3 className="text-white mb-2" style={{ fontWeight: 700 }}>{step.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          HOT DEALS PREVIEW
      ═══════════════════════════════════════════ */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                <span className="text-red-400 text-xs" style={{ fontWeight: 700 }}>ĐANG CÓ DEAL</span>
              </div>
              <h2 className="text-white" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Deal Nóng Hôm Nay
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                AI phát hiện {mockDeals.length} deal bất thường — giảm 44–60% bất kể ngày bay
              </p>
            </div>
            <Link
              to="/deals"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors"
              style={{ fontWeight: 600 }}
            >
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {mockDeals.slice(0, 4).map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
          <div className="text-center mt-8 sm:hidden">
            <Link
              to="/deals"
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
              style={{ fontWeight: 600 }}
            >
              Xem tất cả {mockDeals.length} deal <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          AI INSIGHT DEMO
      ═══════════════════════════════════════════ */}
      <section className="py-16 bg-slate-900/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-sky-500/10 border border-sky-500/20 rounded-full mb-6">
                <Brain className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-sky-400 text-xs" style={{ fontWeight: 600 }}>Price Intelligence AI</span>
              </div>
              <h2 className="text-white mb-4" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Không chỉ cho bạn giá.<br />
                <span className="text-sky-400">Cho bạn hiểu vì sao.</span>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Mỗi deal đều đi kèm phân tích AI: lý do giá giảm, mức độ rủi ro, và khuyến nghị rõ ràng — mua ngay, chờ, hay bỏ qua.
              </p>
              <ul className="space-y-3">
                {[
                  "Lý do giảm giá (low season, mở route mới, flash sale...)",
                  "Mức độ rủi ro: Thấp / Trung Bình / Cao",
                  "Chi phí thực tế sau khi tính ẩn phí",
                  "Khuyến nghị: Mua Ngay / Chờ / Bỏ Qua",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-slate-400 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={`/deals/${mockDeals[1].id}`}
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl transition-all hover:shadow-lg hover:shadow-sky-500/25"
                style={{ fontWeight: 600 }}
              >
                <Sparkles className="w-4 h-4" />
                Xem Phân Tích AI Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {/* Mock AI panel */}
            <div className="flex-1 w-full lg:max-w-md">
              <div className="bg-slate-900 border border-sky-500/20 rounded-2xl overflow-hidden shadow-2xl shadow-sky-500/5">
                <div className="bg-gradient-to-r from-sky-500/10 to-violet-500/10 border-b border-white/5 p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-violet-600 rounded-xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-white text-sm" style={{ fontWeight: 700 }}>Phân Tích AI</div>
                      <div className="text-slate-400 text-xs">HAN → NRT · Vietnam Airlines</div>
                    </div>
                    <div className="ml-auto px-3 py-1 bg-emerald-500 rounded-full text-white text-xs" style={{ fontWeight: 700 }}>MUA NGAY</div>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="bg-slate-800/50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="w-4 h-4 text-sky-400" />
                      <span className="text-sky-400 text-xs" style={{ fontWeight: 600 }}>Lý do giá giảm</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      Vietnam Airlines xả ghế trống cho chuyến bay tháng 11 — sau mùa lá đỏ tháng 10, lượng khách Nhật giảm 35%. Đây là đợt giảm giá kỷ lục trong 18 tháng.
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {["Sau Mùa Lá Đỏ", "Xả Ghế Trống", "Kỷ Lục 18 Tháng"].map((tag) => (
                      <span key={tag} className="px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs rounded-full" style={{ fontWeight: 600 }}>{tag}</span>
                    ))}
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm" style={{ fontWeight: 600 }}>AI Deal Score</span>
                      <span className="text-emerald-400" style={{ fontWeight: 800, fontSize: "1.1rem" }}>96<span className="text-slate-500 text-sm">/100</span></span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full w-[96%] bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <Clock className="w-4 h-4 text-red-400" />
                    <span className="text-red-300 text-sm" style={{ fontWeight: 600 }}>Deal hết hạn trong 3 ngày · Còn 7 ghế</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          FEATURES GRID
      ═══════════════════════════════════════════ */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-violet-400 text-xs" style={{ fontWeight: 600 }}>7 tính năng core</span>
            </div>
            <h2 className="text-white mb-3" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Hệ sinh thái AI hoàn chỉnh
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">Mỗi tính năng được thiết kế để giải quyết một vấn đề cụ thể trong hành trình săn vé rẻ</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {features.map((feature) => {
              const colors = colorMap[feature.color];
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className={`${colors.bg} ${colors.border} border rounded-2xl p-5 hover:scale-[1.02] transition-transform cursor-default`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 ${colors.iconBg} rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${colors.bg} ${colors.text} border ${colors.border}`} style={{ fontWeight: 700 }}>
                      {feature.tag}
                    </span>
                  </div>
                  <h3 className="text-white mb-2" style={{ fontWeight: 700, fontSize: "0.95rem" }}>{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          COMPARISON TABLE
      ═══════════════════════════════════════════ */}
      <section className="py-16 bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-white mb-3" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
              So sánh với các nền tảng khác
            </h2>
            <p className="text-slate-500">FlyCheap AI khác gì Skyscanner và Google Flights?</p>
          </div>
          <div className="bg-slate-900 border border-white/8 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-4 gap-0 border-b border-white/8">
              <div className="p-4 col-span-1" />
              <div className="p-4 text-center border-l border-white/8">
                <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Plane className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-white text-sm" style={{ fontWeight: 700 }}>FlyCheap AI</div>
              </div>
              <div className="p-4 text-center border-l border-white/8">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Globe className="w-4 h-4 text-orange-400" />
                </div>
                <div className="text-slate-400 text-sm" style={{ fontWeight: 600 }}>Skyscanner</div>
              </div>
              <div className="p-4 text-center border-l border-white/8">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-slate-400 text-sm" style={{ fontWeight: 600 }}>Google Flights</div>
              </div>
            </div>
            {comparisonData.map((row, idx) => (
              <div key={row.feature} className={`grid grid-cols-4 gap-0 border-b border-white/5 last:border-0 ${idx % 2 === 0 ? "" : "bg-slate-800/20"}`}>
                <div className="p-4 text-slate-400 text-sm flex items-center">{row.feature}</div>
                <div className="p-4 flex items-center justify-center border-l border-white/8">
                  {row.flycheap === true ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <X className="w-5 h-5 text-red-500/60" />}
                </div>
                <div className="p-4 flex items-center justify-center border-l border-white/8">
                  {row.skyscanner === true ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                    row.skyscanner === "partial" ? <div className="w-5 h-5 rounded-full border-2 border-amber-400/60 flex items-center justify-center"><div className="w-2 h-2 bg-amber-400/60 rounded-full" /></div> :
                      <X className="w-5 h-5 text-red-500/60" />}
                </div>
                <div className="p-4 flex items-center justify-center border-l border-white/8">
                  {row.google === true ? <CheckCircle className="w-5 h-5 text-emerald-400" /> :
                    row.google === "partial" ? <div className="w-5 h-5 rounded-full border-2 border-amber-400/60 flex items-center justify-center"><div className="w-2 h-2 bg-amber-400/60 rounded-full" /></div> :
                      <X className="w-5 h-5 text-red-500/60" />}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 mt-4 justify-center text-xs text-slate-600">
            <div className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Hỗ trợ đầy đủ</div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full border border-amber-400/60 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-amber-400/60 rounded-full" /></div>
              Hỗ trợ cơ bản
            </div>
            <div className="flex items-center gap-1.5"><X className="w-3.5 h-3.5 text-red-500/60" /> Không hỗ trợ</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ALERT CTA
      ═══════════════════════════════════════════ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <div className="relative bg-gradient-to-br from-sky-500/10 to-violet-500/10 border border-sky-500/20 rounded-3xl p-10 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-sky-500/30">
                <Bell className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-white mb-4" style={{ fontSize: "clamp(1.5rem, 3.5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.02em" }}>
                Không bỏ lỡ deal nào nữa
              </h2>
              <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                Đặt alert một lần — AI tự động theo dõi và báo cho bạn ngay khi có deal phù hợp. Qua Telegram hoặc Email. Hoàn toàn miễn phí.
              </p>
              <Link
                to="/alerts"
                className="inline-flex items-center gap-3 px-8 py-4 text-white rounded-2xl transition-all hover:shadow-lg hover:shadow-sky-500/30 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)",
                  fontWeight: 700,
                  fontSize: "1rem",
                }}
              >
                <Zap className="w-5 h-5" />
                Đặt Alert Miễn Phí Ngay
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-slate-600 text-sm mt-4">Không cần tạo tài khoản · Hủy bất kỳ lúc nào</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
