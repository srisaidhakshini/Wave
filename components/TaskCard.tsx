"use client";
import { useState } from "react";
import { Check, ChevronDown, Clock, ListChecks, Pencil, Play, Plus, Timer, Trash2, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { PRIORITY_CLASS, PRIORITY_LABEL, cx, dueLabel, fmtMinutes, isOverdue, taskFocusStats } from "@/lib/utils";

export function TaskCard({ task }: { task: Task }) {
  const { categories, sessions, toggleTask, deleteTask, openForm, startFocus, timer, addSubtask, toggleSubtask, deleteSubtask } = useStore();
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState("");
  const cat = categories.find((c) => c.id === task.categoryId);
  const stats = taskFocusStats(task.id, sessions);
  const overdue = isOverdue(task);
  const doneSubs = task.subtasks.filter((s) => s.done).length;
  const running = timer?.taskId === task.id && timer.status === "running";

  return (
    <article className={cx("row-hover animate-rise border-b border-line px-2 py-4 first:border-t", task.isCompleted && "opacity-60")}>
      <div className="flex items-start gap-3">
        <button role="checkbox" aria-checked={task.isCompleted} aria-label={task.isCompleted ? `Reopen ${task.title}` : `Complete ${task.title}`} onClick={() => toggleTask(task.id)}
          className={cx("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border-2 transition", task.isCompleted ? "border-accent bg-accent text-accent-fg" : "border-faint hover:border-accent")}>
          {task.isCompleted && <Check size={12} strokeWidth={3.5} />}
        </button>
        <div className="min-w-0 flex-1">
          <h3 className={cx("font-semibold leading-snug", task.isCompleted && "text-muted line-through")}>{task.title}</h3>
          {task.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{task.description}</p>}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
            <span className={cx("rounded px-2 py-0.5 text-[11px] font-semibold", PRIORITY_CLASS[task.priority])}>{PRIORITY_LABEL[task.priority]}</span>
            {cat && <span className="inline-flex items-center gap-1.5 text-muted"><span className="h-2 w-2 rounded-full" style={{ background: cat.color }} />{cat.name}</span>}
            <span className={cx("inline-flex items-center gap-1", overdue ? "font-semibold text-coral" : "text-muted")}>
              <Clock size={13} />{task.isCompleted && task.completedAt ? `Done ${dueLabel(task.completedAt)}` : overdue ? `Overdue · ${dueLabel(task.dueAt)}` : dueLabel(task.dueAt)}
            </span>
            {task.recurrence && <span className="text-muted">↻ {task.recurrence}</span>}
            {task.inProgress && <span className="rounded-full bg-accent/15 px-2 py-0.5 font-semibold text-accent">In progress</span>}
            {task.subtasks.length > 0 && <span className="inline-flex items-center gap-1 text-muted"><ListChecks size={13} />{doneSubs}/{task.subtasks.length}</span>}
            {(stats.done > 0 || task.estimatedPomodoros) && (
              <span className="inline-flex items-center gap-1 text-muted"><Timer size={13} />{stats.done}{task.estimatedPomodoros ? `/${task.estimatedPomodoros}` : ""} · {fmtMinutes(stats.minutes)}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          {!task.isCompleted && (
            <button onClick={() => startFocus(task.id)} className={cx("btn-icon", running && "!text-accent")} aria-label={`Start focus on ${task.title}`} title="Start focus"><Play size={16} /></button>
          )}
          <button onClick={() => openForm(task)} className="btn-icon" aria-label={`Edit ${task.title}`}><Pencil size={16} /></button>
          <button onClick={() => deleteTask(task.id)} className="btn-icon hover:!text-coral" aria-label={`Delete ${task.title}`}><Trash2 size={16} /></button>
          <button onClick={() => setOpen(!open)} className="btn-icon" aria-expanded={open} aria-label="Toggle subtasks"><ChevronDown size={16} className={cx("transition", open && "rotate-180")} /></button>
        </div>
      </div>
      {open && (
        <div className="mt-3 space-y-1.5 pl-9">
          {task.subtasks.map((s) => (
            <div key={s.id} className="group flex items-center gap-2.5 text-sm">
              <input type="checkbox" checked={s.done} onChange={() => toggleSubtask(task.id, s.id)} className="h-4 w-4 accent-[rgb(var(--accent))]" aria-label={s.title} />
              <span className={cx("flex-1", s.done && "text-muted line-through")}>{s.title}</span>
              <button onClick={() => deleteSubtask(task.id, s.id)} className="text-muted hover:text-danger focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100" aria-label={`Remove ${s.title}`}><X size={14} /></button>
            </div>
          ))}
          <form className="flex items-center gap-2 pt-1" onSubmit={(e) => { e.preventDefault(); if (sub.trim()) { addSubtask(task.id, sub); setSub(""); } }}>
            <Plus size={16} className="text-muted" />
            <input className="w-full bg-transparent py-1 text-sm placeholder:text-muted/70 focus:outline-none" placeholder="Add a subtask" value={sub} maxLength={120} onChange={(e) => setSub(e.target.value)} aria-label="New subtask" />
          </form>
        </div>
      )}
    </article>
  );
}
