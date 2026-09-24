import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Compass, MapPin, Wallet, CalendarDays } from "lucide-react";
import { getDeals } from "../data/api";
import { Deal, formatVND } from "../data/deals";
import { buildTripAdvice, TripAdvice } from "../domain/tripAdvisor";
import { getUserPreferences } from "../lib/preferences";

export function TripAdvisorPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [origin, setOrigin] = useState(() => getUserPreferences().homeAirport);
  const [budget, setBudget] = useState(() => getUserPreferences().budget);
  const [days, setDays] = useState(4);
  const [submitted, setSubmitted] = useState(false);
  const advice: TripAdvice[] = useMemo(() => submitted ? buildTripAdvice(deals, { origin, budget, days }) : [], [deals, origin, budget, days, submitted]);

  useEffect(() => { getDeals().then(setDeals); }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <Compass className="mx-auto mb-4 h-12 w-12 text-pink-400" />
          <h1 className="text-4xl font-black text-white">AI Trip Advisor</h1>
          <p className="text-slate-500 mt-3">Gợi ý dựa trên deal đã quan sát và rule chi phí minh bạch — không tạo dữ liệu khi chưa có offer.</p>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }} className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-white/10 bg-[#171719] p-5 md:grid-cols-3">
          <label className="text-sm text-slate-300"><MapPin className="inline w-4 h-4 mr-2 text-sky-400" />Điểm khởi hành
            <input aria-label="Điểm khởi hành" value={origin} onChange={(event) => setOrigin(event.target.value.toUpperCase())} className="mt-2 w-full bg-slate-800 rounded-xl px-4 py-3 text-white" />
          </label>
          <label className="text-sm text-slate-300"><Wallet className="inline w-4 h-4 mr-2 text-emerald-400" />Ngân sách (VND)
            <input aria-label="Ngân sách" type="number" min={1} value={budget} onChange={(event) => setBudget(Number(event.target.value))} className="mt-2 w-full bg-slate-800 rounded-xl px-4 py-3 text-white" />
          </label>
          <label className="text-sm text-slate-300"><CalendarDays className="inline w-4 h-4 mr-2 text-violet-400" />Số ngày
            <input aria-label="Số ngày" type="number" min={1} max={30} value={days} onChange={(event) => setDays(Number(event.target.value))} className="mt-2 w-full bg-slate-800 rounded-xl px-4 py-3 text-white" />
          </label>
          <button type="submit" className="md:col-span-3 rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 py-3 font-bold text-white transition-opacity hover:opacity-90">Tìm hành trình phù hợp</button>
        </form>
        {submitted && !advice.length && <p className="text-center text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">Chưa có deal phù hợp từ {origin} trong ngân sách này. Hãy thử nguồn dữ liệu hoặc ngân sách khác.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {advice.map((item) => <article key={item.deal.id} className="rounded-2xl border border-white/10 bg-[#171719] p-5">
            <div className="flex justify-between gap-3"><h2 className="text-white text-xl font-bold">{item.deal.fromCode} → {item.deal.to}</h2><span className="text-emerald-400 font-black">{item.fitScore}/100</span></div>
            <p className="text-slate-400 text-sm mt-3">{item.reason}</p>
            <div className="flex justify-between mt-5 text-sm"><span>Ước tính tổng</span><strong className="text-emerald-400">{formatVND(item.estimatedTripBudget)}</strong></div>
            <Link to={`/deals/${item.deal.id}`} className="mt-4 block rounded-xl bg-white/[0.07] py-2 text-center text-pink-300 transition hover:bg-white/[0.12]">Xem deal và bằng chứng</Link>
          </article>)}
        </div>
      </div>
    </main>
  );
}
