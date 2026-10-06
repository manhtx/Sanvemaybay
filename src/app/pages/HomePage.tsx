import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Bell,
  ArrowRight,
  ShieldCheck,
  Scale,
  ReceiptText,
  TrendingDown,
  Calendar,
  Search,
} from "lucide-react";

import { formatVND, Deal } from "../data/deals";
import { getObservedFares, getDeals } from "../data/api";
import { WatchModal } from "../components/WatchModal";

export function HomePage() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [_isLoading, setIsLoading] = useState(true);
  const [watchOpen, setWatchOpen] = useState(false);

  // Search-First instrument state above the fold
  const [origin, setOrigin] = useState("HAN");
  const [destination, setDestination] = useState("BKK");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [cabin, setCabin] = useState("economy");

  useEffect(() => {
    async function loadInitial() {
      try {
        const observed = await getObservedFares({ page: 1, pageSize: 8, sort: "discount" });
        if (observed.fares.length > 0) {
          setDeals(observed.fares);
        } else {
          const fallback = await getDeals();
          setDeals(fallback.slice(0, 8));
        }
      } catch {
        // Fallback
      } finally {
        setIsLoading(false);
      }
    }
    void loadInitial();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set("from", origin);
    if (destination) params.set("destination", destination);
    if (departDate) params.set("departureFrom", departDate);
    if (returnDate) params.set("departureTo", returnDate);
    navigate(`/search?${params.toString()}`);
  };

  const primaryOpportunity = deals.length > 0 ? deals[0] : null;

  return (
    <main className="min-h-screen bg-[var(--canvas-bg)] text-stone-900">
      {/* ── SECTION 55: SEARCH-FIRST INSTRUMENT ABOVE THE FOLD ── */}
      <section className="relative border-b border-stone-200 bg-white pt-20 pb-12 sm:pt-24 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-stone-100 border border-stone-200 text-[11px] font-mono font-bold text-stone-700 uppercase tracking-wider mb-3">
              <span>Hệ thống giám sát & đối chiếu giá vé độc lập</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 tracking-tight leading-[1.15]">
              Biết mức giá nào{" "}
              <span className="text-blue-600">thực sự đáng chú ý.</span>
            </h1>

            <p className="text-sm sm:text-base text-stone-600 leading-relaxed mt-2.5 max-w-2xl">
              Farely không bán vé và không nhận tiền hoa hồng để đẩy giá. Farely liên tục quét và đối chiếu mức giá quan sát với nhóm chuyến bay tương đương, làm rõ bằng chứng trước khi bạn quyết định mua.
            </p>
          </div>

          {/* Search Box / Trip Intent Composer */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 sm:p-5 shadow-sm">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Where: Origin */}
                <div>
                  <label htmlFor="home-search-from" className="block text-[11px] font-bold text-stone-600 mb-1 uppercase tracking-wider">
                    Điểm khởi hành
                  </label>
                  <select
                    id="home-search-from"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="HAN">Hà Nội (HAN)</option>
                    <option value="SGN">TP. Hồ Chí Minh (SGN)</option>
                    <option value="DAD">Đà Nẵng (DAD)</option>
                  </select>
                </div>

                {/* Where: Destination */}
                <div>
                  <label htmlFor="home-search-to" className="block text-[11px] font-bold text-stone-600 mb-1 uppercase tracking-wider">
                    Điểm đến
                  </label>
                  <input
                    id="home-search-to"
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Bangkok (BKK), Tokyo..."
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                {/* When: Dates */}
                <div>
                  <label htmlFor="home-search-depart" className="block text-[11px] font-bold text-stone-600 mb-1 uppercase tracking-wider">
                    Ngày khởi hành & về
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      id="home-search-depart"
                      type="date"
                      value={departDate}
                      onChange={(e) => setDepartDate(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-900 focus:border-blue-600 focus:outline-none"
                    />
                    <input
                      id="home-search-return"
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-xs text-stone-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Who & Cabin */}
                <div>
                  <label htmlFor="home-search-cabin" className="block text-[11px] font-bold text-stone-600 mb-1 uppercase tracking-wider">
                    Hành khách & Hạng vé
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <select
                      id="home-search-passengers"
                      value={passengers}
                      onChange={(e) => setPassengers(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-2 py-2 text-xs text-stone-900 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="1">1 người</option>
                      <option value="2">2 người</option>
                      <option value="3">3+ người</option>
                    </select>
                    <select
                      id="home-search-cabin"
                      value={cabin}
                      onChange={(e) => setCabin(e.target.value)}
                      className="w-full rounded-lg border border-stone-300 bg-white px-2 py-2 text-xs text-stone-900 focus:border-blue-600 focus:outline-none"
                    >
                      <option value="economy">Economy</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-stone-200">
                <div className="flex items-center gap-5 text-xs text-stone-600">
                  <span className="flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Không giá ảo
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Scale className="w-4 h-4 text-blue-600" /> Đối sánh trung vị
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <ReceiptText className="w-4 h-4 text-stone-500" /> Minh bạch chi phí
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Tìm giá</span>
                  </button>
                  <Link
                    to="/deals"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                  >
                    <span>Xem sổ cơ hội hôm nay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setWatchOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-blue-600" />
                    <span>Theo dõi chặng</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── SECTION 55: FARELY ĐANG THẤY GÌ? (PRODUCT PROOF) ── */}
      {primaryOpportunity && (
        <section className="py-10 border-b border-stone-200 bg-[var(--canvas-bg)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                Farely đang thấy gì?
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Cơ hội quan sát tiêu biểu từ các chu kỳ quét thực tế gần nhất
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      Cơ hội quan sát tiêu biểu
                    </span>
                    <span className="text-stone-500 font-medium">
                      {primaryOpportunity.airline} · {primaryOpportunity.stops === 0 ? "Bay thẳng" : `${primaryOpportunity.stops} điểm dừng`}
                    </span>
                  </div>

                  <div>
                    <div className="text-xs text-stone-500 mb-0.5">
                      {primaryOpportunity.from} → {primaryOpportunity.to}
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-stone-900">
                      {primaryOpportunity.fromCode} <span className="text-blue-600 font-light">→</span> {primaryOpportunity.toCode}
                    </div>
                    <div className="text-xs text-stone-600 mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>Ngày bay: {new Date(primaryOpportunity.departDate).toLocaleDateString("vi-VN")}</span>
                      {primaryOpportunity.returnDate && (
                        <span> – {new Date(primaryOpportunity.returnDate).toLocaleDateString("vi-VN")}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4 flex flex-col md:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-stone-100">
                  <div className="md:text-right">
                    <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-700 tabular-nums">
                      {formatVND(primaryOpportunity.price)}
                    </div>
                    {primaryOpportunity.discount > 0 && (
                      <div className="flex items-center md:justify-end gap-1 text-xs font-mono font-bold text-emerald-700 mt-0.5">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Thấp hơn {primaryOpportunity.discount}% so với trung vị</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/deals/${primaryOpportunity.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-sm"
                  >
                    <span>Xem chi tiết cơ hội</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 3 NGUYÊN TẮC ĐÁNH GIÁ GIÁ VÉ TẠI FARELY ── */}
      <section className="py-12 border-b border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              3 nguyên tắc đánh giá giá vé tại Farely
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-1">
              Hệ thống trả lời minh bạch: Giá này có đáng chú ý không, bằng chứng gồm những gì và nên làm gì tiếp theo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Scale className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">So sánh theo nhóm tương đương</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Không dùng &quot;giá gốc&quot; tự phong. Tỷ lệ phần trăm tính từ trung vị các chuyến bay cùng chặng, thời điểm và điều kiện tương đồng. Khi chưa đủ mẫu, hiển thị rõ &quot;Đang tích lũy&quot;.
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <ReceiptText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">Phân định chi phí rõ ràng</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Tách biệt các khoản đã biết, ước tính thêm, tùy chọn và các khoản chưa rõ. Chưa biết không đồng nghĩa với bằng 0 hoặc miễn phí.
              </p>
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50 p-5 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-stone-900">Bằng chứng theo chu kỳ quét</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Minh bạch số lượt quan sát, số chu kỳ quét và độ tươi dữ liệu. Không dùng thuật toán dự đoán xác suất chưa được chứng minh bằng thực nghiệm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── NOTABLE RECENT OPPORTUNITIES (LEDGER TABLE) ── */}
      {deals.length > 1 && (
        <section className="py-12 bg-[var(--canvas-bg)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                  Cơ hội quan sát gần đây
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  Các chặng bay có mức chênh lệch đáng chú ý so với mặt bằng trung vị
                </p>
              </div>

              <Link
                to="/deals"
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả cơ hội hôm nay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Desktop Ledger Table */}
            <div className="hidden md:block rounded-xl border border-stone-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold uppercase tracking-wider text-stone-600">
                    <th className="py-3 px-4">Chặng bay</th>
                    <th className="py-3 px-3">Ngày bay</th>
                    <th className="py-3 px-3">Hãng / Dừng</th>
                    <th className="py-3 px-4 text-right">Giá quan sát</th>
                    <th className="py-3 px-3 text-right">Đối sánh</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {deals.slice(1, 7).map((deal) => {
                    const formattedDate = new Date(deal.departDate).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                    });
                    const hasComparator = deal.discount > 0 && deal.normalPrice > deal.price;

                    return (
                      <tr key={deal.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            to={`/deals/${deal.id}`}
                            className="font-mono font-bold text-stone-900 text-sm hover:text-blue-600 transition-colors"
                          >
                            {deal.fromCode} <span className="text-blue-600 font-light">→</span> {deal.toCode}
                          </Link>
                          <div className="text-[11px] text-stone-500">
                            {deal.from} – {deal.to}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-stone-700 font-mono text-[11px]">
                          {formattedDate}
                        </td>

                        <td className="py-3 px-3 text-stone-700">
                          <div>{deal.airline}</div>
                          <div className="text-[10px] text-stone-500">
                            {deal.stops === 0 ? "Bay thẳng" : `${deal.stops} điểm dừng`}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-stone-900 text-sm">
                          {formatVND(deal.price)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono">
                          {hasComparator ? (
                            <span className="text-emerald-700 font-bold">
                              ↓{deal.discount}% vs median
                            </span>
                          ) : (
                            <span className="text-stone-500 text-[11px]">Mặt bằng chung</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/deals/${deal.id}`}
                            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-[11px] transition-colors border border-stone-200"
                          >
                            Chi tiết
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-2.5">
              {deals.slice(1, 7).map((deal) => {
                const formattedDate = new Date(deal.departDate).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                });
                const hasComparator = deal.discount > 0 && deal.normalPrice > deal.price;

                return (
                  <div key={deal.id} className="rounded-xl border border-stone-200 bg-white p-3.5 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/deals/${deal.id}`}
                        className="font-mono font-bold text-stone-900 text-sm hover:text-blue-600"
                      >
                        {deal.fromCode} <span className="text-blue-600 font-light">→</span> {deal.toCode}
                      </Link>
                      <div className="font-mono font-bold text-stone-900 text-sm">
                        {formatVND(deal.price)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <span>{formattedDate} · {deal.airline}</span>
                      {hasComparator && (
                        <span className="text-emerald-700 font-bold font-mono">
                          ↓{deal.discount}% vs median
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <WatchModal
        isOpen={watchOpen}
        onClose={() => setWatchOpen(false)}
        sourceContext="home"
      />
    </main>
  );
}
