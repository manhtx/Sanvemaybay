# FlyCheap AI — Master Remediation and Implementation Plan

**Ngày lập:** 2026-08-20  
**Thời hạn:** 12 tuần  
**Nguồn sự thật:** `MASTER_PRODUCT_SYSTEM_DATA_AUDIT_2026-08-20.md`  
**Trạng thái:** Approved; Phase 0–3 implementation in progress  
**Mục tiêu:** Đưa FlyCheap từ observed-price MVP 5.5/10 thành một public beta
có dữ liệu đáng tin, release tái tạo được, API chống abuse, vận hành đo được và
có con đường rõ ràng tới verified-live deal.

## 1. Nguyên tắc điều hành

1. **Data truth trước feature breadth.** Không mở rộng AI, hotel, visa, native
   mobile hoặc 88-route live coverage trước khi core gates đạt.
2. **Một source commit cho một runtime.** Build, migration, functions, frontend
   và workflow production phải truy ngược về cùng Git SHA.
3. **Indicative và live không trộn semantics.** Giá quan sát dùng để discovery;
   chỉ offer có evidence hiện thời và approved provider mới được gọi live.
4. **Confidence điều tiết claim.** Discount cao nhưng confidence thấp không được
   gắn nhãn chắc chắn quá mức.
5. **Precompute trước scale.** Không tải hàng nghìn raw rows để score lại trên
   mỗi public request.
6. **SLO quyết định tốc độ release.** Khi error budget cạn, dừng feature và sửa
   reliability.
7. **Evidence before completion.** Local pass, staging pass và production pass
   là ba bằng chứng độc lập.
8. **Không microservice hóa sớm.** Giữ React + Supabase + background workflow,
   nhưng làm rõ boundary, idempotency và observability.

Kế hoạch áp dụng tư duy release reproducible của Google SRE, continuous delivery
của DORA, production/shared-responsibility checklist của Supabase, OWASP API
Security và WCAG/Core Web Vitals.

## 2. North-star và Definition of Success

### North-star product outcome

Người dùng tìm thấy một cơ hội giá có nguồn, hiểu rõ độ mới và confidence, mở
provider kiểm tra lại thành công, sau đó quay lại hoặc đặt alert vì tin hệ thống.

### 12-week success gates

| Dimension | Target |
|---|---:|
| Source/runtime traceability | 100% deployment có Git SHA + manifest |
| Observed feed age | p95 <= 2 giờ; không hiển thị healthy nếu quá SLO |
| Provider request success | >= 90%/24 giờ trên launch cohort |
| Observation validity | >= 98% accepted/provider options |
| Active live stale rate | 0% |
| Booking/deeplink validity | >= 99% approved samples |
| Price parity | >= 30 samples, báo cáo route/provider rõ ràng |
| Public API | p95 <= 500ms cached; error <1%; bounded database work |
| Alert delivery | >= 95%; duplicate successful delivery = 0 |
| Deal Score | claim-confidence violations = 0; model version lưu đầy đủ |
| Accessibility | keyboard path pass; mobile target >=44px cho primary controls |
| Core Web Vitals | p75 LCP <=2.5s, INP <=200ms, CLS <=0.1 |
| Production proof | read-only acceptance chạy theo deployed SHA |

### GO / HOLD / PIVOT

- **GO public beta:** P0/P1 đóng, live provider gate pass, SLO có 7 ngày bằng
  chứng, privacy surface sẵn sàng.
- **HOLD:** users có giá trị nhưng freshness, parity hoặc alert reliability
  chưa đạt; giữ cohort và sửa.
- **PIVOT:** provider terms không cho phép, parity kém hoặc inventory live liên
  tục bằng 0; chuyển thành price-intelligence/editorial discovery, không hứa
  bookable live deal.

## 3. Program structure

| Workstream | Scope | Audit IDs | Priority |
|---|---|---|---|
| WS-01 Release Integrity | Git, CI/CD, manifest, rollback | F-02 | P0 |
| WS-02 Data Freshness | scheduler, scan health, retention | F-03, F-09 | P1 |
| WS-03 Scoring Integrity | baseline, confidence, labels, backtest | F-04 | P1 |
| WS-04 API/Data Scale | precompute, pagination, indexes, cache | F-05, F-10 | P1 |
| WS-05 Security & Abuse | rate limit, CAPTCHA, secrets, RLS/auth audit | F-05, F-06, F-18 | P1 |
| WS-06 Observability/SRE | SLIs, dashboard, alerting, incidents | F-07 | P1 |
| WS-07 Live Provider | contract, adapter, parity, redirect | F-01, F-09 | P0 external |
| WS-08 QA & Environments | contract/staging/production suites | F-11 | P2 |
| WS-09 UX & Accessibility | semantics, copy, keyboard/touch | F-12, F-13 | P2 |
| WS-10 Performance & SEO | RUM, bundle, metadata, landing pages | F-14, F-15 | P2 |
| WS-11 Privacy & Governance | inventory, policies, user rights | F-16 | P2 |
| WS-12 Maintainability/Docs | module boundaries, as-is architecture | F-08, F-17 | P2 |

## 4. Critical path

```text
WS-01 Reproducible release
    ├── WS-02 Hourly freshness ──┬── WS-03 Calibrated scoring
    │                            └── WS-04 Precomputed public feed
    ├── WS-05 Abuse/security
    └── WS-06 Production telemetry
                                  ↓
                         WS-07 Live provider cohort
                                  ↓
                         WS-08 Production proof
                                  ↓
              WS-09 UX + WS-10 Performance/SEO + WS-11 Privacy
                                  ↓
                             Public beta gate
```

WS-01 là dependency bắt buộc. WS-07 provider approval có thể chạy song song về
business/legal, nhưng code adapter chỉ merge khi release pipeline và contract
schema ổn định.

## 5. Phase plan

## Phase 0 — Governance freeze and baseline (Ngày 1)

### Mục tiêu

Ngăn scope trôi và lưu baseline trước khi sửa.

### Actions

- Tạm dừng feature expansion ngoài 12 workstream.
- Chốt launch cohort 3–5 tuyến, đề xuất: SGN–DAD, SGN–HAN, SGN–BKK,
  HAN–BKK, SGN–SIN; xác nhận lại theo provider coverage.
- Lưu baseline: 623 observed, 0 live, feed age, bundle sizes, tests, API latency,
  database counts và current function versions.
- Lập decision log cho provider, scoring claim, retention, privacy và beta.
- Mọi ticket phải có audit ID, owner, risk, test và rollback.

### Gate P0.0

- Baseline evidence có timestamp UTC.
- Cohort, owner và change freeze được duyệt.
- Không có feature ngoài scope được merge.

## Phase 1 — Reproducible release (Ngày 1–3)

### WS-01 deliverables

1. Kiểm kê 57 changed/untracked paths; tách unrelated/user-owned changes.
2. Chia commit theo boundary:
   - migrations/truth contract;
   - shared data/scoring logic;
   - observed API;
   - frontend UX;
   - workflows/operations;
   - tests/docs.
3. CI required checks:
   - typecheck, lint, unit, Deno, function check, build, E2E;
   - migration lint/dry-run;
   - `git diff --check`;
   - secret scan và dependency audit.
4. Tạo deployment manifest gồm Git SHA, migration list, function versions,
   frontend build ID, workflow revision, environment và timestamp.
5. Chỉ deploy artifact được build trong CI từ SHA đã review.
6. Rollback command/runbook phải trỏ tới prior known-good SHA; data migration
   cần forward-fix hoặc reviewed reversible path.

### Tests

- Rebuild hai lần từ clean checkout và so manifest/artifact inventory.
- Staging deploy từ CI; production dry-run không mutate.
- Rollback rehearsal trên staging.

### Gate P0.1

- Clean/reviewable branch; required checks pass.
- Runtime health trả deployed SHA.
- Frontend, Edge Functions và schema evidence cùng release ID.
- Có known-good rollback target.

## Phase 2 — Fresh data and truthful scoring (Ngày 3–7)

### WS-02 Data freshness

- Kích hoạt hourly scheduler chỉ sau P0.1.
- Worker ghi scan run: provider, route/window, started/finished, received,
  normalized, rejected by reason, deduped, persisted, duration và error class.
- Retry có exponential backoff/jitter; không retry validation errors.
- Route-level circuit breaker; provider kill switch độc lập.
- Retention 7 ngày chuyển sang scheduled DB maintenance độc lập với ingest.
- Feed status:
  - healthy: scan age <=2 giờ;
  - degraded: >2 giờ;
  - unavailable: >6 giờ hoặc provider/schema failure nghiêm trọng.

### WS-03 Scoring integrity

- Tách `discount_strength` khỏi `confidence_level`.
- Minimum comparable set mặc định >=5; 3–4 mẫu chỉ exploratory.
- Confidence <50% cap nhãn tối đa `Giá đáng chú ý`.
- Nhãn “Deal ngon/rất ngon/cực nóng” yêu cầu cả score và confidence gate.
- Baseline segment theo route, date window, trip length, stops, cabin/fare family
  khi provider có; không gộp trường unknown như tương đương chắc chắn.
- Lưu `algorithm_version`, baseline count, dispersion, age và reason codes.
- Tạo model card: assumptions, exclusions, bias, failure modes, changelog.

### Tests

- Boundary tests mọi score/confidence combination.
- Property tests: tăng price không làm discount tốt hơn; dữ liệu stale không
  tăng confidence; low sample không tạo strong claim.
- Backtest historical và shadow run 7 ngày trước khi đổi label production.

### Gate P1.1

- Ba scan liên tiếp đúng lịch; p95 age <=2 giờ.
- 0 card có strong claim khi confidence dưới gate.
- Scoring algorithm versioned và explainable.
- UI thể hiện rõ observed/degraded/live.

## Phase 3 — Scale-safe API, database and abuse controls (Tuần 2)

### WS-04 API/data architecture

- Tạo precomputed `observed_fare_snapshots` hoặc equivalent read model.
- Scoring chạy khi ingest/snapshot refresh, không chạy lại 5.000 rows/request.
- DB làm filter/sort/keyset pagination; public response chỉ lấy page cần thiết.
- Cache public page theo normalized query; ETag/cache-control và bounded TTL.
- Body/schema validation; page size hard cap; reject unknown/expensive filters.
- Dùng `EXPLAIN (ANALYZE, BUFFERS)` trên staging-like data trước khi thêm index.
- Đề xuất partial composite index chỉ khi query plan chứng minh lợi ích:
  `link_kind='indicative'`, departure date, observation time/sort keys.
- Track p50/p95/p99 latency, rows scanned/returned và cache hit.

### WS-05 Security/abuse

- Gateway/IP rate limit cho public feed, redirect, alert setup/manage.
- CAPTCHA cho alert creation và auth abuse surfaces.
- Alert throttle theo IP + normalized email hash + global provider budget.
- Dedupe pending alert và resend confirmation cooldown.
- CORS allowlist production origin cho mutating endpoints; public read endpoint
  có documented policy.
- Audit remote RLS, grants, function auth, password policy, CAPTCHA, SMTP,
  secrets và key rotation; không suy diễn từ local config.
- Chuyển legacy service-role/anon key sang publishable/secret key strategy khi
  compatible; secret key chỉ backend.
- Threat model theo OWASP API: resource consumption, function authorization,
  SSRF/redirect, unsafe provider data và endpoint inventory.

### Load/security tests

- k6 staging test normal/peak/bot burst; không load-test production tùy tiện.
- Verify 429, Retry-After, budget cutoff và recovery.
- Fuzz malformed JSON/filter/page/callback URL.
- RLS negative tests bằng anon, user A, user B và service role.

### Gate P1.2

- Cached API p95 <=500ms ở agreed staging load.
- Work per request bounded; không full-score raw dataset.
- Abuse tests không gửi email vượt budget.
- Remote RLS/auth audit không có P0/P1 mở.

## Phase 4 — Observability and operational control (Tuần 2–3)

### WS-06 telemetry

Tạo dashboard tối thiểu:

| SLI | Dimension | Alert |
|---|---|---|
| Scan success/age | provider, route, worker SHA | age >2h warning; >6h critical |
| Valid/reject ratio | provider, schema version, reason | valid <98% |
| Observed/live count | route, link kind | live zero on enabled cohort |
| API latency/error | endpoint, release, cache status | p95/error budget burn |
| Redirect success | provider/host | <99% sampled |
| Alert delivery/dedup | channel/provider | success <95% or duplicate >0 |
| Database query | query name, rows, p95 | regression threshold |
| Web Vitals | route/device/release | p75 threshold miss |

- Structured log có correlation ID, job/run ID, release SHA; PII scrubber.
- Health endpoint/status document không lộ secrets.
- Burn-rate alerts ưu tiên user impact, không alert mọi log error.
- Incident runbook: stale feed, provider schema drift, redirect violation,
  notification storm, secret exposure, database degradation.
- Thực hiện một game day staging: provider timeout và stale feed.

### Gate P1.3

- Dashboard hiển thị dữ liệu thật theo current release.
- Alert thử nghiệm đến đúng owner.
- Stale/provider failure tự chuyển UI degraded và không publish invalid live row.
- Game-day evidence và follow-up actions được lưu.

## Phase 5 — Official live-provider cohort (Tuần 2–5, external critical path)

### WS-07 business and technical plan

1. Shortlist provider/affiliate dựa trên:
   - live-price/deeplink availability;
   - permitted caching/display/notification;
   - Vietnam route coverage;
   - rate limits/quota/cost;
   - sandbox/contract/support;
   - attribution and affiliate requirements.
2. Legal/terms review; không scrape để giả lập approved access.
3. Adapter contract chuẩn:
   - provider + offer ID;
   - itinerary/segments/times;
   - total price/currency/passengers;
   - cabin/fare family/baggage/refund when supplied;
   - observed/valid-until;
   - booking/affiliate deeplink and approved host;
   - raw provenance hash, adapter version.
4. Provider adapter chạy shadow; không publish ngay.
5. Price parity sample 30 cases theo route/date/device; ghi exact observation và
   provider result, không lưu payment/passport data.
6. Enable live feed từng route bằng feature flag; kill switch theo provider.

### Gate P0.2 — Live truth

- Contract/terms permit intended use.
- >=1 qualified live deal, sau đó >=10 trước beta alert.
- 30 parity samples reviewed; discrepancy policy rõ.
- Redirect success >=99%; stale active = 0.
- Indicative row không thể được promotion thành live chỉ bằng analyzer.

Nếu tuần 5 vẫn không có approved provider, kích hoạt PIVOT decision thay vì tiếp
tục giữ UX “deal đã xác minh” như một lời hứa sắp có.

## Phase 6 — QA architecture and staging proof (Tuần 3–5)

### WS-08 test layers

1. **PR deterministic:** unit/domain, schema/contract, security negatives,
   component/E2E mocked; nhanh và không phụ thuộc provider.
2. **Staging integration:** migrations thật, Edge Functions thật, provider
   sandbox/recorded official fixtures, auth/RLS, email sandbox.
3. **Production read-only:** feed truth, schema/version, freshness, safe redirect
   host validation, no mutation/no personal data.

- `audit:production-truth` có explicit committed cohort config hoặc CI secret;
  thiếu config phải báo BLOCKED rõ, không bị hiểu là product failure.
- Migration test from last production schema snapshot.
- Contract tests provider schema drift và unknown fields.
- Chaos/error cases: timeout, 429, malformed response, partial DB failure,
  email provider failure, stale snapshot.

### Gate P2.1

- Một release candidate pass cả PR, staging và production read-only evidence.
- Không dùng mock result để ghi production PASS.
- Test report chứa release SHA, environment, timestamp và expiry.

## Phase 7 — User trust, accessibility and privacy (Tuần 4–7)

### WS-09 UX/accessibility

- Chuẩn hóa ngôn ngữ tiếng Việt; tooltip giải thích discount/confidence/sample.
- Bỏ duplicate labels; `FLASH` chỉ dùng khi freshness/expiry contract đạt.
- Card có heading, summary và CTA tên rõ; không dùng toàn bộ card text làm
  accessible link name.
- Primary touch controls >=44×44px trên mobile.
- Heading hierarchy, skip link, focus order, status `aria-live` hợp lý.
- Keyboard-only và VoiceOver test các flow: browse/filter/card/alert/auth.
- User comprehension test 10–20 người: phân biệt observed/live/confidence.

### WS-11 privacy/governance

- Data inventory: email, Telegram ID, auth ID, preference, bookmark, events,
  logs, provider data; owner/purpose/retention/access cho từng loại.
- Privacy Policy, Terms, cookie/tracking disclosure và contact route.
- Account data export/delete; unsubscribe và delete semantics rõ.
- Log redaction test; vendor register/DPA review.
- Analytics chỉ thu event whitelist cần thiết; retention và deletion job.
- Legal review theo thị trường launch; tài liệu không thay thế luật sư.

### Gate P2.2

- 0 critical accessibility issue trong core flow.
- >=80% test users hiểu đúng observed vs live và confidence.
- Privacy/Terms/data rights accessible trước khi nhập PII.
- Delete/export/unsubscribe được test end-to-end.

## Phase 8 — Performance, SEO and maintainability (Tuần 6–10)

### WS-10 performance

- Cài privacy-minimal `web-vitals` RUM theo route/device/release.
- Bundle analysis cho DealDetail 425KB raw và entry/Supabase chunks.
- Lazy-load chart/heavy modules; remove unused/duplicate component packages sau
  bundle proof, không tối ưu theo cảm giác.
- CI budget cho initial JS/CSS và route chunks; regression cần approval.
- Image/font/cache/preload audit; test low-end mobile/network.

### WS-10 SEO

- Per-route title, description, canonical và Open Graph.
- `robots.txt`, sitemap và crawlable destination/route landing pages.
- Prerender/SSR decision ADR dựa trên hosting, freshness và maintenance cost.
- JSON-LD chỉ cho entity/content thực sự hiển thị; không khai availability giả.
- Search Console/Rich Results validation sau deploy.

### WS-12 maintainability/docs

- Viết `ARCHITECTURE_AS_IS.md`; target architecture là tài liệu riêng.
- Tách page lớn bằng responsibility, không theo arbitrary line count:
  data hook, state reducer, pure selectors, sections và boundary components.
- Tách API client theo observed/live/user/alerts/history; typed response schemas.
- ADR cho provider, scoring, snapshots, rate limits và SSR/prerender.
- Documentation drift check trong PR template/DoD.

### Gate P2.3

- Field Web Vitals đạt target trong 7 ngày representative hoặc có approved
  exception/remediation.
- Core pages có metadata/canonical và crawl verification.
- Refactor giữ toàn bộ contract/E2E pass, không thay đổi product semantics.
- As-is docs khớp deployed system.

## Phase 9 — Limited beta and decision (Tuần 10–12)

- Mời 20–100 users theo launch airports, không public blast.
- Theo dõi funnel:
  `feed view → deal detail → verify/provider click → alert/save → repeat visit`.
- Không gọi provider click là booking hoặc saving.
- Review theo route/provider/confidence, không chỉ aggregate.
- Weekly scorecard: reliability, data truth, conversion, trust, cost.
- Cuối tuần 12 đưa quyết định GO/HOLD/PIVOT bằng evidence.

### Gate Public Beta

Tất cả điều kiện sau phải đúng:

- F-01–F-09 đóng hoặc có approved external exception không làm sai truth claim.
- 7 ngày SLO evidence; no open P0/P1 incident.
- Production SHA/rollback/evidence hoàn chỉnh.
- Live-provider gate pass hoặc product officially pivot sang indicative-only.
- Privacy/accessibility/abuse controls hoạt động.
- Người dùng hiểu đúng claim và core funnel có tín hiệu giá trị.

## 6. Detailed backlog and acceptance matrix

| Item | Deliverable | Acceptance | Depends | Effort |
|---|---|---|---|---:|
| R1 | Clean, structured commits | CI green; no mixed unrelated files | none | M |
| R2 | Deployment manifest/SHA | health/runtime matches artifact | R1 | M |
| R3 | Hourly scheduler | 3 consecutive successful runs | R2 | S |
| R4 | Scan telemetry/retention | reason counts + independent cleanup | R3 | M |
| R5 | Confidence-aware score | 0 low-confidence strong claims | R1 | M |
| R6 | Precomputed feed | bounded query; keyset page | R4,R5 | L |
| R7 | Query/index proof | staging explain + load target | R6 | M |
| R8 | Rate limiting | 429/budget/recovery tests pass | R2 | M |
| R9 | Alert abuse controls | CAPTCHA + multi-key throttle | R8 | M |
| R10 | Remote security audit | RLS/grants/auth/secrets evidence | R2 | M |
| R11 | SLI dashboard | all core indicators populated | R3,R6 | L |
| R12 | Incident automation | test alerts + runbooks + game day | R11 | M |
| R13 | Provider decision | approved terms or documented pivot | external | L/external |
| R14 | Provider adapter | contract/shadow tests pass | R13,R2 | L |
| R15 | Parity/redirect proof | 30 samples + >=99% valid links | R14 | M |
| R16 | Staging E2E | real migrations/functions/sandbox | R2,R14 | L |
| R17 | Production read-only gate | evidence per deployed SHA | R16 | M |
| R18 | Accessibility remediation | keyboard/VoiceOver/mobile pass | R5 | M |
| R19 | Privacy/user rights | policy + export/delete tests | R9 | L |
| R20 | RUM/performance | p75 CWV + CI budget | R2 | M |
| R21 | SEO foundation | metadata/canonical/sitemap | R2 | M |
| R22 | As-is architecture/refactor | docs match; tests unchanged | R6 | L |
| R23 | Limited beta | 7-day reliability + user evidence | R15,R17-R21 | L |

Effort: S <=1 ngày, M 2–4 ngày, L 5–10 ngày; là engineering estimate, không
bao gồm provider approval/legal waiting time.

## 7. RACI

Nếu một người đang đảm nhiệm nhiều vai trò, vẫn giữ các trách nhiệm tách biệt
trong checklist để tránh tự duyệt bằng cảm giác.

| Work | Accountable | Responsible | Consulted | Informed |
|---|---|---|---|---|
| Product claims/cohort | Product Owner | Product/Data | Legal, Engineering | QA/SRE |
| Release/CI/CD | Engineering Lead | Platform | Backend, QA | Product |
| Scoring/model card | Data Lead | Data/Backend | Product, QA | SRE |
| API/database | Backend Lead | Backend | Security, Data | Product |
| Security/privacy | Security Owner | Backend/Platform | Legal, Product | QA |
| Provider integration | Product Owner | Backend/Data | Legal, Finance | SRE/QA |
| SLO/incident | SRE Owner | Platform | Backend, Product | All |
| UX/accessibility | Product Design | Frontend | QA, users | Product |
| Test evidence | QA Lead | QA + feature owner | SRE/Security | Product |

## 8. Change and release policy

### Pull request contract

Mỗi PR phải ghi:

- audit/backlog ID;
- requirement/doc link;
- affected modules/data;
- migration and compatibility impact;
- security/privacy impact;
- tests run and not run;
- rollout/feature flag;
- rollback;
- production evidence required after merge.

### Release train

- Daily staging deploy khi CI green.
- Production tối đa 2 release window/tuần trong remediation period.
- Canary/feature flag cho provider, scoring label và public feed architecture.
- Dừng release nếu có P0, error-budget burn hoặc unknown schema drift.
- Hotfix phải có follow-up test/document trong 24 giờ.

### Completion states

- `CODE_COMPLETE`: implementation + local tests.
- `STAGING_VERIFIED`: migrations/functions/UI thật trên staging.
- `PRODUCTION_VERIFIED`: current SHA + read-only/runtime evidence.
- `BLOCKED_EXTERNAL`: provider/legal/credential decision được ghi rõ.
- Không dùng một trạng thái thay thế trạng thái khác.

## 9. Test master plan

| Layer | Required coverage |
|---|---|
| Unit/domain | scoring, confidence, dedupe, freshness, alert matching |
| Property/boundary | monotonic score invariants, malformed/unknown provider data |
| Database | RLS negatives, constraints, migrations, retention, query plans |
| API contract | auth, schema, pagination, rate limit, cache, errors |
| Integration | worker→DB→snapshot→UI; alert→confirm→delivery→unsubscribe |
| E2E | desktop/mobile/keyboard; healthy/degraded/empty/live |
| Load | cached/uncached API, alert abuse burst, DB hot query |
| Security | OWASP API threat cases, redirect allowlist, secret/log scanning |
| Accessibility | automated scan + keyboard + VoiceOver manual |
| Production | read-only truth/freshness/version/link-host sampling |

## 10. Risk controls during implementation

| Risk | Control |
|---|---|
| Dirty work lost/mixed | inventory, preserve unrelated changes, scoped commits |
| Data migration harms production | staging clone, dry-run, backups, forward-fix |
| New score changes user trust | shadow mode, versioning, feature flag, backtest |
| Provider quota/cost spike | budget, route cohort, circuit breaker, kill switch |
| Rate limit blocks real users | observe-only first, tune, Retry-After, support path |
| Retention deletes evidence | separate raw evidence policy from public freshness |
| Telemetry leaks PII/secrets | allowlist fields, redaction tests, short retention |
| Refactor creates regressions | after core gates, contract tests, small PRs |
| SEO publishes false availability | structured data review tied to visible truth |

## 11. Weekly execution cadence

- **Monday:** SLO/risk review, approve week scope and production windows.
- **Daily:** blocker/incident/metric delta; không họp status dài.
- **Before merge:** peer review + automated gates.
- **After deploy:** 30–60 minute acceptance + evidence record.
- **Friday:** demo from production/staging evidence, update risk register and DoD.
- **Every incident:** blameless postmortem with root cause and preventive action.

## 12. First seven-day execution board

### Day 1

- Approve this plan, cohort and feature freeze.
- Inventory dirty work; establish release branch/change groups.
- Capture baseline evidence.

### Day 2

- Complete structured commits and CI required checks.
- Add release manifest/build ID design.
- Start provider application/terms track.

### Day 3

- Deploy staging from exact SHA; rehearse rollback.
- Enable hourly scan in staging and validate scan telemetry.

### Day 4

- Implement confidence-aware label contract and tests.
- Design precomputed observed-feed schema/query.

### Day 5

- Activate safe production scheduler from reviewed SHA.
- Add freshness alerts and independent retention job.

### Day 6

- Implement gateway/API budgets and alert abuse controls in staging.
- Run query plans and first bounded load test.

### Day 7

- Review 72-hour scan evidence, scoring shadow report and security results.
- Decide whether Gate P1.1 is pass/hold; do not auto-advance.

## 13. Explicit non-goals until beta gate

- 88-route live expansion.
- Native mobile app.
- AI-generated price/inventory facts.
- Auto-booking/payment/passport handling.
- Hotel/visa/weather facts without authoritative sources.
- Opaque ad/affiliate scripts.
- Complex self-transfer/hidden-city recommendations.
- Microservices, Redis or queue platform without measured need.

## 14. Approval requested

Approval of this plan authorizes focused implementation of Phase 0–2 only:
release integrity, freshness and scoring truth. Production push/deploy, provider
registration/paid contract, CAPTCHA/vendor setup, personal test data, security
key rotation and destructive database operations remain separate actions that
must satisfy their own safety/authorization gates.

## 15. Reference standards

- [Google SRE — Release Engineering](https://sre.google/sre-book/release-engineering/)
- [Google SRE — Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)
- [DORA — Continuous Delivery](https://dora.dev/capabilities/continuous-delivery/)
- [Supabase — Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Supabase — Shared Responsibility Model](https://supabase.com/docs/guides/deployment/shared-responsibility-model)
- [OWASP API Security Top 10 2023](https://owasp.org/API-Security/editions/2023/en/0x11-t10/)
- [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Google — Core Web Vitals](https://web.dev/articles/defining-core-web-vitals-thresholds)

## 16. Final recommendation

Triển khai theo phase gate, không triển khai đồng loạt 18 finding. Thứ tự tối ưu:

`F-02 → F-03/F-04 → F-05/F-06/F-10 → F-07 → F-01/F-09 → F-11 → F-12–F-18`.

Đây là đường ngắn nhất để biến FlyCheap thành sản phẩm đáng tin: trước tiên làm
cho source có thể phát hành lại, sau đó làm dữ liệu mới và claim đúng, tiếp theo
làm hệ thống chịu tải/được quan sát, rồi mới chứng minh giá live và tối ưu tăng
trưởng. Bất kỳ thứ tự nào đưa SEO, AI hoặc UI expansion lên trước critical path
đều tạo nhiều bề mặt hơn nhưng không giải quyết rủi ro cốt lõi.
