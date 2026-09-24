import { Link } from "react-router";

export function TermsPage() {
  return <main className="min-h-screen px-4 pb-20 pt-24 text-slate-300 sm:px-6">
    <article className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-pink-400">Điều khoản beta</p>
      <h1 className="mt-3 text-3xl font-extrabold text-white">Điều khoản sử dụng FlyCheap</h1>
      <p className="mt-3 text-sm text-slate-500">Cập nhật ngày 20/08/2026</p>
      <div className="mt-8 space-y-7 text-sm leading-7">
        <section><h2 className="text-lg font-bold text-white">Phạm vi dịch vụ</h2><p>FlyCheap giúp khám phá và so sánh dữ liệu giá có nguồn. Sản phẩm không phải hãng bay, đại lý phát hành vé hoặc bên xử lý thanh toán.</p></section>
        <section><h2 className="text-lg font-bold text-white">Giá và khả dụng</h2><p>Giá quan sát có thể thay đổi hoặc hết chỗ. Bạn phải kiểm tra tổng giá, hành lý, điều kiện đổi hoàn và itinerary trên provider trước khi đặt. Chỉ feed được ghi rõ live mới áp dụng contract xác minh hiện thời.</p></section>
        <section><h2 className="text-lg font-bold text-white">Cảnh báo</h2><p>Cảnh báo là best-effort và có thể bị chậm bởi provider, email hoặc Telegram. Không dùng cảnh báo như đảm bảo giao dịch.</p></section>
        <section><h2 className="text-lg font-bold text-white">Sử dụng hợp lệ</h2><p>Không tự động lạm dụng endpoint, vượt rate limit, gửi cảnh báo cho người khác khi chưa được phép hoặc tìm cách truy cập dữ liệu/tài khoản không thuộc bạn.</p></section>
        <section><h2 className="text-lg font-bold text-white">Liên kết bên thứ ba</h2><p>Provider chịu trách nhiệm cho booking, thanh toán và điều khoản của họ. FlyCheap chỉ cho phép các host đã duyệt trong bề mặt sản phẩm nhưng bạn vẫn phải tự kiểm tra trang đích.</p></section>
        <section><h2 className="text-lg font-bold text-white">Thay đổi beta</h2><p>Tính năng và nguồn dữ liệu có thể thay đổi trong beta. Thay đổi quan trọng về dữ liệu hoặc điều khoản phải được công bố và rà soát trước public launch.</p></section>
      </div>
      <Link to="/privacy" className="mt-10 inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 font-semibold text-sky-300 hover:bg-white/5">Xem chính sách quyền riêng tư</Link>
    </article>
  </main>;
}
