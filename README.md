## 1. Tên sản phẩm (Working title)

**FlyCheap AI** (có thể đổi sau)

→ Một nền tảng săn vé máy bay giá rẻ chủ động bằng AI, giúp người dùng phát hiện cơ hội bay rẻ bất thường và hiểu rõ lý do đằng sau mức giá đó.

---

## 2. Tầm nhìn (Vision)

Trở thành “radar giá vé máy bay toàn cầu” — nơi không cần biết đi đâu, chỉ cần biết *khi nào có cơ hội bay rẻ*.

Khác với các nền tảng như Skyscanner hay Google Flights (search theo nhu cầu), sản phẩm này **đảo chiều logic**:

👉 Không hỏi “tôi muốn đi đâu”

👉 Mà trả lời “bây giờ nên đi đâu vì đang rẻ”

---

## 3. Sứ mệnh (Mission)

- Giảm chi phí du lịch cho người dùng bằng cách tận dụng biến động giá
- Biến việc “săn vé rẻ” từ kỹ năng cá nhân → thành hệ thống AI tự động
- Giúp người dùng hiểu *vì sao giá rẻ* (không chỉ đưa deal)

---

## 4. Vấn đề (Problem Statement)

Hiện tại:

- Người dùng **không biết khi nào vé rẻ**
- Phải tự check nhiều nền tảng (Skyscanner, OTA, hãng bay…)
- Không hiểu:
    - Vì sao giá giảm?
    - Có nên mua ngay không?
- Vé “rẻ” thường:
    - Ẩn phí (low-cost airlines)
    - Có rủi ro (transit, hidden city, self-transfer)

👉 Tóm lại:

**Thông tin phân mảnh + thiếu insight + mất thời gian**

---

## 5. Giải pháp (Solution)

Một web app dùng AI để:

### Core concept:

👉 **Deal-first discovery engine + Price intelligence layer**

---

### 5.1. Core Value Proposition

- Phát hiện vé rẻ bất thường (price anomaly detection)
- Gợi ý hành trình tối ưu (multi-leg, self-transfer)
- Giải thích rõ:
    - Vì sao rẻ
    - Rủi ro gì
    - Có nên mua không

---

### 5.2. Key Features (High-level)

### 🔎 1. Deal Discovery Engine

- Quét giá vé từ nhiều nguồn
- Detect giảm giá bất thường (20–50%)
- Không cần nhập destination

---

### 📊 2. Price Intelligence AI

- Phân tích:
    - ngày bay
    - seasonality
    - event / low demand
- Explain:
    
    > “Giá giảm 32% vì low season + hãng X đang mở route mới”
    > 

---

### ✈️ 3. Smart Route Builder

- Tự build:
    - multi-leg flight
    - self-transfer
- Ví dụ:
    - HAN → PVG → EU rẻ hơn direct

---

### 💸 4. Hidden Cost Analyzer

- Bóc tách:
    - baggage
    - seat
    - payment fee
- So sánh:
    - “vé 89$ thực tế = 275$”

---

### 🔁 5. Flexible Decision Engine

- Recommend:
    - nên mua ngay / chờ
    - refundable vs non-refundable
- Risk scoring

---

### 🎯 6. Deal Alert System

- Notify:
    - “Hàn Quốc -35% trong 3 ngày tới”
- Có thể integrate với:
    - Telegram / Email / Notion

---

### ⚠️ 7. Advanced Mode (Opt-in)

- Hidden city ticketing
- Complex routing
- Cảnh báo rõ ràng trước khi dùng

---

## 6. Target Users

### Primary:

- Người thích du lịch linh hoạt (không fix điểm đến)
- Digital nomad / freelancer
- Người muốn tiết kiệm chi phí

### Secondary:

- Travel hacker
- Người săn deal

---

## 7. Điểm khác biệt (Differentiation)

| Feature | FlyCheap AI | Skyscanner | Google Flights |
| --- | --- | --- | --- |
| Deal-first | ✅ | ❌ | ❌ |
| Explain price | ✅ | ❌ | ❌ |
| Multi-leg AI | ✅ | ⚠️ manual | ⚠️ limited |
| Hidden cost analysis | ✅ | ❌ | ❌ |
| Personal alert system | ✅ | ⚠️ basic | ⚠️ basic |

---

## 8. Business Model (giai đoạn đầu)

Bạn muốn free → hợp lý.

### Phase 1 (Now):

- 100% free
- Focus:
    - validate value
    - build system

### Phase 2:

- Affiliate:
    - OTA / airline
- Premium:
    - advanced alerts
    - automation

---

## 9. Product Principles

- **Không cần user nhập nhiều**
- **Luôn explain**
- **Minimize risk**
- **Maximize savings**

---

## 10. Success Metrics

- % deal user click
- % deal user book
- Avg saving per user
- Retention (daily check habit)

---

## 11. Scope (v1)

👉 Đừng build full ngay, v1 nên là:

- Deal detection (1–2 routes)
- Simple alert
- Basic explanation

---

## 12. Long-term Vision

- AI Travel Agent:
    - “Tôi rảnh 5 ngày, budget 10tr → đi đâu?”
- Auto-book (sau này)
- Dynamic itinerary builder
