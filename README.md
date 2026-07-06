# Blood Pressure Tracker

Ứng dụng Next.js theo dõi huyết áp, dùng Supabase Auth, Postgres, Storage và RLS.

## Chạy local

1. Tạo Supabase project và chạy `supabase/schema.sql` trong SQL Editor.
2. Sao chép `.env.example` thành `.env.local`, điền URL và anon key.
3. Chạy `npm install` rồi `npm run dev`.

Trong Supabase Auth > URL Configuration, thêm `http://localhost:3000/reset-password` vào Redirect URLs. Bucket ảnh riêng tư và policy được tạo bởi schema.
Theo dõi HA

## Báo cáo email tuần và tháng

1. Chạy lại `supabase/schema.sql` để thêm tùy chọn báo cáo và bảng lịch sử gửi mail.
2. Tạo tài khoản Resend, xác minh domain gửi mail và tạo API key.
3. Cấu hình secret cho Edge Function:

```bash
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set REPORT_EMAIL_FROM="Blood Pressure Tracker <reports@your-domain.com>"
supabase secrets set REPORT_CRON_SECRET=mot-chuoi-ngau-nhien-rat-dai
```

4. Deploy function:

```bash
supabase functions deploy send-health-reports --project-ref zooyuuzvnpdksvqctnra
```

5. Thay placeholder trong `supabase/report-schedule.sql`, bảo đảm `report_cron_secret` trùng với secret ở bước 3, rồi chạy file trong SQL Editor.

Cron chạy hằng ngày lúc 01:00 UTC (08:00 giờ Việt Nam). Function chỉ gửi báo cáo tuần vào thứ Hai và báo cáo tháng vào ngày 1, đồng thời dùng bảng `report_deliveries` để chống gửi trùng.

## Deploy web lên Vercel

File `.env` chỉ dùng trên máy local và đã được `.gitignore` loại khỏi Git. `.env.example` chỉ giữ tên biến, không chứa giá trị thật.

1. Push source code lên GitHub, GitLab hoặc Bitbucket.
2. Trong Vercel chọn **New Project**, import repository và giữ framework preset là Next.js.
3. Trong **Settings → Environment Variables**, thêm cho Production và Preview:

```txt
NEXT_PUBLIC_SUPABASE_URL=https://zooyuuzvnpdksvqctnra.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-or-publishable-key-cua-project>
```

4. Deploy hoặc Redeploy sau khi thay đổi biến môi trường.
5. Trong Supabase **Authentication → URL Configuration**:
   - Site URL: `https://ten-du-an.vercel.app`
   - Redirect URLs: `https://ten-du-an.vercel.app/**`

Các secret `RESEND_API_KEY`, `REPORT_EMAIL_FROM` và `REPORT_CRON_SECRET` thuộc Supabase Edge Function, phải cấu hình bằng `supabase secrets set`; không đặt chúng trong biến `NEXT_PUBLIC_*` trên Vercel.
