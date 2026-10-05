import { Outlet } from "react-router";
import { Navbar } from "../components/Navbar";
import { Link } from "react-router";
import { RouteMetadata } from "../components/RouteMetadata";

function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div>
            <span className="text-base font-bold text-white tracking-tight">Farely</span>
            <p className="text-slate-400 text-xs mt-1 max-w-lg leading-relaxed">
              Hệ thống quan sát và đối chiếu cước hàng không độc lập. Hỗ trợ người dùng nhận diện mức giá đáng chú ý dựa trên bằng chứng dữ liệu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <Link to="/deals" className="hover:text-white transition-colors">Cơ hội</Link>
            <Link to="/search" className="hover:text-white transition-colors">Tìm kiếm</Link>
            <Link to="/watch" className="hover:text-white transition-colors">Theo dõi</Link>
            <Link to="/saved" className="hover:text-white transition-colors">Đã lưu</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Quyền riêng tư</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Điều khoản</Link>
            <a href="mailto:support@farely.manhtx.com" className="text-sky-400 hover:text-sky-300 transition-colors">
              Hỗ trợ
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 Farely. Mọi quyền được bảo lưu.</p>
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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <RouteMetadata />
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-950 shadow-xl transition-transform focus:translate-y-0"
      >
        Bỏ qua điều hướng
      </a>
      <Navbar />
      <div id="main-content" tabIndex={-1} className="pt-14">
        <Outlet />
        <Footer />
      </div>
    </div>
  );
}
