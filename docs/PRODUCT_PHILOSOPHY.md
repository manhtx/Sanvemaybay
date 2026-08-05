# 🧠 Product Philosophy – FlyCheap AI

**Version:** 1.0  
**Status:** Draft

## 1. Purpose

Product Philosophy định nghĩa các nguyên tắc cốt lõi FlyCheap AI luôn tuân theo trong phát triển. Mọi quyết định về Product, Design, AI, Engineering và Data phải phù hợp với tài liệu này.

Khi có nhiều giải pháp, ưu tiên giải pháp phù hợp với Product Philosophy hơn giải pháp chỉ dễ triển khai hơn.

## 2. Core Belief

> **Mọi người đều xứng đáng được đi du lịch nhiều hơn, nhưng không phải ai cũng có thời gian và kinh nghiệm để săn được những cơ hội tốt nhất.**

FlyCheap AI biến việc săn vé giá rẻ từ một kỹ năng cá nhân thành một hệ thống AI thông minh, minh bạch và đáng tin cậy.

## 3. Product Philosophy

### 3.1 Opportunity First

Người dùng không phải lúc nào cũng biết mình muốn đi đâu. Sản phẩm phải chủ động phát hiện cơ hội trước khi người dùng tìm kiếm. FlyCheap AI là công cụ khám phá cơ hội du lịch, không chỉ là công cụ tìm kiếm chuyến bay.

### 3.2 Save Money, Not Just Find Cheap Tickets

Một chiếc vé rẻ chưa chắc là lựa chọn tốt nhất. Hệ thống phải tối ưu tổng chi phí hành trình, gồm giá vé, hành lý, thuế, phí thanh toán, transit, khách sạn và visa transit, thời gian di chuyển cùng các chi phí phát sinh khác.

Mục tiêu là tổng chi phí hợp lý nhất, không chỉ giá vé thấp nhất.

### 3.3 Explain Before Recommend

Không hiển thị recommendation nếu thiếu lời giải thích. Mỗi đề xuất phải nêu được lý do lựa chọn, dữ liệu hỗ trợ, mức độ tự tin và các giả định đang sử dụng.

### 3.4 Data Before AI

AI không phải nguồn dữ liệu mà là công cụ phân tích dữ liệu. Mọi kết luận phải dựa trên dữ liệu thực tế. Nếu dữ liệu chưa đủ, hệ thống phải nói rõ thay vì suy đoán.

### 3.5 Transparency Builds Trust

Thông tin quan trọng cần minh bạch: Data Source, Last Updated, Confidence Score, Historical Comparison và Risk Level. Người dùng có quyền biết kết luận dựa trên điều gì.

### 3.6 Intelligence Over Information

FlyCheap AI không cạnh tranh bằng việc hiển thị nhiều thông tin hơn mà bằng khả năng tổng hợp, giúp người dùng hiểu nhanh và ra quyết định tốt hơn.

### 3.7 Optimize the Journey, Not the Flight

Đánh giá toàn bộ hành trình. Chuyến bay rẻ hơn nhưng transit 20 giờ có thể kém tối ưu hơn chuyến bay đắt hơn một chút nhưng tiết kiệm khách sạn, visa transit và thời gian.

### 3.8 Personalization Without Complexity

Cá nhân hóa theo ngân sách, thời gian rảnh, điểm đến yêu thích, khả năng transit và mức độ chấp nhận rủi ro, nhưng không bắt người dùng thiết lập quá nhiều. Sự thông minh phải đến từ AI.

### 3.9 Safety Before Savings

Tiết kiệm không quan trọng hơn an toàn hoặc tính hợp pháp. Hidden City Ticketing, Self Transfer, Overnight Transit và Multiple Separate Tickets phải luôn có giải thích, rủi ro, cảnh báo và quyền quyết định chủ động của người dùng.

### 3.10 Automation Should Feel Invisible

Hệ thống phải làm phần khó phía sau để người dùng mở ứng dụng là biết ngay hôm nay có deal nào đáng quan tâm. Người dùng chỉ cần đưa ra quyết định cuối cùng.

## 4. Design Philosophy

Thiết kế phải phục vụ việc ra quyết định. Mỗi màn hình cần trả lời ít nhất một câu hỏi như:

- Deal này có đáng mua không?
- Tôi tiết kiệm được bao nhiêu?
- Có rủi ro gì?
- Nếu không mua hôm nay thì sao?

Thành phần giao diện không hỗ trợ quyết định thì không nên tồn tại.

## 5. AI Philosophy

AI không thay người dùng quyết định mà giúp người dùng quyết định tốt hơn. AI phải phân tích, so sánh, giải thích, dự đoán và cảnh báo.

AI không được tự tạo dữ liệu, khẳng định điều không chắc chắn, che giấu confidence hoặc kết luận khi thiếu dữ liệu.

## 6. User Experience Philosophy

FlyCheap AI phải khiến người dùng cảm thấy: “Tôi luôn là người biết deal sớm hơn mọi người”, thay vì “Tôi phải đi tìm deal”. Sản phẩm phải chủ động; người dùng chỉ cần khám phá.

## 7. Engineering Philosophy

Ưu tiên theo thứ tự: **Đơn giản → Chính xác → Có thể mở rộng.**

Không xây dựng hệ thống quá phức tạp nếu chưa tạo thêm giá trị cho người dùng. Mọi thành phần cần có khả năng thay thế, mở rộng, tự động hóa và quan sát được.

## 8. Decision Framework

Trước khi phát triển tính năng mới, cần hỏi:

1. Tính năng có giúp khám phá cơ hội tốt hơn không?
2. Có giúp người dùng tiết kiệm nhiều hơn không?
3. Có giúp người dùng hiểu rõ hơn không?
4. Có minh bạch không?
5. Có giảm thời gian nghiên cứu không?
6. Có phù hợp với Product Mission không?

Nếu câu trả lời là “Không” cho phần lớn câu hỏi, tính năng không nên được phát triển.

## 9. One Sentence Philosophy

> **FlyCheap AI không giúp người dùng tìm vé máy bay. Chúng tôi giúp họ khám phá những cơ hội du lịch tốt nhất bằng dữ liệu, AI và sự minh bạch.**
