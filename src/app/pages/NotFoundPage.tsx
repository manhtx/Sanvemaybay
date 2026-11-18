import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <main className="min-h-[70vh] px-4 pt-32 text-center bg-white text-[#222222]">
      <p className="text-sm font-bold uppercase tracking-widest text-[#0084e6] font-mono">404</p>
      <h1 className="mt-3 text-3xl font-extrabold text-[#222222]">
        Không tìm thấy trang
      </h1>
      <p className="mx-auto mt-3 max-w-md text-[#6a6a6a] text-sm leading-relaxed">
        Đường dẫn này không tồn tại hoặc đã được chuyển sang vị trí khác.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-lg bg-[#0084e6] hover:bg-[#006ec4] active:bg-[#005ba3] px-5 py-2.5 font-bold text-xs text-white transition-colors shadow-sm cursor-pointer"
      >
        Về trang chủ
      </Link>
    </main>
  );
}
