import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getHistoricalDeals } from "../data/api";
import { Deal, formatVND } from "../data/deals";

export function HistoricalDealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  useEffect(() => { getHistoricalDeals().then(setDeals); }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-20 pt-32 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-400">Historical data</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">Lịch sử deal đã quan sát</h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Dữ liệu thật từ các lần quét trước. Các mức giá này đã hết hạn và không được coi là giá đặt vé hiện tại.
          </p>
        </div>
        {!deals.length ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-10 text-center text-slate-400">Chưa có historical snapshot.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {deals.map((deal) => (
              <article key={deal.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Đã hết hạn</span>
                  <span className="text-xs text-slate-500">{deal.observedAt ? new Date(deal.observedAt).toLocaleString("vi-VN") : "Lịch sử"}</span>
                </div>
                <h2 className="mt-4 text-xl font-extrabold">{deal.fromCode} → {deal.toCode}</h2>
                <p className="mt-2 text-slate-300">{deal.airline} · {deal.departDate}</p>
                <p className="mt-4 text-2xl font-black text-sky-300">{formatVND(deal.price)}</p>
                <p className="mt-1 text-sm text-emerald-400">Giảm {deal.discount}% so với baseline lúc quét</p>
                <Link className="mt-5 inline-block text-sm font-semibold text-sky-400 hover:text-sky-300" to={`/deals/${deal.id}`}>Xem dữ liệu chi tiết →</Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
