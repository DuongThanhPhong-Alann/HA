create extension if not exists pgcrypto;

create table if not exists public.report_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null default 'manual',
  report_kind text,
  period_start date not null,
  period_end date not null,
  recipient text not null,
  provider_message_id text,
  status text not null default 'pending',
  error_message text,
  record_count integer not null default 0,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

alter table public.report_deliveries
  add column if not exists report_kind text,
  add column if not exists record_count integer not null default 0;

alter table public.report_deliveries drop constraint if exists report_deliveries_report_type_check;
alter table public.report_deliveries
  add constraint report_deliveries_report_type_check
  check (report_type in ('weekly','monthly','manual'));

alter table public.report_deliveries drop constraint if exists report_deliveries_status_check;
alter table public.report_deliveries
  add constraint report_deliveries_status_check
  check (status in ('pending','sent','failed'));

alter table public.report_deliveries drop constraint if exists report_deliveries_user_id_report_type_period_start_key;
create unique index if not exists report_deliveries_scheduled_unique
  on public.report_deliveries (user_id, report_type, period_start)
  where report_type in ('weekly','monthly');

alter table public.report_deliveries enable row level security;
drop policy if exists "Users can view own report deliveries" on public.report_deliveries;
create policy "Users can view own report deliveries" on public.report_deliveries
  for select using (auth.uid() = user_id);

comment on column public.report_deliveries.report_kind is 'Manual report range option such as custom, week, month, last-7-days, last-30-days';
comment on column public.report_deliveries.record_count is 'Number of readings included in the delivered report';

notify pgrst, 'reload schema';
