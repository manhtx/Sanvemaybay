# 🗺️ Product Roadmap — FlyCheap AI

**Version:** 1.0  
**Status:** Draft  
**Document Type:** Product Delivery Roadmap  
**Horizon:** MVP → V1 → V2 → Scale

## 1. Purpose

Xác định lộ trình từ prototype đến nền tảng săn cơ hội du lịch hoàn chỉnh; giúp ưu tiên, kiểm soát phạm vi, đồng bộ Product/Design/Engineering/Data/AI và xác định điều kiện chuyển phase.

Roadmap không phải lịch cố định. Thứ tự ưu tiên là: **User Value → Data Reliability → Product Validation → Technical Feasibility → Cost Efficiency → Scalability**.

## 2. Roadmap Principles

- **Validate the Core Before Expanding:** chứng minh thu thập ổn định, deal thật, giải thích đáng tin cậy và tạo saving trước khi mở rộng.
- **Data Infrastructure Before Advanced AI:** Collect → Normalize → Validate → Store → Analyze → Explain → Predict.
- **Build Narrow, Learn Deep:** bắt đầu với ít sân bay/khu vực/route để hiểu sâu dữ liệu và hành vi.
- **Rule Engine Before Machine Learning:** giai đoạn đầu dùng rule/statistics cho deal, risk và buy decision; AI chỉ giải thích.
- **Fast Experience, Background Intelligence:** feed có sẵn từ cache, không scrape khi load trang chủ.
- **Safety Before Advanced Savings:** chỉ phát triển hidden city, separate tickets, self-transfer phức tạp, overnight transit và airport change sau khi risk analysis đủ tin cậy.

## 3. Roadmap Overview

```text
Phase 0 Foundation → Phase 1 Data Prototype → Phase 2 Personal MVP
→ Phase 3 Public MVP → Phase 4 Product V1 → Phase 5 Intelligence
→ Phase 6 Travel Opportunity Platform → Phase 7 Scale & Monetization
```

## 4. Phase 0 — Product Foundation

**Objective:** hoàn thiện tài liệu, phạm vi và quyết định nền tảng trước phát triển.

**Deliverables:** Product Overview, Goal, Philosophy, Feature Specification, System Design, Technical Architecture, Automation Flow, Roadmap, [Data Strategy](DATA_STRATEGY.md), [AI Prompt Specification](AI_PROMPT_SPECIFICATION.md), [Database Schema](DATABASE_SCHEMA.md), [API Specification](API_SPECIFICATION.md), [Engineering Principles](ENGINEERING_PRINCIPLES.md) và [Testing Strategy](TESTING_STRATEGY.md). Các tài liệu Phase 0 này đã được tạo và căn chỉnh với implementation hiện tại; runtime/provider gates vẫn được kiểm chứng riêng trong audit.

**Decisions:** sản phẩm là Deal Discovery Platform, không phải OTA; không booking trực tiếp; pre-fetch background; AI không tạo giá; MVP ưu tiên người dùng Việt Nam, home airport ban đầu HAN, một nhóm route nhỏ và chi phí tối thiểu.

**Exit:** MVP scope, data source thử nghiệm, kiến trúc, backlog và các feature deferred được chốt.

## 5. Phase 1 — Data Validation Prototype

**Objective:** chứng minh lấy, lưu và so sánh giá ổn định; chưa cần UI hoàn chỉnh.

**Scope:** origin HAN, 3–5 route đến ICN, TPE, NRT/KIX, BKK, SIN/KUL.

**Capabilities:** collection từ ít nhất một source, raw/debug data, normalization, historical observations không overwrite, idempotency, validation và analytics (lowest/highest/average/median/count/baseline).

**UX:** admin dashboard, database view, CLI, Telegram nội bộ hoặc HTML nội bộ.

**Success:** fetch success ≥90%, duplicate nghiêm trọng bằng 0, currency đúng, thấy lịch sử, có 14–30 ngày dữ liệu và xác minh được price drop thủ công.

**Exit:** source ổn định, schema ít thay đổi, baseline có, workflow chạy 6–12 giờ và kết quả đối chiếu được booking thực tế.

## 6. Phase 2 — Personal MVP

**Objective:** Product Owner mở website là thấy deal đáng chú ý.

**Features:** Deal Feed, Deal Detection, Price History 7/30 ngày, AI Explanation có confidence/uncertainty, rule-based Buy Decision (`BUY_NOW`, `BUY_SOON`, `MONITOR`, `WAIT`, `INSUFFICIENT_DATA`), Basic Hidden Cost (fare/tax/baggage/payment/estimated total) và Telegram Alert cho Strong/Extreme deal.

**Technical:** responsive web, API, database, scheduler, basic queue/job runner, logging, error handling, AI output validation và feed cache.

**Non-scope:** public registration, advanced personalization, Hidden City, full virtual interlining, auto booking, mobile app, hotel/visa engine, ML prediction.

**Success:** feed load nhanh từ cache, 5–20 opportunity/tuần, ít duplicate, AI output ổn định, Telegram hoạt động, booking URL xác minh được và Product Owner sử dụng thường xuyên.

**Exit:** sử dụng lặp lại, có deal đáng mua được xác minh, pipeline ổn định 2–4 tuần, lỗi source không làm website dừng và Deal Detail đủ rõ cho tester.

## 7. Phase 3 — Public MVP

**Objective:** beta nhỏ để kiểm chứng nhu cầu thật.

**Target:** người Việt thích du lịch tự túc, linh hoạt điểm đến, không ngại transit và thường xuất phát từ Hà Nội.

**User capabilities:** authentication, preferences (home airport, budget, region, dates, stops, baggage, self-transfer), Smart Alerts, Bookmark, Sharing và Deal Detail có price/history/total cost/AI/risk/source/time/booking link. Client đã có `/auth`, remote preference sync và remote bookmark sync với local fallback.

Trong client hiện tại, `home airport`, `budget`, region, preferred airline, max stops và max flight time đã được lưu cục bộ; homepage áp dụng transparent preference ranking trên feed đã validated (match origin/region/airline được cộng điểm, mismatch stops/duration/budget bị trừ điểm). Đây là rule-based personalization, chưa phải ML; đồng bộ cross-device vẫn phụ thuộc authentication/profile backend.

**Operations:** admin job dashboard, route/source controls, suspicious verification, workflow retry và source health.

**Analytics:** feed/detail view, bookmark, alert, booking click, share và return frequency.

**Success:** beta 20–100 users, weekly return, alert/bookmark/booking activity, feedback tiết kiệm thời gian, stale/sai deal được kiểm soát và notification không spam.

**Exit:** có repeat demand, hiểu use case chính, lỗi nghiêm trọng giảm và có dữ liệu ưu tiên phát triển.

## 8. Phase 4 — Product V1

**Objective:** biến Deal Feed thành công cụ quyết định du lịch đáng tin cậy.

**Enhancements:** Destination Discovery; percentile/rarity/seasonality/weekday/month/lead-time/volatility analysis; Buy Decision nâng cao; True Cost Comparison; basic route optimization cho direct/one-stop/separate tickets/self-transfer; Risk Analysis; Promotion Matching và Personalized Feed. Price-history percentile, median, volatility và weekday summary đã có ở detail khi observations hợp lệ.

Không mặc định khẳng định thứ Ba/thứ Tư rẻ hơn; mọi insight phải từ dữ liệu thực tế của route.

**Success:** khám phá được destination ngoài ý định ban đầu, total cost làm thay đổi lựa chọn, route optimization tạo saving thực tế, risk giảm lựa chọn không phù hợp và booking click đo được.

## 9. Phase 5 — Intelligence Expansion

**Objective:** tăng chiều sâu phân tích và hành trình phức tạp.

**Scope:** multi-origin SGN/DAD/HPH; mở rộng Asia rồi long-haul theo coverage; Virtual Interlining với buffer, baggage, airport và risk; Flexible Destination/Date Search; Advanced AI Advisor; thử nghiệm Price Forecasting.

Forecast chỉ bắt đầu khi đủ lịch sử, coverage ổn định, có rule baseline và benchmark accuracy; output phải có direction, probability, confidence, horizon và limitation, không phải cam kết chắc chắn. Client hiện có conservative baseline yêu cầu tối thiểu 14 observations và hiển thị limitation; benchmark/live forecast vẫn cần production history.

## 10. Phase 6 — Travel Opportunity Platform

Mở rộng từ flight sang Hotel Intelligence, Destination Cost, Trip Budget (Flight + Hotel + Visa + Transport + Daily Cost + Insurance + Buffer), Travel Calendar và AI Trip Planner.

**Product shift:** `Flight Deal Discovery` → `Travel Opportunity Intelligence`.

## 11. Phase 7 — Scale and Monetization

**Models:** affiliate Airline/OTA/Hotel/Insurance/Travel Service, Premium Subscription (alert sớm, nhiều route, advanced optimization, forecast, bank matching, group planning) và B2B Data Products.

**Principles:** không ưu tiên deal có hoa hồng cao hơn deal tốt, minh bạch affiliate, không bán dữ liệu nhạy cảm, không làm sai Deal Score và free tier vẫn có giá trị.

## 12. Prioritization Framework

Đánh giá User Value, Data Availability, Implementation Effort, Operating Cost, Risk, Learning Value và Strategic Fit.

```text
Priority Score =
(User Value × Strategic Fit × Learning Value)
÷ (Implementation Effort + Operating Cost + Risk)
```

### Priority Levels

- **P0 Critical:** collection, validation, storage, detection, feed, logging.
- **P1 High:** AI explanation, price history, total cost, buy decision, Telegram.
- **P2 Medium:** preferences, bookmark, personalized feed (rule-based MVP đã có), promotion, basic route.
- **P3 Advanced:** virtual interlining, forecast, hidden city, hotel intelligence, AI planner.

## 13. MVP Feature Matrix

| Feature | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---|---|---|---|---|
| Data/History | Basic | ✅ | ✅ | ✅ |
| Deal Detection | Basic | ✅ | Improved | Advanced |
| Deal Feed | Internal | ✅ | ✅ | Personalized |
| AI Explanation | — | ✅ | ✅ | Improved |
| Buy Decision | — | Basic | Basic | Advanced |
| Hidden Cost | — | Basic | Basic | Advanced |
| Telegram | Internal | ✅ | ✅ | ✅ |
| User Account | — | — | ✅ | ✅ |
| Route Optimization | — | Experimental | Basic | ✅ |
| Promotion Matching | — | — | Experimental | ✅ |
| Price Forecast | — | — | — | Research |
| Hidden City | — | — | — | — |

## 14. Explicitly Deferred

Booking trực tiếp, thanh toán, passport storage, check-in, refund management, loyalty connection, native mobile app, chatbot không kiểm soát dữ liệu, hidden city mặc định, auto-booking, realtime scrape khi mở website, ML khi thiếu dữ liệu và full global coverage.

## 15. Experiments

1. **Deal Trust:** historical comparison + source có tăng engagement/booking click không?
2. **AI Explanation:** explanation có giảm thời gian quyết định và tăng helpfulness không?
3. **Total Cost:** hiển thị tổng chi phí có thay đổi lựa chọn không?
4. **Opportunity Feed:** destination chưa tìm kiếm có tăng click/bookmark/alert không?
5. **Multi-leg Saving:** người dùng có chấp nhận separate tickets khi saving và risk minh bạch không?

Đo bằng detail engagement, booking click, interaction, feedback, bookmark, alert và preference.

## 16. Metrics

**Foundation:** fetch success, valid record, duplicate, freshness, job failure.  
**Product:** WAU, detail view, bookmark, alert, notification open, booking click, return rate.  
**Quality:** verified accuracy, stale rate, incorrect price, AI validation failure, false positive, notification duplicate.  
**User value:** estimated/verified saving, research time reduced, discovered opportunities và confidence before booking.

### North Star Metric

**Verified Travel Savings:** tổng tiền được xác nhận đã tiết kiệm so với baseline phù hợp. Trước khi có booking confirmation dùng `Qualified Savings Opportunity`: deal đủ dữ liệu, verified, booking link hợp lệ, vượt Deal Score và không suspicious.

## 17. Review và Go/No-Go

Review sau mỗi phase, khi source/chi phí/rủi ro/user feedback thay đổi hoặc feature không tạo giá trị.

**Go:** core ổn định, có nhu cầu, deal đạt chất lượng, đủ nguồn lực và risk được kiểm soát.  
**No-Go:** data không ổn định, deal sai nhiều, user không quay lại, AI thiếu căn cứ, source không bền vững, chi phí vượt giá trị hoặc lỗi nghiêm trọng chưa giải quyết.

## 18. Recommended Execution Order

```text
Chốt MVP → Data Strategy → Database Schema → Collection Prototype
→ Price History → Deal Detection → Manual Verification → API/Feed
→ AI Explanation → Telegram → Deal Detail → Personal Test
→ Total Cost → Small Beta → Feedback → Mở rộng route/features
```

## 19. Immediate Next Milestone

**Data Validation Prototype:** chứng minh `Thu thập giá → Lưu lịch sử → Phát hiện giá thấp → Xác minh nguồn đặt vé`.

**Required output:** 3–5 route, một source thử nghiệm, bảng observations, scheduled job, basic Deal Detection, dashboard/CLI kiểm tra và báo cáo sau 14–30 ngày.

## 20. One-line Roadmap Strategy

> **FlyCheap AI sẽ bắt đầu bằng việc chứng minh chất lượng dữ liệu và khả năng phát hiện deal trên phạm vi nhỏ, sau đó mới mở rộng trải nghiệm, tối ưu hành trình, trí tuệ phân tích và toàn bộ chi phí chuyến đi.**
