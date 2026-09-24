import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Plane, Bell, Search, Menu, X, Zap, TrendingDown, UserRound, Compass, History, Bookmark, ChevronRight } from "lucide-react";

const navLinks = [
  { label: "Deal Nóng", href: "/deals", icon: TrendingDown },
  { label: "Lịch sử deal", href: "/historical-deals", icon: History },
  { label: "Tìm Vé Thông Minh", href: "/search", icon: Search },
  { label: "Cài Báo Giá", href: "/alerts", icon: Bell },
  { label: "Trip Advisor", href: "/advisor", icon: Compass },
];

function Brand() {
  return <Link to="/" className="group flex items-center gap-3" aria-label="FlyCheap AI - Trang chủ">
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 via-pink-500 to-violet-600 shadow-lg shadow-pink-500/20 transition-transform group-hover:scale-105"><Plane className="h-4 w-4 text-white" strokeWidth={2.5} /></div>
    <span className="text-lg font-extrabold tracking-tight text-white">FlyCheap <span className="text-pink-400">AI</span></span>
  </Link>;
}

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (href: string) => location.pathname === href;

  return <>
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-white/10 bg-[#0d0d0f] px-4 py-6 lg:flex">
      <div className="mb-10 px-2"><Brand /></div>
      <div className="mb-7 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-violet-500 text-xs font-bold text-white">FC</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-white">Khách tham quan</p><p className="text-xs text-slate-500">Chế độ khám phá</p></div></div>
      </div>
      <div className="mb-3 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">Khám phá</div>
      <div className="space-y-1">
        {navLinks.map(({ label, href, icon: Icon }) => <Link key={href} to={href} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${isActive(href) ? "bg-white/[0.09] text-white" : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"}`}><Icon className={`h-[18px] w-[18px] ${isActive(href) ? "text-pink-400" : "text-slate-600 group-hover:text-slate-300"}`} /><span className="flex-1">{label}</span>{isActive(href) && <ChevronRight className="h-3.5 w-3.5 text-slate-600" />}</Link>)}
        <Link to="/saved" className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${isActive("/saved") ? "bg-white/[0.09] text-white" : "text-slate-500 hover:bg-white/[0.05] hover:text-slate-200"}`}><Bookmark className="h-[18px] w-[18px] text-slate-600 group-hover:text-slate-300" />Deal đã lưu</Link>
      </div>
      <div className="mt-auto rounded-2xl border border-white/10 bg-gradient-to-br from-orange-500/20 via-pink-500/10 to-transparent p-4"><p className="text-sm font-semibold text-white">Săn deal có bằng chứng</p><p className="mt-1 text-xs leading-relaxed text-slate-400">Nguồn, thời điểm và rủi ro luôn được hiển thị rõ.</p><Link to="/alerts" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-pink-100"><Zap className="h-3.5 w-3.5" />Tạo báo giá</Link></div>
    </aside>

    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#0d0d0f]/90 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6"><Brand /><button type="button" aria-label={mobileOpen ? "Đóng menu" : "Mở menu"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)} className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white">{mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button></div>
      {mobileOpen && <div className="border-t border-white/5 px-4 pb-4 pt-3 sm:px-6"><div className="space-y-1">{navLinks.map(({ label, href, icon: Icon }) => <Link key={href} to={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm ${isActive(href) ? "bg-white/[0.09] text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}><Icon className="h-4 w-4" />{label}</Link>)}<Link to="/saved" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"><Bookmark className="h-4 w-4" />Deal đã lưu</Link></div><Link to="/alerts" onClick={() => setMobileOpen(false)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-3 text-sm font-semibold text-white"><Zap className="h-4 w-4" />Đặt Alert Miễn Phí</Link><Link to="/auth" onClick={() => setMobileOpen(false)} className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 hover:text-white"><UserRound className="h-4 w-4" />Tài khoản</Link></div>}
    </nav>
  </>;
}
