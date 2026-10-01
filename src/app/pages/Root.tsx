import { Outlet } from "react-router";
import { Navbar } from "../components/Navbar";
import { Link } from "react-router";
import { Plane, Heart } from "lucide-react";
import { RouteMetadata } from "../components/RouteMetadata";

function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-400 via-pink-500 to-violet-600 rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-white" style={{ fontWeight: 800, fontSize: "1.15rem" }}>
                Farely
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Phát hiện cơ hội vé máy bay giá tốt, minh bạch chi phí thực tế và hỗ trợ người dùng ra quyết định chuyến đi thông minh.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white text-sm mb-3" style={{ fontWeight: 600 }}>Sản phẩm</h4>
            <ul className="space-y-2">
              {[
                { label: "Deal Nóng", href: "/deals" },
                { label: "Tìm Vé Thông Minh", href: "/search" },
                { label: "Cài Báo Giá", href: "/alerts" },
                { label: "Cố Vấn Hành Trình", href: "/advisor" },
                { label: "Deal đã lưu", href: "/saved" },
              ].map((item) => (
                <li key={item.href}>
                  <Link to={item.href} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="text-white text-sm mb-3" style={{ fontWeight: 600 }}>Khả năng cốt lõi</h4>
            <ul className="space-y-2">
              {[
                "Theo dõi lịch sử giá",
                "Minh bạch tổng chi phí thực tế",
                "Cảnh báo Email & Telegram",
                "Đánh giá rủi ro & điểm dừng",
              ].map((item) => (
                <li key={item}>
                  <span className="text-slate-500 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Phase */}
          <div>
            <h4 className="text-white text-sm mb-3" style={{ fontWeight: 600 }}>Giai đoạn</h4>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-xs" style={{ fontWeight: 700 }}>BETA TRỰC TUYẾN</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Miễn phí cho người dùng. Dữ liệu đối chiếu độc lập và được cập nhật liên tục từ các nguồn chuyến bay.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs">
            © 2026 Farely. Xây dựng với <Heart className="w-3 h-3 inline text-red-500" /> cho người săn vé thông thái.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <Link to="/privacy" className="min-h-11 py-3 text-slate-500 hover:text-slate-300">Quyền riêng tư</Link>
            <Link to="/terms" className="min-h-11 py-3 text-slate-500 hover:text-slate-300">Điều khoản</Link>
            <p className="text-slate-600">Giá mang tính tham khảo tại thời điểm quan sát. Luôn kiểm tra lại trước khi đặt vé.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function Root() {
  return (
    <div className="min-h-screen bg-slate-950">
      <RouteMetadata />
      <a href="#main-content" className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-white px-4 py-3 font-semibold text-slate-950 shadow-xl transition-transform focus:translate-y-0">
        Bỏ qua điều hướng
      </a>
      <Navbar />
      <div id="main-content" tabIndex={-1} className="pt-16">
        <Outlet />
        <Footer />
      </div>
    </div>
  );
}
