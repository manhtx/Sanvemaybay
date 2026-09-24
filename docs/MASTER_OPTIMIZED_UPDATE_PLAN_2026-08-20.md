# FlyCheap AI — Optimized Product and System Update Plan

**Ngày lập:** 2026-08-20  
**Phạm vi:** Product, data, scoring, provider, frontend, backend, database,
security, privacy, SRE, QA, SEO và release engineering.  
**Nguồn đầu vào:** `MASTER_PRODUCT_SYSTEM_DATA_AUDIT_2026-08-20.md`,
`MASTER_REMEDIATION_IMPLEMENTATION_PLAN_2026-08-20.md` và bằng chứng runtime
trong `REMEDIATION_EXECUTION_STATUS.md`.  
**Trạng thái:** Kế hoạch điều hành đề xuất; không tự động cho phép commit, push,
migration hoặc production deployment.

## 1. Quyết định điều hành

FlyCheap nên tiếp tục theo hướng **price discovery có nguồn và độ tin cậy**, sau
đó mới nâng thành **verified-live deal platform** khi có provider chính thức và
price-parity proof. Không nên lấp trang bằng dữ liệu giả hoặc hạ chuẩn `live` để
tạo cảm giác có nhiều deal.

Trong 12 tuần, thứ tự tối ưu là:

1. đồng bộ source, schema, functions và frontend về cùng một release;
2. làm cho observed feed mới, nhanh, có thể quan sát và chống abuse;
3. chứng minh scoring hữu ích bằng backtest/shadow measurement;
4. tích hợp một provider live trên cohort nhỏ;
5. chỉ mở public beta khi runtime gates đạt liên tục;
6. sau đó mới mở rộng route, SEO và growth.

## 2. Những sự thật không được đánh đổi

- `Observed/indicative` là giá để khám phá, không phải cam kết mua được.
- `Live` phải có approved source, thời điểm kiểm tra, validity/expiry, deeplink
  hợp lệ và price-parity evidence.
- Mức giảm và confidence là hai trục độc lập. Confidence thấp cap claim ở
  `Giá đáng chú ý`, dù discount cao.
- User request đọc từ snapshot trong database; worker refresh nền mỗi giờ. User
  không chờ scraping/provider fan-out trong request.
- Feed quá 2 giờ phải degraded, quá 6 giờ phải stale/unavailable.
- Local PASS, staging PASS và production PASS là ba trạng thái độc lập.
- Không mở rộng AI/hotel/visa/native app cho tới khi P0/P1 gates đóng.

## 3. Kiến trúc vận hành mục tiêu tối thiểu

```text
Scheduled scan / approved provider
        -> validate + normalize + provenance
        -> raw immutable observations
        -> background scoring/versioning
        -> bounded observed/live read models
        -> cached paginated Edge API
        -> web UI, alerts, analytics

Every stage -> request/scan ID + release SHA + structured metrics
```

Không cần microservices ở giai đoạn này. React + Supabase + scheduled workers
đủ cho public beta nếu boundary, idempotency, RLS, rate limits và observability
được thực thi đúng.

## 4. Critical path và dependency gates

| Gate | Điều kiện vào | Điều kiện ra bắt buộc | Nếu fail |
|---|---|---|---|
| G0 Release integrity | Change set đã review | Cùng SHA cho build, migrations, functions; rollback target rõ | Không deploy |
| G1 Data runtime | G0 pass | 3 scan liên tiếp; p95 feed age <=2h; read model refresh thành công | Dừng provider expansion |
| G2 Security/runtime | G0 pass | RLS user A/B/service-role, Turnstile replay, rate limit và retention proof | Không public alert/data rights |
| G3 Scoring evidence | G1 pass | 7 ngày shadow/backtest; 0 low-confidence strong claim | Giữ label bảo thủ |
| G4 Live provider | G0–G3 pass | >=30 parity samples; link >=99%; stale active =0 | HOLD hoặc PIVOT discovery |
| G5 Public beta | G1–G4 pass | 7 ngày SLO, privacy rights, incident drill và production acceptance | Không tăng traffic |
| G6 Scale/growth | G5 pass | CWV, crawler HTML, conversion and retention evidence | Tối ưu core trước SEO breadth |

## 5. Kế hoạch thực thi theo 6 wave

### Wave 0 — Release-ready change set (1–2 ngày)

**Mục tiêu:** biến code local thành một release có thể review và tái tạo.

- Phân loại toàn bộ dirty worktree: in-scope, user-owned, unrelated.
- Review migrations theo thứ tự và forward-fix/rollback path.
- Chia commit theo boundary: truth/scoring, data read model, security/privacy,
  UI, workflows/operations, tests/docs.
- Chạy clean-checkout build và so release manifest/hash.
- Chốt production origin, Supabase project ref và known-good rollback SHA.
- Không push/deploy khi chưa có quyền rõ ràng.

**Exit:** required checks xanh; manifest đầy đủ; reviewer có thể hiểu và rollback
từng boundary.

### Wave 1 — Activate staging runtime (2–4 ngày)

**Mục tiêu:** chứng minh schema/functions hoạt động ngoài local.

- Apply migrations lên staging theo exact SHA.
- Deploy `observed-fares`, refresh, analytics, retention và data-right functions.
- Cấu hình `DEPLOYED_COMMIT`, internal secret, rate-limit salt, Turnstile test
  keys/hostname và public HTTPS origin.
- Chạy refresh snapshot; kiểm tra count, ordering, freshness và pagination.
- Cấu hình inventory gate theo môi trường. Production mặc định phải có ít nhất
  100 observed fares mới và `status=healthy`; mọi override phải được ghi rõ
  launch cohort, lý do, owner và ngày hết hiệu lực.
- Chạy `EXPLAIN (ANALYZE, BUFFERS)` cho top query; chỉ giữ index có bằng chứng.
- Load test cached/uncached; đo p50/p95/p99, rows scanned/returned và error rate.

**Exit:** G0 pass; staging API p95 <=500ms cached; query bounded; release SHA và
feed age xuất hiện đúng.

### Wave 2 — Security, privacy and failure safety (2–4 ngày)

**Mục tiêu:** không để public beta tạo abuse hoặc mất dữ liệu không kiểm soát.

- RLS matrix với anonymous, user A, user B và service role cho tất cả sensitive
  tables/functions.
- CAPTCHA valid/invalid/replay/action/hostname tests; email/IP hash budget,
  concurrency và global quota tests.
- Retention dry-run, sampled delete và post-delete authoritative recount.
- Account export bằng test user; xác minh token/hash/internal IDs không bị lộ.
- Thay immediate multi-step account deletion bằng **idempotent deletion job**:
  request record -> revoke sessions -> transactional user-data cleanup -> Auth
  deletion -> completion receipt. Retry được và không tạo trạng thái account còn
  nhưng dữ liệu đã xoá một phần mà không có audit/recovery path.
- Hash/pseudonymize user identifier trong operational logs; không log email,
  CAPTCHA token, signed URL hoặc raw auth token.

**Exit:** G2 pass; destructive test chỉ dùng dedicated staging account và có
explicit authorization.

### Wave 3 — Freshness and scoring calibration (7 ngày shadow)

**Mục tiêu:** nhiều giá hữu ích, mới và không phóng đại bằng chứng.

- Bật hourly scan cho 3–5 launch routes; retry có jitter, route circuit breaker
  và provider kill switch.
- Dashboard: scan age, received/accepted/rejected/deduped, route coverage,
  provider success, snapshot count và API health.
- Duy trì sort discount giảm dần; UI dùng xanh/vàng/đỏ cho mức chênh lệch nhưng
  luôn hiển thị con số phần trăm và confidence.
- Backtest score theo khả năng giá còn tồn tại sau 15/60 phút; đo precision theo
  label, route, airline, sample size và freshness.
- Điều chỉnh threshold bằng evidence, không theo cảm giác; version algorithm và
  giữ changelog/model card.

**Exit:** G1 và G3 pass; p95 feed age <=2h; 0 claim violation; scoring precision
được báo cáo với confidence interval và known limitations.

### Wave 4 — Live provider cohort (2–4 tuần, phụ thuộc bên ngoài)

**Mục tiêu:** chứng minh lời hứa “deal có thể kiểm tra/mua”.

- Legal/commercial approval cho provider và affiliate/deeplink terms.
- Adapter contract lưu provider offer ID, total price/currency, passenger mix,
  cabin/fare family, baggage, refundability, observed time, expiry và deeplink.
- Không promote discovery rows thành live; live ingest là pipeline riêng.
- Chạy tối thiểu 30 price-parity samples trên launch cohort; ghi mismatch reason
  và tolerance được product/legal duyệt.
- Scheduled link validation và automatic expiry; active stale rate phải bằng 0.

**Exit:** G4 pass. Nếu sau hai provider experiments vẫn không đạt coverage/parity
kinh tế, kích hoạt PIVOT sang price-intelligence discovery thay vì kéo dài vô hạn.

### Wave 5 — Production beta and growth (2 tuần)

**Mục tiêu:** release có kiểm soát, đo được giá trị thật.

- Canary 5% -> 25% -> 100%; mỗi bước có 24h soak và rollback criteria.
- Production acceptance theo deployed SHA; incident game day và on-call owner.
- Đo find-deal -> provider-click -> successful recheck -> alert/return funnel.
- Hoàn tất crawler-rendered HTML strategy: prerender/SSR cho landing routes, không
  index private/action/expired pages.
- Theo dõi p75 LCP/INP/CLS bằng RUM đã lấy mẫu; tối ưu theo field evidence.
- Chỉ mở thêm route khi route hiện tại đạt freshness, parity và conversion gate.

**Exit:** G5 pass 7 ngày. Growth work bắt đầu khi reliability budget còn đủ.

## 6. Capacity allocation tối ưu

Trong trường hợp một nhóm nhỏ, dùng tỷ trọng thay vì chạy mọi workstream cùng
lúc:

| Năng lực | Trước public beta | Sau G5 |
|---|---:|---:|
| Data/provider truth | 35% | 25% |
| Reliability/release/observability | 25% | 20% |
| Security/privacy | 15% | 10% |
| Product/UI/accessibility | 15% | 20% |
| QA/performance | 10% | 15% |
| Growth/experiments | 0% | 10% |

Một người có thể kiêm nhiều vai trò, nhưng mỗi gate phải có một owner và một
reviewer khác cho migration/security/destructive flows.

## 7. Product metrics và guardrails

### North-star

`Verified useful opportunity rate` = tỷ lệ session tìm được fare phù hợp, mở
provider và kiểm tra lại thành công trong tolerance đã định.

### Leading metrics

- fresh observed routes/total launch routes;
- fresh observed inventory (production floor mặc định: 100);
- useful cards per route và coverage theo date window;
- provider recheck success, parity rate và click-through;
- alert opt-in, delivery success, duplicate delivery;
- score precision ở 15/60 phút;
- returning users sau 7 ngày.

### Guardrails

- strong-claim confidence violation = 0;
- stale active live deal = 0;
- API error <1%, alert success >=95%;
- no cross-user RLS read/write;
- no raw personal identifier/token in logs;
- Core Web Vitals p75: LCP <=2.5s, INP <=200ms, CLS <=0.1.

## 8. Decision log bắt buộc

Trước khi production, cần ghi và duyệt rõ:

1. canonical public domain/origin;
2. launch cohort và passenger/currency assumptions;
3. provider terms, parity tolerance và affiliate disclosure;
4. scoring label thresholds và confidence gates;
5. CAPTCHA vendor, privacy impact và fallback;
6. retention periods và account-deletion SLA;
7. prerender/SSR approach;
8. GO/HOLD/PIVOT owner.

## 9. Release acceptance checklist

Một release chỉ được gọi là hoàn tất khi:

- exact SHA build/test/deploy và release manifest khớp;
- migrations/functions/frontend cùng release ID;
- unit, Deno, contracts, E2E, build, audit và diff checks pass;
- staging RLS, abuse, retention, query-plan và load tests pass;
- production read-only smoke pass theo deployed SHA;
- observed feed `healthy`, tuổi không quá 120 phút và inventory đạt floor đã
  duyệt (mặc định production: 100);
- feed freshness/release metadata đúng ở browser;
- provider/parity gates pass nếu release dùng claim live;
- rollback target và owner trực sẵn;
- tài liệu status cập nhật bằng evidence, không bằng suy đoán.

## 10. Trạng thái áp dụng ngay

Repository hiện đã có phần lớn code cho scoring confidence, freshness contract,
read model, abuse controls, observability, privacy, RUM, SEO guard và release
manifest. Local test evidence mạnh, nhưng runtime mới chưa được deploy. Vì vậy:

- **NOW:** Wave 0, review change set và chuẩn bị exact-SHA staging release;
- **NEXT:** Wave 1–3, lấy runtime/security/freshness/scoring evidence;
- **EXTERNAL CRITICAL:** provider contract và live-price parity;
- **DO NOT START:** route breadth, native app, hotel/visa hoặc AI expansion;
- **CURRENT VERDICT:** tiếp tục build có điều kiện; chưa public-beta ready.

## 11. Thứ tự hành động đã tối ưu theo bằng chứng hiện tại

Không nên deploy thẳng change set local vào Supabase production hiện tại. Audit
đã phát hiện project remote đang trộn schema FlyCheap và Macro, migration history
không khớp, thiếu nhiều Edge Functions mới, frontend production thuộc release cũ
và thiếu các environment variables/secrets bắt buộc. Thứ tự thực thi an toàn là:

1. review và chia change set local thành các commit theo boundary, không gom các
   thay đổi user-owned/unrelated;
2. tạo Supabase staging FlyCheap biệt lập, replay toàn bộ migration chain sạch;
3. cấu hình staging secrets/variables bằng tên chuẩn, tuyệt đối không chép giá
   trị secret vào tài liệu hoặc artifact;
4. deploy functions và frontend preview cùng exact SHA;
5. chạy parity, RLS A/B, CAPTCHA replay, retention, account data-rights, query
   plan, load và three-scan freshness suites;
6. chạy scoring shadow 7 ngày trên launch cohort trước khi đổi threshold;
7. tích hợp Skyscanner Live Prices như provider live ưu tiên khi đã có quyền
   commercial/API; giữ Travelpayouts Week Matrix ở lớp indicative;
8. chỉ sau staging PASS mới lập migration/cutover plan riêng cho production
   hiện tại hoặc một production FlyCheap sạch;
9. canary production theo 5% -> 25% -> 100%, mỗi bước có rollback và soak;
10. mở rộng route/SEO/growth sau khi G5 đạt liên tục 7 ngày.

Các bước 2–9 là external-state changes và cần quyền tạo/cấu hình/deploy tương
ứng. Cho tới lúc đó, repository có thể đạt `LOCAL PASS`, nhưng không được ghi là
`STAGING PASS`, `PRODUCTION PASS` hoặc `PUBLIC-BETA READY`.
