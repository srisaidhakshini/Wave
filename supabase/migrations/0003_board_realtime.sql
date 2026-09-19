-- Kanban "In progress" column
alter table public.tasks add column if not exists in_progress boolean not null default false;

-- Realtime cross-device sync
alter publication supabase_realtime add table public.tasks, public.subtasks, public.categories, public.pomodoro_sessions;
