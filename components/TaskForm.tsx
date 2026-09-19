"use client";
import { useEffect, useRef, useState } from "react";
import { useFocusTrap } from "./useFocusTrap";
import { BellRing, X } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Priority } from "@/lib/types";
import { PRIORITY_LABEL, cx, fromLocalInput, toLocalInput } from "@/lib/utils";

export function TaskForm() {
  const { form, closeForm, categories, addTask, updateTask, notifyPermission, requestNotify } = useStore();
  const edit = form.task;
  const dialogRef = useRef<HTMLFormElement>(null);
  useFocusTrap(dialogRef, form.open);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState("");
  const [cat, setCat] = useState(""); const [prio, setPrio] = useState<Priority>("medium");
  const [rec, setRec] = useState<"" | "daily" | "weekly">(""); const [due, setDue] = useState(""); const [est, setEst] = useState(""); const [err, setErr] = useState("");

  useEffect(() => {
    if (!form.open) return;
    setTitle(edit?.title ?? ""); setDesc(edit?.description ?? ""); setCat(edit?.categoryId ?? "");
    setPrio(edit?.priority ?? "medium"); setDue(toLocalInput(edit?.dueAt ?? null)); setRec(edit?.recurrence ?? ""); setEst(edit?.estimatedPomodoros?.toString() ?? ""); setErr("");
  }, [form.open, edit]);
  useEffect(() => {
    if (!form.open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && closeForm();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [form.open, closeForm]);
  if (!form.open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return setErr("Give your task a title.");
    if (t.length > 120) return setErr("Title must be 120 characters or fewer.");
    const n = est ? parseInt(est, 10) : null;
    if (n !== null && (!(n > 0) || n > 50)) return setErr("Estimated pomodoros must be between 1 and 50.");
    const data = { title: t, description: desc.trim().slice(0, 2000), categoryId: cat || null, priority: prio, dueAt: fromLocalInput(due), estimatedPomodoros: n, recurrence: due && rec ? rec : null };
    if (edit) updateTask(edit.id, data); else addTask(data);
    closeForm();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && closeForm()}>
      <form ref={dialogRef} onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="tf-h"
        className="card max-h-[100dvh] w-full max-w-lg animate-rise space-y-4 overflow-y-auto rounded-b-none p-6 sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 id="tf-h" className="text-2xl font-semibold">{edit ? "Edit task" : "New task"}</h2>
          <button type="button" className="btn-icon" onClick={closeForm} aria-label="Close"><X size={18} /></button>
        </div>
        <div>
          <label className="label" htmlFor="tf-title">Title</label>
          <input id="tf-title" autoFocus className="input" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" />
          {err && <p className="mt-1.5 text-xs text-coral" role="alert">{err}</p>}
        </div>
        <div>
          <label className="label" htmlFor="tf-desc">Notes</label>
          <textarea id="tf-desc" className="input min-h-20 resize-y" value={desc} maxLength={2000} onChange={(e) => setDesc(e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="tf-cat">Category</label>
            <select id="tf-cat" className="input" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Uncategorised</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="tf-est">Estimated pomodoros</label>
            <input id="tf-est" type="number" min={1} max={50} className="input" value={est} onChange={(e) => setEst(e.target.value)} placeholder="Optional" />
          </div>
        </div>
        <fieldset>
          <legend className="label">Priority</legend>
          <div className="grid grid-cols-3 gap-2">
            {(["low", "medium", "high"] as Priority[]).map((p) => (
              <button type="button" key={p} aria-pressed={prio === p} onClick={() => setPrio(p)}
                className={cx("rounded-xl border px-3 py-2 text-sm font-medium transition", prio === p ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:text-fg")}>{PRIORITY_LABEL[p]}</button>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="label" htmlFor="tf-due">Deadline</label>
          <input id="tf-due" type="datetime-local" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
          {due && (
            <div className="mt-3">
              <label className="label" htmlFor="tf-rec">Repeat</label>
              <select id="tf-rec" className="input" value={rec} onChange={(e) => setRec(e.target.value as typeof rec)}>
                <option value="">Doesn&rsquo;t repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option>
              </select>
            </div>
          )}
          {due && notifyPermission === "default" && (
            <div className="mt-2 flex items-center gap-3 rounded-xl bg-accent/10 p-3 text-xs text-muted">
              <BellRing size={16} className="shrink-0 text-accent" />
              <span className="flex-1">Want a desktop reminder before this is due?</span>
              <button type="button" onClick={requestNotify} className="font-semibold text-accent">Enable</button>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={closeForm}>Cancel</button>
          <button type="submit" className="btn-primary">{edit ? "Save changes" : "Create task"}</button>
        </div>
      </form>
    </div>
  );
}
