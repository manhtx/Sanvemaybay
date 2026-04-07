import { useState } from "react";
import { Bell, Send, Mail, Zap, CheckCircle, X, Plus, Globe, TrendingDown, Clock, Shield, DollarSign } from "lucide-react";
import { toast, Toaster } from "sonner";
import { Link } from "react-router";
import { formatVND } from "../data/mockDeals";
import { createAlert } from "../data/api";

const destinations = [
  { code: "ICN", name: "Hàn Quốc", flag: "🇰🇷" },
  { code: "NRT", name: "Nhật Bản", flag: "🇯🇵" },
  { code: "CDG", name: "Paris", flag: "🇫🇷" },
  { code: "LHR", name: "London", flag: "🇬🇧" },
  { code: "SIN", name: "Singapore", flag: "🇸🇬" },
  { code: "BKK", name: "Bangkok", flag: "🇹🇭" },
  { code: "JFK", name: "New York", flag: "🇺🇸" },
  { code: "SYD", name: "Sydney", flag: "🇦🇺" },
  { code: "DXB", name: "Dubai", flag: "🇦🇪" },
  { code: "DPS", name: "Bali", flag: "🇮🇩" },
  { code: "IST", name: "Istanbul", flag: "🇹🇷" },
  { code: "AMS", name: "Amsterdam", flag: "🇳🇱" },
  { code: "ZRH", name: "Zurich", flag: "🇨🇭" },
  { code: "MLE", name: "Maldives", flag: "🏝️" },
  { code: "CPT", name: "Cape Town", flag: "🇿🇦" },
  { code: "MEX", name: "Mexico City", flag: "🇲🇽" },
  { code: "DLI", name: "Đà Lạt", flag: "🏔️" },
  { code: "ANY", name: "Bất kỳ đâu", flag: "🌍" },
];

const discountLevels = [
  { value: 20, label: "Từ -20%" },
  { value: 30, label: "Từ -30%" },
  { value: 40, label: "Từ -40%" },
  { value: 50, label: "Từ -50%" },
];

const channels = [
  { value: "telegram", label: "Telegram", icon: Send, description: "Thông báo tức thì, ít bỏ sót nhất" },
  { value: "email", label: "Email", icon: Mail, description: "Nhận digest mỗi buổi sáng" },
];

const existingAlerts = [
  {
    id: "a1",
    destination: "Hàn Quốc 🇰🇷",
    channel: "Telegram",
    discount: 30,
    from: "HAN",
    active: true,
    triggered: 2,
  },
  {
    id: "a2",
    destination: "Bất kỳ đâu 🌍",
    channel: "Email",
    discount: 40,
    from: "SGN",
    active: true,
    triggered: 5,
  },
];

export function AlertsPage() {
  const [selectedDests, setSelectedDests] = useState<string[]>([]);
  const [channel, setChannel] = useState("email");
  const [contact, setContact] = useState(""); // email or telegram username
  const [email, setEmail] = useState(""); // always collect email for confirmation
  const [discount, setDiscount] = useState(30);
  const [fromCity, setFromCity] = useState("HAN");
  const [budgetMax, setBudgetMax] = useState(10000000);
  const [preferredRegions, setPreferredRegions] = useState<string[]>(["Domestic", "International"]);
  const [frequency, setFrequency] = useState("instant");
  const [submitted, setSubmitted] = useState(false);

  const toggleDest = (code: string) => {
    if (code === "ANY") {
      setSelectedDests(["ANY"]);
      return;
    }
    const newDests = selectedDests.includes("ANY") ? [] : selectedDests;
    if (newDests.includes(code)) {
      setSelectedDests(newDests.filter((d: string) => d !== code));
    } else {
      setSelectedDests([...newDests, code]);
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
      toast.error("Vui lòng nhập username Telegram");
      return;
    }
    if (selectedDests.length === 0) {
      toast.error("Chọn ít nhất một điểm đến");
      return;
    }
    
    setIsSubmitting(true);
    let successCount = 0;
    
    try {
      for (const dest of selectedDests) {
        const destLabel = destinations.find(d => d.code === dest)?.name || dest;
        await createAlert({
          destination: destLabel,
          budget: budgetMax,
          notify_telegram: channel === 'telegram',
          notify_email: true, // always notify via email as backup
          email: emailToUse,
          telegram_id: channel === 'telegram' ? contact : '',
          channel: channel
        });
        successCount++;
      }
      
      setSubmitted(true);
      toast.success("🎉 Đã đăng ký báo giá thành công!", {
        description: `${successCount} cảnh báo đã được thiết lập. Kiểm tra ${emailToUse} để xác nhận.`,
        duration: 6000,
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Có lỗi xảy ra khi tạo Alert", {
        description: err?.message || "Vui lòng thử lại sau.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const departureCities = [
    { code: "HAN", name: "Hà Nội" },
    { code: "SGN", name: "TP. HCM" },
    { code: "DAD", name: "Đà Nẵng" },
  ];

  return (
    <div className="pt-24 pb-16">
      <Toaster position="top-center" theme="dark" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-14 h-14 bg-gradient-to-br from-sky-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-sky-500/25">
            <Bell className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-white mb-3" style={{ fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Cài Báo Giá Thông Minh
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Nhận thông báo ngay khi AI phát hiện deal phù hợp — qua Telegram hoặc Email. Miễn phí mãi mãi.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Channel */}
              <div className="bg-slate-900 border border-white/8 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center text-white text-xs" style={{ fontWeight: 800 }}>1</div>
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
                            ? "bg-sky-500/15 border-sky-500/40 text-white"
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
                    type="email"
                    value={channel === "email" ? contact : email}
                    onChange={(e) => channel === "email" ? setContact(e.target.value) : setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/40"
                  />
                </div>
                
                {/* Telegram username — only shown when Telegram channel selected */}
                {channel === "telegram" && (
                  <div className="mt-3">
                    <label className="text-slate-500 text-xs mb-2 block" style={{ fontWeight: 600 }}>
                      ✈️ Username Telegram <span className="text-slate-600">(bắt đầu bằng @)</span>
                    </label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="@username"
                      className="w-full bg-slate-800 border border-white/10 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/40"
                    />
                  </div>
                )}
              </div>

              {/* Step 2: Departure */}
              <div className="bg-slate-900 border border-white/8 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center text-white text-xs" style={{ fontWeight: 800 }}>2</div>
                  <h2 className="text-white" style={{ fontWeight: 700 }}>Sân bay khởi hành</h2>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {departureCities.map((city) => (
                    <button
                      key={city.code}
                      type="button"
                      onClick={() => setFromCity(city.code)}
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
              <div className="bg-slate-900 border border-white/8 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center text-white text-xs" style={{ fontWeight: 800 }}>3</div>
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
                        <span className="text-lg">{dest.flag}</span>
                        <span className="text-sm" style={{ fontWeight: 600 }}>{dest.name}</span>
                        {selected && <CheckCircle className="w-4 h-4 text-sky-400 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 4: Discount threshold */}
              <div className="bg-slate-900 border border-white/8 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center text-white text-xs" style={{ fontWeight: 800 }}>4</div>
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
              <div className="bg-slate-900 border border-white/8 rounded-2xl p-6 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center text-white text-xs" style={{ fontWeight: 800 }}>5</div>
                    <h2 className="text-white" style={{ fontWeight: 700 }}>Tùy chỉnh cá nhân</h2>
                  </div>
                  <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">AI Enhanced</span>
                </div>

                {/* Budget Max */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-slate-400 text-sm font-bold uppercase tracking-wider">Ngân sách tối đa</label>
                    <span className="text-sky-400 font-black">{formatVND(budgetMax)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="1000000" 
                    max="50000000" 
                    step="500000"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                    <span>1.0M</span>
                    <span>50.0M</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
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
                          {f === "instant" ? "Tức thì" : "Mỗi sáng"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-2xl transition-all hover:shadow-lg hover:shadow-sky-500/30 disabled:opacity-50"
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
                  <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs" style={{ fontWeight: 800 }}>FC</span>
                  </div>
                  <div>
                    <div className="text-white text-xs" style={{ fontWeight: 700 }}>FlyCheap AI</div>
                    <div className="text-slate-500 text-xs">vừa xong</div>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  🚨 <strong>Deal Alert!</strong>
                  <br />
                  ✈️ {fromCity} → {selectedDests.length > 0
                    ? destinations.find(d => d.code === selectedDests[0])?.name || "điểm đến"
                    : "Hàn Quốc"} -{discount}%
                  <br />
                  💰 Chỉ từ 2.9M₫ (giá gốc 5.2M₫)
                  <br />
                  ⏰ Còn 1 ngày 14 giờ · 4 ghế
                  <br />
                  🤖 <em>AI: Low season + mở route mới</em>
                </p>
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-slate-900 border border-white/8 rounded-2xl p-5">
              <h3 className="text-white text-sm mb-4" style={{ fontWeight: 700 }}>Tại sao dùng Alert?</h3>
              <ul className="space-y-3">
                {[
                  { icon: Clock, text: "Nhận ngay khi deal xuất hiện — không bỏ lỡ flash sale 24h" },
                  { icon: TrendingDown, text: "Chỉ nhận deal thực sự rẻ — lọc theo ngưỡng bạn đặt" },
                  { icon: Globe, text: "Kèm phân tích AI: vì sao rẻ, có nên mua không" },
                  { icon: Shield, text: "Không spam. Hủy bất kỳ lúc nào." },
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

            {/* Existing alerts */}
            <div className="bg-slate-900 border border-white/8 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-sm" style={{ fontWeight: 700 }}>Alert đang hoạt động</h3>
                <button className="flex items-center gap-1 text-sky-400 text-xs hover:text-sky-300" style={{ fontWeight: 600 }}>
                  <Plus className="w-3.5 h-3.5" />
                  Thêm
                </button>
              </div>
              <div className="space-y-3">
                {existingAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm" style={{ fontWeight: 600 }}>{alert.from} → {alert.destination}</span>
                        <span className="text-emerald-400 text-xs" style={{ fontWeight: 700 }}>-{alert.discount}%+</span>
                      </div>
                      <div className="text-slate-500 text-xs">
                        {alert.channel} · Đã trigger {alert.triggered} lần
                      </div>
                    </div>
                    <button className="text-slate-600 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              q: "Mất phí không?",
              a: "Hoàn toàn miễn phí trong Phase 1. FlyCheap AI kiếm tiền qua affiliate khi bạn đặt vé."
            },
            {
              q: "Nhận bao nhiêu thông báo?",
              a: "Tối đa 2–3 thông báo/ngày/điểm đến. Chúng tôi chỉ gửi khi có deal thực sự tốt."
            },
            {
              q: "Dữ liệu của tôi có an toàn?",
              a: "Chúng tôi chỉ lưu email/username để gửi thông báo. Không chia sẻ với bên thứ ba."
            },
          ].map(({ q, a }) => (
            <div key={q} className="bg-slate-900/60 border border-white/8 rounded-2xl p-5">
              <h3 className="text-white text-sm mb-2" style={{ fontWeight: 700 }}>❓ {q}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}