import { Link } from "react-router";

export function TermsPage() {
  return (
    <main className="min-h-screen px-4 pb-20 pt-24 text-[#222222] sm:px-6 bg-white">
      <article className="mx-auto max-w-3xl rounded-[14px] border border-[#dddddd] bg-white p-6 sm:p-10 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0084e6] font-mono">Điều khoản dịch vụ</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#222222]">Điều khoản sử dụng Farely</h1>
        <p className="mt-2 text-xs text-[#6a6a6a]">Cập nhật ngày 05/10/2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#3f3f3f]">
          <section>
            <h2 className="text-base font-bold text-[#222222]">Phạm vi dịch vụ</h2>
            <p className="mt-1 text-xs sm:text-sm text-[#6a6a6a]">Farely giúp khám phá, theo dõi và so sánh dữ liệu giá chuyến bay có nguồn gốc rõ ràng. Sản phẩm không phải là hãng hàng không, đại lý bán vé hay đơn vị thanh toán trực tiếp.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-[#222222]">Giá và khả dụng</h2>
            <p className="mt-1 text-xs sm:text-sm text-[#6a6a6a]">Giá quan sát có thể thay đổi hoặc hết chỗ theo thời gian thực. Người dùng có trách nhiệm kiểm tra tổng giá cuối cùng, quy định hành lý và điều kiện đổi hoàn trên trang nhà cung cấp trước khi thanh toán.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-[#222222]">Thông báo & theo dõi giá</h2>
            <p className="mt-1 text-xs sm:text-sm text-[#6a6a6a]">Hệ thống gửi cảnh báo theo cơ chế tốt nhất có thể (best-effort) khi phát hiện mức giá đạt tiêu chí. Cảnh báo không thay thế cho cam kết giữ chỗ của hãng bay.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-[#222222]">Sử dụng hợp lệ</h2>
            <p className="mt-1 text-xs sm:text-sm text-[#6a6a6a]">Không tự động khai thác hoặc lạm dụng hệ thống, vượt ngưỡng giới hạn yêu cầu (rate limit), hoặc can thiệp trái phép vào dữ liệu dịch vụ.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-[#222222]">Liên kết bên thứ ba</h2>
            <p className="mt-1 text-xs sm:text-sm text-[#6a6a6a]">Nhà cung cấp chịu trách nhiệm về chính sách thanh toán và điều kiện dịch vụ của họ. Farely chỉ liên kết đến các đối tác hoặc công cụ tìm kiếm đã được kiểm duyệt an toàn.</p>
          </section>
          <section>
            <h2 className="text-base font-bold text-[#222222]">Hỗ trợ</h2>
            <p className="mt-1 text-xs sm:text-sm text-[#6a6a6a]">Mọi thắc mắc hoặc yêu cầu hỗ trợ xin liên hệ qua email: <a href="mailto:support@farely.manhtx.com" className="text-[#0084e6] hover:underline font-medium">support@farely.manhtx.com</a>.</p>
          </section>
        </div>
        <Link to="/privacy" className="mt-8 inline-flex min-h-10 items-center rounded-lg border border-[#dddddd] bg-[#f7f7f7] px-4 font-semibold text-xs text-[#222222] hover:bg-[#ebebeb] transition">Xem chính sách quyền riêng tư</Link>
      </article>
    </main>
  );
}
