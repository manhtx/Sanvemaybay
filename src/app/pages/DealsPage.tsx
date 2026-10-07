import { useState, useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Calendar,
  Bell,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Deal, formatVND } from "../data/deals";
import { getObservedFares, getDealsResult } from "../data/api";
import {
  isBookmarkedDeal,
  mutateBookmarkOptimistic,
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

  const monthOptions = useMemo(() => {
    const list: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      list.push(`${d.getMonth() + 1}/${d.getFullYear()}`);
    }
    return list;
  }, []);

  const handleBookmarkToggle = async (deal: Deal) => {
    const targetId = deal.opportunityId || deal.id;
    const snapshot = createOpportunitySnapshot(deal);
    const wasBookmarked = bookmarkedIds.has(targetId);
    const next = !wasBookmarked;

    setBookmarkedIds((prev) => {
      const updated = new Set(prev);
      if (next) updated.add(targetId);
      else updated.delete(targetId);
      return updated;
    });

    const result = await mutateBookmarkOptimistic(targetId, next, snapshot, undefined, {
      onRollback: (rolledState) => {
        setBookmarkedIds((prev) => {
          const updated = new Set(prev);
          if (rolledState) updated.add(targetId);
          else updated.delete(targetId);
          return updated;
        });
      },
    });

    if (result.success) {
      void trackProductEvent({
        eventType: "bookmark",
        entityId: targetId,
        metadata: { bookmarked: next, route: `${deal.fromCode}-${deal.toCode}`, source: "deals_ledger" },
      });
    }
  };

  return (
    <main id="main-content" className="min-h-screen pb-16 pt-24 text-stone-900 bg-[var(--canvas-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mb-1.5">
                Cơ hội giá vé đã ghi nhận
              </h1>
              <p className="max-w-2xl text-xs sm:text-sm leading-relaxed text-stone-600">
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
              className="flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-700 transition-colors hover:bg-stone-50 sm:hidden font-medium shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Bộ lọc</span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Global Filter Toolbar */}
        <div
          className={`rounded-xl border border-stone-200 bg-white p-4 shadow-sm ${
            showFilters ? "block" : "hidden sm:block"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            {/* 1. Origin */}
            <div>
              <label htmlFor="origin-filter" className="block text-[11px] font-bold text-stone-600 mb-1 uppercase tracking-wider">
                Điểm khởi hành
              </label>
              <select
                id="origin-filter"
                value={originFilter}
                onChange={(e) => handleOriginChange(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="all">Tất cả điểm đi</option>
                <option value="HAN">Hà Nội (HAN)</option>
                <option value="SGN">TP. Hồ Chí Minh (SGN)</option>
                <option value="DAD">Đà Nẵng (DAD)</option>
              </select>
            </div>

            {/* 2. Month */}
            <div>
              <label htmlFor="month-filter" className="block text-[11px] font-bold text-stone-600 mb-1 uppercase tracking-wider">
                Thời gian bay
              </label>
              <select
                id="month-filter"
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-blue-600 focus:outline-none"
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
              <label htmlFor="budget-filter" className="block text-[11px] font-bold text-stone-600 mb-1 uppercase tracking-wider">
                Ngân sách tối đa
              </label>
              <select
                id="budget-filter"
                value={maxBudget}
                onChange={(e) => handleBudgetChange(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="all">Tất cả ngân sách</option>
                <option value={3000000}>Dưới 3.000.000₫</option>
                <option value={5000000}>Dưới 5.000.000₫</option>
                <option value={7000000}>Dưới 7.000.000₫</option>
                <option value={10000000}>Dưới 10.000.000₫</option>
              </select>
            </div>

            {/* 4. Direct Only */}
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1 uppercase tracking-wider">
                Số điểm dừng
              </label>
              <button
                type="button"
                onClick={handleDirectToggle}
                className={`w-full py-1.5 px-3 rounded-lg border text-xs font-medium transition-colors ${
                  directOnly
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-stone-300 text-stone-700 hover:bg-stone-50"
                }`}
              >
                {directOnly ? "✓ Chỉ bay thẳng (0 dừng)" : "Tất cả điểm dừng"}
              </button>
            </div>

            {/* 5. Sort */}
            <div>
              <label htmlFor="sort-select" className="block text-[11px] font-bold text-stone-600 mb-1 uppercase tracking-wider">
                Sắp xếp
              </label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => handleSortChange(e.target.value as SortType)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-blue-600 focus:outline-none"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Counter and Page indicator */}
        <div className="flex items-center justify-between text-xs text-stone-600">
          <div>
            {totalCount > 0 && (
              <span>
                Hiển thị {startIdx} – {endIdx} trên tổng số {totalCount} cơ hội
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span>
                Trang {currentPage} / {totalPages}
              </span>
            </div>
          )}
        </div>

        {/* Results grid / cards */}
        {isLoading ? (
          <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-stone-500 font-mono text-xs shadow-sm">
            <LoaderCircle className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
            <span>Đang nạp dữ liệu quan sát…</span>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white p-12 text-center space-y-3 shadow-sm">
            <p className="text-stone-700 font-semibold text-sm">
              Không có cơ hội nào khớp với điều kiện lọc hiện tại.
            </p>
            <p className="text-stone-500 text-xs max-w-md mx-auto">
              Thử điều chỉnh lại điểm khởi hành, tháng bay hoặc mở rộng ngân sách để xem thêm các chặng bay quan sát.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map((deal) => {
              const targetId = deal.opportunityId || deal.id;
              const isSaved = bookmarkedIds.has(targetId) || isBookmarkedDeal(targetId);
              const discount = Number(deal.discount) || 0;

              // Color-coded percentage badge per exact test specification:
              // >= 30% -> bg-red-500
              // >= 15% -> bg-amber-400
              // else -> bg-emerald-500
              const badgeClass =
                discount >= 30
                  ? "bg-red-500 text-white"
                  : discount >= 15
                  ? "bg-amber-400 text-stone-900"
                  : "bg-emerald-500 text-white";

              return (
                <div
                  key={deal.id}
                  className="rounded-xl border border-stone-200 bg-white p-4 space-y-3 shadow-sm hover:border-stone-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {deal.airline}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={isSaved ? "Bỏ lưu cơ hội" : "Lưu cơ hội"}
                          onClick={() => handleBookmarkToggle(deal)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? "fill-blue-600 text-blue-600" : ""}`} />
                        </button>
                        <button
                          type="button"
                          aria-label="Theo dõi"
                          onClick={() => {
                            setSelectedWatchDeal(deal);
                          }}
                          className="p-1.5 text-stone-400 hover:text-stone-700 rounded-md hover:bg-stone-100"
                        >
                          <Bell className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Primary clickable link block containing route and price */}
                    <Link
                      to={`/deals/${deal.id}`}
                      className="block group hover:text-blue-600 transition-colors"
                    >
                      <div className="text-xs text-stone-500 mb-0.5">
                        {deal.from} → {deal.to}
                      </div>
                      <div className="text-xl font-bold font-mono text-stone-900 group-hover:text-blue-600 transition-colors">
                        {deal.fromCode} <span className="text-blue-600 font-light">→</span> {deal.toCode}
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <div className="text-lg font-bold font-mono text-stone-900 tabular-nums">
                          {formatVND(deal.price)}
                        </div>
                        {discount > 0 ? (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono font-bold ${badgeClass}`}>
                            ↓ {discount.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-500">Mặt bằng chung</span>
                        )}
                      </div>
                    </Link>

                    <div className="text-xs text-stone-600 pt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        {new Date(deal.departDate).toLocaleDateString("vi-VN")}
                      </span>
                      <span>·</span>
                      <span>{deal.stops === 0 ? "Bay thẳng" : `${deal.stops} điểm dừng`}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-end">
                    <Link
                      to={`/deals/${deal.id}`}
                      className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs transition-colors border border-stone-200"
                    >
                      Chi tiết
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-lg border border-stone-300 bg-white text-stone-700 disabled:opacity-40 hover:bg-stone-50 transition-colors cursor-pointer"
              aria-label="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-medium text-stone-700 px-3">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-lg border border-stone-300 bg-white text-stone-700 disabled:opacity-40 hover:bg-stone-50 transition-colors cursor-pointer"
              aria-label="Trang tiếp"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <WatchModal
        isOpen={Boolean(selectedWatchDeal)}
        onClose={() => setSelectedWatchDeal(null)}
        opportunity={
          selectedWatchDeal
            ? {
                id: selectedWatchDeal.id,
                originCode: selectedWatchDeal.fromCode,
                destinationCode: selectedWatchDeal.toCode,
                price: selectedWatchDeal.price,
                departDate: selectedWatchDeal.departDate,
                returnDate: selectedWatchDeal.returnDate,
                stops: selectedWatchDeal.stops,
              }
            : undefined
        }
        sourceContext="deals_ledger"
      />
    </main>
  );
}
