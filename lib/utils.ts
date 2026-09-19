import type { Category, Priority, Session, Task } from "./types";

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

export const PRIORITY_RANK: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
export const PRIORITY_LABEL: Record<Priority, string> = { high: "High", medium: "Medium", low: "Low" };
export const PRIORITY_CLASS: Record<Priority, string> = {
  high: "bg-fg text-bg", medium: "text-muted bg-surface2", low: "text-faint bg-surface2",
};
export const CATEGORY_COLORS = ["#e8e4dc", "#b5b0a5", "#8a867d", "#d6cfc0", "#6f6b63", "#c9c3b6", "#a39d8f"];

export const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const dayKey = (d: Date | string) => {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
export const endOfWeek = (d: Date) => addDays(startOfDay(d), 7 - ((d.getDay() + 6) % 7)); // exclusive, weeks start Monday

export const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${dayKey(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
export const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : null);

export const isOverdue = (t: Task) => !t.isCompleted && !!t.dueAt && new Date(t.dueAt).getTime() < Date.now();

export function dueLabel(iso: string | null) {
  if (!iso) return "No deadline";
  const d = new Date(iso);
  const days = Math.round((startOfDay(d).getTime() - startOfDay(new Date()).getTime()) / 864e5);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Tomorrow, ${time}`;
  if (days === -1) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

export function timeUntil(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  const m = Math.round(Math.abs(ms) / 60000);
  const txt = m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`;
  return ms >= 0 ? `in ${txt}` : `${txt} ago`;
}

export const fmtClock = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};
export const fmtMinutes = (min: number) => (min >= 60 ? `${Math.floor(min / 60)}h ${Math.round(min % 60)}m` : `${Math.round(min)}m`);

export function taskFocusStats(taskId: string, sessions: Session[]) {
  const f = sessions.filter((s) => s.taskId === taskId && s.type === "focus");
  return { done: f.filter((s) => s.completed).length, minutes: f.reduce((a, s) => a + s.actualSeconds, 0) / 60 };
}

export function lastNDays(n: number) {
  const t = startOfDay(new Date());
  return Array.from({ length: n }, (_, i) => addDays(t, i - (n - 1)));
}

export function streak(tasks: Task[], sessions: Session[]) {
  const active = new Set<string>();
  tasks.forEach((t) => t.completedAt && active.add(dayKey(t.completedAt)));
  sessions.forEach((s) => s.type === "focus" && s.actualSeconds > 0 && active.add(dayKey(s.startedAt)));
  let d = startOfDay(new Date());
  if (!active.has(dayKey(d))) d = addDays(d, -1); // today still open doesn't break it
  let n = 0;
  while (active.has(dayKey(d))) { n++; d = addDays(d, -1); }
  return n;
}

export function xpInfo(tasks: Task[], sessions: Session[]) {
  const xp = tasks.filter((t) => t.isCompleted).length * 10 + sessions.filter((s) => s.type === "focus" && s.completed).length * 5;
  const level = Math.floor(Math.sqrt(xp / 25)) + 1;
  const base = 25 * (level - 1) ** 2, next = 25 * level ** 2;
  return { xp, level, pct: (xp - base) / (next - base), toNext: next - xp };
}

export function toCSV(tasks: Task[], cats: Category[]) {
  // Quote every cell; neutralise spreadsheet formula injection (=, +, -, @, tab, CR at the start of a cell).
  const esc = (v: string) => `"${(/^[=+\-@\t\r]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
  const rows = tasks.map((t) => [t.title, t.description, cats.find((c) => c.id === t.categoryId)?.name ?? "", t.priority,
    t.dueAt ?? "", t.isCompleted ? "completed" : "pending", t.completedAt ?? ""].map((v) => esc(String(v))).join(","));
  return "﻿" + ["title,description,category,priority,due,status,completed_at", ...rows].join("\r\n"); // BOM so Excel reads UTF-8
}

export function seedData() {
  const now = new Date();
  const at = (d: number, h: number, m = 0) => { const x = addDays(startOfDay(now), d); x.setHours(h, m); return x.toISOString(); };
  const cats: Category[] = [
    { id: "c-math", name: "Mathematics", color: "#b5b0a5" },
    { id: "c-phys", name: "Physics", color: "#b5b0a5" },
    { id: "c-cs", name: "Computer Science", color: "#d6cfc0" },
    { id: "c-me", name: "Personal", color: "#8a867d" },
  ];
  const mk = (title: string, p: Partial<Task>): Task => ({
    id: uid(), title, description: "", categoryId: null, priority: "medium", dueAt: null, isCompleted: false,
    completedAt: null, estimatedPomodoros: null, inProgress: false, recurrence: null, subtasks: [], createdAt: new Date().toISOString(), ...p,
  });
  const st = (t: string, done = false) => ({ id: uid(), title: t, done });
  const tasks = [
    mk("Physics lab report — wave interference", { description: "Include the fringe-spacing table and error analysis.", categoryId: "c-phys", priority: "high", dueAt: at(0, 23, 0), estimatedPomodoros: 4, subtasks: [st("Plot fringe data", true), st("Error analysis"), st("Write conclusion")] }),
    mk("Calculus problem set 6", { categoryId: "c-math", priority: "medium", dueAt: at(1, 12, 0), estimatedPomodoros: 3 }),
    mk("Data structures assignment: AVL trees", { categoryId: "c-cs", priority: "high", dueAt: at(3, 18, 0), estimatedPomodoros: 6, subtasks: [st("Rotations"), st("Insert / delete"), st("Unit tests")] }),
    mk("Read chapter 9 — Fourier series", { categoryId: "c-math", priority: "low", dueAt: at(5, 9, 0), estimatedPomodoros: 2 }),
    mk("Book dentist appointment", { categoryId: "c-me", priority: "low", dueAt: at(-1, 17, 0) }),
    mk("Submit scholarship form", { categoryId: "c-me", priority: "medium", isCompleted: true, completedAt: at(-1, 10, 0), dueAt: at(-1, 12, 0) }),
    mk("Revise thermodynamics notes", { categoryId: "c-phys", isCompleted: true, completedAt: at(-2, 20, 0), dueAt: at(-2, 21, 0) }),
    mk("Lab 4: linked lists", { categoryId: "c-cs", isCompleted: true, completedAt: at(0, 8, 30), dueAt: at(0, 9, 0) }),
  ];
  const sessions: Session[] = [];
  [[-6, 2], [-5, 3], [-4, 1], [-3, 4], [-2, 2], [-1, 3], [0, 1]].forEach(([d, n], i) => {
    for (let k = 0; k < n; k++) {
      const s = at(d, 10 + k, 0);
      sessions.push({ id: uid(), taskId: tasks[i % 3].id, type: "focus", startedAt: s, endedAt: s, plannedSeconds: 1500, actualSeconds: 1500, completed: true });
    }
  });
  return { cats, tasks, sessions };
}
