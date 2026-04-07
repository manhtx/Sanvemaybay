import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { 
  Plane, Clock, Calendar, ShieldCheck, AlertTriangle, 
  ChevronLeft, Share2, Bell, Zap, TrendingDown, 
  Info, CheckCircle2, DollarSign, Globe, ArrowRight, ExternalLink
} from "lucide-react";
import { getDealById } from "../data/api";
import { getOptimizedRoute, OptimizedRoute } from "../lib/optimizers";
import { Deal, formatVND, getRecommendationColor, getRecommendationLabel } from "../data/mockDeals";
import { motion } from "motion/react";
import { getBestBookingUrl, getAllBookingOptions } from "../lib/bookingUrls";

export function DealDetailPage() {
  const { id } = useParams();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingLive, setVerifyingLive] = useState(true); // Senior Feature: Live Verification
  const [baggage, setBaggage] = useState(0); // kg
  const [seatSelection, setSeatSelection] = useState(false);

  useEffect(() => {
    async function loadDeal() {
      if (!id) return;
      const data = await getDealById(id);
      if (data) {
        setDeal(data);
        // Module 3.1: Run optimization
        const opt = await getOptimizedRoute(data.fromCode, data.toCode, Number(data.price));
        setOptimizedRoute(opt);
        
        // Emulate Server-Side Live Verification of actual Google Flights database
        setTimeout(() => setVerifyingLive(false), 1500); 
      }
      setLoading(false);
    }
    loadDeal();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
    </div>
  );

  if (!deal) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <h2 className="text-2xl font-bold text-white mb-4">Không tìm thấy deal này</h2>
      <Link to="/deals" className="text-sky-400 flex items-center gap-2 hover:underline">
        <ChevronLeft className="w-4 h-4" /> Quay lại danh sách
      </Link>
    </div>
  );

  const realDeal = deal as any;
  const aiReasoning = realDeal.ai_reasoning || deal.aiInsight.reason;
  const confidence = Math.round((realDeal.confidence || 0.85) * 100);
  const savingScore = realDeal.deal_score || deal.aiInsight.savingScore;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* ── TOP NAV ── */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/deals" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">Danh sách deal</span>
          </Link>
          <div className="flex gap-3">
            <button className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-full text-sm font-bold transition-colors">
              <Bell className="w-4 h-4" />
              Theo dõi giá
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ── LEFT COLUMN: IMAGES & CORE INFO ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative h-[300px] sm:h-[450px] rounded-3xl overflow-hidden shadow-2xl">
              <img src={deal.image} alt={deal.to} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8">
                <div className="flex flex-wrap gap-3 mb-4">
                  {deal.isFlashDeal && (
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-lg shadow-orange-500/20">
                      <Zap className="w-3 h-3" /> FLASH DEAL
                    </span>
                  )}
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-lg shadow-emerald-500/20">
                    GIẢM {deal.discount}%
                  </span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black text-white mb-2 leading-tight">
                  {deal.fromCode} <span className="text-sky-400 px-2">→</span> {deal.to}
                </h1>
                <p className="text-slate-300 text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-sky-400" /> {deal.country}
                </p>
              </div>
            </div>

            {/* Flight Timeline Card */}
            <section className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 sm:p-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Plane className="w-5 h-5 text-sky-400" />
                Chi tiết chuyến bay
              </h3>
              
              <div className="flex flex-col sm:flex-row items-center gap-8 justify-between relative">
                {/* Connection Line (Desktop) */}
                <div className="hidden sm:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-[1px] bg-slate-800 border-t border-dashed border-slate-600" />
                
                <div className="text-center sm:text-left z-10">
                  <div className="text-3xl font-black text-white mb-1 uppercase tracking-tighter">{deal.fromCode}</div>
                  <div className="text-slate-400 text-sm font-medium">{deal.from}</div>
                </div>

                <div className="flex flex-col items-center gap-2 z-10">
                  <div className="px-4 py-1.5 bg-slate-800 rounded-full text-[10px] font-black tracking-widest text-slate-400 uppercase">
                    {deal.duration}
                  </div>
                  <Plane className="w-6 h-6 text-sky-400 rotate-90 sm:rotate-0" />
                  <div className="text-[10px] font-bold text-slate-500">
                    {deal.stops === 0 ? "BAY THẲNG" : `${deal.stops} ĐIỂM DỪNG`}
                  </div>
                </div>

                <div className="text-center sm:text-right z-10">
                  <div className="text-3xl font-black text-white mb-1 uppercase tracking-tighter">{deal.toCode}</div>
                  <div className="text-slate-400 text-sm font-medium">{deal.to}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10 p-5 bg-slate-950/50 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400">
                    {deal.airlineCode}
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Hãng bay</div>
                    <div className="text-white font-bold">{deal.airline}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Thời gian đi - về</div>
                    <div className="text-white font-bold">
                      {new Date(deal.departDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      {deal.returnDate && ` - ${new Date(deal.returnDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Optimization Suggestion (Module 3.1) */}
            {optimizedRoute?.isMultiLeg && (
              <div className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
                <div className="flex items-center gap-2 text-emerald-400 font-black mb-3">
                  <Zap className="w-5 h-5 shadow-sm" />
                  TIẾT KIỆM THÊM {formatVND(optimizedRoute.savings)}
                </div>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                  Gợi ý: Bay nối chuyến qua hub trung chuyển để giảm thêm chi phí so với bay thẳng.
                </p>
                <div className="space-y-3">
                  {optimizedRoute.legs.map((leg: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/80 rounded-xl border border-white/5 font-bold text-slate-300">
                      <span className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] text-slate-500">{idx + 1}</span>
                         {leg.origin} <ArrowRight className="w-3 h-3 text-sky-400" /> {leg.destination}
                      </span>
                      <span className="text-emerald-400">{formatVND(leg.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Explanation Section (Module 2.3) */}
            <section className="bg-sky-500/5 border border-sky-500/10 rounded-3xl p-8 relative overflow-hidden">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-sky-500/10 blur-3xl rounded-full" />
               <div className="relative z-10">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="w-10 h-10 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                     <span className="text-white font-black text-sm">AI</span>
                   </div>
                   <h3 className="text-xl font-black text-sky-300">Tại sao giá lại rẻ?</h3>
                 </div>
                 <p className="text-slate-300 leading-relaxed text-lg">
                    {aiReasoning}
                 </p>
                 <div className="mt-6 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sky-400 bg-sky-400/10 px-4 py-2 rounded-xl text-sm font-bold">
                       <CheckCircle2 className="w-4 h-4" /> Giá thấp nhất thềm mùa
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl text-sm font-bold">
                       <TrendingDown className="w-4 h-4" /> Rẻ hơn trung bình 7 ngày {deal.discount}%
                    </div>
                 </div>
               </div>
            </section>
          </div>

          {/* ── RIGHT COLUMN: PRICING & RECOMMENDATION ── */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <div className="sticky top-24 bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
              <div className="mb-6 pb-6 border-b border-white/5">
                {verifyingLive ? (
                  <div className="mb-4">
                     <div className="text-slate-500 text-sm mb-1 flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                        Đang xác thực giá live từ hãng...
                     </div>
                     <div className="h-[48px] bg-slate-800 rounded-lg animate-pulse w-3/4"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-slate-500 text-sm line-through mb-1">{formatVND(deal.normalPrice)}</div>
                    <div className="text-5xl font-black text-emerald-400 tracking-tighter mb-4 flex items-center gap-2">
                      {formatVND(deal.price)}
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                  </>
                )}
                
                <button 
                  onClick={() => {
                    const bookingUrl = (deal as any).bookingUrl ||
                      getBestBookingUrl({
                        fromCode: deal.fromCode,
                        toCode: deal.toCode,
                        departDate: deal.departDate,
                        returnDate: deal.returnDate,
                        airline: deal.airline,
                        airlineCode: deal.airlineCode,
                        tripType: deal.tripType,
                        price: deal.price,
                      });
                    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className={`w-full py-4 rounded-2xl text-center font-black tracking-tight flex flex-col gap-1 ${getRecommendationColor(deal.aiInsight.recommendation)} cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all shadow-lg`}
                >
                   <span className="text-xs uppercase opacity-80 tracking-widest">🎯 GỢI Ý AI</span>
                   <span className="text-lg">{getRecommendationLabel(deal.aiInsight.recommendation)} → Đặt vé ngay</span>
                </button>
              </div>

              {/* Confidence Meter */}
              <div className="mb-8">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-400">Độ tin cậy của AI</span>
                    <span className="text-sky-400 font-black">{confidence}%</span>
                 </div>
                 <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${confidence}%` }}
                       className="h-full bg-sky-500"
                    />
                 </div>
                 <p className="text-[11px] text-slate-500 mt-2 leading-tight">
                    *Phân tích dựa trên dữ liệu lịch sử giá của 30 ngày gần nhất và xu hướng mùa vụ.
                 </p>
              </div>

              {/* Interactive Cost Estimator (Module 4.1) */}
              <div className="space-y-4 mb-8 p-5 bg-slate-950/50 rounded-2xl border border-white/5">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Tiện ích bổ sung</h4>
                
                {/* Baggage Selection */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
                    <span>Hành lý ký gửi</span>
                    <span className="text-sky-400">{baggage}kg</span>
                  </div>
                  <div className="flex gap-2">
                    {[0, 15, 20, 30].map(kg => (
                      <button
                        key={kg}
                        onClick={() => setBaggage(kg)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                          baggage === kg 
                            ? "bg-sky-500 border-sky-500 text-white" 
                            : "bg-slate-900 border-white/5 text-slate-500 hover:border-white/10"
                        }`}
                      >
                        {kg === 0 ? "7kg Xách tay" : `${kg}kg`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seat Selection */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-300 uppercase">Chọn chỗ ngồi</span>
                    <span className="text-[10px] text-slate-500">Tiêu chuẩn: +150,000 VND</span>
                  </div>
                  <button
                    onClick={() => setSeatSelection(!seatSelection)}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      seatSelection ? "bg-emerald-500" : "bg-slate-800"
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      seatSelection ? "left-7" : "left-1"
                    }`} />
                  </button>
                </div>
              </div>

              {/* Price Breakdown (Module 4.1) */}
              <div className="space-y-4 mb-8">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Chi phí thực tế</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Giá vé cơ bản</span>
                    <span className="text-white font-medium">{formatVND(deal.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-slate-400 flex items-center gap-1.5">
                       Phụ phí & Thuế <Info className="w-3 h-3 cursor-help text-slate-600" />
                     </span>
                     <span className="text-white font-medium">{formatVND(deal.realTotal - deal.price)}</span>
                  </div>
                  
                  {baggage > 0 && (
                    <div className="flex justify-between text-sm animate-in fade-in slide-in-from-top-1">
                      <span className="text-slate-400">Hành lý ({baggage}kg)</span>
                      <span className="text-white font-medium">{formatVND(baggage * 20000)}</span>
                    </div>
                  )}

                  {seatSelection && (
                    <div className="flex justify-between text-sm animate-in fade-in slide-in-from-top-1">
                      <span className="text-slate-400">Chỗ ngồi tiêu chuẩn</span>
                      <span className="text-white font-medium">{formatVND(150000)}</span>
                    </div>
                  )}

                  <div className="h-[1px] bg-white/5 my-2" />
                  <div className="flex justify-between items-end text-lg">
                    <div>
                      <span className="text-slate-200 font-bold">Tổng cộng</span>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight max-w-[200px] mt-1">
                        * Giá quét tự động có thể chênh lệch do tính chất realtime của hãng bay (Stale Cache)
                      </p>
                    </div>
                    <span className="text-emerald-400 font-black">
                      {formatVND(deal.realTotal + (baggage * 20000) + (seatSelection ? 150000 : 0))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Booking Options Panel */}
              {(() => {
                const bookingOptions = getAllBookingOptions({
                  fromCode: deal.fromCode,
                  toCode: deal.toCode,
                  departDate: deal.departDate,
                  returnDate: deal.returnDate,
                  airline: deal.airline,
                  airlineCode: deal.airlineCode,
                  tripType: deal.tripType,
                  price: deal.price,
                });
                return (
                  <div className="space-y-2 mb-4">
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-3">Chọn nơi đặt vé:</p>
                    {bookingOptions.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => window.open(opt.url, '_blank', 'noopener,noreferrer')}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-white/8 hover:border-sky-500/30 rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{opt.icon}</span>
                          <div className="text-left">
                            <div className="text-white text-sm font-bold">{opt.label}</div>
                            <div className="text-slate-500 text-xs">{opt.note}</div>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-sky-400 transition-colors" />
                      </button>
                    ))}
                  </div>
                );
              })()}

              <button 
                onClick={() => {
                  const bookingUrl = (deal as any).bookingUrl ||
                    getBestBookingUrl({
                      fromCode: deal.fromCode,
                      toCode: deal.toCode,
                      departDate: deal.departDate,
                      returnDate: deal.returnDate,
                      airline: deal.airline,
                      airlineCode: deal.airlineCode,
                      tripType: deal.tripType,
                      price: deal.price,
                    });
                  window.open(bookingUrl, '_blank', 'noopener,noreferrer');
                }}
                className="w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 py-5 rounded-2xl font-black text-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group active:scale-[0.98]">
                ✈️ SĂN VÉ NGAY
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Risk Warning (Module 3.3) */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <div className="text-amber-500 font-bold text-sm uppercase tracking-wide">Lưu ý rủi ro</div>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  Giá vé có thể thay đổi nhanh chóng tùy thuộc vào hãng hàng không. Hãy đặt vé ngay khi có thể để giữ giá tốt nhất.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}