import { Outlet, Link, useLocation } from "react-router";
import { Navbar } from "../components/Navbar";
import { RouteMetadata } from "../components/RouteMetadata";
import { Search, Compass, Bell, Bookmark } from "lucide-react";

function BottomNav() {
  const location = useLocation();
  const navItems = [
    { label: "Tìm giá", href: "/search", icon: Search },
    { label: "Cơ hội", href: "/deals", icon: Compass },
    { label: "Theo dõi", href: "/watch", icon: Bell },
    { label: "Đã lưu", href: "/saved", icon: Bookmark },
  ];

  return (
    <nav
      aria-label="Điều hướng chính di động"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-[#ebebeb] lg:hidden flex items-center justify-around py-2 shadow-xs backdrop-blur-md"
    >
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = location.pathname === href || (href === "/deals" && location.pathname.startsWith("/deals"));
        return (
          <Link
            key={href}
            to={href}
            className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-medium transition-colors ${
              active ? "text-[#0084e6] font-semibold" : "text-[#6a6a6a] hover:text-[#222222]"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="bg-[#f7f7f7] border-t border-[#ebebeb] mt-20 mb-14 lg:mb-0">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-12 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#dddddd]">
          <div>
            <span className="text-base font-bold text-[#222222] tracking-tight">Farely</span>
            <p className="text-[#6a6a6a] text-xs mt-1 max-w-lg leading-relaxed">
              Hệ thống quan sát và đối chiếu cước hàng không độc lập. Hỗ trợ người dùng nhận diện mức giá đáng chú ý dựa trên bằng chứng dữ liệu thực nghiệm.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-[#222222]">
            <Link to="/deals" className="hover:text-[#0084e6] transition-colors">Cơ hội</Link>
            <Link to="/search" className="hover:text-[#0084e6] transition-colors">Tìm kiếm</Link>
            <Link to="/watch" className="hover:text-[#0084e6] transition-colors">Theo dõi</Link>
            <Link to="/saved" className="hover:text-[#0084e6] transition-colors">Đã lưu</Link>
            <Link to="/privacy" className="hover:text-[#0084e6] transition-colors">Quyền riêng tư</Link>
            <Link to="/terms" className="hover:text-[#0084e6] transition-colors">Điều khoản</Link>
            <a href="mailto:support@farely.manhtx.com" className="text-[#0084e6] hover:underline transition-colors font-medium">
              Hỗ trợ
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#6a6a6a]">
          <p>© 2026 Farely, Inc. Mọi quyền được bảo lưu.</p>
          <p className="max-w-xl text-[11px] leading-relaxed">
            Mức giá hiển thị là dữ liệu quan sát tại thời điểm ghi nhận. Giá thực tế trên hãng bay hoặc đại lý có thể thay đổi bất kỳ lúc nào trước khi hoàn tất đặt vé.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Root() {
  return (
    <div className="min-h-screen bg-[#ffffff] text-[#222222] flex flex-col font-sans antialiased">
      <RouteMetadata />
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-[#222222] px-4 py-2 text-xs font-semibold text-white shadow-xl transition-transform focus:translate-y-0"
      >
        Bỏ qua điều hướng
      </a>
      <Navbar />
      <div id="main-content" tabIndex={-1} className="pt-20 flex-1">
        <Outlet />
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
