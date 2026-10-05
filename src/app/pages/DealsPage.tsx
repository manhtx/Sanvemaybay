import { useState, useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Plane,
  X,
  Bell,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Deal, formatVND } from "../data/deals";
import { getObservedFares, getDealsResult } from "../data/api";

import {
  isBookmarkedDeal,
  saveRemoteBookmark,
  toggleBookmarkedDeal,
  createOpportunitySnapshot,
} from "../lib/bookmarks";
import { WatchModal } from "../components/WatchModal";
import { trackProductEvent } from "../lib/analytics";

type SortType = "discount" | "price_asc" | "date_near";

const sortOptions: { value: SortType; label: string }[] = [
  { value: "discount", label: "Mức giảm nhiều nhất" },
  { value: "price_asc", label: "Giá thấp đến cao" },
  { value: "date_near", label: "Bay sớm nhất" },
];

export function DealsPage() {
  const [opportunities, setOpportunities] = useState<Deal[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [sort, setSort] = useState<SortType>("discount");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [maxBudget, setMaxBudget] = useState<number | "all">("all");
  const [directOnly, setDirectOnly] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWatchDeal, setSelectedWatchDeal] = useState<Deal | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  const pageSize = 60;

  // Global server-side filtering: FILTER -> SORT -> PAGINATE
  const loadOpportunities = useCallback(async () => {
    setIsLoading(true);
    try {
      const observed = await getObservedFares({
        sort,
        page: currentPage,
        pageSize,
        origin: originFilter !== "all" ? originFilter : undefined,
        month: selectedMonth !== "all" ? selectedMonth : undefined,
        budget: typeof maxBudget === "number" ? maxBudget : undefined,
        directOnly: directOnly ? true : undefined,
      });

      if (observed.fares.length > 0 || observed.status !== "provider_unavailable") {
        setOpportunities(observed.fares);
        setTotalCount(observed.total);
      } else {
        // Fallback to legacy deals only if observed fares is completely unavailable
        const legacy = await getDealsResult();
        let fallback = legacy.deals;
        if (originFilter !== "all") fallback = fallback.filter((d) => d.fromCode === originFilter);
        if (directOnly) fallback = fallback.filter((d) => d.stops === 0);
        if (typeof maxBudget === "number") fallback = fallback.filter((d) => d.price <= maxBudget);
        setOpportunities(fallback.slice((currentPage - 1) * pageSize, currentPage * pageSize));
        setTotalCount(fallback.length);
      }
    } catch {
      // Keep existing state
    } finally {
      setIsLoading(false);
    }
  }, [sort, currentPage, originFilter, selectedMonth, maxBudget, directOnly]);

  useEffect(() => {
    void loadOpportunities();
  }, [loadOpportunities]);

  // Reset page when filters change
  const handleOriginChange = (val: string) => {
    setOriginFilter(val);
    setCurrentPage(1);
  };
  const handleMonthChange = (val: string) => {
    setSelectedMonth(val);
    setCurrentPage(1);
  };
  const handleBudgetChange = (val: number | "all") => {
    setMaxBudget(val);
    setCurrentPage(1);
  };
  const handleDirectToggle = () => {
    setDirectOnly((prev) => !prev);
    setCurrentPage(1);
  };
  const handleSortChange = (val: SortType) => {
    setSort(val);
    setCurrentPage(1);
  };

  const activeFilterCount =
    (originFilter !== "all" ? 1 : 0) +
    (selectedMonth !== "all" ? 1 : 0) +
    (maxBudget !== "all" ? 1 : 0) +
    (directOnly ? 1 : 0);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIdx = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalCount);

  // Month options for next 12 months
  const monthOptions = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      list.push(`${d.getMonth() + 1}/${d.getFullYear()}`);
    }
    return list;
  }, []);

  const handleBookmarkToggle = (deal: Deal) => {
    const targetId = deal.opportunityId || deal.id;
    const snapshot = createOpportunitySnapshot(deal);
    const next = toggleBookmarkedDeal(targetId, undefined, snapshot);
    setBookmarkedIds((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(targetId);
      else updated.delete(targetId);
      return updated;
    });
    void saveRemoteBookmark(targetId, next, snapshot);
    void trackProductEvent({
      eventType: "bookmark",
      entityId: targetId,
      metadata: { bookmarked: next, route: `${deal.fromCode}-${deal.toCode}`, source: "deals_ledger" },
    });
  };

  return (
    <main className="min-h-screen pb-16 pt-24 text-slate-100 bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1.5">
                Cơ hội giá vé đã ghi nhận
              </h1>
              <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-400">
                {isLoading
                  ? "Đang đối chiếu mức giá quan sát từ các chu kỳ quét gần nhất…"
                  : totalCount === 0
                  ? "Tất cả các tuyến bay đang theo dõi hiện giữ mức giá thông thường."
                  : `Đang theo dõi ${totalCount} cơ hội có bằng chứng so sánh với nhóm chặng bay tương đương.`}
              </p>

            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3.5 py-2 text-xs text-slate-300 transition-colors hover:bg-slate-800 sm:hidden font-medium"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
              <span>Bộ lọc</span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-sky-500 px-1.5 text-[10px] font-bold text-slate-950">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Global Filter Toolbar */}
        <div
          className={`mb-6 rounded-xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-sm ${
            showFilters ? "block" : "hidden sm:block"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            {/* 1. Origin */}
            <div>
              <label htmlFor="origin-filter" className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Điểm khởi hành
              </label>
              <select
                id="origin-filter"
                value={originFilter}
                onChange={(e) => handleOriginChange(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="all">Tất cả điểm đi</option>
                <option value="HAN">Hà Nội (HAN)</option>
                <option value="SGN">TP. Hồ Chí Minh (SGN)</option>
                <option value="DAD">Đà Nẵng (DAD)</option>
              </select>
            </div>

            {/* 2. Month */}
            <div>
              <label htmlFor="month-filter" className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Thời gian bay
              </label>
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="all">Tất cả các tháng</option>
                {monthOptions.map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Budget */}
            <div>
              <label htmlFor="budget-filter" className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Ngân sách tối đa
              </label>
              <select
                id="budget-filter"
                value={maxBudget}
                onChange={(e) => handleBudgetChange(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="all">Không giới hạn</option>
                <option value="1500000">Dưới 1.500.000₫</option>
                <option value="3000000">Dưới 3.000.000₫</option>
                <option value="5000000">Dưới 5.000.000₫</option>
                <option value="10000000">Dưới 10.000.000₫</option>
              </select>
            </div>

            {/* 4. Stops */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Điểm dừng
              </label>
              <button
                type="button"
                onClick={handleDirectToggle}
                className={`w-full flex items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
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
              <label htmlFor="sort-filter" className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                Sắp xếp
              </label>
              <select
                id="sort-filter"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value as SortType)}
                className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
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
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>Đang lọc {totalCount} kết quả trên toàn hệ thống</span>
              <button
                type="button"
                onClick={() => {
                  setOriginFilter("all");
                  setSelectedMonth("all");
                  setMaxBudget("all");
                  setDirectOnly(false);
                  setCurrentPage(1);
                }}
                className="text-sky-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <X className="w-3.5 h-3.5" /> Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Opportunity Ledger (High-Density Consumer Price Instrument) */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <LoaderCircle className="w-8 h-8 animate-spin text-sky-400 mb-3" />
            <span className="text-xs font-mono">Đang truy vấn dữ liệu quan sát…</span>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-white/10 bg-slate-900/20 p-8">
            <p className="text-slate-400 text-sm mb-3">
              Không có cơ hội nào khớp với điều kiện lọc hiện tại.
            </p>
            <button
              type="button"
              onClick={() => {
                setOriginFilter("all");
                setSelectedMonth("all");
                setMaxBudget("all");
                setDirectOnly(false);
                setCurrentPage(1);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Opportunity Ledger */}
            <div className="rounded-xl border border-white/10 bg-slate-900/40 divide-y divide-white/5 overflow-hidden">
              {opportunities.map((deal) => {
                const targetId = deal.opportunityId || deal.id;
                const isBookmarked = bookmarkedIds.has(targetId) || isBookmarkedDeal(targetId);
                const formattedDate = new Date(deal.departDate).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                });
                const formattedReturn = deal.returnDate
                  ? ` – ${new Date(deal.returnDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`
                  : "";

                const hasComparator = deal.discount > 0 && deal.normalPrice > deal.price;
                const evidenceLabel = deal.confidence && deal.confidence >= 0.7
                  ? "Bằng chứng mạnh"
                  : deal.confidence && deal.confidence >= 0.4
                  ? "Bằng chứng vừa"
                  : "Đang tích lũy";

                return (
                  <article
                    key={deal.id}
                    className="p-3.5 hover:bg-white/[0.03] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    {/* Primary link area containing Route and Price */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/deals/${deal.id}`}
                        className="group flex flex-wrap items-baseline justify-between md:justify-start gap-x-4 gap-y-1 hover:text-sky-400 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-white text-sm group-hover:text-sky-400 transition-colors">
                            {deal.fromCode} <span className="text-sky-400 font-light">→</span> {deal.toCode}
                          </span>
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            {deal.from} – {deal.to}
                          </span>
                        </div>

                        <div className="font-mono font-bold text-white text-sm">
                          {formatVND(deal.price)}
                        </div>
                      </Link>

                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span className="font-mono text-slate-300">
                          {formattedDate}{formattedReturn}
                        </span>
                        <span>·</span>
                        <span>{deal.airline}</span>
                        <span>·</span>
                        <span>{deal.stops === 0 ? "Bay thẳng" : `${deal.stops} điểm dừng`}</span>
                      </div>
                    </div>

                    {/* Comparator & Evidence */}
                    <div className="flex items-center justify-between md:justify-end gap-4 min-w-[240px]">
                      <div className="flex items-center gap-2">
                        {hasComparator ? (
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                              deal.discount >= 30
                                ? "bg-red-500 text-white"
                                : deal.discount >= 15
                                ? "bg-amber-400 text-slate-950"
                                : "bg-emerald-500 text-white"
                            }`}
                          >
                            ↓ {deal.discount.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">
                            {deal.comparator?.isSufficient === false ? "Đang tích lũy" : "Mặt bằng chung"}
                          </span>
                        )}

                        <div className="text-left text-[11px]">
                          <div className="text-slate-300">{evidenceLabel}</div>
                          <div className="text-[10px] text-slate-500">{deal.expiresIn || "Quan sát mới"}</div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/deals/${deal.id}`}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] transition-colors"
                        >
                          Chi tiết
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSelectedWatchDeal(deal)}
                          className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-white/5 transition-colors cursor-pointer"
                          title="Theo dõi chặng này"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBookmarkToggle(deal)}
                          className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-white/5 transition-colors cursor-pointer"
                          title={isBookmarked ? "Bỏ lưu" : "Lưu"}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-sky-400 text-sky-400" : ""}`} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-6 border-t border-white/10 text-xs text-slate-400">
                <div>
                  Hiển thị <span className="font-mono text-white">{startIdx}</span>–
                  <span className="font-mono text-white">{endIdx}</span> trên{" "}
                  <span className="font-mono text-white">{totalCount}</span> cơ hội
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trang trước</span>
                  </button>

                  <span className="px-2 font-mono text-slate-300">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-slate-900 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors flex items-center gap-1"
                  >
                    <span>Trang sau</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {selectedWatchDeal && (
        <WatchModal
          isOpen={Boolean(selectedWatchDeal)}
          onClose={() => setSelectedWatchDeal(null)}
          initialOrigin={selectedWatchDeal.fromCode}
          initialDestination={selectedWatchDeal.toCode}
          currentPrice={selectedWatchDeal.price}
          sourceContext="deals_page"
        />
      )}
    </main>
  );
}
