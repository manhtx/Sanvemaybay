# FlyCheap AI

Ứng dụng phát hiện giá vé thấp dựa trên dữ liệu quan sát lịch sử, hiển thị
deal và gửi cảnh báo qua email hoặc Telegram.

## Kiến trúc

- React + Vite: giao diện và truy vấn dữ liệu deal đã công bố.
- Supabase Postgres: lưu quan sát giá, deal, alert và lịch sử gửi.
- `scripts/fast-flights-worker.py`: quét candidate discovery từ `fast-flights`,
  chuẩn hóa và ingest vào `flights` với trạng thái `indicative`; dữ liệu này
  không được công bố như deal live hoặc affiliate.
- `analyze-price`: so sánh lịch sử và công bố deal đủ điều kiện.
- `alert-processor`: ghép deal với alert và gửi thông báo.
- `setup-alert`: kiểm tra yêu cầu, giới hạn tần suất và gửi email xác nhận.
- `manage-alert`: xác nhận hoặc hủy đăng ký bằng liên kết có chữ ký.

Frontend không gọi provider bay hoặc Resend trực tiếp. Không đặt server secret
trong biến có tiền tố `VITE_`.

## Chạy local

```bash
npm ci
cp .env.example .env
npm run dev
```

Frontend cần:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_TURNSTILE_SITE_KEY=your-turnstile-site-key
VITE_PUBLIC_SITE_URL=http://localhost:5173
```

## Kiểm tra chất lượng

```bash
npm run check
```

Lệnh này chạy typecheck, lint, unit test và production build.

UI/E2E test chạy riêng bằng Playwright:

```bash
npx playwright install chromium
npm run test:e2e
```

`npm run test:all` chạy unit test, Deno shared tests và UI/E2E test.

CI chạy cùng các gate này; Supabase integration smoke được giữ riêng vì cần
`VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` của môi trường kiểm thử.

Kiểm tra type cho Supabase Edge Functions:

```bash
npm run check:functions
```

Test service authentication:

```bash
npm run test:functions
```

Lệnh này chạy toàn bộ Deno tests dưới `supabase/functions/_shared`.

Read-only Supabase integration smoke test:

```bash
npm run test:integration
```

Production refresh is scheduled by `.github/workflows/fast-flights-pipeline.yml`.
The worker calls `fast-flights → direct ingest → analyze-price → observed-fare
read model → feed snapshot → retention cleanup`
using server-only GitHub Actions secrets. It never creates mock deals. The
snapshot quality gate rejects sparse, expired or non-HTTPS rows.

For the production Supabase migration/function deployment path, see
[`docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md`](docs/PRODUCTION_DEPLOYMENT_RUNBOOK.md).

## Cấu hình Supabase

1. Đăng nhập và liên kết project:

```bash
npx supabase login
npm run supabase:link -- --project-ref YOUR_PROJECT_REF
npm run supabase:push
```

2. Deploy các Edge Functions (bao gồm `feed-snapshot` và `flight-search`):
   - `flight-ingest`
   - `analyze-price`
   - `ai-explainer`
   - `setup-alert`
   - `alert-processor`
   - `manage-alert`
   - `feed-snapshot`
   - `deal-redirect`
   - `flight-search`
   - `observed-fares`
   - `refresh-observed-fares`
   - `track-event`
   - `retention-cleanup`

```bash
npm run supabase:functions
```

3. Cấu hình secrets phía server:

```bash
npx supabase secrets set \
  RESEND_API_KEY=... \
  ALERT_FROM_EMAIL='FlyCheap Alerts <alerts@example.com>' \
  TELEGRAM_BOT_TOKEN=... \
  PUBLIC_SITE_URL='https://your-domain.example' \
  UNSUBSCRIBE_SECRET='a-long-random-secret' \
  INTERNAL_FUNCTION_SECRET='a-separate-long-random-secret' \
  RATE_LIMIT_SALT='at-least-16-random-characters' \
  TURNSTILE_SECRET_KEY='server-only-turnstile-secret' \
  TURNSTILE_ALLOWED_HOSTNAMES='your-domain.example'
```

`SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` được Supabase cung cấp cho Edge
Functions khi deploy.

Telegram cần Chat ID dạng số, không phải username. Người nhận phải bắt đầu hội
thoại với bot trước khi bot có thể gửi cảnh báo.

## Lịch chạy

Không hard-code project URL hoặc token trong migration. GitHub Actions chạy
`fast-flights-pipeline.yml` theo lịch mỗi giờ; workflow thực hiện scan, ingest,
analyze, refresh snapshot và retention theo thứ tự. Các function nội bộ dùng header
`x-internal-secret` trùng với `INTERNAL_FUNCTION_SECRET`; không dùng secret này
trong frontend hoặc biến môi trường có tiền tố `VITE_`.

Chỉ bật pipeline sau khi đã cấu hình các provider credentials được phê duyệt;
nếu thiếu credential, worker phải dừng hoặc giữ source-only, không tạo dữ liệu
giả và không tự gắn affiliate URL.

## Quy tắc dữ liệu

- Giá tham chiếu được tính từ quan sát thật, không tạo bằng hệ số giả định.
- Mỗi tuyến mặc định quét bốn cửa sổ khởi hành: 14, 30, 60 và 90 ngày.
- Khi chưa đủ lịch sử, deal được so với trung vị của ít nhất năm lựa chọn thật
  trong cùng tuyến, cùng ngày đi và ngày về.
- Khi nhà cung cấp trả ít hơn năm lựa chọn, cần tối thiểu ba thời điểm quét
  trong 30 ngày trước khi công bố deal.
- Ngưỡng deal mặc định là thấp hơn 10% và có thể chỉnh riêng cho từng tuyến
  bằng `tracked_routes.deal_threshold_percent`.
- Trường nhà cung cấp không trả về phải để trống hoặc ghi rõ chưa xác định.
- Mỗi notification được chống gửi trùng theo alert, deal và channel.
- Alert chỉ hoạt động sau khi người nhận xác nhận email trong 24 giờ.
- Không có tuyến mẫu: thêm các tuyến thật cần theo dõi vào `tracked_routes`.

Mỗi cửa sổ ngày tương ứng một request tới nhà cung cấp dữ liệu. Điều chỉnh
`FAST_FLIGHTS_WINDOW_LIMIT` và `FAST_FLIGHTS_ROUTE_LIMIT` trong workflow để
kiểm soát tải và thời gian scan.

## Deploy Vercel và push GitHub

Đảm bảo mọi thay đổi đã được commit, remote `origin` trỏ đúng repository và
đã đăng nhập Vercel. Sau đó chạy:

```bash
npm run deploy
```

Lệnh deploy dừng nếu working tree còn thay đổi, chạy toàn bộ kiểm tra, push
branch hiện tại lên GitHub rồi mới deploy production lên Vercel. Điều này bảo
đảm GitHub và bản production dùng cùng một commit.

Trên Vercel, cấu hình `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_TURNSTILE_SITE_KEY` và `VITE_PUBLIC_SITE_URL`. Không
đưa service-role key, provider token, Resend key hoặc Telegram bot token lên
frontend/Vercel.

## Bảo mật

Nếu repository từng chứa key thật, thêm `.gitignore` không đủ để thu hồi key.
Phải rotate key tại provider/Resend/Supabase và cân nhắc xóa secret khỏi lịch sử
Git trước khi công khai repository.

Thiết kế ban đầu của giao diện được phát triển từ
[Figma FlyCheap](https://www.figma.com/design/gdsfQe8OKL887a6TGf6aFa/FlyCheap).
