"use client";
import { Play, Timer } from "lucide-react";
import { Droplet } from "@/components/Pixel";
import { useStore } from "@/lib/store";
import { cx, fmtClock, fmtMinutes, isOverdue, taskFocusStats } from "@/lib/utils";

export default function FocusPage() {
  const { tasks, sessions, timer, timerRemaining, openFocus, startFocus, settings } = useStore();
  const pending = tasks.filter((t) => !t.isCompleted).sort((a, b) => (a.dueAt ? +new Date(a.dueAt) : 9e15) - (b.dueAt ? +new Date(b.dueAt) : 9e15));
  const active = timer ? tasks.find((t) => t.id === timer.taskId) : null;
  const todayFocus = sessions.filter((s) => s.type === "focus" && new Date(s.startedAt).toDateString() === new Date().toDateString());

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Focus</h1>
        <p className="mt-1 text-sm text-muted">{settings.focusMinutes}-minute sessions, {settings.shortBreakMinutes}-minute breaks. Pick a task and go.</p>
      </header>

      <section className="border-b border-line pb-10">
        {timer && active ? (
          <button onClick={() => openFocus(timer.taskId)} className="text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-faint">{timer.type === "focus" ? "Focusing on" : "On a break from"} {active.title}</p>
            <p className={cx("mt-2 text-7xl font-bold tabular-nums tracking-tighter", timer.status === "running" ? "text-accent" : "text-muted")}>{fmtClock(timerRemaining)}</p>
            <p className="mt-2 text-sm text-muted">{timer.status === "running" ? "Running" : "Paused"}. Click to open the timer.</p>
          </button>
        ) : (
          <div className="flex items-center gap-3 text-muted"><Timer size={22} /><p className="text-sm">No timer running.</p></div>
        )}
        <p className="mt-6 flex items-center gap-2 text-sm"><Droplet /> <strong>{todayFocus.length}</strong> <span className="text-muted">sessions today · {fmtMinutes(todayFocus.reduce((a, s) => a + s.actualSeconds, 0) / 60)}</span></p>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Start a session</h2>
        {pending.length === 0 ? <p className="py-8 text-sm text-muted">No pending tasks. Add one to focus on.</p> : (
          <ul>
            {pending.map((t) => {
              const st = taskFocusStats(t.id, sessions);
              return (
                <li key={t.id} className="row-hover flex items-center gap-3 border-t border-line px-2 py-3 last:border-b">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className={cx("text-xs", isOverdue(t) ? "text-coral" : "text-muted")}>{st.done}{t.estimatedPomodoros ? `/${t.estimatedPomodoros}` : ""} sessions · {fmtMinutes(st.minutes)}</p>
                  </div>
                  <button className="btn-ghost !py-1.5" onClick={() => startFocus(t.id)} aria-label={`Start focus on ${t.title}`}><Play size={14} /> {timer?.taskId === t.id ? "Open" : "Focus"}</button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
