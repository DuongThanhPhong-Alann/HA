alter table public.profiles
  add column if not exists weekly_report_enabled boolean not null default true,
  add column if not exists monthly_report_enabled boolean not null default true,
  add column if not exists report_timezone text not null default 'Asia/Ho_Chi_Minh';

comment on column public.profiles.weekly_report_enabled is 'Whether weekly health reports are enabled';
comment on column public.profiles.monthly_report_enabled is 'Whether monthly health reports are enabled';
comment on column public.profiles.report_timezone is 'IANA timezone used to schedule health reports';

notify pgrst, 'reload schema';
