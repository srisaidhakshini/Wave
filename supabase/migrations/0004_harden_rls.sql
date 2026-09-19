-- Hardening pass: enforce ownership of *referenced* rows, not just the row's own user_id.
-- Without this, user A could insert a subtask/session/task pointing at user B's task/category id.

-- profiles / user_settings: allow the owner to create their row (client upsert fallback)
create policy "own profile: insert" on public.profiles
  for insert with check (auth.uid() = id);
create policy "own settings: insert" on public.user_settings
  for insert with check (auth.uid() = user_id);

-- tasks: category must be null or owned by the same user
drop policy "own tasks: insert" on public.tasks;
drop policy "own tasks: update" on public.tasks;
create policy "own tasks: insert" on public.tasks
  for insert with check (
    auth.uid() = user_id
    and (category_id is null or exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()))
  );
create policy "own tasks: update" on public.tasks
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (category_id is null or exists (select 1 from public.categories c where c.id = category_id and c.user_id = auth.uid()))
  );

-- subtasks: parent task must be owned by the same user
drop policy "own subtasks: insert" on public.subtasks;
drop policy "own subtasks: update" on public.subtasks;
create policy "own subtasks: insert" on public.subtasks
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
  );
create policy "own subtasks: update" on public.subtasks
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid())
  );

-- focus sessions: task must be null or owned by the same user
drop policy "own pomodoro_sessions: insert" on public.pomodoro_sessions;
drop policy "own pomodoro_sessions: update" on public.pomodoro_sessions;
create policy "own pomodoro_sessions: insert" on public.pomodoro_sessions
  for insert with check (
    auth.uid() = user_id
    and (task_id is null or exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()))
  );
create policy "own pomodoro_sessions: update" on public.pomodoro_sessions
  for update using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (task_id is null or exists (select 1 from public.tasks t where t.id = task_id and t.user_id = auth.uid()))
  );

-- server-side limit matching the UI (a client can bypass the textarea maxLength)
alter table public.tasks add constraint tasks_description_len check (description is null or char_length(description) <= 2000);
