import { useState } from "react";
import { Link, useLocation } from "react-router";
import {
  Plane,
  Bell,
  Search,
  Menu,
  X,
  Zap,
  TrendingDown,
  UserRound,
  Bookmark,
} from "lucide-react";

const navLinks = [
  { label: "Cơ hội", href: "/deals", icon: TrendingDown },
  { label: "Tìm kiếm", href: "/search", icon: Search },
  { label: "Theo dõi", href: "/alerts", icon: Bell },
  { label: "Đã lưu", href: "/saved", icon: Bookmark },
];

function Brand() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Farely - Trang chủ">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 via-pink-500 to-violet-600 shadow-lg shadow-pink-500/20 transition-transform group-hover:scale-105">
        <Plane className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-black tracking-tight text-white leading-none">
          Farely
        </span>
        <span className="text-[10px] font-semibold text-pink-400/90 tracking-wide uppercase">
          Travel Intelligence
        </span>
      </div>
    </Link>
  );
}

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0d0d0f]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Brand />

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              to={href}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
                isActive(href)
                  ? "bg-white/[0.1] text-white font-semibold shadow-sm shadow-black/20"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive(href) ? "text-pink-400" : "text-slate-400"}`} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/alerts"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all hover:opacity-95 hover:shadow-pink-500/30"
          >
            <Zap className="h-4 w-4" />
            <span>Theo dõi chuyến</span>
          </Link>
          <Link
            to="/auth"
            aria-label="Tài khoản"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            <UserRound className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            to="/alerts"
            className="flex items-center gap-1.5 rounded-lg bg-pink-500/20 border border-pink-500/30 px-2.5 py-1.5 text-xs font-semibold text-pink-300"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Theo dõi</span>
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-white/5 bg-[#0d0d0f] px-4 pb-6 pt-3 lg:hidden">
          <div className="space-y-1 mb-4">
            {navLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors ${
                  isActive(href)
                    ? "bg-white/[0.09] text-white font-semibold"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive(href) ? "text-pink-400" : "text-slate-400"}`} />
                <span>{label}</span>
              </Link>
            ))}
          </div>
          <Link
            to="/alerts"
            onClick={() => setMobileOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20"
          >
            <Zap className="h-4 w-4" />
            <span>Theo dõi chuyến</span>
          </Link>
          <Link
            to="/auth"
            onClick={() => setMobileOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-400 hover:text-white"
          >
            <UserRound className="h-4 w-4" />
            <span>Tài khoản người dùng</span>
          </Link>
        </div>
      )}
    </header>
  );
}
