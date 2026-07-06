-- Chạy sau khi deploy Edge Function `send-health-reports`.
-- Cron chạy 01:00 UTC mỗi ngày, tương ứng 08:00 Asia/Ho_Chi_Minh.
create extension if not exists pg_cron;
create extension if not exists pg_net;
create extension if not exists supabase_vault;

-- Thay các placeholder trước khi chạy. Không commit secret thật.
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'report_project_url');
select vault.create_secret('YOUR_PUBLISHABLE_OR_ANON_KEY', 'report_publishable_key');
select vault.create_secret('GENERATE_A_LONG_RANDOM_SECRET', 'report_cron_secret');

select cron.unschedule(jobid) from cron.job where jobname = 'send-health-reports-at-08-vn';
select cron.schedule(
  'send-health-reports-at-08-vn',
  '0 1 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'report_project_url') || '/functions/v1/send-health-reports',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'report_publishable_key'),
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'report_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
