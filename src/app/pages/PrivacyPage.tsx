import { Link } from "react-router";
import { DataRightsPanel } from "../components/DataRightsPanel";

export function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 pb-20 pt-24 text-stone-700 sm:px-6 bg-[var(--canvas-bg)]">
      <article className="mx-auto max-w-3xl rounded-xl border border-stone-200 bg-white p-6 sm:p-10 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">Quyền riêng tư</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-stone-900">Chính sách bảo mật Farely</h1>
        <p className="mt-2 text-xs text-stone-500">Cập nhật ngày 05/10/2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-stone-700">
          <section>
            <h2 className="text-base font-bold text-stone-900">Dữ liệu giá vé</h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-600">Farely lưu các quan sát giá, tuyến bay, hãng hàng không, thời điểm ghi nhận và liên kết nguồn để xác định mặt bằng giá trung vị và kiểm tra tính xác thực. Giá quan sát không phải cam kết còn chỗ của hãng bay.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-stone-900">Dữ liệu bạn cung cấp</h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-600">Khi tạo tài khoản hoặc đăng ký theo dõi giá, hệ thống xử lý địa chỉ email, tiêu chí tuyến bay, ngân sách và tuỳ chọn nhận tin. Farely không yêu cầu và không lưu trữ thông tin hộ chiếu, CCCD hay thông tin thẻ thanh toán ngân hàng.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-stone-900">Phân tích sử dụng</h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-600">Sản phẩm chỉ ghi nhận các tương tác ẩn danh cơ bản như xem chi tiết, lưu cơ hội, chia sẻ và tạo cảnh báo nhằm cải thiện trải nghiệm người dùng.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-stone-900">Mục đích và các bên xử lý dữ liệu (Data Processors)</h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-600">Dữ liệu chỉ được dùng để gửi thông báo giá vé mà bạn đã yêu cầu và phòng chống thư rác/lạm dụng. Farely không bán hoặc chia sẻ dữ liệu người dùng cho các bên quảng cáo thứ ba. Hệ thống sử dụng các bên xử lý dữ liệu cơ sở hạ tầng sau:</p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-xs sm:text-sm text-stone-600">
              <li><strong>Supabase Inc.</strong>: Lưu trữ cơ sở dữ liệu quan sát, xác thực tài khoản và kiểm soát quyền truy cập RLS.</li>
              <li><strong>Resend Technologies</strong>: Dịch vụ gửi email thông báo và liên kết xác nhận đăng ký theo dõi giá.</li>
              <li><strong>Cloudflare Inc.</strong>: Xác thực chống bot tự động (Turnstile) và bảo vệ hạ tầng mạng.</li>
              <li><strong>Vercel Inc.</strong>: Hạ tầng phân phối và lưu trữ ứng dụng web (CDN & Hosting).</li>
            </ul>
          </section>
          <section>
            <h2 className="text-base font-bold text-stone-900">Quyền của bạn đối với dữ liệu</h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-600">Bạn có thể huỷ theo dõi bất cứ lúc nào qua liên kết đính kèm trong email thông báo. Khi đăng nhập, bạn có thể tải toàn bộ dữ liệu hoặc yêu cầu xoá vĩnh viễn tài khoản bằng công cụ bên dưới.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-stone-900">Kênh liên hệ</h2>
            <p className="mt-1 text-xs sm:text-sm text-stone-600">Mọi yêu cầu liên quan đến quyền riêng tư và dữ liệu cá nhân, vui lòng liên hệ ban quản trị qua email: <a href="mailto:support@farely.manhtx.com" className="text-blue-600 hover:underline">support@farely.manhtx.com</a>.</p>
          </section>
        </div>
        <DataRightsPanel />
        <Link to="/terms" className="mt-8 inline-flex min-h-10 items-center rounded-lg border border-stone-300 bg-stone-50 px-4 font-semibold text-xs text-stone-800 hover:bg-stone-100 transition">Xem điều khoản sử dụng</Link>
      </article>
    </main>
  );
}
