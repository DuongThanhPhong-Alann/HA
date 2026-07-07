alter table public.profiles
  add column if not exists preferred_music text not null default 'salt_and_bamboo',
  add column if not exists language text not null default 'vi';

alter table public.profiles drop constraint if exists profiles_preferred_music_check;
alter table public.profiles add constraint profiles_preferred_music_check
  check (preferred_music in ('salt_and_bamboo', 'porcelain_sunlight'));

alter table public.profiles drop constraint if exists profiles_language_check;
alter table public.profiles add constraint profiles_language_check
  check (language in ('vi', 'en'));
