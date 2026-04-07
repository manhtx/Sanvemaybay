import { Outlet } from "react-router";
import { Navbar } from "../components/Navbar";
import { Link } from "react-router";
import { Plane, Github, Twitter, Send, Heart } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/5 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Plane className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-white" style={{ fontWeight: 700, fontSize: "1.1rem" }}>
                FlyCheap <span className="text-sky-400">AI</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Radar giá vé máy bay toàn cầu — phát hiện cơ hội bay rẻ bất thường bằng AI.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <Send className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white text-sm mb-3" style={{ fontWeight: 600 }}>Sản phẩm</h4>
            <ul className="space-y-2">
              {[
                { label: "Deal Nóng", href: "/deals" },
                { label: "Tìm Vé Thông Minh", href: "/search" },
                { label: "Cài Báo Giá", href: "/alerts" },
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
            <h4 className="text-white text-sm mb-3" style={{ fontWeight: 600 }}>Tính năng AI</h4>
            <ul className="space-y-2">
              {[
                "Deal Discovery Engine",
                "Price Intelligence AI",
                "Smart Route Builder",
                "Hidden Cost Analyzer",
                "Flexible Decision Engine",
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
                <span className="text-emerald-400 text-xs" style={{ fontWeight: 700 }}>Phase 1 — BETA</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                100% miễn phí. Đang trong giai đoạn validate value và xây dựng hệ thống.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-xs">
            © 2026 FlyCheap AI. Built with <Heart className="w-3 h-3 inline text-red-500" /> for budget travelers.
          </p>
          <p className="text-slate-600 text-xs">
            Giá hiển thị chỉ mang tính tham khảo. Luôn kiểm tra lại trước khi đặt vé.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function Root() {
  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
}
