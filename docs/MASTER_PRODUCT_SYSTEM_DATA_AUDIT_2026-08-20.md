# FlyCheap AI — Master Product, Engineering, System and Data Audit

**Ngày đánh giá:** 2026-08-20  
**Phạm vi:** Product, frontend/UX, accessibility, backend/API, database, data
quality, scoring, security/privacy, DevOps/SRE, QA, SEO/performance và khả năng
thương mại hóa.  
**Loại đánh giá:** Code + tài liệu + local runtime + production-backed public
feed. Không phải penetration test, legal opinion hay chứng nhận production.

## 1. Kết luận điều hành

FlyCheap AI đang đi đúng hướng về nguyên tắc trung thực dữ liệu: hệ thống đã
tách `indicative` khỏi `live`, fail closed khi không có deal live, có allowlist
booking URL, validation và test tốt. Đây là nền móng đáng giữ.

Tuy nhiên, sản phẩm **chưa production-ready cho lời hứa “deal vé máy bay đã
xác minh”**. Giá trị người dùng hiện tại là một bảng khám phá giá quan sát, chưa
phải nguồn inventory live/bookable. Rủi ro cao nhất là khoảng cách giữa:

1. dữ liệu quan sát và giá có thể mua thật;
2. Deal Score mạnh và confidence còn thấp;
3. thiết kế vận hành mỗi giờ và dữ liệu thực tế đã 16 giờ;
4. tài liệu kiến trúc lý tưởng và implementation hiện tại;
5. code local đã tiến xa và source đã commit/deploy có thể tái tạo.

### Product verdict

**Có thể tiếp tục build**, nhưng phải xem giai đoạn hiện tại là
`observed-price discovery MVP`, không phải flight OTA hay verified-live deal
platform. Trong 30 ngày tới chỉ nên tập trung vào data truth, provider contract,
reproducible release và observability. Chưa nên mở rộng AI, khách sạn, visa,
mobile native hoặc nhiều tính năng phụ.

## 2. Phương pháp và mức bằng chứng

| Ký hiệu | Ý nghĩa |
|---|---|
| VERIFIED | Đã kiểm tra trực tiếp trong code, command hoặc browser hiện tại |
| PARTIAL | Có implementation nhưng thiếu production/runtime proof đầy đủ |
| NOT_RUN | Chưa chạy vì thiếu cấu hình, quyền hoặc môi trường thích hợp |
| BLOCKED | Không thể đạt tiêu chí nếu thiếu provider/contract/quyết định bên ngoài |

Đánh giá đối chiếu với OWASP API Security Top 10 2023, Supabase security/RLS,
WCAG 2.2 và Google Core Web Vitals. Nguồn tham khảo ở cuối tài liệu.

## 3. Scorecard tổng quan

| Lĩnh vực | Điểm / 10 | Nhận định |
|---|---:|---|
| Product focus | 6 | Core value rõ hơn trước, nhưng nhiều feature vượt xa dữ liệu thực |
| Data truth/provenance | 7 | Phân loại indicative/live tốt; score và freshness còn yếu |
| Frontend/UI | 7 | Responsive, nhất quán, nhiều thông tin; mật độ cao và semantic yếu |
| Accessibility | 5 | Có lang/focus/ARIA cơ bản; touch target, heading và link name còn yếu |
| Backend/API | 6 | Validation tốt; public endpoints thiếu quota/rate-limit và query bounded đúng lớp |
| Database | 6 | RLS/unique constraints đã có; index, retention và remote drift cần proof |
| Security/privacy | 5 | Secret boundary tốt hơn; abuse protection và privacy surface chưa đủ |
| DevOps/release | 4 | CI/workflow có nhưng source local/deployed/remote chưa đồng nhất |
| Observability/SRE | 4 | Có SLO trên giấy; thiếu RUM, dashboard, tracing và alert evidence |
| Testing/QA | 7 | Test local mạnh; E2E phần lớn mock, production acceptance chưa tự động hóa |
| SEO/growth | 3 | SPA metadata chung, chưa có page metadata/SSR/indexable deal strategy |
| Maintainability | 5 | Domain logic được tách; nhiều page/function quá lớn và docs drift |

**Tổng hợp:** 5.5/10 — MVP kỹ thuật có tiềm năng, chưa đạt production maturity.

## 4. Risk register ưu tiên

| ID | Mức | Lĩnh vực | Phát hiện | Hậu quả chính |
|---|---|---|---|---|
| F-01 | P0 | Product/Data | Chưa có provider live/affiliate được phê duyệt và price parity | Không chứng minh được “giá mua được” |
| F-02 | P0 | Release | 57 file thay đổi/untracked; code local, GitHub và runtime không cùng revision | Không rollback hoặc tái tạo production an toàn |
| F-03 | P1 | Data | Dữ liệu UI 16 giờ tuổi trong khi contract muốn scan mỗi giờ | Deal nhanh chóng mất giá trị và niềm tin |
| F-04 | P1 | Scoring | Nhãn “Deal rất ngon” xuất hiện với confidence 25–33% | Tín hiệu mạnh hơn bằng chứng |
| F-05 | P1 | API/Security | `observed-fares` đọc tối đa 5.000 row, score trong request public, không rate-limit | DoS/cost amplification khi traffic/bot tăng |
| F-06 | P1 | Abuse/Privacy | Alert công khai gửi email; limit chủ yếu theo email, không CAPTCHA/IP/device throttle | Email abuse, quota/cost và reputation risk |
| F-07 | P1 | Operations | SLO là mục tiêu nhưng chưa có telemetry/dashboard/on-call proof | Không phát hiện freshness/provider incident sớm |
| F-08 | P1 | Architecture | Tài liệu mô tả API-first, queues, DLQ, event-driven; code thực tế chưa có | Quyết định sai dựa trên kiến trúc tưởng tượng |
| F-09 | P1 | Data source | `fast-flights` là discovery dependency không có SLA/contract trong repo | Breakage, throttling, terms và schema drift |
| F-10 | P2 | Database | Thiếu index rõ ràng cho query indicative + timestamp + departure date | Latency/cost tăng theo raw history |
| F-11 | P2 | QA | Playwright intercept hầu hết API; production truth command không tự chạy khi thiếu cohort | Green suite không chứng minh end-to-end production |
| F-12 | P2 | Accessibility | Nhiều control cao 30–36px, card link có accessible name cực dài | Khó dùng bằng touch/screen reader |
| F-13 | P2 | UX | Card lặp label, trộn Anh–Việt, “FLASH/TRENDING” trên indicative | Cognitive load và dễ hiểu nhầm độ chắc chắn |
| F-14 | P2 | Performance | Deal detail chunk 425KB raw/118KB gzip; chưa có field Web Vitals | Mobile yếu có thể tải/chạy chậm |
| F-15 | P2 | SEO | Một title/description cho SPA, không canonical/OG/JSON-LD theo route | Khó có organic acquisition và share preview đúng |
| F-16 | P2 | Privacy/Legal | Thu email, Telegram ID, analytics nhưng không có Privacy/Terms/data rights UI | Trust/compliance risk trước public launch |
| F-17 | P2 | Maintainability | Deals 578 dòng, Alerts 534, Home 487, Detail 442, API client 559 | Review/test/thay đổi khó và dễ regression |
| F-18 | P3 | Auth config | Local config password tối thiểu 6, CAPTCHA tắt; remote chưa xác minh | Weak baseline nếu production kế thừa |

## 5. Phân tích chi tiết

### F-01 — Core promise chưa có live inventory (P0, BLOCKED)

**Bằng chứng:** tab `Deal live` hiện là 0; production truth trước đây fail closed;
`fast-flights` được phân loại đúng là `indicative`. Google Flights URL hiện tại
là hành động kiểm tra lại, không phải deep link giữ đúng fare/inventory.

**Nguyên nhân gốc:** chưa có hợp đồng/API provider live-price được chấp thuận,
provider metadata và checkout price parity.

**Giải pháp:** chọn 3–5 tuyến launch; tích hợp một provider chính thức; lưu
offer ID, fare family, baggage, timestamp, expiry, deeplink; sample price parity
theo điều khoản provider. Chỉ khi gate đạt mới dùng “đã xác minh”.

**Exit gate:** >=1 offer live có thể mở/mua; 30 mẫu parity; booking-link success
>=99%; stale active row = 0.

### F-02 — Không có reproducible release (P0, VERIFIED)

**Bằng chứng:** worktree có 57 path modified/untracked, diff tracked khoảng
1.144 dòng thêm/500 dòng xóa. Nhánh hiện tại chưa chứa một commit đại diện cho
API/UI/data contract đang chạy.

**Tác động:** không thể xác định chính xác source của production, review thay
đổi, rollback, bisect hay kích hoạt hourly workflow an toàn.

**Giải pháp:** chia change set thành các commit reviewable: truth contract,
observed API/scoring, UI, migrations, workflows, docs. CI phải build/test từ
chính SHA sẽ deploy; runtime ghi `deployed_commit` trong health/evidence.

### F-03 — Freshness loop chưa hoạt động (P1, VERIFIED)

**Bằng chứng browser:** 623 giá nhưng “Quan sát 16 giờ trước”. Workflow trong
workspace đặt cron mỗi giờ, nhưng code chưa được push nên schedule không phải
bằng chứng runtime.

**Giải pháp:** sau khi giải quyết F-02, bật scheduler; ghi `scan_runs`, route
coverage, received/valid/deduped counts; alert nếu last successful scan >2 giờ.
UI nên hiển thị degraded status khi feed vượt SLO, không chỉ tuổi từng card.

### F-04 — Deal Score overstates confidence (P1, VERIFIED)

**Bằng chứng browser:** các card đầu được gắn “Deal rất ngon” trong khi chỉ có
3–4 mẫu và confidence 25–33%. Score hiện cho discount 45%, percentile 20%,
freshness 15%, sample confidence 15%, direct 5%; nhãn chỉ dựa tổng điểm.

**Vấn đề thống kê:** median của 3 mẫu rất nhạy; mẫu có thể không đồng nhất fare
family/baggage/refund/airline/time-of-day. Điểm tổng cao không có nghĩa estimate
đáng tin.

**Giải pháp ưu tiên:** dùng nhãn hai chiều:

- `Mức giảm: mạnh/vừa/nhẹ`;
- `Độ tin cậy: thấp/vừa/cao`;
- confidence thấp phải cap nhãn tối đa “Giá đáng chú ý”, không được “cực nóng”;
- baseline cần segment và minimum effective sample size; lưu version thuật toán;
- backtest precision: bao nhiêu “deal ngon” còn đúng khi kiểm tra sau 15/60 phút.

### F-05 — Public scoring endpoint chưa scale-safe (P1, VERIFIED)

**Bằng chứng code:** mỗi request `observed-fares` dùng service role, lấy tối đa
5.000 rows rồi filter, group, score, sort trong Edge Function. Pagination diễn
ra sau khi tải và score toàn bộ. CORS là `*`; không thấy rate limit tại handler.

**Đối chiếu:** OWASP API4 cảnh báo unrestricted resource consumption.

**Giải pháp:** materialized snapshot/precomputed table theo scan; query page đã
sort từ DB; CDN cache theo query key; hard allowlist filter; request/body limit;
IP/token rate limit ở gateway; timeout và circuit breaker. Service role chỉ giữ
trong backend và endpoint chỉ select các cột cần thiết.

### F-06 — Alert abuse control chưa đủ (P1, VERIFIED/PARTIAL)

**Bằng chứng:** handler có giới hạn 5 alert/email/giờ và confirmation token tốt,
nhưng kẻ xấu có thể xoay email; không thấy CAPTCHA, IP throttle hoặc provider
quota guard trong function. Endpoint công khai và có thể tiêu tốn Resend quota.

**Giải pháp:** Turnstile/hCaptcha; rate limit IP + email hash + device risk;
dedupe pending alert; daily/global sending budget; bounce/complaint suppression;
generic error để giảm enumeration; dashboard cost/anomaly.

### F-07 — SLO chưa có hệ thống đo (P1, VERIFIED)

`OPERATIONS_SLO.md` định nghĩa đúng LCP/INP/CLS, freshness, provider success,
link validity và delivery success nhưng ghi rõ production measurements pending.
Không thấy RUM `web-vitals`, distributed tracing, request ID, dashboard hay
incident evidence trong code.

**Giải pháp:** bắt đầu bằng 8 metric: scan age, provider success, valid ratio,
observed count, qualified live count, endpoint p95/error, redirect success,
alert delivery. Thêm structured log có correlation ID và deployed SHA. Không
log email, Telegram ID, token hoặc signed URL.

### F-08 — Documentation/architecture drift (P1, VERIFIED)

`TECHNICAL_ARCHITECTURE.md` mô tả `/api/v1`, event-driven queues, retry 3 lần,
DLQ, microservice boundaries và folder structure không tồn tại đầy đủ. Trong
thực tế đây là React SPA + Supabase Data API/Edge Functions + GitHub schedules;
frontend vẫn đọc một số bảng trực tiếp.

**Giải pháp:** viết architecture “as-is” trước, thêm target architecture riêng.
Mọi component phải có trạng thái `implemented/planned/external`. Không gọi queue
hoặc DLQ là active nếu chỉ là ý tưởng.

### F-09 — Provider dependency risk (P1, PARTIAL)

`fast-flights` hữu ích để discovery nhưng không phải bằng chứng về partner SLA,
availability hoặc commercial use rights. Worker đã gặp provider-shape failures
ở một số route/window.

**Giải pháp:** provider adapter contract; schema fixture; kill switch; bounded
retry; terms register; source health score; một provider chính thức cho live,
discovery source chỉ dùng indicative.

### F-10 — Data/index/lifecycle (P2, code evidence)

Query chính lọc `link_kind`, `timestamp`, `date` và order timestamp, nhưng
migration chưa thể hiện composite/partial index tương ứng. Unique
`(itinerary_key,timestamp)` không giúp đủ cho read path này. Retention 7 ngày
được đặt ở worker, nên failure của worker có thể đồng thời làm cleanup không chạy.

**Giải pháp:** dùng `EXPLAIN (ANALYZE, BUFFERS)` trên production clone; tạo
partial index sau khi đo; tách retention thành scheduled DB job; quan sát table
size, dead tuples và query p95. Không thêm index mù.

### F-11 — Test pyramid chưa chứng minh production (P2, VERIFIED)

**Điểm mạnh:** 63 Vitest + 3 Node truth tests + 26 Deno tests pass; build pass;
`npm audit --omit=dev` báo 0 vulnerability đã biết.

**Khoảng trống:** Playwright intercept `feed-snapshot`, `observed-fares`, alert
và REST data; do đó chủ yếu kiểm UI contract. `npm run audit:production-truth`
trả exit 2 khi thiếu `LIVE_LAUNCH_ROUTES`, thay vì có một cohort safe mặc định
hoặc CI configuration rõ ràng.

**Giải pháp:** ba suite tách biệt:

1. deterministic contract suite mỗi PR;
2. staging E2E với database/provider sandbox;
3. production read-only acceptance theo deployed SHA.

### F-12/F-13 — Accessibility và information architecture (P2, VERIFIED)

**Điểm tốt:** `<html lang="vi">`, `main`, `nav`, một H1, focus-visible và một
số ARIA label đã có; browser không có console warning/error.

**Điểm yếu:** nhiều button/filter cao 30–36px, bookmark 32px; WCAG enhanced
target khuyến nghị 44×44. Trang dài chỉ có H1, thiếu heading cho filter/stats/list.
Toàn card là một link có accessible name hàng trăm ký tự. Các từ `FLASH`,
`TRENDING`, `SAVING SCORE`, `CONFIDENCE` trộn với tiếng Việt và label bị lặp.

**Giải pháp:** target 44px trên mobile; heading hierarchy; card có CTA link tên
rõ; bookmark là button độc lập; thêm skip link; audit keyboard + VoiceOver;
chuẩn hóa copy tiếng Việt và chỉ dùng “Flash” khi có freshness/expiry phù hợp.

### F-14 — Performance chưa có field evidence (P2, VERIFIED/PARTIAL)

Build thành công nhưng `DealDetailPage` chunk là 425KB raw/118KB gzip,
application entry 256KB raw/83KB gzip và Supabase chunk 194KB raw/51KB gzip.
Không có RUM nên chưa biết p75 thật.

**Giải pháp:** đo bundle composition; lazy-load chart/heavy UI; bỏ dependency
trùng/không dùng; performance budget trong CI; gửi LCP/INP/CLS ẩn danh. Gate theo
Google: p75 LCP <=2.5s, INP <=200ms, CLS <=0.1.

### F-15 — SEO/growth foundation yếu (P2, VERIFIED)

SPA chỉ có title `FlyCheap AI` và một description chung. Không thấy canonical,
Open Graph, per-route metadata, sitemap, robots hay JSON-LD. Deal data động từ
client khó trở thành stable indexable landing pages.

**Giải pháp:** trước tiên tạo indexable route/destination pages có nội dung và
freshness thật; SSR/prerender metadata; canonical/OG/sitemap; chỉ dùng structured
data phù hợp với nội dung nhìn thấy và không khai báo availability giả.

### F-16 — Privacy/legal surface chưa sẵn sàng (P2, VERIFIED)

Sản phẩm lưu email, Telegram ID, preferences, bookmarks và product events nhưng
không thấy Privacy Policy, Terms, retention/user-rights UI. Đây không phải kết
luận vi phạm pháp luật, nhưng là launch blocker về trust và governance.

**Giải pháp:** data inventory; purpose/retention; privacy/terms pages; consent
cho marketing/third-party tracking nếu có; export/delete account; vendor DPA;
không lưu PII trong log. Nhờ tư vấn pháp lý theo thị trường launch.

### F-17/F-18 — Maintainability và auth baseline (P2/P3)

Năm module lớn nhất từ 442–578 dòng. Cần tách state/data hooks, pure selectors,
view sections và API schemas nhưng không tạo microservice sớm. Local Supabase
config đặt password min 6 và CAPTCHA off; remote settings chưa được audit nên
đánh dấu NOT_RUN, không suy diễn production đang yếu.

## 6. Điểm mạnh cần bảo vệ

- Fail-closed live deal contract; không lấy mock/archive thay cho live.
- Approved-host URL validation và internal-secret boundary cho worker/admin.
- Dedupe/normalization và provenance fields.
- Domain logic có unit tests; E2E desktop/mobile hiện ổn định.
- Observed price UI nói rõ chưa cam kết còn chỗ.
- SLO và 90-day plan đã bắt đầu đặt đúng release gates.
- Dependency production hiện không có advisory theo `npm audit` ngày audit.

## 7. Roadmap khắc phục đề xuất

### 0–7 ngày — Release integrity và data truth

1. Freeze feature expansion.
2. Review/chia/commit toàn bộ worktree; CI từ exact SHA; lập deployment manifest.
3. Kích hoạt hourly scan an toàn; freshness alert >2 giờ; retention job độc lập.
4. Sửa score presentation: confidence thấp không được nhãn quá mạnh.
5. Đặt rate limit/cache cho public feed; abuse protection cho setup-alert.
6. Chọn cohort 3–5 tuyến và bắt đầu provider approval.

**Gate:** source/runtime cùng SHA; scan <2 giờ; public feed không full-score
5.000 row/request; confidence semantics được test.

### 8–30 ngày — Production MVP

1. Provider adapter chính thức và checkout parity sampling.
2. Precomputed observed snapshot + index đo bằng query plan.
3. Metrics/dashboard/alerts tối thiểu; production acceptance read-only.
4. Privacy/Terms/data retention và user deletion workflow.
5. Accessibility remediation + keyboard/VoiceOver test.
6. Staging environment dùng migrations/provider sandbox thật.

**Gate:** provider success >=90%; valid ratio >=98%; stale active = 0; alert
duplicate = 0; 30 parity samples; incident owner rõ.

### 31–60 ngày — Conversion và trust

1. Destination/route landing pages có metadata và canonical.
2. Funnel thật: view → verify price → click provider → alert/save → return.
3. Backtest Deal Score; calibration theo route/season/sample confidence.
4. Field Web Vitals và bundle budget.
5. Cohort mở rộng chỉ khi route hiện tại đạt SLO.

### 61–90 ngày — Scale có kiểm soát

Chỉ xem xét AI explanation nâng cao, secondary provider, hotel/visa enrichment
hoặc mobile nếu core funnel có retention/conversion và live provider gate pass.
Không dùng AI để phát minh giá, inventory, baggage, refund hay visa facts.

## 8. Ownership đề xuất

| Workstream | Accountable role | Bằng chứng phải tạo |
|---|---|---|
| Provider/live truth | Product + Data Lead | contract, parity sample, source SLA |
| Scoring/calibration | Data Lead | versioned model card, backtest, confidence calibration |
| API/database | Backend Lead | rate-limit, query plan, retention, load test |
| Security/privacy | Security + Legal | threat model, RLS audit, abuse test, policies |
| Release/SRE | Platform Lead | SHA manifest, dashboard, alerts, rollback drill |
| UX/accessibility | Product Design + FE | task test, keyboard/VoiceOver, WCAG checklist |
| QA | QA Lead | PR/staging/production evidence matrix |

## 9. Quyết định nên chốt ngay

1. Tên sản phẩm trong MVP là “giá quan sát” hay “deal đã xác minh”? Khuyến nghị:
   giá quan sát là default; verified live là tier riêng cho tới khi có provider.
2. Có chấp nhận provider chính thức/affiliate contract không? Nếu không, mô hình
   phải pivot sang price intelligence/editorial discovery, không hứa bookable.
3. Confidence thấp có được gọi “deal rất ngon” không? Khuyến nghị: không.
4. Có ưu tiên public launch hay internal validation 30 ngày? Khuyến nghị:
   limited beta cho tới khi F-01–F-07 có owner và exit gate.

## 10. Verification record ngày 2026-08-20

| Check | Kết quả |
|---|---|
| Typecheck/lint/unit/build | PASS; 63 Vitest + 3 Node tests; build pass |
| Shared Deno tests | PASS; 26/26 |
| Production dependency audit | PASS; 0 known prod vulnerabilities |
| Browser `/deals` | PASS render; 623 observed, 0 live, no console error |
| Freshness | FAIL SLO intent; visible observations 16 hours old |
| Production truth command | NOT_RUN/config-blocked; missing `LIVE_LAUNCH_ROUTES` |
| Exact production SHA | UNVERIFIED; dirty/uncommitted workspace |
| Remote RLS/Auth settings | NOT_RUN |
| Real alert email/Telegram delivery | NOT_RUN |
| Checkout price parity | BLOCKED by live provider contract |
| Field Core Web Vitals | NOT_RUN; no RUM evidence |

## 11. Nguồn tiêu chuẩn

- [OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [Supabase — Securing your data](https://supabase.com/docs/guides/database/secure-data)
- [Supabase — Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase — Understanding API keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Google — Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds)
- [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C — Target Size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced)
- [Google Search — Structured data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)

## 12. Final recommendation

FlyCheap không cần thêm nhiều feature ngay. Sản phẩm cần trở thành một hệ thống
**đáng tin, đo được và deploy tái tạo được**. Thứ tự đúng là:

`reproducible release → hourly freshness → calibrated scoring → official live provider → observability/abuse controls → conversion/SEO → feature expansion`.

Nếu làm đúng thứ tự này, nền tảng hiện có đủ tốt để phát triển tiếp. Nếu bỏ qua
F-01–F-07 và tiếp tục thêm AI/UI, sản phẩm sẽ đẹp hơn nhưng không mạnh hơn ở
điểm quyết định: người dùng có thực sự mua được mức giá mà hệ thống gọi là deal.
