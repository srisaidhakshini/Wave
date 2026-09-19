# Product Requirements Document (PRD)

## Student Task Management Application ("FocusBoard" – working title)

| | |
|---|---|
| **Document type** | PRD (Full Stack Developer Assignment) |
| **Status** | Draft v1.0 |
| **Stack** | Next.js (App Router) · Supabase (Postgres, Auth, Realtime, Edge Functions, Storage) · Tailwind CSS |
| **Auth** | Google OAuth via Supabase Auth |

---

## 1. Overview

### 1.1 Purpose
A full-stack web application that helps students plan, track, and complete academic and personal tasks. Beyond basic CRUD, it includes a **per-task Pomodoro timer** and **deadline notifications** so students can both organise work and actually focus on it.

### 1.2 Problem Statement
Students juggle assignments, exams, projects, and personal commitments across chats, notebooks, and memory. Deadlines get missed and there is no link between *planning* a task and *doing* it. This app connects the two: tasks are planned with priorities and deadlines, executed with focus sessions, and reviewed through simple productivity stats.

### 1.3 Goals
1. Satisfy every assignment requirement (create, edit, delete, complete, view pending/completed, filter/organise, database storage, responsive UI).
2. Deliver a polished, secure, deployable product.
3. Differentiate with Pomodoro tracking per task, deadline reminders, and a lightweight dashboard.

### 1.4 Non-Goals (v1)
- Team or shared workspaces, task assignment to other users.
- Native mobile apps (a PWA covers mobile).
- Full LMS integrations (Canvas, Moodle).
- Paid plans or billing.

---

## 2. Target Users & Personas

**Primary: College/university student (18–25)**
- Manages 4–6 courses plus personal tasks.
- Uses a laptop for study and a phone for quick checks.
- Wants quick task entry, clear deadlines, and to stay focused.

**Secondary: High-school student / self-learner** with the same needs at smaller scale.

---

## 3. Assignment Requirement Traceability

| # | Assignment requirement | Where covered |
|---|---|---|
| 1 | Create tasks | FR-T1 |
| 2 | Edit tasks | FR-T2 |
| 3 | Delete tasks | FR-T3 |
| 4 | Mark tasks completed | FR-T4 |
| 5 | View pending and completed tasks | FR-V1, FR-V2 |
| 6 | Filter or organise tasks | FR-F1 – FR-F4 |
| 7 | Store data in a database | Section 8 (Supabase Postgres) |
| 8 | Clean and responsive UI | Section 10 |
| – | Frontend framework | Next.js + React |
| – | Backend API / server-side logic | Route Handlers / Server Actions + Supabase Edge Functions |
| – | Database | Supabase (PostgreSQL) |

---

## 4. Scope & Prioritisation

### P0 – Must have (core + chosen features)
- Google sign-in / sign-out
- Task CRUD, complete/uncomplete
- Pending / Completed views
- Priority, category, due date/time
- Search, filter, sort
- Per-task Pomodoro timer with session logging
- Deadline reminder notifications (browser notifications)
- Responsive UI, Row Level Security

### P1 – Should have
- Subtasks / checklist with progress
- Dashboard with basic stats (tasks completed, focus time)
- Dark mode
- Calendar / "Today · This week · Upcoming" views
- Configurable Pomodoro durations and reminder lead times
- Undo on delete, toasts, loading skeletons, empty states

### P2 – Nice to have
- Web Push notifications when the tab is closed
- Recurring tasks
- Kanban board with drag and drop
- Realtime cross-device sync
- PWA installability
- Keyboard shortcuts
- Attachments/notes (Supabase Storage)
- Export to CSV; Google Calendar sync
- AI task breakdown helper

---

## 5. User Stories

**Authentication**
- As a student, I can sign in with my Google account so I don't manage another password.
- As a student, I only ever see my own tasks.

**Tasks**
- As a student, I can create a task with title, description, category, priority, and due date/time.
- As a student, I can edit or delete a task, and undo an accidental delete.
- As a student, I can mark a task complete (and reopen it).
- As a student, I can switch between pending and completed tasks.
- As a student, I can search, filter, and sort tasks to find what matters now.

**Focus**
- As a student, I can start a Pomodoro timer on a specific task.
- As a student, I can see how many focus sessions and how much time I've spent on each task.
- As a student, I get an alert when a focus or break session ends.

**Notifications**
- As a student, I get a desktop notification before a task's deadline.
- As a student, I can choose how early I'm reminded and turn reminders off.

**Insights**
- As a student, I can see my weekly completed tasks, focus time, and streak.

---

## 6. Functional Requirements

### 6.1 Authentication (FR-A)
| ID | Requirement | Priority |
|---|---|---|
| FR-A1 | Sign in with Google via Supabase Auth (OAuth). | P0 |
| FR-A2 | Unauthenticated users are redirected to the login page; authenticated users to the dashboard. | P0 |
| FR-A3 | Sign out clears the session. | P0 |
| FR-A4 | A `profiles` row is auto-created on first login (name, avatar, email from Google). | P0 |

### 6.2 Task Management (FR-T)
| ID | Requirement | Priority |
|---|---|---|
| FR-T1 | Create a task: title (required, ≤120 chars), description (optional), category, priority (low/medium/high, default medium), due date + time (optional), estimated pomodoros (optional). | P0 |
| FR-T2 | Edit any field of an existing task. | P0 |
| FR-T3 | Delete a task with confirmation or an undo toast (soft delete window of ~5s in UI). | P0 |
| FR-T4 | Toggle completion; store `completed_at`. Completing a task stops any running timer on it. | P0 |
| FR-T5 | Subtasks: add, toggle, delete; show progress (e.g., 2/5). | P1 |
| FR-T6 | Recurring tasks (daily/weekly); completing one generates the next occurrence. | P2 |

### 6.3 Views & Organisation (FR-V / FR-F)
| ID | Requirement | Priority |
|---|---|---|
| FR-V1 | **Pending** view: incomplete tasks. | P0 |
| FR-V2 | **Completed** view: completed tasks with completion date. | P0 |
| FR-V3 | Quick views: Today, This Week, Upcoming, Overdue. | P1 |
| FR-V4 | Calendar view of tasks by due date. | P1 |
| FR-V5 | Kanban board (To Do / In Progress / Done) with drag and drop. | P2 |
| FR-F1 | Filter by status, priority, category, and due-date range. | P0 |
| FR-F2 | Full-text search over title and description. | P0 |
| FR-F3 | Sort by due date, priority, created date, title. | P0 |
| FR-F4 | Filters persist in the URL query string so views are shareable/refresh-safe. | P1 |

### 6.4 Categories (FR-C)
| ID | Requirement | Priority |
|---|---|---|
| FR-C1 | Create, rename, recolour, and delete categories (e.g., Maths, Physics, Personal). | P0 |
| FR-C2 | Deleting a category leaves its tasks uncategorised (does not delete tasks). | P0 |

### 6.5 Pomodoro Timer (FR-P)
| ID | Requirement | Priority |
|---|---|---|
| FR-P1 | Each task has a "Start focus" action that opens a timer bound to that task. | P0 |
| FR-P2 | Default cycle: 25 min focus, 5 min short break, 15 min long break after 4 focus sessions. | P0 |
| FR-P3 | Controls: start, pause, resume, reset, skip break. | P0 |
| FR-P4 | Timer accuracy uses timestamps (end time = start + duration), not just `setInterval` ticks, so it stays correct when the tab is throttled or in the background. | P0 |
| FR-P5 | On completion of a focus session, a `pomodoro_sessions` row is saved (task, started_at, ended_at, duration, type, completed flag). | P0 |
| FR-P6 | Show per-task stats on the task card: sessions completed, total focus minutes, and progress vs. estimate. | P0 |
| FR-P7 | Sound and browser notification when a session ends. | P0 |
| FR-P8 | Only one timer can run at a time; starting another asks to switch. | P0 |
| FR-P9 | Timer state survives page refresh (persisted in localStorage and/or a `running_timer` record). | P1 |
| FR-P10 | Configurable durations and long-break interval in Settings. | P1 |
| FR-P11 | Tab title shows remaining time (e.g., "24:13 · Physics report"). | P1 |

### 6.6 Deadline Notifications (FR-N)
| ID | Requirement | Priority |
|---|---|---|
| FR-N1 | Ask for notification permission via an in-app prompt at a sensible moment (e.g., when the user first sets a due date), not on page load. | P0 |
| FR-N2 | While the app is open, schedule browser notifications (Notification API) for tasks approaching their deadline based on the user's lead time (default 1 hour before). | P0 |
| FR-N3 | Notification content: task title, time remaining; clicking it opens the task. | P0 |
| FR-N4 | Do not notify for completed tasks; re-schedule when a due date is edited. | P0 |
| FR-N5 | Settings: choose lead times (e.g., 1 day, 1 hour, 15 min), or disable. | P1 |
| FR-N6 | Web Push via a service worker so reminders arrive even when the tab is closed, sent by a scheduled Supabase Edge Function. | P2 |
| FR-N7 | Optional email reminders. | P2 |
| FR-N8 | Graceful fallback: if permission is denied, show in-app banners/toasts for due-soon and overdue tasks. | P0 |

### 6.7 Dashboard & Insights (FR-D)
| ID | Requirement | Priority |
|---|---|---|
| FR-D1 | Summary cards: pending, due today, overdue, completed this week. | P1 |
| FR-D2 | Chart: tasks completed per day (last 7/30 days). | P1 |
| FR-D3 | Chart: focus minutes per day and by category. | P1 |
| FR-D4 | Streak: consecutive days with at least one completed task or focus session. | P2 |

### 6.8 Settings (FR-S)
- Theme (light/dark/system), Pomodoro durations, reminder lead times, notification toggle, sign out. (P1)

---

## 7. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Security** | Row Level Security on every table; users can only read/write their own rows. No service-role key in the client. Validate all inputs server-side (Zod). HTTPS only. |
| **Performance** | Initial load under 2.5 s on a typical connection (LCP). Task list interactions feel instant using optimistic updates. Paginate or virtualise beyond ~200 tasks. |
| **Responsiveness** | Works from 360 px mobile widths to wide desktops. |
| **Accessibility** | WCAG 2.1 AA targets: keyboard navigation, focus states, sufficient contrast, ARIA labels, no colour-only meaning (priority also has text/icon). |
| **Reliability** | Timer correctness under tab throttling; errors surface as friendly toasts, never silent failures. |
| **Privacy** | Store only data required from Google (name, email, avatar). Provide a "delete my account and data" option (P1). |
| **Browser support** | Latest Chrome, Edge, Firefox, Safari. Notification/Push limitations documented for Safari/iOS. |
| **Maintainability** | TypeScript throughout, linting/formatting, generated Supabase types, clear README. |

---

## 8. Technical Architecture

### 8.1 Stack
| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), React, TypeScript |
| Styling/UI | Tailwind CSS, shadcn/ui, lucide-react icons |
| State/data | TanStack Query (caching, optimistic updates) + React Hook Form + Zod |
| Backend | Next.js Route Handlers / Server Actions; Supabase Edge Functions for scheduled jobs |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth with Google provider (`@supabase/ssr` for cookie sessions) |
| Realtime | Supabase Realtime (P2) |
| Storage | Supabase Storage (P2 attachments) |
| Charts | Recharts |
| Drag & drop | dnd-kit (P2) |
| Notifications | Notification API + Service Worker; Web Push (`web-push`) (P2) |
| Hosting | Vercel (app) + Supabase (backend) |

### 8.2 High-Level Architecture

```
Browser (Next.js / React / PWA)
   │  ├─ UI, timer logic, Notification API, Service Worker
   │  └─ Supabase JS client (user session, RLS-protected)
   ▼
Next.js server (Vercel)
   │  ├─ Auth callback / middleware (session refresh, route protection)
   │  └─ Route Handlers / Server Actions (validation + business logic)
   ▼
Supabase
   ├─ Auth (Google OAuth)
   ├─ Postgres (tables + RLS + indexes)
   ├─ Realtime (optional)
   └─ Edge Function + pg_cron (send due-soon push/email reminders)
```

### 8.3 Auth Flow
1. User clicks "Continue with Google" → `supabase.auth.signInWithOAuth({ provider: 'google' })`.
2. Google consent → redirect to `/auth/callback` → code exchanged for a session (cookies).
3. Middleware refreshes the session and protects `/app/*` routes.
4. Database trigger creates the `profiles` and `user_settings` rows on first sign-up.

**Setup notes:** create OAuth credentials in Google Cloud Console (Web application), add the Supabase callback URL as an authorised redirect URI, and add the site URL and redirect URLs in the Supabase Auth settings (local and production).

---

## 9. Data Model

### 9.1 Entity Overview
- `profiles` 1—1 `auth.users`
- `user_settings` 1—1 user
- `categories` N—1 user
- `tasks` N—1 user, N—1 category (nullable)
- `subtasks` N—1 task
- `pomodoro_sessions` N—1 task, N—1 user
- `push_subscriptions` N—1 user (P2)

### 9.2 SQL Schema (reference)

```sql
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
```

### 9.3 Row Level Security (apply to every table)

```sql
alter table public.tasks enable row level security;

create policy "own tasks: select" on public.tasks
  for select using (auth.uid() = user_id);
create policy "own tasks: insert" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "own tasks: update" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own tasks: delete" on public.tasks
  for delete using (auth.uid() = user_id);

-- Repeat the same four policies for: categories, subtasks,
-- pomodoro_sessions, push_subscriptions.
-- profiles and user_settings: select/update only where id (or user_id) = auth.uid().
```

---

## 10. API Design

Most reads/writes can go directly through the Supabase client (RLS-protected). Route Handlers/Server Actions are used where server-side validation or secrets are needed.

| Method & Path | Purpose | Notes |
|---|---|---|
| `GET /api/tasks` | List tasks | Query: `status`, `priority`, `category`, `q`, `from`, `to`, `sort`, `order`, `page` |
| `POST /api/tasks` | Create task | Zod-validated body |
| `GET /api/tasks/:id` | Task detail | Includes subtasks + pomodoro totals |
| `PATCH /api/tasks/:id` | Edit task | Partial update |
| `PATCH /api/tasks/:id/complete` | Toggle completion | Sets/clears `completed_at` |
| `DELETE /api/tasks/:id` | Delete task | |
| `GET/POST/PATCH/DELETE /api/categories` | Manage categories | |
| `POST /api/tasks/:id/subtasks` etc. | Subtask CRUD | P1 |
| `POST /api/pomodoro` | Save a finished session | |
| `GET /api/stats?range=7d` | Dashboard aggregates | Uses SQL views/RPC |
| `GET/PATCH /api/settings` | User settings | |
| `POST /api/push/subscribe` | Save push subscription | P2 |

**Validation example (Zod):**
```ts
export const taskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  categoryId: z.string().uuid().nullable().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  estimatedPomodoros: z.number().int().positive().max(50).optional(),
});
```

**Error format:** `{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }` with correct HTTP status codes (400, 401, 404, 500).

---

## 11. Feature Design Details

### 11.1 Pomodoro Timer
- **State machine:** `idle → focus → (short_break | long_break) → idle`, with `paused` as a sub-state.
- **Accuracy:** store `endsAt = Date.now() + remainingMs` when running. Each tick computes `remaining = endsAt - Date.now()`, so background throttling doesn't drift the timer. On pause, store `remainingMs`.
- **Persistence:** save `{ taskId, type, endsAt | remainingMs, status }` in localStorage so refresh/reopen resumes correctly.
- **On completion:** play a sound, show a notification, insert a `pomodoro_sessions` row, and auto-suggest the next phase (break or focus).
- **Interrupted sessions:** if the user resets early, log `completed = false` with `actual_seconds` (optional) or discard, per a setting.
- **Global mini-timer** in the header/bottom bar so it's visible while browsing other tasks.

### 11.2 Deadline Notifications
**Phase 1: In-app + Notification API (P0)**
- A client-side scheduler runs while the app is open. For each pending task with `due_at`, compute `notifyAt = due_at - leadTime`.
- Use a single interval (e.g., every 30–60 s) that checks tasks against the current time, plus `setTimeout` for near-term ones. Track already-notified `(taskId, leadTime)` pairs in localStorage to avoid duplicates.
- Show via `new Notification(title, { body, tag, data: { taskId } })`; the click handler focuses the window and routes to the task.
- Fallback toast/banner if permission is denied or unsupported.

**Phase 2: Web Push (P2)**
- Register a service worker; subscribe with `pushManager.subscribe` using a VAPID public key; store the subscription in `push_subscriptions`.
- A Supabase Edge Function on a `pg_cron` schedule (every 5 min) queries tasks due within each user's lead window whose reminder hasn't been sent, sends pushes via `web-push`, and records `reminder_sent_at`.
- Service worker `push` event displays the notification and `notificationclick` opens the task.

**Known limitation:** browser notifications require a supported browser and granted permission; Safari/iOS Web Push requires the PWA to be installed to the home screen.

### 11.3 Filtering, Search & Sorting
- Filter bar with status tabs (All / Pending / Completed), priority chips, category dropdown, due-date presets (Today, This week, Overdue, custom range).
- Debounced search input (300 ms) using Postgres full-text search or `ilike`.
- Sort: due date (soonest, default for pending), priority, created, title; completed view defaults to most recently completed.
- State reflected in URL search params.

### 11.4 Dashboard
- Cards: Pending · Due today · Overdue · Done this week.
- Charts: tasks completed per day; focus minutes per day; time by category (donut).
- Powered by SQL views/RPC (e.g., `daily_focus_minutes`, `daily_completed_tasks`) to keep the client light.

---

## 12. UI / UX Requirements

### 12.1 Pages
| Route | Description |
|---|---|
| `/login` | Landing + "Continue with Google" |
| `/app` (dashboard) | Summary cards, upcoming deadlines, quick add, charts |
| `/app/tasks` | Main task list with tabs (Pending/Completed), filters, search, sort |
| `/app/calendar` | Calendar view (P1) |
| `/app/board` | Kanban (P2) |
| `/app/focus/[taskId]` or modal | Pomodoro timer screen |
| `/app/settings` | Pomodoro, notifications, theme, account |

### 12.2 Key Components
- `TaskCard` (title, priority badge, category tag, due date with overdue styling, subtask progress, pomodoro count, actions)
- `TaskFormDialog` (create/edit)
- `FilterBar`, `SearchInput`, `SortMenu`
- `PomodoroTimer` + `MiniTimer`
- `NotificationPermissionPrompt`
- `StatsCards`, `Charts`
- `EmptyState`, `Skeletons`, `Toaster`

### 12.3 Design Principles
- Clean, minimal, generous whitespace; one accent colour plus semantic priority colours (with text labels).
- Mobile-first layout: bottom navigation on mobile, sidebar on desktop; forms as full-screen sheets on small screens.
- Fast task entry: floating "+" button, `N` shortcut, inline quick-add field.
- Clear feedback: toasts for success/error, undo for delete, optimistic updates.
- Dark mode via CSS variables/Tailwind `dark:`.

---

## 13. Suggested Project Structure

```
/
├─ app/
│  ├─ (auth)/login/page.tsx
│  ├─ auth/callback/route.ts
│  ├─ (app)/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx                 # dashboard
│  │  ├─ tasks/page.tsx
│  │  ├─ calendar/page.tsx
│  │  ├─ board/page.tsx
│  │  └─ settings/page.tsx
│  └─ api/
│     ├─ tasks/route.ts
│     ├─ tasks/[id]/route.ts
│     ├─ categories/route.ts
│     ├─ pomodoro/route.ts
│     ├─ stats/route.ts
│     └─ push/subscribe/route.ts
├─ components/  (ui/, tasks/, timer/, dashboard/, layout/)
├─ hooks/       (useTasks, usePomodoro, useNotifications)
├─ lib/
│  ├─ supabase/ (client.ts, server.ts, middleware.ts)
│  ├─ validators/
│  └─ utils/
├─ types/       (database.types.ts generated by Supabase CLI)
├─ public/      (sw.js, manifest.json, sounds/)
├─ supabase/
│  ├─ migrations/
│  └─ functions/send-reminders/
├─ middleware.ts
└─ README.md
```

---

## 14. Implementation Plan

| Phase | Focus | Deliverables |
|---|---|---|
| **1. Setup** | Repo, Next.js, Tailwind, shadcn/ui, Supabase project, Google OAuth, env config | Login/logout working, protected routes |
| **2. Data layer** | Migrations, RLS, generated types, profile trigger | Schema live and secured |
| **3. Core tasks** | CRUD, complete toggle, pending/completed views, categories, priorities, due dates | All assignment requirements met |
| **4. Organise** | Search, filters, sort, URL state, quick views | Fast task discovery |
| **5. Pomodoro** | Timer state machine, session logging, per-task stats, mini-timer | Focus feature complete |
| **6. Notifications** | Permission flow, scheduler, fallbacks, settings | Deadline alerts working |
| **7. Insights & polish** | Dashboard, dark mode, empty/loading states, accessibility pass | Polished UX |
| **8. Extras (optional)** | Subtasks, Web Push, Realtime, Kanban, PWA, recurring tasks | Stretch goals |
| **9. Ship** | Tests, README, screenshots, deploy to Vercel, demo data | Live URL + docs |

---

## 15. Testing Strategy

- **Unit:** validators, date/priority sorting utils, timer state machine, notification scheduling logic (Vitest/Jest).
- **Component:** task form, filter bar, timer controls (React Testing Library).
- **Integration/API:** CRUD endpoints with a test Supabase project or local Supabase (CLI).
- **RLS tests:** verify user A cannot read/update/delete user B's data.
- **E2E:** sign-in (mocked), create → edit → complete → delete flow; timer start/pause; filter behaviour (Playwright).
- **Manual:** responsive checks, keyboard-only navigation, notification permission granted/denied paths, timer in a background tab.

---

## 16. Acceptance Criteria (Definition of Done)

1. A user can sign in with Google and sees only their own data.
2. A user can create, edit, delete, and complete/reopen tasks, and changes persist in Supabase after refresh.
3. Pending and completed tasks are viewable separately, and filtering, searching, and sorting work as specified.
4. Each task has a working Pomodoro timer; completed focus sessions are saved and reflected in per-task stats.
5. A desktop notification fires at the configured time before a task's deadline (with permission), with an in-app fallback otherwise.
6. UI is responsive at 360 px, tablet, and desktop, with light and dark themes.
7. RLS is enabled on all tables and verified by tests.
8. App is deployed, and the README explains setup, environment variables, and design decisions.

---

## 17. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Notifications don't fire when the tab is closed | Missed reminders | Clearly communicate Phase 1 limits; implement Web Push (P2); in-app overdue banners |
| Browser denies notification permission | No alerts | Contextual permission prompt + toast fallback |
| Timer drift in background tabs | Wrong durations | Timestamp-based timer, not tick counting |
| Google OAuth misconfiguration (redirect URIs) | Login fails | Document exact redirect URLs for local and prod; test early |
| Scope creep | Unfinished core | Ship P0 first; treat P1/P2 as incremental |
| Data leakage between users | Serious security issue | RLS on all tables, RLS tests, no service key on client |
| Time zones | Wrong deadlines | Store `timestamptz` (UTC), render in the user's local zone |

---

## 18. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=         # server/Edge Function only, never exposed to the client
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=      # P2 Web Push
VAPID_PRIVATE_KEY=                 # P2, server only
```

---

## 19. Future Enhancements
- Team/study-group shared tasks and accountability partners
- AI study planner (auto-schedule tasks by deadline and estimated effort)
- Google Calendar two-way sync
- Native mobile wrapper (Capacitor) or React Native app
- Gamification: badges, levels, focus leaderboards among friends
- Integrations with Notion, Google Classroom, and Todoist import

---

*End of document.*
