# Blood Pressure Tracker

Ứng dụng Next.js theo dõi huyết áp, dùng Supabase Auth, Postgres, Storage và RLS.

## Chạy local

1. Tạo Supabase project và chạy `supabase/schema.sql` trong SQL Editor.
2. Sao chép `.env.example` thành `.env.local`, điền URL và anon key.
3. Chạy `npm install` rồi `npm run dev`.

Trong Supabase Auth > URL Configuration, thêm `http://localhost:3000/reset-password` vào Redirect URLs. Bucket ảnh riêng tư và policy được tạo bởi schema.
Theo dõi HA
