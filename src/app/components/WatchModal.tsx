import { useState, useEffect, useRef } from "react";
import { X, Bell, Check, ChevronDown, ChevronUp, Mail, ShieldCheck } from "lucide-react";
import { formatVND } from "../data/deals";
import { createWatch } from "../data/watchApi";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { trackProductEvent } from "../lib/analytics";

export interface WatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  opportunity?: {
    id?: string;
    originCode?: string;
    originName?: string;
    destinationCode?: string;
    destinationName?: string;
    price?: number;
    departDate?: string;
    returnDate?: string;
    stops?: number;
  } | null;
  initialOrigin?: string;
  initialDestination?: string;
  currentPrice?: number;
  targetPrice?: number;
  sourceContext?: string;
}

export function WatchModal({
  isOpen,
  onClose,
  onSuccess,
  opportunity,
  initialOrigin,
  initialDestination,
  currentPrice,
  targetPrice: propTargetPrice,
  sourceContext,
}: WatchModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const effectiveOrigin = opportunity?.originCode || initialOrigin || "HAN";
  const effectiveDestination = opportunity?.destinationCode || initialDestination || "BKK";
  const effectiveCurrentPrice = opportunity?.price || currentPrice || 3000000;

  const [targetPrice, setTargetPrice] = useState<number>(
    propTargetPrice || Math.round(effectiveCurrentPrice * 0.95)
  );
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"instant" | "daily">("instant");
  const [maxStops, setMaxStops] = useState<number | undefined>(opportunity?.stops);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsSuccess(false);
    setError(null);
    setTargetPrice(propTargetPrice || Math.round(effectiveCurrentPrice * 0.95));
    setMaxStops(opportunity?.stops);

    // Try prefilling email if signed in
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user?.email) {
          setEmail(data.session.user.email);
        }
      });
    }

    // REQ-A11Y-005: Modal focus trap & restore
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    // Focus first focusable element inside modal
    const timer = setTimeout(() => {
      const emailInput = document.getElementById("watch-email") as HTMLElement | null;
      if (emailInput) {
        emailInput.focus();
      } else {
        modalRef.current?.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusable = Array.from(focusableElements).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
      // Restore focus on close
      if (previouslyFocusedElement && typeof previouslyFocusedElement.focus === "function") {
        previouslyFocusedElement.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Vui lòng nhập địa chỉ email hợp lệ.");
      return;
    }

    setSubmitting(true);
    setError(null);

    // REQ-FEAT-005: Any-Date Watch with explicit horizon (default to 90 days from today if unconstrained)
    const todayStr = new Date().toISOString().slice(0, 10);
    const horizon90DaysStr = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
    const dateFrom = opportunity?.departDate || todayStr;
    const dateTo = opportunity?.returnDate || opportunity?.departDate || horizon90DaysStr;

    try {
      const res = await createWatch({
        originCode: effectiveOrigin,
        originName: opportunity?.originName || effectiveOrigin,
        destinationCode: effectiveDestination,
        destinationName: opportunity?.destinationName || effectiveDestination,
        currentPrice: effectiveCurrentPrice,
        targetPrice,
        maxStops,
        dateFrom,
        dateTo,
        email: email.trim(),
        frequency,
        channel: "email",
      });

      if (res.success) {
        setIsSuccess(true);
        void trackProductEvent({
          eventType: "watch_created",
          entityId: res.watchId,
          metadata: {
            watch_id: res.watchId,
            opportunity_id: opportunity?.id || null,
            route: `${effectiveOrigin}-${effectiveDestination}`,
            target_price: targetPrice,
            source: sourceContext || "modal",
          },
        });
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(res.error || "Không thể tạo theo dõi lúc này. Vui lòng thử lại.");
      }
    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi khi tạo theo dõi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-lg rounded-xl border border-stone-200 bg-white p-6 shadow-2xl text-stone-900 outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="watch-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8 space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-stone-900">Đã bắt đầu theo dõi</h3>
            <p className="text-sm text-stone-600">
              Farely sẽ thông báo tới <strong className="text-stone-900">{email}</strong> ngay khi có lượt quét phát hiện mức giá ≤ {formatVND(targetPrice)}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-1">
                <Bell className="w-4 h-4" />
                <span>Theo dõi cơ hội bay</span>
              </div>
              <h2 id="watch-modal-title" className="text-xl font-bold text-stone-900">
                {opportunity?.originName || effectiveOrigin} ({effectiveOrigin}) → {opportunity?.destinationName || effectiveDestination} ({effectiveDestination})
              </h2>
              {opportunity?.departDate && (
                <p className="text-xs text-stone-500 mt-1">
                  Ngày bay: {opportunity.departDate} {opportunity.returnDate ? `— ${opportunity.returnDate}` : "(Một chiều)"}
                </p>
              )}
            </div>

            {/* Price context block */}
            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500">Mức giá ghi nhận gần nhất</span>
                <p className="text-lg font-bold text-stone-900 tracking-tight font-mono">{formatVND(effectiveCurrentPrice)}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-stone-500">Mục tiêu bạn muốn</span>
                <p className="text-sm font-bold text-blue-600 font-mono">≤ {formatVND(targetPrice)}</p>
              </div>
            </div>

            {/* Target Price Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="target-price-input" className="text-stone-700 font-medium">
                  Báo cho tôi khi giá bằng hoặc thấp hơn:
                </label>
                <span className="font-mono text-emerald-700 font-bold">{formatVND(targetPrice)}</span>
              </div>
              <input
                id="target-price-input"
                type="range"
                min={Math.max(500000, Math.floor(effectiveCurrentPrice * 0.4))}
                max={Math.ceil(effectiveCurrentPrice * 1.1)}
                step={50000}
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-stone-500 font-mono">
                <span>{formatVND(Math.max(500000, Math.floor(effectiveCurrentPrice * 0.4)))}</span>
                <span>Hiện tại: {formatVND(effectiveCurrentPrice)}</span>
              </div>
            </div>

            {/* Email input */}
            <div className="space-y-1.5">
              <label htmlFor="watch-email" className="block text-xs font-medium text-stone-700">
                Email nhận cảnh báo
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                <input
                  id="watch-email"
                  type="email"
                  required
                  placeholder="traveler@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-stone-300 bg-white text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* Advanced toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 transition"
              >
                <span>Tùy chọn nâng cao</span>
                {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showAdvanced && (
                <div className="mt-3 p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-3 animate-in fade-in duration-100">
                  <div className="space-y-1">
                    <label className="block text-xs text-stone-600 font-medium">Tần suất gửi tin</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setFrequency("instant")}
                        className={`p-2 rounded-lg border text-center transition ${
                          frequency === "instant"
                            ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                            : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        Khi có lượt quét phù hợp
                      </button>
                      <button
                        type="button"
                        onClick={() => setFrequency("daily")}
                        className={`p-2 rounded-lg border text-center transition ${
                          frequency === "daily"
                            ? "border-blue-600 bg-blue-50 text-blue-700 font-bold"
                            : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
                        }`}
                      >
                        Tổng hợp 1 lần/ngày
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs text-stone-600 font-medium">Số điểm dừng tối đa</label>
                    <select
                      value={maxStops ?? ""}
                      onChange={(e) => setMaxStops(e.target.value === "" ? undefined : Number(e.target.value))}
                      className="w-full py-2 px-3 rounded-lg border border-stone-300 bg-white text-xs text-stone-900 focus:border-blue-600"
                    >
                      <option value="">Bất kỳ số điểm dừng</option>
                      <option value="0">Bay thẳng (0 điểm dừng)</option>
                      <option value="1">Tối đa 1 điểm dừng</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg" role="alert">
                {error}
              </p>
            )}

            <div className="pt-2 flex items-center justify-between gap-3 border-t border-stone-100">
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                <span>Không spam · Hủy bất kỳ lúc nào</span>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-xs font-bold text-white transition shadow-sm cursor-pointer"
              >
                {submitting ? "Đang lưu..." : "Bắt đầu theo dõi"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
