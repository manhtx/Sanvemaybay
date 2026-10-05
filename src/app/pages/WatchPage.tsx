import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Bell,
  Plus,
  Play,
  Pause,
  Trash2,
  ExternalLink,
  Plane,
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

function timeAgo(dateString?: string | null): string {
  if (!dateString) return "Chưa kiểm tra";
  const ms = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(ms / (1000 * 60));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
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

  const monitoringCount = watches.filter((w) => w.status === "monitoring").length;
  const matchedCount = watches.filter((w) => w.status === "matched").length;

  return (
    <main className="min-h-screen bg-slate-950 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Bell className="w-4 h-4" />
              <span>Quản lý theo dõi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Tuyến bay bạn đang quan sát
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Farely liên tục đối chiếu các đợt quét giá mới với mục tiêu của bạn và thông báo khi có mức giá phù hợp.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm tuyến theo dõi</span>
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <span className="text-xs text-slate-500 font-medium">Tổng số tuyến</span>
            <p className="text-2xl font-bold text-white mt-1">{watches.length}</p>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <span className="text-xs text-slate-500 font-medium">Đang theo dõi</span>
            <p className="text-2xl font-bold text-blue-400 mt-1">{monitoringCount}</p>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <span className="text-xs text-slate-500 font-medium">Đã đạt mục tiêu</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{matchedCount}</p>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <span className="text-xs text-slate-500 font-medium">Kênh nhận tin</span>
            <p className="text-sm font-semibold text-slate-300 mt-2 truncate">Email định kỳ</p>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-16 text-slate-500 text-sm">Đang tải danh sách theo dõi...</div>
        ) : watches.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-white/10 bg-white/[0.01] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Chưa có tuyến bay nào được theo dõi</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                Khi bạn tìm thấy một cơ hội thú vị, bấm [Theo dõi] để Farely canh giá và gửi thông báo khi giá hạ xuống mức bạn muốn.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition"
              >
                Tạo theo dõi đầu tiên
              </button>
              <Link
                to="/deals"
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-semibold text-slate-300 transition"
              >
                Khám phá cơ hội hôm nay
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {watches.map((watch) => {
              const meta = formatWatchStatusLabel(watch.status);
              return (
                <div
                  key={watch.id}
                  className="p-5 rounded-2xl border border-white/[0.08] bg-[#12151c] hover:border-white/20 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-lg font-bold text-white tracking-tight">
                          {watch.originName || watch.originCode} ({watch.originCode})
                        </span>
                        <span className="text-slate-500">→</span>
                        <span className="text-lg font-bold text-white tracking-tight">
                          {watch.destinationName || watch.destinationCode} ({watch.destinationCode})
                        </span>
                        <span
                          className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border ${meta.colorClass}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {watch.dateFrom
                          ? `Giai đoạn: ${watch.dateFrom} ${watch.dateTo ? `đến ${watch.dateTo}` : ""}`
                          : "Theo dõi mọi ngày bay"}
                        {typeof watch.maxStops === "number" && ` · Tối đa ${watch.maxStops} điểm dừng`}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleTogglePause(watch)}
                        title={watch.status === "paused" ? "Tiếp tục theo dõi" : "Tạm dừng"}
                        className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition text-xs flex items-center gap-1.5"
                      >
                        {watch.status === "paused" ? (
                          <>
                            <Play className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Tiếp tục</span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3.5 h-3.5 text-amber-400" />
                            <span>Tạm dừng</span>
                          </>
                        )}
                      </button>
                      <Link
                        to={`/deals?destination=${watch.destinationCode}`}
                        title="Xem các cơ hội hiện có"
                        className="p-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition text-xs flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Xem vé</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(watch.id)}
                        title="Xóa theo dõi"
                        className="p-2 rounded-lg border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 transition text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Fact line */}
                  <div className="pt-3 border-t border-white/[0.05] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500">Mục tiêu báo giá</span>
                      <p className="font-semibold text-emerald-400">
                        {watch.targetPrice ? `≤ ${formatVND(watch.targetPrice)}` : "Mọi giá tốt"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Giá quan sát gần nhất</span>
                      <p className="font-semibold text-white">
                        {watch.latestPrice ? formatVND(watch.latestPrice) : "Đang kiểm tra"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Lần kiểm tra gần nhất</span>
                      <p className="text-slate-300">{timeAgo(watch.lastCheckedAt)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Email nhận tin</span>
                      <p className="text-slate-300 truncate">{watch.email || "—"}</p>
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
          opportunity={{
            originCode: "HAN",
            originName: "Hà Nội",
            destinationCode: "BKK",
            destinationName: "Bangkok",
            price: 3200000,
          }}
        />
      </div>
    </main>
  );
}
