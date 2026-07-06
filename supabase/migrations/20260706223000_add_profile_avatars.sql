alter table public.profiles
  add column if not exists avatar_preset text,
  add column if not exists avatar_path text;

alter table public.profiles
  drop constraint if exists profiles_avatar_preset_format;

alter table public.profiles
  add constraint profiles_avatar_preset_format
  check (avatar_preset is null or avatar_preset ~ '^avatar-(0[1-9]|[1-5][0-9]|60)$');

comment on column public.profiles.avatar_preset is 'Built-in neon avatar identifier';
comment on column public.profiles.avatar_path is 'Private bp-images storage path for a custom avatar';

notify pgrst, 'reload schema';
