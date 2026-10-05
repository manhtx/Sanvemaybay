import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Cơ hội", href: "/deals" },
  { label: "Tìm kiếm", href: "/search" },
  { label: "Theo dõi", href: "/watch" },
  { label: "Đã lưu", href: "/saved" },
  { label: "Tài khoản", href: "/auth" },
];

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        
        {/* Brand: Quiet, crisp logotype */}
        <Link to="/" className="flex items-center gap-2 group" aria-label="Farely - Trang chủ">
          <span className="text-base font-bold tracking-tight text-white group-hover:text-sky-400 transition-colors">
            Farely
          </span>
        </Link>

        {/* Desktop Quiet Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map(({ label, href }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                to={href}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Hamburger */}
        <div className="flex items-center lg:hidden">
          <button
            type="button"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-slate-950 px-4 py-3 lg:hidden space-y-1">

          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              to={href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive(href)
                  ? "bg-white/10 text-white font-semibold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
