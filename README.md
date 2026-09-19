# Wave

Ride every deadline. Wave is a student task manager with per-task Pomodoro timers, deadline reminders and a lightweight dashboard. Built from `PRD_Student_Task_Manager.md`.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

## What's built (PRD P0 + most of P1)

- Task CRUD, complete/reopen, undo on delete, subtasks with progress
- Pending / Completed / All views; search (300 ms debounce), priority, category and due filters, sorting; **filters live in the URL**
- Categories (create, rename, recolour, delete → tasks become uncategorised)
- Per-task Pomodoro: timestamp-based (correct in background tabs), survives refresh, one timer at a time, session logging, per-task stats, sound + notification, tab title countdown, configurable durations
- Deadline reminders via the Notification API with in-app toast fallback; permission is requested contextually (when you set a due date)
- Dashboard (summary cards, completions and focus charts, focus by category, streak), calendar view, dark/light/system theme, CSV export, `N` to add a task
- Responsive from 360 px: sidebar on desktop, bottom nav + FAB on mobile

## Supabase setup

1. Copy `.env.example` to `.env.local` and fill in the project URL and anon key (Settings → API). Without them Wave runs in local demo mode (data in `localStorage`).
2. In the Supabase **SQL editor**, paste and run `supabase/setup.sql` (the three migrations combined).
3. Authentication → Providers: enable **Email** (already on by default) and, for Google, **Google** with your OAuth client ID/secret. Add `http://localhost:3000/app` (and your production URL) under Authentication → URL Configuration → Redirect URLs. Set the Google OAuth client's authorised redirect URI to `https://<project-ref>.supabase.co/auth/v1/callback`.
4. `npm run dev`, sign in. Tasks, categories, subtasks, focus sessions and settings sync to Postgres; RLS keeps each user's rows private.

Only the anon key is used in the browser. `SUPABASE_SERVICE_ROLE_KEY` is not used by the app; keep it out of client code.

Sessions are kept in the browser (supabase-js) and routes are protected client-side rather than through Next.js middleware. Kanban board, recurring tasks, realtime sync and PWA install are included. Not implemented: Web Push while the tab is closed (needs VAPID keys + a scheduled Edge Function).

## Notes

- Reminders only fire while Wave is open in a tab (PRD Phase 1).
- Design: deep-ocean dark app shell with teal/coral accents; light, airy landing page. Theme tokens are CSS variables in `app/globals.css`.
