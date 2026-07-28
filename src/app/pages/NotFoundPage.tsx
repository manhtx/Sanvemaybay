import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <main className="min-h-[70vh] px-4 pt-32 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-sky-400">404</p>
      <h1 className="mt-3 text-3xl font-extrabold text-white">
        Không tìm thấy trang
      </h1>
      <p className="mx-auto mt-3 max-w-md text-slate-400">
        Đường dẫn này không tồn tại hoặc đã được chuyển sang vị trí khác.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex rounded-xl bg-sky-500 px-5 py-3 font-bold text-white hover:bg-sky-400"
      >
        Về trang chủ
      </Link>
    </main>
  );
}
