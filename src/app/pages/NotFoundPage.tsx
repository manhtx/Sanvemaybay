import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <main className="min-h-[70vh] px-4 pt-32 text-center bg-[var(--canvas-bg)] text-stone-900">
      <p className="text-sm font-bold uppercase tracking-widest text-blue-600 font-mono">404</p>
      <h1 className="mt-3 text-3xl font-extrabold text-stone-900">
        Không tìm thấy trang
      </h1>
      <p className="mx-auto mt-3 max-w-md text-stone-600 text-sm">
        Đường dẫn này không tồn tại hoặc đã được chuyển sang vị trí khác.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2.5 font-bold text-xs text-white transition-colors shadow-sm"
      >
        Về trang chủ
      </Link>
    </main>
  );
}
