import { Link } from "react-router";
import { DataRightsPanel } from "../components/DataRightsPanel";

export function PrivacyPage() {
  return <main className="min-h-screen px-4 pb-20 pt-24 text-slate-300 sm:px-6">
    <article className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-pink-400">Quyền riêng tư</p>
      <h1 className="mt-3 text-3xl font-extrabold text-white">Dữ liệu FlyCheap sử dụng</h1>
      <p className="mt-3 text-sm text-slate-500">Cập nhật ngày 20/08/2026 · Chính sách beta</p>
      <div className="mt-8 space-y-7 text-sm leading-7">
        <section><h2 className="text-lg font-bold text-white">Dữ liệu giá vé</h2><p>FlyCheap lưu quan sát giá, tuyến, hãng, thời điểm và URL nguồn để tính mặt bằng và kiểm tra provenance. Giá quan sát không phải cam kết còn chỗ.</p></section>
        <section><h2 className="text-lg font-bold text-white">Dữ liệu bạn cung cấp</h2><p>Khi tạo tài khoản hoặc cảnh báo, hệ thống có thể xử lý email, Telegram ID, tuyến, ngân sách và preference. FlyCheap hiện không yêu cầu passport hoặc dữ liệu thanh toán.</p></section>
        <section><h2 className="text-lg font-bold text-white">Phân tích sử dụng</h2><p>Sản phẩm chỉ ghi các event đã giới hạn như xem chi tiết, lưu, chia sẻ, nhấp kiểm tra giá và tạo cảnh báo. Không nên nhập thông tin nhạy cảm vào các trường không yêu cầu.</p></section>
        <section><h2 className="text-lg font-bold text-white">Mục đích và chia sẻ</h2><p>Dữ liệu được dùng để vận hành, bảo mật, chống lạm dụng, gửi cảnh báo bạn yêu cầu và cải thiện sản phẩm. Nhà cung cấp hạ tầng/email/Telegram/provider chỉ nhận dữ liệu cần cho chức năng tương ứng.</p></section>
        <section><h2 className="text-lg font-bold text-white">Lưu giữ và quyền của bạn</h2><p>Dữ liệu được giữ theo các khoảng thời gian công bố cho từng mục đích. Bạn có thể hủy cảnh báo bằng liên kết trong email; khi đăng nhập, bạn có thể tải dữ liệu hoặc xóa vĩnh viễn tài khoản bằng công cụ bên dưới.</p></section>
        <section><h2 className="text-lg font-bold text-white">Liên hệ</h2><p>Trong giai đoạn beta, hãy sử dụng kênh hỗ trợ do chủ sản phẩm công bố để yêu cầu truy cập, chỉnh sửa hoặc xóa dữ liệu. Chính sách này phải được rà soát pháp lý trước public launch.</p></section>
      </div>
      <DataRightsPanel />
      <Link to="/terms" className="mt-10 inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 font-semibold text-sky-300 hover:bg-white/5">Xem điều khoản sử dụng</Link>
    </article>
  </main>;
}
