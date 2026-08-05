import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Plane, Bell, Search, Menu, X, Zap, TrendingDown, UserRound, Compass, History } from "lucide-react";

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: "Deal Nóng", href: "/deals", icon: TrendingDown },
    { label: "Lịch sử deal", href: "/historical-deals", icon: History },
    { label: "Tìm Vé Thông Minh", href: "/search", icon: Search },
    { label: "Cài Báo Giá", href: "/alerts", icon: Bell },
    { label: "Trip Advisor", href: "/advisor", icon: Compass },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plane className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-white" style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
              FlyCheap <span className="text-sky-400">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                  isActive(href)
                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-xs" style={{ fontWeight: 600 }}>
                Phase 1 — Beta
              </span>
            </div>
            <Link
              to="/alerts"
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm transition-colors"
              style={{ fontWeight: 600 }}
            >
              <Zap className="w-4 h-4" />
              Đặt Alert
            </Link>
            <Link to="/auth" aria-label="Tài khoản" className="p-2 text-slate-400 hover:text-white"><UserRound className="w-5 h-5" /></Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-slate-400 hover:text-white p-2"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-white/5 mt-2 pt-4 space-y-1">
            {navLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                to={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm transition-all ${
                  isActive(href)
                    ? "bg-sky-500/15 text-sky-400"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
            <Link
              to="/alerts"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-sky-500 text-white rounded-lg text-sm"
              style={{ fontWeight: 600 }}
            >
              <Zap className="w-4 h-4" />
              Đặt Alert Miễn Phí
            </Link>
            <Link to="/auth" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 px-4 py-3 rounded-lg text-slate-400 hover:text-white"><UserRound className="w-4 h-4" /> Tài khoản</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
