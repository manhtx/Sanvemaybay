# FARELY V22 — PRICE TRUTH & EPISTEMIC CONTRACT

### 1. Price Taxonomy
Farely rejects the conflation of different price concepts into an ambiguous `deal.price`. Every price in the system must be typed and bounded:

| Price Type | Definition | Source / Authority |
| :--- | :--- | :--- |
| `OBSERVED_PRICE` | Giá quan sát tại một thời điểm cụ thể $T$ bởi crawler/worker. | Raw Ingestion row |
| `OFFER_PRICE` | Giá cước gắn với một `OfferVariant` xác định (hãng bay, giờ bay, chặng bay). | Normalized Provider Offer |
| `BEST_OBSERVED_PRICE` | Mức giá hợp lệ thấp nhất trong các bản ghi quan sát còn hạn tươi cho một `TravelIntent`. | Snapshot Aggregation |
| `BEST_CURRENT_PRICE` | Mức giá thấp nhất trả về từ một truy vấn tìm kiếm trực tiếp hiện thời. | On-Demand Live Search |
| `VERIFIED_OFFER_PRICE` | Mức giá hiện tại đã được xác nhận trực tiếp cho một chuyến bay cụ thể. | Verification Probe |
| `REFERENCE_PRICE` | Mức giá tham chiếu có cơ sở thống kê (Trung vị của `ComparableCohort`). | Historical Distribution |

---

### 2. Price Scope Fingerprint (`PriceScopeFingerprint`)
Hai mức giá **chỉ được phép so sánh trực tiếp** để tranh danh hiệu "Rẻ nhất" khi và chỉ khi có cùng `PriceScopeFingerprint`:

$$\text{Fingerprint} = \langle \text{OriginScope}, \text{DestinationScope}, \text{DepartDate}, \text{ReturnDate}, \text{TripType}, \text{StopsConstraint}, \text{Cabin}, \text{Passengers}, \text{Currency} \rangle$$

**Quy tắc Cấm kỵ:**
1. **Direct-only vs Any-stops:** Chuyến bay 1 điểm dừng giá 3.5M **không được phép** làm cho chuyến bay thẳng 4.2M bị coi là "đắt hơn" nếu người dùng đang tìm kiếm chuyến bay thẳng.
2. **Airport vs City:** Tìm kiếm `BKK` (Suvarnabhumi) không được âm thầm so sánh với `DMK` (Don Mueang) trừ khi người dùng tìm kiếm toàn thành phố `Bangkok (All Airports)`.
3. **Trip Type:** Giá khứ hồi (Round-Trip) không bao giờ được so sánh với vé một chiều (One-Way).

---

### 3. "Cheapest" vs "Best Value"
- **CHEAPEST (Rẻ nhất):**
  - Là giá trị số học tuyệt đối nhỏ nhất: $\min_{i} (\text{NormalizedTotalPrice}_i)$ thỏa mãn điều kiện lọc.
  - Không chịu ảnh hưởng bởi bất kỳ thuật toán xếp hạng hay điểm số nào.
- **BEST VALUE (Tối ưu nhất):**
  - Là sự cân bằng giữa giá cước, thời lượng bay, số điểm dừng, sự thuận tiện của giờ khởi hành và độ tin cậy của hãng bay.
  - Được xếp hạng theo `DealScore`.
- **Luật:** Trên giao diện, nhãn `"RẺ NHẤT"` hoặc `"GIÁ THẤP NHẤT"` **chỉ dành riêng cho CHEAPEST**. Không bao giờ gọi một lựa chọn điểm cao nhưng đắt tiền hơn là "Rẻ nhất".

---

### 4. Giải phẫu Hồi quy HAN → KUL (Incident Root Cause Analysis)

#### Sự cố đã ghi nhận:
- Người dùng tìm kiếm chặng **HAN → KUL** (16/10/2026 – 20/10/2026, bay thẳng).
- Farely hiển thị vé của **Sun PhuQuoc Airways** ở mức **~5.21M VND**.
- Trong khi đó trên Google Flights hiển thị vé bay thẳng của **AirAsia** ở mức **~4.27M VND**.

#### Các nguyên nhân tiềm ẩn và phương án khắc phục:
1. **Khuyết mẫu cào (Provider Coverage / Sampling Gap):**
   - Script worker `fast-flights-worker.py` truy vấn Google Flights. Google Flights phân chia kết quả thành "Top flights" (Best flights) và "Other flights". Nếu worker chỉ đọc nhóm top hoặc bị giới hạn bởi số kết quả phân trang, các chuyến bay giá rẻ của AirAsia có thể bị bỏ sót.
   - **Khắc phục:** Đảm bảo parser duyệt qua toàn bộ các lựa chọn hợp lệ trong danh sách chuyến bay, không dừng sớm khi chỉ mới lấy 1-2 chuyến đầu.
2. **Offer Aggregation vs Route Best:**
   - Nếu hệ thống lưu nhiều OfferVariant cho cùng một chặng HAN-KUL (ví dụ: Sun PhuQuoc 5.21M và AirAsia 4.27M), nhưng thuật toán hiển thị sắp xếp theo `deal_score` (giả sử Sun PhuQuoc có điểm discount cao hơn do median tham chiếu khác biệt), thẻ hiển thị có thể đưa Sun PhuQuoc lên trước.
   - **Khắc phục:** Khi hiển thị cơ hội theo chặng bay, mức giá nổi bật nhất **bắt buộc là giá thấp nhất (Route-Best Price: 4.27M)**. Nếu người dùng xem chi tiết vé 5.21M của Sun PhuQuoc, giao diện phải hiển thị rõ ràng: *"Đang có lựa chọn rẻ hơn: AirAsia (4.27M)"*.
3. **Thuế và Phí (Tax/Currency Normalization):**
   - Đảm bảo giá trị giá vé luôn là giá **Tổng cộng (Total Price including mandatory taxes)**, tính theo VND.
