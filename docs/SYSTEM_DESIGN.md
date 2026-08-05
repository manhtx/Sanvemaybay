# 🏗️ System Design — FlyCheap AI

**Version:** 1.0  
**Status:** Draft

## 1. Purpose

Tài liệu mô tả kiến trúc tổng thể, thành phần hệ thống, luồng dữ liệu, trách nhiệm service, phạm vi sử dụng AI và luồng xử lý chức năng. Mọi implementation phải tuân theo kiến trúc này.

## 2. Design Principles

- **Modular:** mỗi module chỉ đảm nhiệm một nhiệm vụ.
- **API First:** mọi dữ liệu truy cập qua API; frontend không truy cập trực tiếp Data Source.
- **Event Driven:** module giao tiếp qua Event hoặc Queue khi phù hợp.
- **AI Assisted:** AI chỉ phân tích, không lấy hoặc lưu dữ liệu.
- **Data First:** mọi quyết định dựa trên dữ liệu. Khi thiếu dữ liệu, AI trả về “I don't have enough data.”

## 3. High-level Architecture

```text
User Browser
    ↓ REST / GraphQL API
Backend API Layer
    ├── Deal Detection Engine
    ├── AI Analysis Engine
    ├── User Service
    └── Notification Service
    ↓
Database Layer
    ├── Flight Data
    ├── Historical Data
    └── User Data
    ↑
Data Collection Layer
    ├── Airline API
    ├── OTA/API
    ├── Price Feed
    └── External Data
```

## 4. System Modules

### 4.1 Data Collection Service

Thu thập dữ liệu chuyến bay từ External Sources, không xử lý business logic và không sử dụng AI.

**Input:** External Sources  
**Output:** Normalized Flight Data  
**Functions:** Fetch Flight Price, Airline Data, Airport Data, Route Data và Promotion.

Promotion data is treated as an input contract, not invented by the client: the domain matcher validates effective dates, departure dates, route/airline scope, minimum fare and capped savings before a promotion can affect a deal. Missing or unverified promotion feeds produce no match.

### 4.2 Data Processing Service

Chuẩn hóa Currency, Timezone, Airport Code và Airline Name, sau đó tạo Clean Data.

### 4.3 Historical Database

Lưu toàn bộ lịch sử giá, không overwrite dữ liệu cũ. Bản ghi gồm route, ngày, giá, airline và timestamp.

### 4.4 Deal Detection Engine

Phát hiện deal bằng thuật toán, không sử dụng AI.

```text
Current Price + Historical Price
        ↓
Compare Historical Average
        ↓
Calculate Discount
        ↓
Generate Deal Score
        ↓
Store Result
```

### 4.5 Route Optimization Engine

Tìm route tốt hơn, gồm Direct, Multi-leg, Self-transfer và Virtual Interlining. Output là Optimized Route.

### 4.6 Cost Analysis Engine

Tính tổng chi phí thực tế gồm Ticket, Baggage, Seat, Tax và Payment Fee. Output là Total Cost.

### 4.7 AI Analysis Engine

Đây là module duy nhất sử dụng AI. AI chỉ Explain, Compare, Summarize, Recommend và Predict.

AI không Crawl, Store, Fetch hoặc Detect Deal.

**Input:** Deal Data, Historical Data, Route và Trend.  
**Output:** Summary, Reason, Recommendation và Confidence.

### 4.8 Notification Service

Gửi Alert qua Telegram, Email và Push Notification.

### 4.9 User Service

Quản lý Profile, Preference, Alert và Saved Deal.

## 5. Data Flows

### 5.1 Homepage Flow

```text
User opens Homepage
    ↓
Frontend calls API
    ↓
Backend reads Database
    ↓
Load Today's Deals and AI Summary
    ↓
Return JSON
    ↓
Render UI
```

Homepage không fetch trực tiếp từ Airline và không scrape realtime.

Feed output is diversified into hot, newly observed, biggest-drop, preference recommendation and destination sections using validated deal fields. Missing provider fields, including refund/change terms or unparseable duration, remain explicit unavailable data rather than inferred values.

### 5.2 Background Flow

Mỗi 6 giờ: Fetch New Price → Normalize → Save Database → Compare Historical → Generate Deal Score → Store Deal → Trigger AI Analysis → Save Summary → Send Alert.

### 5.3 Search Flow

User Search → Check Database → Apply origin/destination/budget/date/stops/max-duration filters → nếu có dữ liệu thì Return Result; nếu chưa có thì Create Fetch Job → Background Processing → Save Database → Notify User. UI không bị block.

### 5.4 AI Flow

Deal Created → Prepare Context → Call AI → Validate Output → Store AI Result → Display on Frontend.

### 5.5 Data Lifecycle

Fetch → Clean → Validate → Store → Analyze → Recommend → Archive.

Không xóa lịch sử giá.

## 6. Database Domains

Flight, Airport, Airline, Route, Deal, Historical Price, Alert, User, Preference và AI Summary.

## 7. External Dependencies

Flight Data Provider, Airport Information, Currency Exchange và Holiday Calendar. Weather API và Visa Information là dependency tương lai.

## 8. Caching Strategy

| Resource | Cache |
|---|---:|
| Homepage | 5 phút |
| Deal Detail | 30 phút |
| Historical Chart | 1 giờ |
| Airline Information | 24 giờ |

## 9. Failure Strategy

- **Data Source lỗi:** giữ dữ liệu gần nhất và hiển thị thời điểm cập nhật, ví dụ “Last updated 3 hours ago”.
- **AI lỗi:** không chặn hệ thống; chỉ ẩn AI Summary.
- **Notification lỗi:** retry và chuyển vào Dead Letter Queue.

## 10. Scalability

Kiến trúc cho phép mở rộng Multiple Data Sources, AI Models, Notification Channels, Countries và Languages mà không cần thay đổi kiến trúc nền tảng.

## 11. Security

Không lưu thông tin thanh toán hoặc hộ chiếu, không thực hiện booking và chỉ lưu dữ liệu cần thiết.

## 12. Future Architecture

Các module tương lai gồm Hotel Engine, Visa Engine, Trip Planner, AI Travel Assistant, Budget Planner, Car Rental và Insurance Recommendation. Tất cả hoạt động trên cùng kiến trúc.
