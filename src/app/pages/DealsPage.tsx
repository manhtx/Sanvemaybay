import { useState, useMemo, useCallback, useEffect } from "react";
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Plane,
  X,
} from "lucide-react";
import { DealCard } from "../components/DealCard";
import { Deal } from "../data/deals";
import { getDealsResult, getObservedFares } from "../data/api";
import { isSupabaseConfigured } from "../lib/supabase";

type SortType = "discount" | "price_asc" | "date_near";

const sortOptions: { value: SortType; label: string }[] = [
  { value: "discount", label: "Mức giảm nhiều nhất" },
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "date_near", label: "Bay sớm nhất" },
];

export function DealsPage() {
  const [opportunities, setOpportunities] = useState<Deal[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortType>("discount");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [maxBudget, setMaxBudget] = useState<number | "all">("all");
  const [directOnly, setDirectOnly] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);

  const loadOpportunities = useCallback(async () => {
    setIsLoading(true);
    try {
      const observed = await getObservedFares({
        sort,
        page: 1,
        pageSize: 60,
      });

      if (observed.fares.length > 0) {
        setOpportunities(observed.fares);
        setTotalCount(observed.total);
      } else {
        // Fallback to legacy deals if observed fares table is empty
        const legacy = await getDealsResult();
        setOpportunities(legacy.deals);
        setTotalCount(legacy.deals.length);
      }
    } catch {
      // Keep existing state
    } finally {
      setIsLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    void loadOpportunities();
  }, [loadOpportunities]);

  // Available travel months
  const availableMonths = useMemo(() => {
    const monthSet = new Set(
      opportunities.map((d: Deal) => {
        const date = new Date(d.departDate);
        return `${date.getMonth() + 1}/${date.getFullYear()}`;
      })
    );
    return Array.from(monthSet).sort((a, b) => {
      const [ma, ya] = a.split("/").map(Number);
      const [mb, yb] = b.split("/").map(Number);
      return ya !== yb ? ya - yb : ma - mb;
    });
  }, [opportunities]);

  // Filtered & Sorted Opportunities
  const filtered = useMemo(() => {
    return opportunities
      .filter((d: Deal) => {
        if (originFilter !== "all" && d.fromCode !== originFilter) return false;
        if (directOnly && d.stops > 0) return false;
        if (typeof maxBudget === "number" && d.price > maxBudget) return false;
        if (selectedMonth !== "all") {
          const date = new Date(d.departDate);
          const dealMonth = `${date.getMonth() + 1}/${date.getFullYear()}`;
          if (dealMonth !== selectedMonth) return false;
        }
        return true;
      })
      .sort((a: Deal, b: Deal) => {
        switch (sort) {
          case "discount":
            return b.discount - a.discount;
          case "price_asc":
            return a.price - b.price;
          case "date_near":
            return new Date(a.departDate).getTime() - new Date(b.departDate).getTime();
          default:
            return 0;
        }
      });
  }, [opportunities, originFilter, directOnly, maxBudget, selectedMonth, sort]);

  const activeFilterCount =
    (originFilter !== "all" ? 1 : 0) +
    (selectedMonth !== "all" ? 1 : 0) +
    (maxBudget !== "all" ? 1 : 0) +
    (directOnly ? 1 : 0);

  return (
    <main className="min-h-screen pb-16 pt-24 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Hệ thống giám sát cước hàng không
            </span>
          </div>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                Cơ hội giá vé đã ghi nhận
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
                {isLoading
                  ? "Đang đối chiếu mức giá quan sát từ các chu kỳ quét gần nhất…"
                  : totalCount === 0
                  ? "Tất cả các tuyến bay đang theo dõi hiện giữ mức giá thông thường."
                  : `Đang theo dõi ${totalCount} cơ hội giá vé có bằng chứng so sánh với mặt bằng chung.`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800 sm:hidden font-medium"
            >
              <SlidersHorizontal className="w-4 h-4 text-sky-400" />
              <span>Bộ lọc</span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-sky-500 px-1.5 py-0.2 text-[10px] font-bold text-slate-950">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Supabase status warning if unconfigured */}
        {!isSupabaseConfigured && (
          <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200 text-sm">
            Chưa kết nối Supabase. Ứng dụng đang hiển thị tập dữ liệu mẫu.
          </div>
        )}

        {/* Section 44: Pruned Primary Filters (FROM, WHEN, BUDGET, STOPS, SORT) */}
        <div
          className={`mb-8 rounded-2xl border border-white/10 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-sm ${
            showFilters ? "block" : "hidden sm:block"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* 1. Origin (FROM) */}
            <div>
              <label htmlFor="origin-filter" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Điểm khởi hành
              </label>
              <select
                id="origin-filter"
                value={originFilter}
                onChange={(e) => setOriginFilter(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="all">Tất cả điểm đi</option>
                <option value="HAN">Hà Nội (HAN)</option>
                <option value="SGN">TP. Hồ Chí Minh (SGN)</option>
                <option value="DAD">Đà Nẵng (DAD)</option>
              </select>
            </div>

            {/* 2. Month (WHEN) */}
            <div>
              <label htmlFor="month-filter" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Thời gian bay
              </label>
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="all">Tất cả các tháng</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Budget (MAX BUDGET) */}
            <div>
              <label htmlFor="budget-filter" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Ngân sách tối đa
              </label>
              <select
                id="budget-filter"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="all">Không giới hạn</option>
                <option value="1500000">Dưới 1.500.000₫</option>
                <option value="3000000">Dưới 3.000.000₫</option>
                <option value="5000000">Dưới 5.000.000₫</option>
                <option value="10000000">Dưới 10.000.000₫</option>
              </select>
            </div>

            {/* 4. Stops (DIRECT ONLY) */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Điểm dừng
              </label>
              <button
                type="button"
                onClick={() => setDirectOnly(!directOnly)}
                className={`w-full flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all ${
                  directOnly
                    ? "border-sky-500/50 bg-sky-500/10 text-sky-400"
                    : "border-white/10 bg-slate-950 text-slate-400 hover:text-white"
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span>{directOnly ? "Chỉ bay thẳng" : "Tất cả điểm dừng"}</span>
              </button>
            </div>

            {/* 5. Sort */}
            <div>
              <label htmlFor="sort-filter" className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                Sắp xếp
              </label>
              <select
                id="sort-filter"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>Đang áp dụng {activeFilterCount} bộ lọc</span>
              <button
                type="button"
                onClick={() => {
                  setOriginFilter("all");
                  setSelectedMonth("all");
                  setMaxBudget("all");
                  setDirectOnly(false);
                }}
                className="text-sky-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Section 42: Primary High-Density Opportunity Scanning Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <LoaderCircle className="w-8 h-8 animate-spin text-sky-400 mb-3" />
            <span className="text-sm">Đang tải danh sách cơ hội…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 p-8">
            <p className="text-slate-400 text-sm mb-4">
              Không có cơ hội nào phù hợp với bộ lọc hiện tại.
            </p>
            <button
              type="button"
              onClick={() => {
                setOriginFilter("all");
                setSelectedMonth("all");
                setMaxBudget("all");
                setDirectOnly(false);
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((deal) => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
