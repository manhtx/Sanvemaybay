# 📑 Feature Specification — FlyCheap AI

**Version:** 1.0  
**Status:** Draft

## 1. Purpose

Tài liệu này định nghĩa các chức năng của FlyCheap AI. Mỗi feature phải làm rõ vấn đề, giá trị, cách tương tác, logic hệ thống, điều kiện hoàn thành, dữ liệu cần thiết và vai trò của AI. Mọi implementation phải tuân theo tài liệu này.

## 2. Feature Specifications

### Feature 01 — Deal Discovery

**Objective:** Tự động phát hiện chuyến bay có giá thấp bất thường.

**Business value:** Người dùng không cần theo dõi giá mỗi ngày; hệ thống chủ động phát hiện deal.

**User story:** Người thích du lịch muốn mở website và ngay lập tức thấy deal đáng chú ý mà không phải tự tìm từng chặng bay.

**Functional requirements:** Theo dõi giá liên tục, so sánh lịch sử, phát hiện mức giảm bất thường, tính Deal Score và xếp hạng deal. Search có thể lọc theo origin, destination code/tên/quốc gia, budget, date range và max stops.

**Display:** Origin, Destination, Departure Date, Airline, Current Price, Average Price, Discount Percentage, Deal Score, Updated Time.

**Acceptance criteria:** Chỉ hiển thị khi giá thấp hơn ngưỡng cấu hình, dữ liệu còn mới trong khoảng cho phép và Confidence Score đạt mức tối thiểu.

**AI responsibility:** Không; sử dụng thuật toán và dữ liệu. Future enhancement: Machine Learning Deal Detection, Personalized Deal Score.

### Feature 02 — AI Price Explanation

**Objective:** Giúp người dùng hiểu vì sao deal được coi là tốt.

**Functional requirements:** Giải thích vì sao giá giảm, thấp hơn trung bình bao nhiêu, có phải mức thấp nhất lịch sử không, khả năng tiếp tục giảm và yếu tố mùa vụ.

**Output:** Summary, Reason, Confidence, Recommendation.

**Acceptance criteria:** Không được tạo dữ liệu. Nếu thiếu dữ liệu, AI phải nói rõ.

**AI responsibility:** Đây là feature chính sử dụng AI.

### Feature 03 — Route Optimization

**Objective:** Đề xuất hành trình tiết kiệm hơn.

**Functional requirements:** So sánh direct flight, multi-leg và self-transfer; tính tổng chi phí.

**Display:** Route, Total Price, Duration, Number of Stops, Risk Score.

**Acceptance criteria:** Luôn sắp xếp theo Total Cost, không chỉ Ticket Price. Khi chỉ có một provider itinerary, hiển thị đánh giá phương án hiện tại và không tuyên bố đã tối ưu giữa các route chưa được cung cấp.

Implementation note: `combineSelfTransferOptions` only creates a candidate when observed legs connect at the same airport and meet the configured minimum buffer (120 minutes by default); it preserves freshness/visa/airport-change signals and requires provider route options before any UI recommendation.

**AI responsibility:** Giải thích ưu và nhược điểm.

### Feature 04 — Hidden Cost Analysis

**Objective:** Hiển thị tổng chi phí thực tế.

**Functional requirements:** Tính Base Fare, Tax, Baggage, Seat, Payment Fee, Transit Cost và Estimated Total.

**Acceptance criteria:** Luôn hiển thị Real Total Cost/Estimated Total Cost with a clear distinction between provider-known and user-entered costs; never silently invent missing fees.

### Feature 05 — Buy Decision

**Objective:** Đề xuất nên mua ngay hay tiếp tục chờ.

**Functional requirements:** Kết hợp Historical Price, Trend, Seasonality, Airline Promotion và Confidence.

**Output:** `BUY`, `WAIT` hoặc `MONITOR`.

**AI responsibility:** Giải thích quyết định.

### Feature 06 — Price History

**Objective:** Cho phép người dùng xem lịch sử giá.

**Functional requirements:** Biểu đồ 7 ngày, 30 ngày, 90 ngày và 180 ngày.

**Acceptance criteria:** Hiển thị các cửa sổ 7/30/90/180 ngày, neo theo observation mới nhất; hiển thị Lowest, Highest và Average khi có dữ liệu `price_history`; khi chưa có quan sát hợp lệ phải hiển thị trạng thái thiếu dữ liệu và không suy đoán biểu đồ.

### Feature 07 — Smart Alerts

**Objective:** Thông báo khi xuất hiện deal phù hợp.

**Functional requirements:** Cho phép tạo Alert theo Destination, Region, Budget, Date Range và Discount %. Date Range là khoảng ngày khởi hành bao gồm cả hai đầu mút; ngày không hợp lệ hoặc khoảng đảo chiều bị từ chối.

**Channels:** Telegram, Email.

### Feature 08 — Destination Discovery

**Objective:** Giúp người dùng khám phá điểm đến mới.

**Functional requirements:** Hiển thị Cheapest Destination, Trending Deals, Hidden Gems, Weekend Deals và Holiday Deals.

### Feature 09 — Destination Insight

**Objective:** Cung cấp bối cảnh cho điểm đến.

**Display:** Best Season, Weather, Visa, Estimated Budget và Suggested Duration.

Trong MVP, chỉ hiển thị các insight có thể tính từ deal đã được lưu (giá thực tế thấp nhất, số deal, mức giảm trung bình, Deal Score và deal cuối tuần). Weather, Visa và Best Season chỉ được bổ sung khi có nguồn dữ liệu xác thực.

### Feature 10 — Flight Comparison

**Objective:** So sánh nhiều phương án.

**Comparison fields:** Ticket Price, Total Cost, Transit, Airline, Duration, Refund Policy và Risk. Người dùng có thể chọn tối đa 3 deal trong danh sách để xem bảng so sánh; khi dữ liệu thiếu phải hiển thị “Chưa có dữ liệu”, không suy đoán. `refund_policy` được lưu khi provider có dữ liệu xác thực; nếu không, UI giữ trạng thái thiếu dữ liệu.

### Feature 11 — Risk Analysis

**Objective:** Đánh giá rủi ro của hành trình.

**Risk types:** Self Transfer, Hidden City, Tight Connection, Overnight Transit, Visa Transit và Airline Reliability.

Implementation note: route risk accepts explicit `overnightTransit` and `airlineReliability` metadata. Unknown reliability is surfaced as missing evidence rather than converted into a fabricated score; low reliability and overnight transit add risk reasons and may require confirmation.

**Output:** Risk Score, Risk Level và Recommendation.

### Feature 12 — User Preference

**Objective:** Cho phép AI hiểu người dùng.

**Preferences:** Home Airport, Budget, Favorite Region, Departure Date Range (inclusive), Max Stops, Preferred Airlines, Cabin Class và Max Flight Time. Search rejects reversed date ranges and never fabricates results outside the observed departure dates.

### Feature 13 — AI Trip Advisor

**Objective:** Đề xuất hành trình phù hợp.

MVP implementation là rule-based `/advisor`: chỉ dùng deal đã được cung cấp, ngân sách, origin và số ngày; chi phí điểm đến là estimate minh bạch theo rule. Không gọi đây là dự báo AI và không đưa hotel/visa/transport vào tổng nếu chưa có nguồn dữ liệu tương ứng.

Với ngân sách và số ngày người dùng cung cấp, AI đề xuất đi đâu, khi nào, bay thế nào, tổng chi phí và lý do.

Implementation note: MVP filters by origin, estimates flight plus rule-based daily destination cost, applies a bounded budget-fit weighting, and excludes results whose estimated total exceeds the supplied budget. It does not claim hotel, visa, transport or weather costs without verified sources.

### Feature 14 — Deal Bookmark

Người dùng có thể lưu deal.

### Feature 15 — Deal Sharing

Người dùng có thể chia sẻ deal.

### Feature 16 — AI Travel Feed

Trang chủ hiển thị Deal Hot, Newly Detected Deals, AI Recommendation, Biggest Price Drop và Trending Destination.

Promotion matching implementation contract: a validated promotion is eligible only when its validity window, departure window, route, airline and minimum-fare conditions match the deal. Fixed and percentage savings are capped at the promotion limit and ranked best-saving first. Collection of authoritative promotions remains an external-source dependency. The feed sections are built deterministically from validated deal fields: hot score, newly observed timestamp, biggest discount, transparent preferences and one highest-scoring deal per destination.

## 3. MVP Scope

Phiên bản đầu tiên bao gồm:

- Deal Discovery
- AI Explanation
- Price History
- Route Optimization
- Buy Decision
- Smart Alert

## 4. Future Scope

- Hotel
- Visa
- Travel Insurance
- Car Rental
- AI Planner
- AI Budget Optimizer
- Travel Calendar
- Team Travel
