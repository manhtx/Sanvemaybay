# FlyCheap AI — Product Goal

**Version:** 1.0  
**Status:** Draft  
**Owner:** Product Team

## 1. Mục đích tài liệu

Tài liệu này định nghĩa tầm nhìn, sứ mệnh, phạm vi, nguyên tắc phát triển và tiêu chí định hướng của FlyCheap AI.

Mọi quyết định về thiết kế, kỹ thuật, AI, dữ liệu và trải nghiệm người dùng phải tuân theo tài liệu này.

## 2. Sứ mệnh

FlyCheap AI giúp người dùng khám phá các cơ hội du lịch có chi phí thấp bằng cách chủ động phát hiện, phân tích và giải thích những mức giá vé máy bay bất thường.

Thay vì người dùng phải tìm kiếm trên nhiều nền tảng, hệ thống liên tục theo dõi thị trường, phát hiện cơ hội đáng chú ý và cung cấp đủ thông tin để người dùng ra quyết định.

## 3. Tầm nhìn

Trở thành **AI Travel Opportunity Engine** dành cho khách du lịch linh hoạt.

Sản phẩm chuyển trải nghiệm từ **Search-driven Travel** sang **Opportunity-driven Travel**: không bắt đầu bằng “Bạn muốn đi đâu?” mà bằng “Hiện tại có cơ hội du lịch nào đáng để đi nhất?”.

## 4. Mục tiêu cốt lõi

1. **Tự động phát hiện cơ hội bay giá tốt:** price drop, flash sale, airline promotion, route mới, seasonal price drop, low-demand period và error fare khi có thể.
2. **Giải thích mọi khuyến nghị:** luôn làm rõ vì sao giá rẻ, thấp hơn bình thường bao nhiêu, có đáng mua hay nên chờ, cùng các rủi ro liên quan.
3. **Tối ưu tổng chi phí chuyến đi:** xét giá vé, hành lý, chỗ ngồi, thuế, phí thanh toán, transit, visa transit, khách sạn transit và chi phí phát sinh.
4. **Khám phá điểm đến:** chủ động đề xuất điểm đến, quốc gia, thành phố và hành trình đang có giá tốt.
5. **Giảm thời gian nghiên cứu:** rút gọn việc so sánh nhiều website, đọc nội dung khuyến mãi và tự tính chi phí xuống còn vài phút.
6. **Xây dựng niềm tin bằng minh bạch:** hiển thị nguồn dữ liệu, thời điểm cập nhật, confidence score và lý do hệ thống đưa ra kết luận.

## 5. Kết quả người dùng cần đạt được

Sau khi sử dụng FlyCheap AI, người dùng có thể:

- Biết khi nào xuất hiện vé rẻ và không bỏ lỡ deal quan trọng.
- Hiểu nguyên nhân giá giảm và biết nên mua hay chờ.
- Tiết kiệm thời gian nghiên cứu và tổng chi phí chuyến đi.
- Khám phá các điểm đến mới mà không cần biết trước nơi muốn đi.

## 6. Mục tiêu kinh doanh giai đoạn đầu

Giai đoạn đầu ưu tiên chất lượng sản phẩm hơn doanh thu:

- Xây dựng hệ thống dữ liệu giá vé đáng tin cậy.
- Thu hút người dùng quay lại hằng ngày.
- Trở thành công cụ kiểm tra giá trước khi đặt vé.
- Tạo nền tảng để mở rộng sang các dịch vụ du lịch khác.

## 7. Nguyên tắc sản phẩm

- **Opportunity First:** ưu tiên phát hiện cơ hội trước khi người dùng tìm kiếm.
- **Explain Everything:** không hiển thị khuyến nghị nếu thiếu lời giải thích phù hợp.
- **Evidence Before Recommendation:** mọi khuyến nghị phải dựa trên dữ liệu thực tế; AI không được tự tạo dữ liệu.
- **Optimize Total Cost:** tối ưu toàn bộ hành trình, không chỉ giá vé.
- **Transparency:** kết luận phải đi kèm confidence score, data source, updated time và reasoning.
- **User Safety First:** các kỹ thuật có rủi ro như hidden city ticketing, self-transfer và separate tickets phải hiển thị mức độ rủi ro, điều kiện áp dụng và cảnh báo từ hãng bay; người dùng phải chủ động xác nhận trước khi xem gợi ý.

## 8. Non-goals

FlyCheap AI không hướng tới:

- Trở thành OTA.
- Bán vé máy bay trực tiếp.
- Xử lý thanh toán.
- Quản lý hoàn vé.

## 9. Quy tắc áp dụng cho phát triển

Khi có xung đột giữa một tính năng và tài liệu này, phải ưu tiên minh bạch dữ liệu, an toàn người dùng, tối ưu tổng chi phí và khả năng giải thích. Các thay đổi quan trọng đối với logic sản phẩm phải cập nhật tài liệu này trước khi triển khai.
