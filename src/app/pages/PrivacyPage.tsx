import { Link } from "react-router";
import { DataRightsPanel } from "../components/DataRightsPanel";

export function PrivacyPage() {
  return <main className="min-h-screen px-4 pb-20 pt-24 text-slate-300 sm:px-6">
    <article className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-pink-400">Quyền riêng tư</p>
      <h1 className="mt-3 text-3xl font-extrabold text-white">Chính sách bảo mật Farely</h1>
      <p className="mt-3 text-sm text-slate-500">Cập nhật ngày 05/10/2026</p>
      <div className="mt-8 space-y-7 text-sm leading-7">
        <section><h2 className="text-lg font-bold text-white">Dữ liệu giá vé</h2><p>Farely lưu các quan sát giá, tuyến bay, hãng hàng không, thời điểm ghi nhận và liên kết nguồn để xác định mặt bằng giá trung vị và kiểm tra tính xác thực. Giá quan sát không phải cam kết còn chỗ của hãng bay.</p></section>
        <section><h2 className="text-lg font-bold text-white">Dữ liệu bạn cung cấp</h2><p>Khi tạo tài khoản hoặc đăng ký theo dõi giá, hệ thống xử lý địa chỉ email, tiêu chí tuyến bay, ngân sách và tuỳ chọn nhận tin. Farely không yêu cầu và không lưu trữ thông tin hộ chiếu, CCCD hay thông tin thẻ thanh toán ngân hàng.</p></section>
        <section><h2 className="text-lg font-bold text-white">Phân tích sử dụng</h2><p>Sản phẩm chỉ ghi nhận các tương tác ẩn danh cơ bản như xem chi tiết, lưu cơ hội, chia sẻ và tạo cảnh báo nhằm cải thiện trải nghiệm người dùng.</p></section>
        <section><h2 className="text-lg font-bold text-white">Mục đích và chia sẻ</h2><p>Dữ liệu chỉ được dùng để gửi thông báo giá vé mà bạn đã yêu cầu và phòng chống thư rác/lạm dụng. Farely không bán hoặc chia sẻ dữ liệu người dùng cho các bên quảng cáo thứ ba.</p></section>
        <section><h2 className="text-lg font-bold text-white">Quyền của bạn đối với dữ liệu</h2><p>Bạn có thể huỷ theo dõi bất cứ lúc nào qua liên kết đính kèm trong email thông báo. Khi đăng nhập, bạn có thể tải toàn bộ dữ liệu hoặc yêu cầu xoá vĩnh viễn tài khoản bằng công cụ bên dưới.</p></section>
        <section><h2 className="text-lg font-bold text-white">Kênh liên hệ</h2><p>Mọi yêu cầu liên quan đến quyền riêng tư và dữ liệu cá nhân, vui lòng liên hệ ban quản trị qua email: <a href="mailto:support@farely.manhtx.com" className="text-sky-400 hover:underline">support@farely.manhtx.com</a>.</p></section>
      </div>
      <DataRightsPanel />
      <Link to="/terms" className="mt-10 inline-flex min-h-11 items-center rounded-xl border border-white/10 px-4 font-semibold text-sky-300 hover:bg-white/5">Xem điều khoản sử dụng</Link>
    </article>
  </main>;
}
