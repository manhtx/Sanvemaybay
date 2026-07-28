# FlyCheap AI

Ứng dụng phát hiện giá vé thấp dựa trên dữ liệu quan sát lịch sử, hiển thị
deal và gửi cảnh báo qua email hoặc Telegram.

## Kiến trúc

- React + Vite: giao diện và truy vấn dữ liệu deal đã công bố.
- Supabase Postgres: lưu quan sát giá, deal, alert và lịch sử gửi.
- `flight-scanner`: lấy dữ liệu nhà cung cấp và lưu vào `flights`.
- `analyze-price`: so sánh lịch sử và công bố deal đủ điều kiện.
- `alert-processor`: ghép deal với alert và gửi thông báo.
- `setup-alert`: kiểm tra yêu cầu, giới hạn tần suất và gửi email xác nhận.
- `manage-alert`: xác nhận hoặc hủy đăng ký bằng liên kết có chữ ký.

Frontend không gọi SerpApi hoặc Resend trực tiếp. Không đặt secret trong biến
có tiền tố `VITE_`.

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
```

## Kiểm tra chất lượng

```bash
npm run check
```

Lệnh này chạy typecheck, lint, unit test và production build.

## Cấu hình Supabase

1. Đăng nhập và liên kết project:

```bash
npx supabase login
npm run supabase:link -- --project-ref YOUR_PROJECT_REF
npm run supabase:push
```

2. Deploy các Edge Functions:
   - `flight-scanner`
   - `analyze-price`
   - `setup-alert`
   - `alert-processor`
   - `manage-alert`

```bash
npm run supabase:functions
```

3. Cấu hình secrets phía server:

```bash
npx supabase secrets set \
  SERPAPI_KEY=... \
  RESEND_API_KEY=... \
  ALERT_FROM_EMAIL='FlyCheap Alerts <alerts@example.com>' \
  TELEGRAM_BOT_TOKEN=... \
  PUBLIC_SITE_URL='https://your-domain.example' \
  UNSUBSCRIBE_SECRET='a-long-random-secret' \
  INTERNAL_FUNCTION_SECRET='a-separate-long-random-secret'
```

`SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` được Supabase cung cấp cho Edge
Functions khi deploy.

Telegram cần Chat ID dạng số, không phải username. Người nhận phải bắt đầu hội
thoại với bot trước khi bot có thể gửi cảnh báo.

## Lịch chạy

Không hard-code project URL hoặc token trong migration. Tạo ba Cron job trong
Supabase Dashboard:

1. `flight-scanner` mỗi 12 giờ.
2. `analyze-price` sau scanner.
3. `alert-processor` sau analyzer.

Trong giai đoạn đầu, nên chạy lệch nhau 10 phút để mỗi bước hoàn thành trước
khi bước kế tiếp bắt đầu. Ba request nội bộ phải gửi header
`x-internal-secret` trùng với `INTERNAL_FUNCTION_SECRET`. Không dùng secret này
trong frontend hoặc biến môi trường có tiền tố `VITE_`.

Chỉ bật Cron sau khi đã cấu hình `SERPAPI_KEY`; nếu chưa có key thật, scanner
sẽ chủ động trả lỗi thay vì tạo dữ liệu giả.

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

Mỗi cửa sổ ngày tương ứng một request tới nhà cung cấp dữ liệu. Có thể giảm
`tracked_routes.departure_offsets_days` nếu cần kiểm soát quota SerpApi.

## Deploy Vercel và push GitHub

Đảm bảo mọi thay đổi đã được commit, remote `origin` trỏ đúng repository và
đã đăng nhập Vercel. Sau đó chạy:

```bash
npm run deploy
```

Lệnh deploy dừng nếu working tree còn thay đổi, chạy toàn bộ kiểm tra, push
branch hiện tại lên GitHub rồi mới deploy production lên Vercel. Điều này bảo
đảm GitHub và bản production dùng cùng một commit.

Trên Vercel, cấu hình `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`. Không
đưa service-role key, SerpApi key, Resend key hoặc Telegram bot token lên
frontend/Vercel.

## Bảo mật

Nếu repository từng chứa key thật, thêm `.gitignore` không đủ để thu hồi key.
Phải rotate key tại SerpApi/Resend/Supabase và cân nhắc xóa secret khỏi lịch sử
Git trước khi công khai repository.

Thiết kế ban đầu của giao diện được phát triển từ
[Figma FlyCheap](https://www.figma.com/design/gdsfQe8OKL887a6TGf6aFa/FlyCheap).
