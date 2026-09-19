-- Extra per-user preference not in the original PRD schema
alter table public.user_settings add column if not exists sound boolean not null default true;

-- Backfill profile/settings rows for users created before the trigger existed
insert into public.profiles (id, full_name, avatar_url, email)
  select id, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url', email from auth.users
  on conflict (id) do nothing;
insert into public.user_settings (user_id) select id from auth.users on conflict (user_id) do nothing;
