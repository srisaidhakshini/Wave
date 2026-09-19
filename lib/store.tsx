"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { DEFAULT_SETTINGS, type Category, type Session, type SessionType, type Settings, type Task, type TaskInput, type TimerState, type User } from "./types";
import type { User as SbUser } from "@supabase/supabase-js";
import { buildRows, loadAll, pushDiff, settingsRow, snapshotOf, supabase, type Snapshot } from "./db";
import { fmtMinutes, seedData, timeUntil, uid } from "./utils";

const KEY = "wave:v1";
const TIMER_KEY = "wave:timer";
const NOTIFIED_KEY = "wave:notified";

export interface Toast { id: string; message: string; tone?: "ok" | "error" | "info"; action?: { label: string; run: () => void } }
interface FormState { open: boolean; task?: Task }

interface Ctx {
  ready: boolean; mode: "demo" | "supabase"; loadError: string | null;
  user: User | null;
  tasks: Task[]; categories: Category[]; sessions: Session[]; settings: Settings;
  signIn: (name: string) => void; signInGoogle: () => Promise<void>; signInEmail: (email: string) => Promise<boolean>; signOut: () => void;
  addTask: (i: TaskInput) => Task; updateTask: (id: string, p: Partial<Task>) => void;
  deleteTask: (id: string) => void; toggleTask: (id: string) => void;
  addSubtask: (id: string, title: string) => void; toggleSubtask: (id: string, sid: string) => void; deleteSubtask: (id: string, sid: string) => void;
  addCategory: (name: string, color: string) => void; updateCategory: (id: string, p: Partial<Category>) => void; deleteCategory: (id: string) => void;
  updateSettings: (p: Partial<Settings>) => void; resetDemo: () => void; clearAll: () => void;
  toasts: Toast[]; toast: (m: string, tone?: Toast["tone"], action?: Toast["action"]) => void; dismissToast: (id: string) => void;
  form: FormState; openForm: (task?: Task) => void; closeForm: () => void;
  timer: TimerState | null; timerRemaining: number; focusTaskId: string | null;
  openFocus: (taskId: string) => void; closeFocus: () => void;
  startFocus: (taskId: string) => void; pauseTimer: () => void; resumeTimer: () => void; resetTimer: () => void; skipBreak: () => void;
  notifyPermission: NotificationPermission | "unsupported"; requestNotify: () => Promise<void>;
}

const StoreCtx = createContext<Ctx | null>(null);
export const useStore = () => { const c = useContext(StoreCtx); if (!c) throw new Error("StoreProvider missing"); return c; };

const read = <T,>(k: string): T | null => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : null; } catch { return null; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full / blocked */ } };

let audio: AudioContext | null = null;
function beep(on: boolean) {
  if (!on) return;
  try {
    audio = audio ?? new AudioContext();
    [0, 0.22, 0.44].forEach((t, i) => {
      const o = audio!.createOscillator(); const g = audio!.createGain();
      o.frequency.value = [659, 784, 988][i]; o.connect(g); g.connect(audio!.destination);
      g.gain.setValueAtTime(0.0001, audio!.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.25, audio!.currentTime + t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, audio!.currentTime + t + 0.35);
      o.start(audio!.currentTime + t); o.stop(audio!.currentTime + t + 0.4);
    });
  } catch { /* audio blocked */ }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [form, setForm] = useState<FormState>({ open: false });
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [perm, setPerm] = useState<Ctx["notifyPermission"]>("default");

  // ---- load / persist
  const mode: Ctx["mode"] = supabase ? "supabase" : "demo";
  const snap = useRef<Snapshot | null>(null);
  const userIdRef = useRef<string | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());
  const failed = useRef(false);
  const tasksRef = useRef(tasks); tasksRef.current = tasks;
  const categoriesRef = useRef(categories); categoriesRef.current = categories;
  const sessionsRef = useRef(sessions); sessionsRef.current = sessions;

  useEffect(() => {
    setTimer(read<TimerState>(TIMER_KEY));
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);

    if (!supabase) {
      const s = read<{ user: User | null; tasks: Task[]; categories: Category[]; sessions: Session[]; settings: Settings }>(KEY);
      if (s) {
        setUser(s.user); setTasks(s.tasks); setCategories(s.categories); setSessions(s.sessions);
        setSettings({ ...DEFAULT_SETTINGS, ...s.settings });
      } else {
        const d = seedData(); setTasks(d.tasks); setCategories(d.cats); setSessions(d.sessions);
      }
      setReady(true);
      return;
    }

    let alive = true;
    const bail = setTimeout(() => alive && setReady(true), 8000); // never leave the app on an endless loader
    const hydrate = async (u: SbUser | null) => {
      if (!alive) return;
      if (!u) { userIdRef.current = null; snap.current = null; setUser(null); setTasks([]); setCategories([]); setSessions([]); setReady(true); return; }
      if (userIdRef.current === u.id) return; // token refresh, nothing to reload
      userIdRef.current = u.id; snap.current = null;
      try {
        const d = await loadAll(u.id);
        if (!alive) return;
        setUser({ name: (u.user_metadata?.full_name as string) || u.email?.split("@")[0] || "Student", email: u.email ?? "" });
        setTasks(d.tasks); setCategories(d.categories); setSessions(d.sessions); setSettings(d.settings);
        const rows = buildRows(u.id, d.categories, d.tasks, d.sessions);
        snap.current = snapshotOf(rows, JSON.stringify(settingsRow(u.id, d.settings)));
      } catch (e) {
        userIdRef.current = null;
        const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? "Could not load your data";
        setLoadError(/schema cache|does not exist|relation/i.test(msg)
          ? "You're signed in, but the database tables don't exist yet. In Supabase → SQL Editor, run supabase/setup.sql, then reload this page."
          : msg);
      }
      setReady(true);
    };
    supabase.auth.getSession().then(({ data }) => hydrate(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { setTimeout(() => hydrate(session?.user ?? null), 0); });
    // Realtime cross-device sync: reload from the DB when another device changes something
    let timer_: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase.channel("wave-sync");
    ["tasks", "subtasks", "categories", "pomodoro_sessions"].forEach((table) =>
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        clearTimeout(timer_);
        timer_ = setTimeout(async () => {
          const id = userIdRef.current; if (!id || !alive) return;
          await chain.current; // let our own writes land first
          try {
            const d = await loadAll(id); if (!alive || userIdRef.current !== id) return;
            const rows = buildRows(id, d.categories, d.tasks, d.sessions);
            const cur = buildRows(id, categoriesRef.current, tasksRef.current, sessionsRef.current);
            if (JSON.stringify(rows) === JSON.stringify(cur)) return; // our own echo
            snap.current = snapshotOf(rows, JSON.stringify(settingsRow(id, d.settings)));
            setTasks(d.tasks); setCategories(d.categories); setSessions(d.sessions);
          } catch { /* next event will retry */ }
        }, 700);
      }));
    channel.subscribe();
    return () => { alive = false; clearTimeout(bail); clearTimeout(timer_); sub.subscription.unsubscribe(); void supabase!.removeChannel(channel); };
  }, []);

  useEffect(() => { if (ready && !supabase) write(KEY, { user, tasks, categories, sessions, settings }); }, [ready, user, tasks, categories, sessions, settings]);

  useEffect(() => { if (!ready) return; timer ? write(TIMER_KEY, timer) : localStorage.removeItem(TIMER_KEY); }, [ready, timer]);

  // ---- theme
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = settings.theme === "dark" || (settings.theme === "system" && mq.matches);
      document.documentElement.classList.toggle("dark", dark);
    };
    apply(); mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [settings.theme]);

  // ---- toasts
  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback<Ctx["toast"]>((message, tone = "info", action) => {
    const id = uid();
    setToasts((t) => [...t.slice(-3), { id, message, tone, action }]);
    setTimeout(() => dismissToast(id), action ? 6000 : 4000);
  }, [dismissToast]);

  // Supabase: push changes (serialised so writes never overlap)
  useEffect(() => {
    const uid_ = userIdRef.current;
    if (!supabase || !ready || !uid_ || !snap.current) return;
    const rows = buildRows(uid_, categories, tasks, sessions);
    chain.current = chain.current.then(async () => {
      if (!snap.current || userIdRef.current !== uid_) return;
      try { await pushDiff(uid_, rows, settings, snap.current); failed.current = false; }
      catch (e) {
        if (!failed.current) toast(`Couldn't save to the database: ${(e as { message?: string })?.message ?? "unknown error"}`, "error");
        failed.current = true;
      }
    });
  }, [ready, tasks, categories, sessions, settings, toast]);

  // ---- browser notifications
  const notify = useCallback((title: string, body: string, tag: string, taskId?: string) => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        const n = new Notification(title, { body, tag });
        n.onclick = () => { window.focus(); if (taskId) window.dispatchEvent(new CustomEvent("wave:open-task", { detail: taskId })); n.close(); };
        return;
      } catch { /* fall through to toast */ }
    }
    toast(`${title} — ${body}`, "info"); // FR-N8 fallback
  }, [toast]);

  const requestNotify = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPerm(p);
    toast(p === "granted" ? "Reminders on. We'll nudge you before deadlines." : "Notifications blocked — we'll use in-app alerts instead.", p === "granted" ? "ok" : "info");
  }, [toast]);

  // ---- tasks
  const addTask: Ctx["addTask"] = useCallback((i) => {
    const t: Task = { description: "", categoryId: null, priority: "medium", dueAt: null, isCompleted: false, completedAt: null, estimatedPomodoros: null, inProgress: false, recurrence: null, ...i, id: uid(), subtasks: [], createdAt: new Date().toISOString() };
    setTasks((a) => [t, ...a]); toast("Task created", "ok"); return t;
  }, [toast]);
  const updateTask = useCallback((id: string, p: Partial<Task>) => setTasks((a) => a.map((t) => (t.id === id ? { ...t, ...p } : t))), []);

  const timerRef = useRef(timer); timerRef.current = timer;
  const settingsRef = useRef(settings); settingsRef.current = settings;

  const toggleTask = useCallback((id: string) => {
    const t = tasksRef.current.find((x) => x.id === id); if (!t) return;
    const done = !t.isCompleted;
    updateTask(id, { isCompleted: done, completedAt: done ? new Date().toISOString() : null, inProgress: false });
    if (done && timerRef.current?.taskId === id) setTimer(null); // FR-T4
    if (done && t.recurrence && t.dueAt) { // FR-T6: completing a recurring task spawns the next occurrence
      const next = new Date(t.dueAt); next.setDate(next.getDate() + (t.recurrence === "daily" ? 1 : 7));
      while (next.getTime() < Date.now()) next.setDate(next.getDate() + (t.recurrence === "daily" ? 1 : 7));
      setTasks((a) => [{ ...t, id: uid(), isCompleted: false, completedAt: null, inProgress: false, dueAt: next.toISOString(), createdAt: new Date().toISOString(), subtasks: t.subtasks.map((s) => ({ ...s, id: uid(), done: false })) }, ...a]);
      toast(`Done — next one is due ${next.toLocaleDateString([], { month: "short", day: "numeric" })}`, "ok"); return;
    }
    toast(done ? "Nice — task completed" : "Task reopened", "ok");
  }, [toast, updateTask]);

  const deleteTask = useCallback((id: string) => {
    const idx = tasksRef.current.findIndex((x) => x.id === id); const t = tasksRef.current[idx]; if (!t) return;
    setTasks((a) => a.filter((x) => x.id !== id));
    if (timerRef.current?.taskId === id) setTimer(null);
    toast("Task deleted", "info", { label: "Undo", run: () => setTasks((a) => (a.some((x) => x.id === id) ? a : [...a.slice(0, idx), t, ...a.slice(idx)])) });
  }, [toast]);

  const patchSubs = (id: string, f: (s: Task["subtasks"]) => Task["subtasks"]) => setTasks((a) => a.map((t) => (t.id === id ? { ...t, subtasks: f(t.subtasks) } : t)));
  const addSubtask = (id: string, title: string) => patchSubs(id, (s) => [...s, { id: uid(), title: title.trim().slice(0, 120), done: false }]);
  const toggleSubtask = (id: string, sid: string) => patchSubs(id, (s) => s.map((x) => (x.id === sid ? { ...x, done: !x.done } : x)));
  const deleteSubtask = (id: string, sid: string) => patchSubs(id, (s) => s.filter((x) => x.id !== sid));

  const addCategory = (name: string, color: string) => {
    const n = name.trim().slice(0, 40); if (!n) return;
    if (categories.some((c) => c.name.toLowerCase() === n.toLowerCase())) return toast("That category already exists", "error");
    setCategories((a) => [...a, { id: uid(), name: n, color }]);
  };
  const updateCategory = (id: string, p: Partial<Category>) => setCategories((a) => a.map((c) => (c.id === id ? { ...c, ...p } : c)));
  const deleteCategory = (id: string) => { setCategories((a) => a.filter((c) => c.id !== id)); setTasks((a) => a.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t))); }; // FR-C2

  const updateSettings = (p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p }));

  // ---- Pomodoro (timestamp-based, FR-P4)
  const durationSec = (type: SessionType) => 60 * (type === "focus" ? settingsRef.current.focusMinutes : type === "short_break" ? settingsRef.current.shortBreakMinutes : settingsRef.current.longBreakMinutes);

  const logSession = useCallback((t: TimerState, actualSeconds: number, completed: boolean) => {
    if (t.type !== "focus" || !t.startedAt || actualSeconds < 60) return; // ignore trivial interruptions
    setSessions((a) => [...a, { id: uid(), taskId: t.taskId, type: t.type, startedAt: t.startedAt!, endedAt: new Date().toISOString(), plannedSeconds: t.plannedSeconds, actualSeconds, completed }]);
  }, []);

  const finishPhase = useCallback(() => {
    const t = timerRef.current; if (!t) return;
    logSession(t, t.plannedSeconds, true);
    const cycle = t.cycle + (t.type === "focus" ? 1 : 0);
    const next: SessionType = t.type !== "focus" ? "focus" : cycle % settingsRef.current.longBreakEvery === 0 ? "long_break" : "short_break";
    const title = tasksRef.current.find((x) => x.id === t.taskId)?.title ?? "your task";
    setTimer({ taskId: t.taskId, type: next, status: "paused", endsAt: null, remainingMs: durationSec(next) * 1000, plannedSeconds: durationSec(next), startedAt: null, cycle });
    beep(settingsRef.current.sound);
    notify(t.type === "focus" ? "Focus session complete" : "Break over", t.type === "focus" ? `Nice work on “${title}”. Time for a ${next === "long_break" ? "long" : "short"} break.` : "Ready for the next focus session?", `timer-${t.taskId}`, t.taskId);
  }, [logSession, notify]);

  useEffect(() => {
    if (timer?.status !== "running") return;
    const id = setInterval(() => { const n = Date.now(); setNow(n); if (timerRef.current?.endsAt && n >= timerRef.current.endsAt) finishPhase(); }, 250);
    return () => clearInterval(id);
  }, [timer?.status, finishPhase]);

  const timerRemaining = !timer ? 0 : timer.status === "running" && timer.endsAt ? Math.max(0, timer.endsAt - now) : timer.remainingMs;

  const begin = (t: TimerState): TimerState => ({ ...t, status: "running", endsAt: Date.now() + t.remainingMs, startedAt: t.startedAt ?? new Date().toISOString() });
  const startFocus = (taskId: string) => {
    const cur = timerRef.current;
    if (cur && cur.taskId !== taskId) {
      const other = tasksRef.current.find((x) => x.id === cur.taskId)?.title ?? "another task";
      if (!window.confirm(`A timer is already active on “${other}”. Switch to this task?`)) return;
      if (cur.status === "running" && cur.endsAt) logSession(cur, cur.plannedSeconds - Math.round((cur.endsAt - Date.now()) / 1000), false);
    }
    setFocusTaskId(taskId);
    if (cur && cur.taskId === taskId) return; // dialog shows existing timer
    setTimer(begin({ taskId, type: "focus", status: "paused", endsAt: null, remainingMs: durationSec("focus") * 1000, plannedSeconds: durationSec("focus"), startedAt: null, cycle: 0 }));
  };
  const pauseTimer = () => setTimer((t) => (t && t.status === "running" && t.endsAt ? { ...t, status: "paused", remainingMs: Math.max(0, t.endsAt - Date.now()), endsAt: null } : t));
  const resumeTimer = () => setTimer((t) => (t && t.status === "paused" ? begin(t) : t));
  const resetTimer = () => {
    const t = timerRef.current;
    if (t && t.startedAt) logSession(t, t.plannedSeconds - Math.round(timerRemaining / 1000), false);
    setTimer(null);
  };
  const skipBreak = () => setTimer((t) => (t && t.type !== "focus" ? { ...t, type: "focus", status: "paused", endsAt: null, startedAt: null, plannedSeconds: durationSec("focus"), remainingMs: durationSec("focus") * 1000 } : t));

  // tab title (FR-P11)
  useEffect(() => {
    const base = document.title.replace(/^\d\d:\d\d · /, "");
    if (timer?.status === "running") {
      const title = tasks.find((x) => x.id === timer.taskId)?.title ?? "Wave";
      document.title = `${Math.floor(timerRemaining / 60000).toString().padStart(2, "0")}:${Math.floor((timerRemaining % 60000) / 1000).toString().padStart(2, "0")} · ${title}`;
      return () => { document.title = base; };
    }
  }, [timer?.status, timerRemaining, timer?.taskId, tasks]);

  // ---- deadline scheduler (FR-N2..N4)
  useEffect(() => {
    if (!ready || !user) return;
    const check = () => {
      const s = settingsRef.current; if (!s.remindersEnabled) return;
      const done = read<string[]>(NOTIFIED_KEY) ?? []; const seen = new Set(done); const t0 = Date.now();
      for (const t of tasksRef.current) {
        if (t.isCompleted || !t.dueAt) continue;
        const due = new Date(t.dueAt).getTime(); if (due <= t0) continue;
        const hits = s.reminderLeadMinutes.filter((m) => due - m * 60000 <= t0 && !seen.has(`${t.id}:${t.dueAt}:${m}`));
        if (!hits.length) continue;
        hits.forEach((m) => seen.add(`${t.id}:${t.dueAt}:${m}`));
        notify(`Due ${timeUntil(t.dueAt)}`, t.title, `due-${t.id}`, t.id);
      }
      write(NOTIFIED_KEY, [...seen].slice(-300));
    };
    check(); const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [ready, user, notify]);

  const value: Ctx = {
    ready, mode, loadError, user, tasks, categories, sessions, settings,
    signIn: (name) => setUser({ name: name.trim() || "Student", email: "demo@wave.local" }),
    signInGoogle: async () => {
      const { error } = await supabase!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/app` } });
      if (error) toast(/provider is not enabled|Unsupported provider/i.test(error.message) ? "Google sign-in isn't enabled for this project yet." : error.message, "error");
    },
    signInEmail: async (email) => {
      const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/app` } });
      if (error) { toast(error.message, "error"); return false; }
      return true;
    },
    signOut: () => { setTimer(null); if (supabase) void supabase.auth.signOut(); else setUser(null); },
    addTask, updateTask, deleteTask, toggleTask, addSubtask, toggleSubtask, deleteSubtask,
    addCategory, updateCategory, deleteCategory, updateSettings,
    resetDemo: () => { if (supabase) return; const d = seedData(); setTasks(d.tasks); setCategories(d.cats); setSessions(d.sessions); setTimer(null); toast("Demo data restored", "ok"); },
    clearAll: () => { setTasks([]); setCategories([]); setSessions([]); setTimer(null); localStorage.removeItem(NOTIFIED_KEY); toast("All data deleted", "info"); },
    toasts, toast, dismissToast,
    form, openForm: (task) => setForm({ open: true, task }), closeForm: () => setForm({ open: false }),
    timer, timerRemaining, focusTaskId, openFocus: setFocusTaskId, closeFocus: () => setFocusTaskId(null),
    startFocus, pauseTimer, resumeTimer, resetTimer, skipBreak,
    notifyPermission: perm, requestNotify,
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export { fmtMinutes };
