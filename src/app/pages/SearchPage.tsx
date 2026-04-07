import { useState } from "react";
import {
  Plane,
  Search,
  Brain,
  Route,
  Sparkles,
  ArrowRight,
  ChevronDown,
  Clock,
  DollarSign,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Zap,
  Bell,
} from "lucide-react";
import { Link } from "react-router";
import { formatVND } from "../data/mockDeals";

const departureCities = [
  { code: "HAN", name: "Hà Nội" },
  { code: "SGN", name: "TP. Hồ Chí Minh" },
  { code: "DAD", name: "Đà Nẵng" },
];

const durations = ["3–5 ngày", "5–7 ngày", "7–10 ngày", "10–14 ngày", "14+ ngày"];
const months = [
  "Tháng 6/2026", "Tháng 7/2026", "Tháng 8/2026", "Tháng 9/2026",
  "Tháng 10/2026", "Tháng 11/2026", "Tháng 12/2026",
  "Tháng 1/2027", "Tháng 2/2027", "Tháng 3/2027",
  "Tháng 4/2027", "Tháng 5/2027", "Tháng 6/2027",
];
const budgets = [
  { label: "Dưới 2 triệu", min: 0, max: 2000000 },
  { label: "2–5 triệu", min: 2000000, max: 5000000 },
  { label: "5–10 triệu", min: 5000000, max: 10000000 },
  { label: "10–20 triệu", min: 10000000, max: 20000000 },
  { label: "Trên 20 triệu", min: 20000000, max: 99999999 },
];

interface SmartRoute {
  id: string;
  legs: { from: string; to: string; airline: string; price: number; duration: string }[];
  totalPrice: number;
  directPrice: number;
  saving: number;
  savingPercent: number;
  aiNote: string;
  risk: "low" | "medium";
  riskNote: string;
  aiScore: number;
}

const mockSmartRoutes: SmartRoute[] = [
  {
    id: "r1",
    legs: [
      { from: "HAN", to: "PVG", airline: "China Eastern", price: 2100000, duration: "3h 30m" },
      { from: "PVG", to: "FCO", airline: "Alitalia", price: 4200000, duration: "11h 20m" },
    ],
    totalPrice: 6300000,
    directPrice: 14500000,
    saving: 8200000,
    savingPercent: 57,
    aiNote: "Bay qua Thượng Hải tiết kiệm 57% so với bay thẳng HAN→FCO. China Eastern đang có flash sale trên leg đầu.",
    risk: "medium",
    riskNote: "Quá cảnh PVG cần 4h — vừa đủ thời gian. Tuy nhiên đây là self-transfer: nếu trễ chuyến 1, bạn tự chịu chi phí đổi vé chuyến 2.",
    aiScore: 88,
  },
  {
    id: "r2",
    legs: [
      { from: "HAN", to: "BKK", airline: "VietJet Air", price: 1250000, duration: "1h 55m" },
      { from: "BKK", to: "NRT", airline: "Thai Airways", price: 3800000, duration: "6h 30m" },
    ],
    totalPrice: 5050000,
    directPrice: 8500000,
    saving: 3450000,
    savingPercent: 41,
    aiNote: "Bangkok là hub giá rẻ vào Nhật. Thai Airways có giá tốt trên BKK→NRT do cạnh tranh với Zipair. Tổng hành trình 2 vé rẻ hơn 1 vé thẳng 41%.",
    risk: "low",
    riskNote: "Quá cảnh BKK 3h tại Suvarnabhumi — rộng rãi và dễ di chuyển. Đây là connected ticket qua Thai Airways — nếu trễ chuyến 1, Thai Airways có trách nhiệm.",
    aiScore: 85,
  },
  {
    id: "r3",
    legs: [
      { from: "SGN", to: "DOH", airline: "Qatar Airways", price: 3200000, duration: "7h 30m" },
      { from: "DOH", to: "LHR", airline: "Qatar Airways", price: 4800000, duration: "7h 15m" },
    ],
    totalPrice: 8000000,
    directPrice: 18000000,
    saving: 10000000,
    savingPercent: 56,
    aiNote: "Qatar Airways đang khuyến mãi mạnh trên route SGN–DOH–LHR. Doha là hub trung tâm của Qatar — kết nối hoàn hảo, hành lý không cần lấy ra.",
    risk: "low",
    riskNote: "Vé connected ticket chính thức. Quá cảnh Doha 2h — đủ thoải mái tại terminal sang trọng. Hành lý check-through không cần làm lại.",
    aiScore: 93,
  },
];

function RouteLeg({ leg, isLast }: { leg: SmartRoute["legs"][0]; isLast: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 flex-1">
        <div className="text-center">
          <div className="text-white text-sm" style={{ fontWeight: 800 }}>{leg.from}</div>
        </div>
        <div className="flex-1 flex items-center gap-1">
          <div className="h-px flex-1 bg-slate-700" />
          <div className="flex flex-col items-center">
            <Plane className="w-4 h-4 text-sky-400" />
            <span className="text-slate-600 text-xs">{leg.duration}</span>
          </div>
          <div className="h-px flex-1 bg-slate-700" />
        </div>
        <div className="text-center">
          <div className="text-white text-sm" style={{ fontWeight: 800 }}>{leg.to}</div>
        </div>
      </div>
      {!isLast && (
        <div className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs rounded-full whitespace-nowrap" style={{ fontWeight: 600 }}>
          Quá cảnh
        </div>
      )}
    </div>
  );
}

function SmartRouteCard({ route }: { route: SmartRoute }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900 border border-white/8 rounded-2xl overflow-hidden hover:border-sky-500/30 transition-colors">
      <div className="p-5">
        {/* Route path */}
        <div className="mb-4 space-y-3">
          {route.legs.map((leg, idx) => (
            <RouteLeg key={idx} leg={leg} isLast={idx === route.legs.length - 1} />
          ))}
        </div>

        {/* Price comparison */}
        <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4 mb-4">
          <div>
            <div className="text-slate-500 text-xs mb-0.5">Bay thẳng thông thường</div>
            <div className="text-slate-400 line-through text-sm">{formatVND(route.directPrice)}</div>
          </div>
          <div className="text-slate-600 text-xl">→</div>
          <div className="text-right">
            <div className="text-slate-500 text-xs mb-0.5">Multi-leg AI route</div>
            <div className="text-emerald-400" style={{ fontWeight: 800, fontSize: "1.35rem" }}>{formatVND(route.totalPrice)}</div>
            <div className="text-emerald-500 text-xs" style={{ fontWeight: 700 }}>
              Tiết kiệm {formatVND(route.saving)} (-{route.savingPercent}%)
            </div>
          </div>
        </div>

        {/* AI note */}
        <div className="bg-sky-500/5 border border-sky-500/10 rounded-xl p-4 mb-4">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-sky-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-white" style={{ fontSize: "9px", fontWeight: 800 }}>AI</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{route.aiNote}</p>
          </div>
        </div>

        {/* Risk */}
        <div className={`flex items-start gap-3 p-3 rounded-xl mb-4 ${
          route.risk === "low"
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : "bg-amber-500/10 border border-amber-500/20"
        }`}>
          {route.risk === "low" ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          )}
          <div>
            <span className={`text-xs ${route.risk === "low" ? "text-emerald-400" : "text-amber-400"}`} style={{ fontWeight: 700 }}>
              Rủi ro {route.risk === "low" ? "Thấp" : "Trung Bình"}:
            </span>
            <p className={`text-xs mt-0.5 leading-relaxed ${route.risk === "low" ? "text-emerald-300/80" : "text-amber-300/80"}`}>
              {route.riskNote}
            </p>
          </div>
        </div>

        {/* Legs detail toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-300 text-xs transition-colors w-full"
          style={{ fontWeight: 600 }}
        >
          Chi tiết từng chặng
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>

        {expanded && (
          <div className="mt-4 space-y-3 border-t border-white/8 pt-4">
            {route.legs.map((leg, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-800/30 rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="text-white text-sm" style={{ fontWeight: 600 }}>
                      {leg.from} → {leg.to}
                    </div>
                    <div className="text-slate-500 text-xs">{leg.airline} · {leg.duration}</div>
                  </div>
                </div>
                <div className="text-emerald-400 text-sm" style={{ fontWeight: 700 }}>
                  {formatVND(leg.price)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI score + CTA */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
          <div>
            <div className="text-slate-500 text-xs mb-1">AI Route Score</div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full" style={{ width: `${route.aiScore}%` }} />
              </div>
              <span className="text-emerald-400 text-xs" style={{ fontWeight: 700 }}>{route.aiScore}/100</span>
            </div>
          </div>
          <a
            href="#"
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm transition-colors"
            style={{ fontWeight: 600 }}
          >
            Đặt Vé
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

export function SearchPage() {
  const [fromCity, setFromCity] = useState("HAN");
  const [duration, setDuration] = useState("5–7 ngày");
  const [budget, setBudget] = useState(1);
  const [month, setMonth] = useState("Tháng 6/2026");
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = () => {
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      setSearched(true);
    }, 1800);
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-5">
            <Route className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 text-xs" style={{ fontWeight: 600 }}>Smart Route Builder</span>
          </div>
          <h1 className="text-white mb-3" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Tìm Vé Thông Minh
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto">
            Nhập budget và thời gian — AI tự động tìm multi-leg routes rẻ hơn bay thẳng đến 57%
          </p>
        </div>

        {/* Search form */}
        <div className="bg-slate-900 border border-white/8 rounded-2xl p-6 mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Departure city */}
            <div>
              <label className="text-slate-500 text-xs mb-2 block" style={{ fontWeight: 600 }}>
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                Điểm khởi hành
              </label>
              <select
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/40 cursor-pointer"
              >
                {departureCities.map((c) => (
                  <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="text-slate-500 text-xs mb-2 block" style={{ fontWeight: 600 }}>
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                Thời gian đi
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/40 cursor-pointer"
              >
                {durations.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Budget */}
            <div>
              <label className="text-slate-500 text-xs mb-2 block" style={{ fontWeight: 600 }}>
                <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                Budget tối đa (khứ hồi)
              </label>
              <select
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/40 cursor-pointer"
              >
                {budgets.map((b, idx) => (
                  <option key={b.label} value={idx}>{b.label}</option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div>
              <label className="text-slate-500 text-xs mb-2 block" style={{ fontWeight: 600 }}>
                <Plane className="w-3.5 h-3.5 inline mr-1" />
                Thời điểm bay
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-sky-500/40 cursor-pointer"
              >
                {months.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={searching}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl text-white transition-all ${
              searching
                ? "bg-slate-700 cursor-not-allowed"
                : "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 hover:shadow-lg hover:shadow-sky-500/30"
            }`}
            style={{ fontWeight: 700, fontSize: "1rem" }}
          >
            {searching ? (
              <>
                <Brain className="w-5 h-5 animate-pulse" />
                AI đang phân tích {mockSmartRoutes.length * 180}+ hành trình...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Tìm Route Tối Ưu với AI
                <Sparkles className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Loading state */}
        {searching && (
          <div className="text-center py-12">
            <div className="flex items-center justify-center gap-3 mb-6">
              {["Quét 38+ nguồn giá...", "Tính toán multi-leg...", "Phân tích rủi ro..."].map((step, idx) => (
                <div key={step} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: `${idx * 0.2}s` }} />
                  <span className="text-slate-500 text-sm">{step}</span>
                  {idx < 2 && <ArrowRight className="w-4 h-4 text-slate-700" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {searched && !searching && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-white" style={{ fontWeight: 700, fontSize: "1.25rem" }}>
                  AI tìm được {mockSmartRoutes.length} hành trình tối ưu
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Từ {departureCities.find(c => c.code === fromCity)?.name} · {duration} · {month}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-xs" style={{ fontWeight: 700 }}>
                  Tiết kiệm tối đa đến 57%
                </span>
              </div>
            </div>

            {/* Advanced mode warning */}
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-6">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-amber-300 text-sm" style={{ fontWeight: 600 }}>Lưu ý về Self-Transfer Routes</p>
                <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                  Một số route dưới đây là self-transfer (2 vé riêng biệt). Nếu chuyến 1 bị trễ, bạn tự chịu chi phí đổi chuyến 2.
                  FlyCheap AI luôn ghi rõ rủi ro này trước mỗi route.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {mockSmartRoutes.map((route) => (
                <SmartRouteCard key={route.id} route={route} />
              ))}
            </div>

            {/* CTA for alerts */}
            <div className="mt-8 bg-slate-900/60 border border-white/8 rounded-2xl p-6 text-center">
              <p className="text-slate-400 mb-4">
                Muốn được thông báo tự động khi có route tốt hơn?
              </p>
              <Link
                to="/alerts"
                className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl transition-colors"
                style={{ fontWeight: 600 }}
              >
                <Bell className="w-4 h-4" />
                Đặt Alert cho Route Này
              </Link>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!searched && !searching && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-slate-900 border border-white/8 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Route className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-slate-500 mb-2" style={{ fontWeight: 600 }}>Smart Route Builder</h3>
            <p className="text-slate-600 text-sm max-w-md mx-auto">
              Nhập thông tin chuyến đi của bạn — AI sẽ tìm các combination vé rẻ hơn bay thẳng, bao gồm multi-leg và self-transfer routes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}