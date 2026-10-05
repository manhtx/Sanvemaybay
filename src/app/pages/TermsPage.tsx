import { Link } from "react-router";

export function TermsPage() {
  return <main className="min-h-screen px-4 pb-20 pt-24 text-slate-300 sm:px-6">
    <article className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-pink-400">Điều khoản dịch vụ</p>
      <h1 className="mt-3 text-3xl font-extrabold text-white">Điều khoản sử dụng Farely</h1>
      <p className="mt-3 text-sm text-slate-500">Cập nhật ngày 05/10/2026</p>
      <div className="mt-8 space-y-7 text-sm leading-7">
        <section><h2 className="text-lg font-bold text-white">Phạm vi dịch vụ</h2><p>Farely giúp khám phá, theo dõi và so sánh dữ liệu giá chuyến bay có nguồn gốc rõ ràng. Sản phẩm không phải là hãng hàng không, đại lý bán vé hay đơn vị thanh toán trực tiếp.</p></section>
        <section><h2 className="text-lg font-bold text-white">Giá và khả dụng</h2><p>Giá quan sát có thể thay đổi hoặc hết chỗ theo thời gian thực. Người dùng có trách nhiệm kiểm tra tổng giá cuối cùng, quy định hành lý và điều kiện đổi hoàn trên trang nhà cung cấp trước khi thanh toán.</p></section>
        <section><h2 className="text-lg font-bold text-white">Thông báo & theo dõi giá</h2><p>Hệ thống gửi cảnh báo theo cơ chế tốt nhất có thể (best-effort) khi phát hiện mức giá đạt tiêu chí. Cảnh báo không thay thế cho cam kết giữ chỗ của hãng bay.</p></section>
        <section><h2 className="text-lg font-bold text-white">Sử dụng hợp lệ</h2><p>Không tự động khai thác hoặc lạm dụng hệ thống, vượt ngưỡng giới hạn yêu cầu (rate limit), hoặc can thiệp trái phép vào dữ liệu dịch vụ.</p></section>
        <section><h2 className="text-lg font-bold text-white">Liên kết bên thứ ba</h2><p>Nhà cung cấp chịu trách nhiệm về chính sách thanh toán và điều kiện dịch vụ của họ. Farely chỉ liên kết đến các đối tác hoặc công cụ tìm kiếm đã được kiểm duyệt an toàn.</p></section>
        <section><h2 className="text-lg font-bold text-white">Hỗ trợ</h2><p>Mọi thắc mắc hoặc yêu cầu hỗ trợ xin liên hệ qua email: <a href="mailto:support@farely.manhtx.com" className="text-sky-400 hover:underline">support@farely.manhtx.com</a>.</p></section>
      </div>
      <Link to="/privacy" className="mt-10 inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 font-semibold text-sky-300 hover:bg-white/5">Xem chính sách quyền riêng tư</Link>
    </article>
  </main>;
}
