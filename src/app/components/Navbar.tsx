import { useState } from "react";
import { Link, useLocation } from "react-router";
import { Menu, X, Plane, Bell, Globe } from "lucide-react";

const navLinks = [
  { label: "Tìm chuyến bay", href: "/search" },
  { label: "Cơ hội vé rẻ", href: "/deals" },
  { label: "Cảnh báo giá", href: "/watch" },
  { label: "Đã lưu", href: "/saved" },
];

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isActive = (href: string) => {
    if (href === "/deals") return location.pathname === "/deals" || location.pathname.startsWith("/deals/");
    return location.pathname === href;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#ffffff] border-b border-[#ebebeb] transition-all">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-4">

        {/* Brand: Airbnb-style clean mark with Sky Blue identity */}
        <Link to="/" className="flex items-center gap-2 group shrink-0" aria-label="Farely — Trang chủ">
          <div className="w-9 h-9 rounded-full bg-[#0084e6] flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
            <Plane className="w-5 h-5 -rotate-45" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-[#0084e6]">
              farely
            </span>
          </div>
        </Link>

        {/* Center: Airbnb-style Product Tabs */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map(({ label, href }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                to={href}
                className={`px-4 py-2.5 rounded-full text-sm transition-all duration-150 ${
                  active
                    ? "font-semibold text-[#222222] bg-[#f7f7f7]"
                    : "font-normal text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right side: User menu & quick actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/watch"
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold text-[#222222] hover:bg-[#f7f7f7] transition-colors"
          >
            <Bell className="w-4 h-4 text-[#0084e6]" />
            <span>Tạo cảnh báo</span>
          </Link>

          <Link
            to="/explore"
            className="p-2.5 rounded-full text-[#222222] hover:bg-[#f7f7f7] transition-colors hidden sm:flex"
            title="Khám phá điểm đến"
          >
            <Globe className="w-4 h-4 text-[#6a6a6a]" />
          </Link>

          {/* Airbnb Pill User Menu Button */}
          <Link
            to="/auth"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#dddddd] hover:shadow-md transition-shadow bg-white text-[#222222]"
            aria-label="Tài khoản cá nhân"
          >
            <Menu className="w-4 h-4 text-[#222222]" />
            <div className="w-6 h-6 rounded-full bg-[#6a6a6a] text-white flex items-center justify-center text-[10px] font-bold">
              U
            </div>
          </Link>

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="p-2 rounded-full text-[#222222] hover:bg-[#f7f7f7] lg:hidden transition-colors"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#ebebeb] bg-white px-6 py-4 md:hidden space-y-2 shadow-lg animate-in slide-in-from-top-2">
          {navLinks.map(({ label, href }) => (
            <Link
              key={href}
              to={href}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-xl text-sm transition-colors ${
                isActive(href)
                  ? "bg-[#f7f7f7] text-[#222222] font-semibold"
                  : "text-[#6a6a6a] hover:text-[#222222] hover:bg-[#f7f7f7]"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-[#ebebeb]">
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 rounded-xl text-sm font-semibold text-[#0084e6] hover:bg-[#f7f7f7]"
            >
              Đăng nhập / Đăng ký
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
