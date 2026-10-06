import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Tìm giá", href: "/search" },
  { label: "Cơ hội", href: "/deals" },
  { label: "Theo dõi", href: "/watch" },
  { label: "Đã lưu", href: "/saved" },
  { label: "Tài khoản", href: "/auth" },
];

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (href: string) => {
    if (href === "/deals") return location.pathname === "/deals" || location.pathname.startsWith("/deals/");
    return location.pathname === href;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-stone-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        
        {/* Brand: Calm, authoritative logotype */}
        <Link to="/" className="flex items-center gap-2 group" aria-label="Farely - Trang chủ">
          <span className="text-base font-bold tracking-tight text-stone-900 group-hover:text-blue-600 transition-colors">
            Farely
          </span>
          <span className="hidden sm:inline-block text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
            Airfare Instrument
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? "bg-stone-100 text-stone-900 font-semibold shadow-xs"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
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
            className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-stone-200 bg-white px-4 py-3 lg:hidden space-y-1 shadow-sm">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              to={href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive(href)
                  ? "bg-stone-100 text-stone-900 font-semibold"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
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
