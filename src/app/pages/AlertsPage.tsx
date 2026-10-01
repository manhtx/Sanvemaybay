import { useEffect, useMemo, useState } from "react";
import { Bell, Send, Mail, Zap, CheckCircle, Globe, TrendingDown, Clock, Shield } from "lucide-react";
import { toast, Toaster } from "sonner";
import { useSearchParams } from "react-router";
import { formatVND } from "../data/deals";
import { createAlerts, getTrackedRoutes, TrackedRoute } from "../data/api";
import { getUserPreferences, loadRemoteUserPreferences, saveRemoteUserPreferences, saveUserPreferences } from "../lib/preferences";
import { trackProductEvent } from "../lib/analytics";
import { TurnstileWidget } from "../components/TurnstileWidget";

const discountLevels = [
  { value: 20, label: "Từ -20%" },
  { value: 30, label: "Từ -30%" },
  { value: 40, label: "Từ -40%" },
  { value: 50, label: "Từ -50%" },
];

const channels = [
  { value: "telegram", label: "Telegram", icon: Send, description: "Thông báo tức thì, ít bỏ sót nhất" },
  { value: "email", label: "Email", icon: Mail, description: "Nhận cảnh báo theo tần suất đã chọn" },
];

export function AlertsPage() {
  const [searchParams] = useSearchParams();
  const initialDestination = searchParams.get("destination");
  const initialOrigin = searchParams.get("origin");
  const [routes, setRoutes] = useState<TrackedRoute[]>([]);
  const [selectedDests, setSelectedDests] = useState<string[]>([]);
  const [channel, setChannel] = useState("email");
  const [contact, setContact] = useState(""); // email or Telegram Chat ID
  const [email, setEmail] = useState(""); // always collect email for confirmation
  const [discount, setDiscount] = useState(30);
  const [fromCity, setFromCity] = useState(initialOrigin ?? getUserPreferences().homeAirport);
  const [budgetMax, setBudgetMax] = useState(getUserPreferences().budget);
  const [preferredRegions, setPreferredRegions] = useState<string[]>(["Domestic", "International"]);
  const [frequency, setFrequency] = useState("instant");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? "";

  useEffect(() => {
    loadRemoteUserPreferences().then((remote) => {
      if (!remote) return;
      setFromCity(remote.homeAirport);
      setBudgetMax(remote.budget);
      saveUserPreferences(remote);
    });
  }, []);

  const departureCities = useMemo(
    () =>
      Array.from(
        new Map(routes.map((route) => [route.originCode, {
          code: route.originCode,
          name: route.originName,
        }])).values(),
      ),
    [routes],
  );
  const destinations = useMemo(
    () =>
      Array.from(
        new Map(
          routes
            .filter((route) => !fromCity || route.originCode === fromCity)
            .map((route) => [route.destinationCode, {
              code: route.destinationCode,
              name: route.destinationName,
            }]),
        ).values(),
      ),
    [fromCity, routes],
  );

  useEffect(() => {
    getTrackedRoutes().then((trackedRoutes) => {
      setRoutes(trackedRoutes);
      const origin =
        (initialOrigin && trackedRoutes.some((route) => route.originCode === initialOrigin)
          ? initialOrigin
          : trackedRoutes.find((route) => route.originCode === getUserPreferences().homeAirport)?.originCode
            ?? trackedRoutes[0]?.originCode) ?? "";
      setFromCity(origin);
      const matchingDestination = trackedRoutes.find(
        (route) =>
          route.originCode === origin &&
          (route.destinationCode === initialDestination ||
            route.destinationName === initialDestination),
      );
      if (matchingDestination) setSelectedDests([matchingDestination.destinationCode]);
    });
  }, [initialDestination, initialOrigin]);

  useEffect(() => {
    setSelectedDests((selected) =>
      selected.filter((code) => destinations.some((destination) => destination.code === code)),
    );
  }, [destinations]);

  const toggleDest = (code: string) => {
    if (selectedDests.includes(code)) {
      setSelectedDests(selectedDests.filter((d: string) => d !== code));
    } else {
      if (selectedDests.length >= 5) {
        toast.error("Mỗi lần chỉ có thể đăng ký tối đa 5 điểm đến.");
        return;
      }
      setSelectedDests([...selectedDests, code]);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate: need at least an email for confirmation
    const emailToUse = channel === 'email' ? contact : email;
    if (!emailToUse || !emailToUse.includes('@')) {
      toast.error("Vui lòng nhập địa chỉ email hợp lệ để nhận xác nhận");
      return;
    }
    if (channel === 'telegram' && !contact) {
      toast.error("Vui lòng nhập Telegram Chat ID");
      return;
    }
    if (selectedDests.length === 0) {
      toast.error("Chọn ít nhất một điểm đến");
      return;
    }
    if (!turnstileSiteKey || !turnstileToken) {
      toast.error("Vui lòng hoàn tất bước xác minh chống spam");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const alerts = selectedDests.map((dest) => {
        const destLabel = destinations.find(d => d.code === dest)?.name || dest;
        return {
          destination: destLabel,
          destination_code: dest,
          origin_code: fromCity,
          budget: budgetMax,
          discount_threshold: discount,
          preferred_regions: preferredRegions,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          frequency: frequency as "instant" | "daily",
          notify_telegram: channel === 'telegram',
          notify_email: true, // always notify via email as backup
          email: emailToUse,
          telegram_id: channel === 'telegram' ? contact : '',
          channel,
        };
      });
      const result = await createAlerts(alerts, turnstileToken);
      for (const dest of selectedDests) {
        void trackProductEvent({ eventType: "alert_created", entityId: dest, metadata: { route: `${fromCity}-${dest}`, channel } });
      }
      
      toast.success("🎉 Đã đăng ký báo giá thành công!", {
        description: `${result.alert_ids?.length ?? alerts.length} cảnh báo đã được thiết lập. Kiểm tra ${emailToUse} để xác nhận.`,
        duration: 6000,
      });
    } catch (err: unknown) {
      toast.error("Có lỗi xảy ra khi tạo Alert", {
        description: err instanceof Error ? err.message : "Vui lòng thử lại sau.",
      });
    } finally {
      setIsSubmitting(false);
      setTurnstileReset((value) => value + 1);
    }
  };

  return (
    <main className="min-h-screen pb-16 pt-24">
      <Toaster position="top-center" theme="dark" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-pink-500 to-violet-600 shadow-lg shadow-pink-500/20">
            <Bell className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-white mb-3" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Cài Báo Giá Thông Minh
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Nhận thông báo khi hệ thống phát hiện deal đạt điều kiện — qua Telegram hoặc Email trong giai đoạn Beta.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Channel */}
              <div className="rounded-2xl border border-white/10 bg-[#171719] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-xs font-extrabold text-white">1</div>
                  <h2 className="text-white" style={{ fontWeight: 700 }}>Kênh nhận thông báo</h2>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  {channels.map((ch) => {
                    const Icon = ch.icon;
                    return (
                      <button
                        key={ch.value}
                        type="button"
                        onClick={() => setChannel(ch.value)}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                          channel === ch.value
                            ? "bg-pink-500/15 border-pink-500/40 text-white"
                            : "bg-slate-800/50 border-white/10 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${channel === ch.value ? "text-sky-400" : "text-slate-500"}`} />
                        <div>
                          <div className="text-sm" style={{ fontWeight: 700 }}>{ch.label}</div>
                          <div className="text-xs opacity-70 mt-0.5">{ch.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Email always shown */}
                <div>
                  <label className="text-slate-500 text-xs mb-2 block" style={{ fontWeight: 600 }}>
                    📧 Địa chỉ Email <span className="text-sky-400">(để nhận xác nhận)</span>
                  </label>
                  <input
                    aria-label="Email nhận xác nhận báo giá"
                    type="email"
                    value={channel === "email" ? contact : email}
                    onChange={(e) => channel === "email" ? setContact(e.target.value) : setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/40"
                  />
                </div>
                
                {/* Telegram Chat ID — only shown when Telegram channel selected */}
                {channel === "telegram" && (
                  <div className="mt-3">
                    <label className="text-slate-500 text-xs mb-2 block" style={{ fontWeight: 600 }}>
                      ✈️ Telegram Chat ID
                    </label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="Ví dụ: 123456789"
                      className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/40"
                    />
                  </div>
                )}
              </div>

              {/* Step 2: Departure */}
              <div className="rounded-2xl border border-white/10 bg-[#171719] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-xs font-extrabold text-white">2</div>
                  <h2 className="text-white" style={{ fontWeight: 700 }}>Sân bay khởi hành</h2>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {departureCities.map((city) => (
                    <button
                      key={city.code}
                      type="button"
                      onClick={() => {
                        setFromCity(city.code);
                        saveUserPreferences({ homeAirport: city.code });
                        void saveRemoteUserPreferences({ ...getUserPreferences(), homeAirport: city.code });
                      }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm ${
                        fromCity === city.code
                          ? "bg-sky-500/15 border-sky-500/40 text-sky-400"
                          : "bg-slate-800/50 border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      {city.name} ({city.code})
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Destinations */}
              <div className="rounded-2xl border border-white/10 bg-[#171719] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-xs font-extrabold text-white">3</div>
                  <h2 className="text-white" style={{ fontWeight: 700 }}>Điểm đến quan tâm</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {destinations.map((dest) => {
                    const selected = selectedDests.includes(dest.code);
                    return (
                      <button
                        key={dest.code}
                        type="button"
                        onClick={() => toggleDest(dest.code)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                          selected
                            ? "bg-sky-500/15 border-sky-500/40 text-white"
                            : "bg-slate-800/50 border-white/10 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        <span className="text-sm" style={{ fontWeight: 600 }}>{dest.name}</span>
                        {selected && <CheckCircle className="w-4 h-4 text-sky-400 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
                {destinations.length === 0 && (
                  <p className="text-amber-400 text-sm mt-4">
                    Chưa có tuyến bay đang được theo dõi từ điểm khởi hành này.
                  </p>
                )}
              </div>

              {/* Step 4: Discount threshold */}
              <div className="rounded-2xl border border-white/10 bg-[#171719] p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-xs font-extrabold text-white">4</div>
                  <h2 className="text-white" style={{ fontWeight: 700 }}>Ngưỡng giảm giá</h2>
                </div>
                <p className="text-slate-500 text-sm mb-4">Chỉ nhận thông báo khi giá giảm ít nhất bao nhiêu?</p>
                <div className="flex gap-3 flex-wrap">
                  {discountLevels.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setDiscount(level.value)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm ${
                        discount === level.value
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : "bg-slate-800/50 border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      <TrendingDown className="w-3.5 h-3.5" />
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 5: Advanced Personalization (Module 6.2) */}
              <div className="space-y-8 rounded-2xl border border-white/10 bg-[#171719] p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-xs font-extrabold text-white">5</div>
                    <h2 className="text-white" style={{ fontWeight: 700 }}>Tùy chỉnh cá nhân</h2>
                  </div>
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Bộ lọc dữ liệu</span>
                </div>

                {/* Budget Max */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-400 text-sm font-bold uppercase tracking-wider">Ngân sách tối đa</label>
                    <span className="text-sky-400 font-black">{formatVND(budgetMax)}</span>
                  </div>
                  <input aria-label="Ngưỡng giảm giá tối thiểu"
                    type="range" 
                    min="1000000" 
                    max="50000000" 
                    step="500000"
                    value={budgetMax}
                    onChange={(e) => {
                      const nextBudget = Number(e.target.value);
                      setBudgetMax(nextBudget);
                      saveUserPreferences({ budget: nextBudget });
                      void saveRemoteUserPreferences({ ...getUserPreferences(), budget: nextBudget });
                    }}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                    <span>1.0M</span>
                    <span>50.0M</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                  <div className="sm:col-span-2 space-y-3">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest block">Khoảng ngày khởi hành (tuỳ chọn)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input aria-label="Ngày đi từ" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm" />
                      <input aria-label="Ngày đi đến" type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)} className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm" />
                    </div>
                  </div>
                  {/* Regions */}
                  <div className="space-y-3">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest block">Khu vực ưa thích</label>
                    <div className="flex gap-2">
                      {["Domestic", "International"].map(r => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setPreferredRegions(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                            preferredRegions.includes(r) 
                              ? "bg-sky-500/20 border-sky-500/40 text-sky-400" 
                              : "bg-slate-800/50 border-white/5 text-slate-500"
                          }`}
                        >
                          {r === "Domestic" ? "🇻🇳 Nội địa" : "🌏 Quốc tế"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frequency */}
                  <div className="space-y-3">
                    <label className="text-slate-500 text-[10px] font-black uppercase tracking-widest block">Tần suất báo</label>
                    <div className="flex gap-2">
                      {["instant", "daily"].map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setFrequency(f)}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                            frequency === f
                              ? "bg-violet-500/20 border-violet-500/40 text-violet-400" 
                              : "bg-slate-800/50 border-white/5 text-slate-500"
                          }`}
                        >
                          {f === "instant" ? "Tức thì" : "Mỗi ngày"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {turnstileSiteKey ? (
                <TurnstileWidget siteKey={turnstileSiteKey} onToken={setTurnstileToken} resetSignal={turnstileReset} />
              ) : (
                <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                  Dịch vụ xác minh chống spam chưa được cấu hình. Tạm thời chưa thể tạo cảnh báo.
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || !turnstileSiteKey || !turnstileToken}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 py-4 text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ fontWeight: 700, fontSize: "1rem" }}
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Tạo Alert Miễn Phí
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            <div className="bg-slate-900 border border-sky-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-4 h-4 text-sky-400" />
                <span className="text-white text-sm" style={{ fontWeight: 700 }}>Preview thông báo</span>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 border border-white/8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 via-pink-500 to-violet-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs" style={{ fontWeight: 800 }}>FL</span>
                  </div>
                  <div>
                    <div className="text-white text-xs" style={{ fontWeight: 700 }}>Farely Alert</div>
                    <div className="text-slate-500 text-xs">vừa xong</div>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  🚨 <strong>Deal Alert!</strong>
                  <br />
                  ✈️ {fromCity} → {selectedDests.length > 0
                    ? destinations.find(d => d.code === selectedDests[0])?.name || "điểm đến"
                    : "điểm đến đã chọn"}
                  <br />
                  💰 Giá không vượt quá {formatVND(budgetMax)}
                  <br />
                  📉 Giảm ít nhất {discount}% so với mức tham chiếu
                  <br />
                  📊 <em>Kèm số mẫu và độ tin cậy của dữ liệu</em>
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-slate-900 border border-white/8 rounded-2xl p-5">
              <h3 className="text-white text-sm mb-4" style={{ fontWeight: 700 }}>Tại sao dùng Alert?</h3>
              <ul className="space-y-3">
                {[
                  { icon: Clock, text: "Nhận thông báo sau khi hệ thống xác nhận deal đạt điều kiện" },
                  { icon: TrendingDown, text: "Chỉ nhận deal thực sự rẻ — lọc theo ngưỡng bạn đặt" },
                  { icon: Globe, text: "Kèm số liệu lịch sử và mức độ tin cậy" },
                  { icon: Shield, text: "Chống gửi trùng cùng một deal" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="w-7 h-7 bg-sky-500/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <span className="text-slate-400 text-sm leading-relaxed">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              q: "Mất phí không?",
              a: "Hiện tại hệ thống không thu phí khi tạo cảnh báo."
            },
            {
              q: "Nhận bao nhiêu thông báo?",
              a: "Hệ thống chống gửi trùng cùng một deal và chỉ gửi khi đạt ngân sách, ngưỡng giảm bạn đặt."
            },
            {
              q: "Dữ liệu của tôi có an toàn?",
              a: "Email hoặc Telegram Chat ID được lưu để gửi cảnh báo qua nhà cung cấp tương ứng."
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-slate-900/60 border border-white/8 rounded-2xl p-5">
              <h3 className="text-white text-sm mb-2" style={{ fontWeight: 700 }}>❓ {q}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
