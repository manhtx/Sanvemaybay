import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Search,
  SlidersHorizontal,
  Compass,
  Sparkles,
  PlaneTakeoff,
  Globe2,
  CalendarDays,
  ShieldCheck,
  Zap,
  ArrowRight,
} from "lucide-react";

import { Deal } from "../data/deals";
import { getObservedFares, getDeals } from "../data/api";
import { DealCard } from "../components/DealCard";
import { WatchModal } from "../components/WatchModal";

const categories = [
  { id: "all", label: "Tất cả cơ hội", icon: Sparkles },
  { id: "asia", label: "Đông Nam Á", icon: Globe2 },
  { id: "east-asia", label: "Đông Bắc Á", icon: Compass },
  { id: "direct", label: "Bay thẳng", icon: PlaneTakeoff },
  { id: "weekend", label: "Cuối tuần", icon: CalendarDays },
  { id: "deep-discount", label: "Giảm sâu > 30%", icon: Zap },
];

export function HomePage() {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [watchOpen, setWatchOpen] = useState(false);

  // Airbnb Search Pill State
  const [origin, setOrigin] = useState("HAN");
  const [destination, setDestination] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  useEffect(() => {
    async function loadDeals() {
      try {
        const observed = await getObservedFares({ page: 1, pageSize: 16, sort: "discount" });
        if (observed.fares.length > 0) {
          setDeals(observed.fares);
        } else {
          const fallback = await getDeals();
          setDeals(fallback.slice(0, 16));
        }
      } catch {
        const fallback = await getDeals();
        setDeals(fallback.slice(0, 16));
      } finally {
        setIsLoading(false);
      }
    }
    void loadDeals();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (origin) params.set("from", origin);
    if (destination) params.set("destination", destination);
    if (departDate) {
      params.set("departDate", departDate);
      params.set("departureFrom", departDate);
    }
    if (returnDate) {
      params.set("returnDate", returnDate);
      params.set("departureTo", returnDate);
    }
    navigate(`/search?${params.toString()}`);
  };

  const filteredDeals = deals.filter((deal) => {
    if (activeCategory === "direct") return deal.stops === 0;
    if (activeCategory === "deep-discount") return deal.discount >= 30;
    if (activeCategory === "asia") return ["BKK", "SIN", "KUL", "DMK", "DPS"].includes(deal.toCode);
    if (activeCategory === "east-asia") return ["HND", "NRT", "ICN", "TPE", "KIX"].includes(deal.toCode);
    return true;
  });

  return (
    <main className="min-h-screen bg-[#ffffff] text-[#222222] pt-20">

      {/* ── HERO BANNER: DISCOVERY & VALUE MANIFESTO ── */}
      <section className="bg-white pt-8 pb-4 border-b border-[#ebebeb]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f7f7f7] border border-[#dddddd] text-[11px] font-bold text-[#6a6a6a] uppercase tracking-wider mb-3">
            <span>Hệ thống giám sát & đối chiếu giá vé độc lập</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#222222] tracking-tight leading-[1.15]">
            Biết mức giá nào <span className="text-[#0084e6]">thực sự đáng chú ý.</span>
          </h1>
          <p className="text-sm sm:text-base text-[#6a6a6a] leading-relaxed mt-2 max-w-2xl mx-auto">
            Farely không bán vé và không nhận tiền hoa hồng để đẩy giá. Farely liên tục quét và đối chiếu mức giá quan sát với nhóm chuyến bay tương đương, làm rõ bằng chứng trước khi bạn quyết định mua.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              to="/deals"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0084e6] hover:bg-[#006ec4] text-white rounded-full font-bold text-xs transition-colors shadow-xs"
            >
              <span>Xem sổ cơ hội hôm nay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── AIRBNB SEARCH BAR PILL HEADER SECTION ── */}
      <section className="border-b border-[#ebebeb] bg-[#ffffff] py-6 sm:py-8 sticky top-20 z-40">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">

          <form
            onSubmit={handleSearchSubmit}
            className="mx-auto max-w-[850px] bg-white rounded-full border border-[#dddddd] shadow-[0_3px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow p-2 flex items-center justify-between"
          >
            {/* Segment 1: Điểm đi (Where From) */}
            <div className="flex-1 px-4 sm:px-6 py-1.5 border-r border-[#ebebeb] text-left">
              <label htmlFor="home-origin" className="block text-[11px] font-bold text-[#222222] tracking-wider uppercase">
                Điểm đi
              </label>
              <select
                id="home-origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-[#222222] focus:outline-none cursor-pointer p-0"
              >
                <option value="HAN">Hà Nội (HAN)</option>
                <option value="SGN">TP. Hồ Chí Minh (SGN)</option>
                <option value="DAD">Đà Nẵng (DAD)</option>
              </select>
            </div>

            {/* Segment 2: Điểm đến (Where To) */}
            <div className="flex-1 px-4 sm:px-6 py-1.5 border-r border-[#ebebeb] text-left">
              <label htmlFor="home-destination" className="block text-[11px] font-bold text-[#222222] tracking-wider uppercase">
                Điểm đến
              </label>
              <input
                id="home-destination"
                type="text"
                placeholder="Tìm điểm đến hoặc mã sân bay"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-transparent text-sm text-[#222222] placeholder:text-[#929292] focus:outline-none"
              />
            </div>

            {/* Segment 3: Ngày đi */}
            <div className="hidden sm:block flex-1 px-4 sm:px-6 py-1.5 border-r border-[#ebebeb] text-left">
              <label htmlFor="home-dates" className="block text-[11px] font-bold text-[#222222] tracking-wider uppercase">
                Ngày đi
              </label>
              <input
                id="home-dates"
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                className="w-full bg-transparent text-sm text-[#222222] focus:outline-none cursor-pointer"
              />
            </div>

            {/* Segment 4: Ngày về (Optional) */}
            <div className="hidden md:block flex-1 px-4 sm:px-6 py-1.5 text-left">
              <label htmlFor="home-return-date" className="block text-[11px] font-bold text-[#222222] tracking-wider uppercase">
                Ngày về
              </label>
              <input
                id="home-return-date"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-transparent text-sm text-[#222222] focus:outline-none cursor-pointer"
              />
            </div>

            {/* Airbnb Sky Blue Search Orb */}
            <button
              type="submit"
              aria-label="Tìm kiếm vé máy bay giá rẻ"
              className="w-12 h-12 rounded-full bg-[#0084e6] hover:bg-[#006ec4] text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-xs"
            >
              <Search className="w-5 h-5 text-white stroke-[2.5]" />
            </button>
          </form>

        </div>
      </section>

      {/* ── AIRBNB CATEGORY STRIP ── */}
      <section className="border-b border-[#ebebeb] bg-[#ffffff] sticky top-[148px] sm:top-[160px] z-30">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between gap-4 py-3">

            <div className="flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex flex-col items-center gap-1.5 pb-2 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors ${
                      active
                        ? "border-[#222222] text-[#222222]"
                        : "border-transparent text-[#6a6a6a] hover:text-[#222222] hover:border-[#dddddd]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? "text-[#0084e6]" : "text-[#6a6a6a]"}`} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter button pill */}
            <div className="hidden lg:flex items-center shrink-0">
              <button
                type="button"
                onClick={() => navigate("/search")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#dddddd] text-xs font-semibold text-[#222222] hover:border-[#222222] transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Bộ lọc chi tiết</span>
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ── MAIN PROPERTY / FLIGHT DEAL CARDS GRID ── */}
      <section className="py-8 sm:py-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">

          {/* Header row */}
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#222222]">
                Cơ hội vé máy bay giá tốt bất thường
              </h1>
              <p className="text-sm text-[#6a6a6a] mt-0.5">
                Được đối chiếu liên tục với dữ liệu giá lịch sử, làm rõ thuế phí và rủi ro chuyển chặng.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setWatchOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#0084e6] hover:underline"
            >
              <span>Cài đặt cảnh báo hành trình</span>
            </button>
          </div>

          {/* Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse flex flex-col gap-3">
                  <div className="aspect-[4/3] w-full rounded-[14px] bg-[#f2f2f2]" />
                  <div className="h-4 w-3/4 rounded bg-[#f2f2f2]" />
                  <div className="h-3 w-1/2 rounded bg-[#f2f2f2]" />
                  <div className="h-4 w-1/3 rounded bg-[#f2f2f2]" />
                </div>
              ))}
            </div>
          ) : filteredDeals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {filteredDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-[#dddddd] rounded-2xl bg-[#f7f7f7]">
              <p className="text-base font-semibold text-[#222222]">Chưa tìm thấy chuyến bay phù hợp danh mục này</p>
              <p className="text-sm text-[#6a6a6a] mt-1">Hãy thử chọn lại danh mục khác hoặc tìm kiếm tự do bằng thanh công cụ phía trên.</p>
            </div>
          )}

        </div>
      </section>

      {/* ── 3 NGUYÊN TẮC ĐÁNH GIÁ GIÁ VÉ TẠI FARELY ── */}
      <section className="border-t border-[#ebebeb] bg-[#f7f7f7] py-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-[#222222] tracking-tight">
              3 nguyên tắc đánh giá giá vé tại Farely
            </h2>
            <p className="text-[#6a6a6a] text-xs sm:text-sm mt-1">
              Hệ thống trả lời minh bạch: Giá này có đáng chú ý không, bằng chứng gồm những gì và nên làm gì tiếp theo.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white border border-[#dddddd] flex items-center justify-center shrink-0 text-[#0084e6]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#222222]">Dữ liệu minh bạch, độc lập</h2>
                <p className="text-xs text-[#6a6a6a] mt-1 leading-relaxed">
                  Farely không bán vé và không đẩy giá hưởng hoa hồng. Mọi mức giá đều được đối chiếu với lịch sử thị trường trước khi đưa ra nhận định.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white border border-[#dddddd] flex items-center justify-center shrink-0 text-[#0084e6]">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#222222]">Làm rõ chi phí ẩn</h2>
                <p className="text-xs text-[#6a6a6a] mt-1 leading-relaxed">
                  Công cụ bóc tách hành lý ký gửi, phụ phí chọn chỗ và rủi ro tự nối chuyến (self-transfer separate tickets) trước khi bạn thanh toán.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-white border border-[#dddddd] flex items-center justify-center shrink-0 text-[#0084e6]">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#222222]">Thông báo khi có deal thật</h2>
                <p className="text-xs text-[#6a6a6a] mt-1 leading-relaxed">
                  Cài đặt theo dõi tuyến bay bạn quan tâm và chỉ nhận email khi giá vé thực sự giảm sâu bất thường.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Watch Modal Dialog */}
      <WatchModal isOpen={watchOpen} onClose={() => setWatchOpen(false)} />
    </main>
  );
}
