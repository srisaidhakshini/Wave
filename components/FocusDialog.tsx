"use client";
import { useEffect, useRef } from "react";
import { useFocusTrap } from "./useFocusTrap";
import { Pause, Play, RotateCcw, SkipForward, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { cx, fmtClock, fmtMinutes, taskFocusStats } from "@/lib/utils";

const LABEL = { focus: "Focus", short_break: "Short break", long_break: "Long break" } as const;

export function FocusDialog() {
  const { focusTaskId, closeFocus, tasks, sessions, timer, timerRemaining, startFocus, pauseTimer, resumeTimer, resetTimer, skipBreak, settings } = useStore();
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, !!focusTaskId);
  useEffect(() => {
    if (!focusTaskId) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && closeFocus();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [focusTaskId, closeFocus]);

  const task = tasks.find((t) => t.id === focusTaskId);
  if (!focusTaskId || !task) return null;

  const mine = timer?.taskId === task.id ? timer : null;
  const stats = taskFocusStats(task.id, sessions);
  const total = mine ? mine.plannedSeconds * 1000 : settings.focusMinutes * 60000;
  const remaining = mine ? timerRemaining : total;
  const pct = 1 - remaining / total;
  const R = 108, C = 2 * Math.PI * R;
  const isBreak = mine && mine.type !== "focus";

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && closeFocus()}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Focus timer" className="card w-full max-w-md animate-rise p-7 text-center">
        <div className="flex items-start justify-between text-left">
          <div><p className="label !mb-0">{mine ? LABEL[mine.type] : "Focus"}</p><h2 className="mt-1 text-xl font-semibold leading-snug">{task.title}</h2></div>
          <button className="btn-icon" onClick={closeFocus} aria-label="Close timer"><X size={18} /></button>
        </div>

        <div className="relative mx-auto my-6 h-64 w-64">
          <svg viewBox="0 0 256 256" className="-rotate-90" aria-hidden>
            <circle cx="128" cy="128" r={R} fill="none" stroke="rgb(var(--surface2))" strokeWidth="12" />
            <circle cx="128" cy="128" r={R} fill="none" strokeWidth="12" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
              stroke={isBreak ? "rgb(var(--iris))" : "rgb(var(--accent))"} className="transition-[stroke-dashoffset] duration-300" />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div>
              <p className="text-6xl font-semibold tabular-nums" aria-live="off">{fmtClock(remaining)}</p>
              <p className="mt-1 text-xs text-muted">{mine?.status === "paused" && mine.startedAt ? "Paused" : mine?.status === "paused" ? "Ready" : mine ? "Running" : "Idle"}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          {!mine ? (
            <button className="btn-primary !px-7" onClick={() => startFocus(task.id)}><Play size={16} /> Start focus</button>
          ) : (
            <>
              {mine.status === "running"
                ? <button className="btn-primary !px-7" onClick={pauseTimer}><Pause size={16} /> Pause</button>
                : <button className="btn-primary !px-7" onClick={resumeTimer}><Play size={16} /> {mine.startedAt ? "Resume" : "Start"}</button>}
              <button className="btn-ghost" onClick={resetTimer} aria-label="Reset timer"><RotateCcw size={16} /> Reset</button>
              {isBreak && <button className="btn-ghost" onClick={skipBreak}><SkipForward size={16} /> Skip</button>}
            </>
          )}
        </div>

        <div className={cx("mt-6 grid grid-cols-3 gap-2 border-t border-line pt-5 text-sm")}>
          <div><p className="text-lg font-semibold">{stats.done}</p><p className="text-xs text-muted">sessions</p></div>
          <div><p className="text-lg font-semibold">{fmtMinutes(stats.minutes)}</p><p className="text-xs text-muted">focused</p></div>
          <div><p className="text-lg font-semibold">{task.estimatedPomodoros ? `${stats.done}/${task.estimatedPomodoros}` : "—"}</p><p className="text-xs text-muted">vs estimate</p></div>
        </div>
      </div>
    </div>
  );
}
