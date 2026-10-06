import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Bell,
  Plus,
  Play,
  Pause,
  Trash2,
  ExternalLink,
} from "lucide-react";

import { formatVND } from "../data/deals";
import {
  deleteWatch,
  getWatches,
  pauseWatch,
  resumeWatch,
} from "../data/watchApi";
import { formatWatchStatusLabel, WatchIntent } from "../domain/watch";
import { WatchModal } from "../components/WatchModal";
import { trackProductEvent } from "../lib/analytics";

function formatLastChecked(dateString?: string | null): { text: string; isDegraded: boolean } {
  if (!dateString) {
    return { text: "Đang chờ lượt kiểm tra đầu tiên", isDegraded: false };
  }
  const ms = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(ms / (1000 * 60));
  const isDegraded = minutes > 6 * 60;

  let text = "Vừa xong";
  if (minutes >= 1 && minutes < 60) text = `${minutes} phút trước`;
  else if (minutes >= 60 && minutes < 24 * 60) text = `${Math.floor(minutes / 60)} giờ trước`;
  else if (minutes >= 24 * 60) text = `${Math.floor(minutes / (24 * 60))} ngày trước`;

  return { text, isDegraded };
}

export function WatchPage() {
  const [watches, setWatches] = useState<WatchIntent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const list = await getWatches();
      setWatches(list);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    void trackProductEvent({ eventType: "page_view", metadata: { page: "watch" } });
  }, []);

  async function handleTogglePause(watch: WatchIntent) {
    if (watch.status === "paused") {
      await resumeWatch(watch.id);
    } else {
      await pauseWatch(watch.id);
    }
    await loadData();
  }

  async function handleDelete(id: string) {
    if (window.confirm("Bạn có chắc muốn ngừng theo dõi tuyến bay này?")) {
      await deleteWatch(id);
      await loadData();
    }
  }

  return (
    <main className="min-h-screen bg-[var(--canvas-bg)] text-stone-900 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
              Tuyến bay bạn đang quan sát
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xl">
              Hợp đồng giám sát định kỳ. Farely đối chiếu mỗi chu kỳ quét dữ liệu với mục tiêu của bạn và chỉ thông báo khi có biến động giá thực tế.
            </p>
            <div className="text-xs text-stone-500 mt-1">Tổng số tuyến: {watches.length}</div>
          </div>

          <div>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo theo dõi mới</span>
            </button>
          </div>
        </div>

        {/* Monitoring Ledger List */}
        {loading ? (
          <div className="text-center py-16 text-stone-500 text-xs font-mono">Đang tải sổ theo dõi…</div>
        ) : watches.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-xl border border-dashed border-stone-300 bg-white space-y-3 shadow-sm">
            <Bell className="w-8 h-8 text-stone-400 mx-auto" />
            <div>
              <h2 className="text-base font-bold text-stone-900">Chưa có tuyến bay nào trong sổ theo dõi</h2>
              <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                Khi xem một cơ hội trên Farely, bấm [Theo dõi] để nhận cảnh báo khi giá chạm mục tiêu mong muốn.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/deals"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white transition shadow-sm"
              >
                Khám phá cơ hội hôm nay
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {watches.map((watch) => {
              const meta = formatWatchStatusLabel(watch.status);
              const checkInfo = formatLastChecked(watch.lastCheckedAt);
              const isDegraded = checkInfo.isDegraded || watch.status === "degraded";

              return (
                <div
                  key={watch.id}
                  className={`p-4 rounded-xl border transition-colors bg-white shadow-sm ${
                    isDegraded
                      ? "border-amber-300 bg-amber-50/50"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Route & Intent Header */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-stone-900">
                          {watch.originCode} <span className="text-blue-600 font-light">→</span> {watch.destinationCode}
                        </span>
                        <span className="text-xs text-stone-500">
                          ({watch.originName || watch.originCode} - {watch.destinationName || watch.destinationCode})
                        </span>

                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                            isDegraded
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-stone-100 text-stone-700 border-stone-200"
                          }`}
                        >
                          {isDegraded ? "MONITORING DEGRADED" : meta.label}
                        </span>
                      </div>

                      <div className="text-xs text-stone-600 flex flex-wrap items-center gap-3">
                        <span>
                          {watch.dateFrom
                            ? `Ngày: ${watch.dateFrom}${watch.dateTo ? ` đến ${watch.dateTo}` : ""}`
                            : "Mọi ngày bay"}
                        </span>
                        {typeof watch.maxStops === "number" && (
                          <span>· Tối đa {watch.maxStops} điểm dừng</span>
                        )}
                        {watch.email && <span>· Báo về {watch.email}</span>}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePause(watch)}
                        title={watch.status === "paused" ? "Tiếp tục theo dõi" : "Tạm dừng"}
                        className="px-2.5 py-1 rounded-lg border border-stone-300 text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition text-xs flex items-center gap-1 cursor-pointer"
                      >
                        {watch.status === "paused" ? (
                          <>
                            <Play className="w-3 h-3 text-emerald-600" />
                            <span>Tiếp tục</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3 h-3 text-amber-600" />
                            <span>Tạm dừng</span>
                          </>
                        )}
                      </button>

                      <Link
                        to={`/deals?destination=${watch.destinationCode}`}
                        title="Xem các cơ hội hiện có"
                        className="px-2.5 py-1 rounded-lg border border-stone-300 text-stone-700 hover:text-stone-900 hover:bg-stone-50 transition text-xs flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Xem vé</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(watch.id)}
                        title="Xóa theo dõi"
                        className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        aria-label="Xóa theo dõi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Fact Ledger Row: Target, Latest Price, Last Checked */}
                  <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                        Mục tiêu
                      </span>
                      <p className="font-mono font-bold text-emerald-700 mt-0.5">
                        {watch.targetPrice ? `≤ ${formatVND(watch.targetPrice)}` : "Mọi giá giảm tốt"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                        Giá ghi nhận gần nhất
                      </span>
                      <p className="font-mono font-bold text-stone-900 mt-0.5">
                        {watch.latestPrice ? formatVND(watch.latestPrice) : "Đang chờ quét"}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                        Lần kiểm tra gần nhất
                      </span>
                      <p className={`font-mono mt-0.5 ${isDegraded ? "text-amber-700 font-semibold" : "text-stone-700"}`}>
                        {checkInfo.text}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                        Tình trạng
                      </span>
                      <p className="font-mono text-stone-700 mt-0.5">
                        {watch.status === "matched"
                          ? "Đã có chuyến khớp giá"
                          : isDegraded
                          ? "Chưa có đợt quét mới"
                          : "Đang giám sát chủ động"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for manual adding */}
        <WatchModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => loadData()}
          initialOrigin="HAN"
          initialDestination="BKK"
          sourceContext="watch_page"
        />
      </div>
    </main>
  );
}
