-- Wave schema (from PRD section 9)
-- Enums
create type task_priority as enum ('low', 'medium', 'high');
create type session_type  as enum ('focus', 'short_break', 'long_break');

-- Profiles (mirrors auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  email       text,
  created_at  timestamptz not null default now()
);

-- User settings
create table public.user_settings (
  user_id                 uuid primary key references auth.users(id) on delete cascade,
  focus_minutes           int  not null default 25 check (focus_minutes between 1 and 180),
  short_break_minutes     int  not null default 5  check (short_break_minutes between 1 and 60),
  long_break_minutes      int  not null default 15 check (long_break_minutes between 1 and 120),
  long_break_every        int  not null default 4  check (long_break_every between 2 and 10),
  reminders_enabled       boolean not null default true,
  reminder_lead_minutes   int[] not null default '{60}',
  theme                   text not null default 'system',
  updated_at              timestamptz not null default now()
);

-- Categories
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  color      text not null default '#6366f1',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Tasks
create table public.tasks (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  category_id          uuid references public.categories(id) on delete set null,
  title                text not null check (char_length(title) between 1 and 120),
  description          text,
  priority             task_priority not null default 'medium',
  due_at               timestamptz,
  is_completed         boolean not null default false,
  completed_at         timestamptz,
  estimated_pomodoros  int check (estimated_pomodoros is null or estimated_pomodoros > 0),
  recurrence_rule      text,                       -- P2 (e.g., 'FREQ=WEEKLY')
  reminder_sent_at     timestamptz[] default '{}', -- P2 push tracking
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index tasks_user_status_due_idx on public.tasks (user_id, is_completed, due_at);
create index tasks_user_category_idx   on public.tasks (user_id, category_id);
create index tasks_search_idx on public.tasks
  using gin (to_tsvector('english', title || ' ' || coalesce(description, '')));

-- Subtasks
create table public.subtasks (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.tasks(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 120),
  is_completed boolean not null default false,
  position     int not null default 0,
  created_at   timestamptz not null default now()
);

-- Pomodoro sessions
create table public.pomodoro_sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  task_id          uuid references public.tasks(id) on delete cascade,
  type             session_type not null default 'focus',
  started_at       timestamptz not null,
  ended_at         timestamptz,
  planned_seconds  int not null,
  actual_seconds   int,
  completed        boolean not null default false
);

create index pomodoro_task_idx      on public.pomodoro_sessions (task_id);
create index pomodoro_user_time_idx on public.pomodoro_sessions (user_id, started_at desc);

-- Web push subscriptions (P2)
create table public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

-- updated_at trigger
create or replace function public.set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

-- Auto-create profile + settings on signup
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (new.id,
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'avatar_url',
          new.email);
  insert into public.user_settings (user_id) values (new.id);
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security: own rows only, on every table
do $$
declare t text;
begin
  foreach t in array array['categories','tasks','subtasks','pomodoro_sessions','push_subscriptions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own %1$s: select" on public.%1$I for select using (auth.uid() = user_id)', t);
    execute format('create policy "own %1$s: insert" on public.%1$I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy "own %1$s: update" on public.%1$I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy "own %1$s: delete" on public.%1$I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy "own profile: select" on public.profiles for select using (auth.uid() = id);
create policy "own profile: update" on public.profiles for update using (auth.uid() = id);
alter table public.user_settings enable row level security;
create policy "own settings: select" on public.user_settings for select using (auth.uid() = user_id);
create policy "own settings: update" on public.user_settings for update using (auth.uid() = user_id);
-- Extra per-user preference not in the original PRD schema
alter table public.user_settings add column if not exists sound boolean not null default true;

-- Backfill profile/settings rows for users created before the trigger existed
insert into public.profiles (id, full_name, avatar_url, email)
  select id, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url', email from auth.users
  on conflict (id) do nothing;
insert into public.user_settings (user_id) select id from auth.users on conflict (user_id) do nothing;
-- Kanban "In progress" column
alter table public.tasks add column if not exists in_progress boolean not null default false;

-- Realtime cross-device sync
alter publication supabase_realtime add table public.tasks, public.subtasks, public.categories, public.pomodoro_sessions;
