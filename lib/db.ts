import { createClient } from "@supabase/supabase-js";
import { DEFAULT_SETTINGS, type Category, type Session, type Settings, type Task } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
/** null → the app runs in local demo mode. Only the anon key is ever used in the browser (RLS protects the data). */
export const supabase = url && key ? createClient(url, key) : null;

interface CategoryRow { id: string; name: string; color: string }
interface SubtaskRow { id: string; title: string; is_completed: boolean; position: number }
interface TaskRow {
  id: string; title: string; description: string | null; category_id: string | null; priority: Task["priority"];
  due_at: string | null; is_completed: boolean; completed_at: string | null; estimated_pomodoros: number | null;
  in_progress: boolean | null; recurrence_rule: string | null; created_at: string; subtasks: SubtaskRow[] | null;
}
interface SessionRow {
  id: string; task_id: string | null; type: Session["type"]; started_at: string; ended_at: string | null;
  planned_seconds: number; actual_seconds: number | null; completed: boolean;
}
interface SettingsRow {
  focus_minutes: number; short_break_minutes: number; long_break_minutes: number; long_break_every: number;
  reminders_enabled: boolean; reminder_lead_minutes: number[] | null; theme: string; sound: boolean | null;
}

export async function loadAll(userId: string) {
  const db = supabase!;
  const [c, t, s, st] = await Promise.all([
    db.from("categories").select("*").order("created_at"),
    db.from("tasks").select("*, subtasks(*)").order("created_at", { ascending: false }),
    db.from("pomodoro_sessions").select("*").order("started_at", { ascending: false }).limit(2000),
    db.from("user_settings").select("*").maybeSingle(),
  ]);
  const err = c.error ?? t.error ?? s.error ?? st.error;
  if (err) throw err;

  const categories: Category[] = ((c.data ?? []) as CategoryRow[]).map((r) => ({ id: r.id, name: r.name, color: r.color }));
  const tasks: Task[] = ((t.data ?? []) as TaskRow[]).map((r) => ({
    id: r.id, title: r.title, description: r.description ?? "", categoryId: r.category_id, priority: r.priority,
    dueAt: r.due_at, isCompleted: r.is_completed, completedAt: r.completed_at, estimatedPomodoros: r.estimated_pomodoros,
    inProgress: !!r.in_progress, recurrence: r.recurrence_rule === "FREQ=DAILY" ? "daily" : r.recurrence_rule === "FREQ=WEEKLY" ? "weekly" : null,
    createdAt: r.created_at,
    subtasks: [...(r.subtasks ?? [])].sort((a, b) => a.position - b.position).map((x) => ({ id: x.id, title: x.title, done: x.is_completed })),
  }));
  const sessions: Session[] = ((s.data ?? []) as SessionRow[]).map((r) => ({
    id: r.id, taskId: r.task_id, type: r.type, startedAt: r.started_at, endedAt: r.ended_at ?? r.started_at,
    plannedSeconds: r.planned_seconds, actualSeconds: r.actual_seconds ?? 0, completed: r.completed,
  }));
  const r = st.data as SettingsRow | null;
  const settings: Settings = r ? {
    focusMinutes: r.focus_minutes, shortBreakMinutes: r.short_break_minutes, longBreakMinutes: r.long_break_minutes,
    longBreakEvery: r.long_break_every, remindersEnabled: r.reminders_enabled, reminderLeadMinutes: r.reminder_lead_minutes ?? [60],
    theme: r.theme === "dark" ? "dark" : "light", sound: r.sound ?? true,
  } : DEFAULT_SETTINGS;
  if (!r) await db.from("user_settings").upsert(settingsRow(userId, settings));
  return { categories, tasks, sessions, settings };
}

export const settingsRow = (userId: string, s: Settings) => ({
  user_id: userId, focus_minutes: s.focusMinutes, short_break_minutes: s.shortBreakMinutes, long_break_minutes: s.longBreakMinutes,
  long_break_every: s.longBreakEvery, reminders_enabled: s.remindersEnabled, reminder_lead_minutes: s.reminderLeadMinutes,
  theme: s.theme, sound: s.sound,
});

export function buildRows(userId: string, categories: Category[], tasks: Task[], sessions: Session[]) {
  const ids = new Set(tasks.map((t) => t.id));
  return {
    categories: categories.map((c) => ({ id: c.id, user_id: userId, name: c.name, color: c.color })),
    tasks: tasks.map((t) => ({
      id: t.id, user_id: userId, category_id: t.categoryId, title: t.title, description: t.description || null, priority: t.priority,
      due_at: t.dueAt, is_completed: t.isCompleted, completed_at: t.completedAt, estimated_pomodoros: t.estimatedPomodoros, in_progress: t.inProgress,
      recurrence_rule: t.recurrence === "daily" ? "FREQ=DAILY" : t.recurrence === "weekly" ? "FREQ=WEEKLY" : null, created_at: t.createdAt,
    })),
    subtasks: tasks.flatMap((t) => t.subtasks.map((s, i) => ({ id: s.id, task_id: t.id, user_id: userId, title: s.title, is_completed: s.done, position: i }))),
    pomodoro_sessions: sessions.filter((s) => !s.taskId || ids.has(s.taskId)).map((s) => ({
      id: s.id, user_id: userId, task_id: s.taskId, type: s.type, started_at: s.startedAt, ended_at: s.endedAt,
      planned_seconds: s.plannedSeconds, actual_seconds: s.actualSeconds, completed: s.completed,
    })),
  };
}
export type Rows = ReturnType<typeof buildRows>;
export type Snapshot = { [K in keyof Rows]: Map<string, string> } & { settings: string };

export const snapshotOf = (rows: Rows, settings: string): Snapshot => ({
  categories: new Map(rows.categories.map((r) => [r.id, JSON.stringify(r)])),
  tasks: new Map(rows.tasks.map((r) => [r.id, JSON.stringify(r)])),
  subtasks: new Map(rows.subtasks.map((r) => [r.id, JSON.stringify(r)])),
  pomodoro_sessions: new Map(rows.pomodoro_sessions.map((r) => [r.id, JSON.stringify(r)])),
  settings,
});

/** Push only what changed since `snap`; mutates `snap` to the new state. */
export async function pushDiff(userId: string, rows: Rows, settings: Settings, snap: Snapshot) {
  const db = supabase!;
  const changed = (table: keyof Rows) => (rows[table] as { id: string }[]).filter((r) => snap[table].get(r.id) !== JSON.stringify(r));
  const removed = (table: keyof Rows) => { const cur = new Set((rows[table] as { id: string }[]).map((r) => r.id)); return [...snap[table].keys()].filter((id) => !cur.has(id)); };

  const order: (keyof Rows)[] = ["categories", "tasks", "subtasks", "pomodoro_sessions"];
  const ups = order.map((t) => [t, changed(t)] as const);
  const dels = (["subtasks", "tasks", "categories"] as const).map((t) => [t, removed(t)] as const);

  for (const [t, list] of ups) if (list.length) { const { error } = await db.from(t).upsert(list); if (error) throw error; }
  for (const [t, ids] of dels) if (ids.length) { const { error } = await db.from(t).delete().in("id", ids); if (error) throw error; }
  const sj = JSON.stringify(settingsRow(userId, settings));
  if (sj !== snap.settings) { const { error } = await db.from("user_settings").upsert(JSON.parse(sj)); if (error) throw error; }

  // rows already omits sessions of deleted tasks (DB cascades them), so an undo re-inserts them
  Object.assign(snap, snapshotOf(rows, sj));
}
