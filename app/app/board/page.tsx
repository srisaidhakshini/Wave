"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Clock, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { PRIORITY_CLASS, PRIORITY_LABEL, cx, dueLabel, isOverdue } from "@/lib/utils";

type Col = "todo" | "doing" | "done";
const COLS: { id: Col; label: string }[] = [{ id: "todo", label: "To do" }, { id: "doing", label: "In progress" }, { id: "done", label: "Done" }];
const colOf = (t: Task): Col => (t.isCompleted ? "done" : t.inProgress ? "doing" : "todo");

export default function Board() {
  const { tasks, categories, updateTask, toggleTask, openForm } = useStore();
  const [over, setOver] = useState<Col | null>(null);

  const move = (t: Task, to: Col) => {
    if (colOf(t) === to) return;
    if (to === "done") return toggleTask(t.id); // handles recurrence + stops timers
    updateTask(t.id, { isCompleted: false, completedAt: null, inProgress: to === "doing" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Board</h1>
        <button className="btn-primary" onClick={() => openForm()}><Plus size={16} /> New task</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {COLS.map((col, ci) => {
          const list = tasks.filter((t) => colOf(t) === col.id).sort((a, b) => (a.dueAt ? +new Date(a.dueAt) : 9e15) - (b.dueAt ? +new Date(b.dueAt) : 9e15));
          return (
            <section key={col.id} aria-label={col.label}
              onDragOver={(e) => { e.preventDefault(); setOver(col.id); }} onDragLeave={() => setOver(null)}
              onDrop={(e) => { e.preventDefault(); setOver(null); const t = tasks.find((x) => x.id === e.dataTransfer.getData("text/plain")); if (t) move(t, col.id); }}
              className={cx("min-h-40 rounded-lg border border-dashed p-3 transition", over === col.id ? "border-accent bg-accent/5" : "border-transparent bg-surface/50")}>
              <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-semibold">{col.label}<span className="rounded-full bg-surface2 px-2 py-0.5 text-xs text-muted">{list.length}</span></h2>
              <div className="space-y-2.5">
                {list.map((t) => {
                  const cat = categories.find((c) => c.id === t.categoryId);
                  return (
                    <article key={t.id} draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                      className="card cursor-grab p-3.5 active:cursor-grabbing">
                      <button onClick={() => openForm(t)} className="w-full text-left">
                        <p className={cx("text-sm font-semibold", t.isCompleted && "text-muted line-through")}>{t.title}</p>
                      </button>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                        <span className={cx("rounded px-2 py-0.5 font-semibold", PRIORITY_CLASS[t.priority])}>{PRIORITY_LABEL[t.priority]}</span>
                        {cat && <span className="inline-flex items-center gap-1 text-muted"><span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.color }} />{cat.name}</span>}
                        {t.dueAt && <span className={cx("inline-flex items-center gap-1", isOverdue(t) ? "text-danger" : "text-muted")}><Clock size={11} />{dueLabel(t.dueAt)}</span>}
                      </div>
                      <div className="mt-2.5 flex justify-between border-t border-line pt-2 text-muted">
                        <button className="btn-icon !h-7 !w-7 disabled:invisible" disabled={ci === 0} onClick={() => move(t, COLS[ci - 1].id)} aria-label={`Move ${t.title} to ${COLS[ci - 1]?.label}`}><ArrowLeft size={14} /></button>
                        <button className="btn-icon !h-7 !w-7 disabled:invisible" disabled={ci === 2} onClick={() => move(t, COLS[ci + 1].id)} aria-label={`Move ${t.title} to ${COLS[ci + 1]?.label}`}><ArrowRight size={14} /></button>
                      </div>
                    </article>
                  );
                })}
                {list.length === 0 && <p className="py-6 text-center text-xs text-muted">Drop tasks here</p>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
