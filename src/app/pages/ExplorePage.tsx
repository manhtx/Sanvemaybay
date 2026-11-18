import React, { useState, useEffect } from "react";
import { Map, ChevronRight, Globe } from "lucide-react";
import { Link } from "react-router";
import { getDeals } from "../data/api";
import { Deal, formatVND } from "../data/deals";
import { motion } from "motion/react";
import { buildDestinationInsights } from "../domain/destinationInsights";

export function ExplorePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getDeals();
      setDeals(data);
      setLoading(false);
    }
    load();
  }, []);
  const filteredDeals = deals.filter((deal) =>
    `${deal.to} ${deal.toCode} ${deal.country}`
      .toLocaleLowerCase("vi")
      .includes(query.trim().toLocaleLowerCase("vi")),
  );
  const destinationInsights = buildDestinationInsights(filteredDeals);

  return (
    <main className="min-h-screen bg-white pb-20 text-[#222222]">
      {/* ── HERO DISCOVERY ── */}
      <section className="relative py-16 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0084e6]/5 via-white to-white border-b border-[#ebebeb]">
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#0084e6]/20 bg-[#0084e6]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0084e6]">
              <Globe className="w-4 h-4" /> Khám phá điểm đến tiết kiệm
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#222222] mb-4 tracking-tight">
              Bạn muốn đi đâu <br />
              với <span className="text-[#0084e6]">ngân sách tối ưu nhất?</span>
            </h1>
            <p className="text-sm sm:text-base text-[#6a6a6a] max-w-lg mx-auto mb-8 leading-relaxed">
              Dữ liệu giá vé liên tục được cập nhật và đối chiếu lịch sử để tìm ra các hành trình có giá hời thực sự.
            </p>
          </motion.div>

          <div className="mx-auto flex max-w-lg rounded-full border border-[#dddddd] bg-white p-2 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex-1 px-4 flex items-center gap-3">
              <Globe className="w-5 h-5 text-[#6a6a6a]" />
              <input
                aria-label="Tìm điểm đến"
                type="text"
                placeholder="Tìm điểm đến, thành phố, quốc gia..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="bg-transparent border-none outline-none text-[#222222] w-full text-sm font-medium placeholder-[#929292]"
              />
            </div>
            <button
              type="button"
              className="w-10 h-10 rounded-full bg-[#0084e6] text-white flex items-center justify-center hover:bg-[#006ec4] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {!loading && destinationInsights.length > 0 && (
          <section className="mb-12" aria-label="Destination insights">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#222222]">Cơ hội nổi bật theo điểm đến</h2>
                <p className="text-[#6a6a6a] text-xs sm:text-sm mt-1">Dựa trên dữ liệu giá vé đã được xác thực qua các chuyến bay thực tế.</p>
              </div>
              <span className="text-[#6a6a6a] text-xs font-semibold">{destinationInsights.length} điểm đến</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {destinationInsights.slice(0, 4).map((insight) => (
                <Link
                  key={insight.destinationCode}
                  to={`/deals/${insight.topDealId}`}
                  className="rounded-[14px] border border-[#dddddd] bg-white p-4 transition-all hover:border-[#0084e6] hover:shadow-md block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#222222] font-bold text-base">{insight.destination}</span>
                    {insight.hasWeekendDeal && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        Cuối tuần
                      </span>
                    )}
                  </div>
                  <div className="text-[#6a6a6a] text-xs mb-1">Giá thấp nhất từ</div>
                  <div className="text-[#0084e6] text-lg font-bold">{formatVND(insight.cheapestPrice)}</div>
                  <div className="flex justify-between mt-3 text-xs text-[#6a6a6a] pt-2 border-t border-[#ebebeb]">
                    <span>{insight.dealCount} cơ hội</span>
                    <span className="text-emerald-700 font-semibold">Giảm ~{Math.round(insight.averageDiscount)}%</span>
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
                <div key={i} className="h-[340px] bg-[#f7f7f7] rounded-[14px] animate-pulse border border-[#dddddd]" />
             ))
          ) : (
            filteredDeals.map((deal, idx) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Link
                  to={`/deals/${deal.id}`}
                  className="group block rounded-[14px] overflow-hidden border border-[#dddddd] bg-white shadow-sm hover:shadow-md transition-all"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-[#f7f7f7]">
                    {deal.image ? (
                      <img
                        src={deal.image}
                        alt={deal.to}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#0084e6]/10 via-[#f7f7f7] to-[#ebebeb] flex items-center justify-center">
                        <Map className="w-8 h-8 text-[#0084e6]/40" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <div className="px-2.5 py-1 bg-white/95 text-[11px] font-bold text-emerald-700 rounded-full shadow-sm border border-emerald-200">
                        -{deal.discount}%
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-1.5 text-[#6a6a6a] text-[11px] font-semibold tracking-wider uppercase mb-1">
                      <Map className="w-3.5 h-3.5 text-[#0084e6]" /> {deal.country}
                    </div>
                    <h3 className="text-base font-bold text-[#222222] mb-2 leading-snug group-hover:text-[#0084e6] transition-colors">
                      {deal.to}
                    </h3>
                    <div className="flex items-baseline justify-between pt-2 border-t border-[#ebebeb]">
                      <div>
                        <div className="text-[#929292] text-[11px] line-through">{formatVND(deal.normalPrice)}</div>
                        <div className="text-base font-extrabold text-[#222222]">{formatVND(deal.price)} <span className="text-xs font-normal text-[#6a6a6a]">/ khách</span></div>
                      </div>
                      <span className="text-xs font-semibold text-[#0084e6] group-hover:underline">Chi tiết →</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
        {!loading && filteredDeals.length === 0 && (
          <div className="py-20 text-center text-[#6a6a6a] text-sm">
            Không tìm thấy chặng bay nào khớp với từ khóa tìm kiếm.
          </div>
        )}
      </div>
    </main>
  );
}
