"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ListTodo, Plus, Search } from "lucide-react";
import { TaskCard } from "@/components/TaskCard";
import { useStore } from "@/lib/store";
import type { Priority, Task } from "@/lib/types";
import { PRIORITY_LABEL, PRIORITY_RANK, addDays, endOfWeek, startOfDay } from "@/lib/utils";

const SORTS = { due: "Due date", priority: "Priority", created: "Newest", title: "Title" } as const;
type SortKey = keyof typeof SORTS;

function TasksInner() {
  const { tasks, categories, openForm, ready } = useStore();
  const sp = useSearchParams(); const router = useRouter(); const path = usePathname();

  // FR-F4: all filter state lives in the URL
  const status = sp.get("status") ?? "pending";
  const prio = sp.get("priority") ?? "";
  const cat = sp.get("category") ?? "";
  const when = sp.get("when") ?? "";
  const sort = (sp.get("sort") as SortKey) || (status === "completed" ? "completed" : "due");
  const q = sp.get("q") ?? "";
  const set = useCallback((patch: Record<string, string>) => {
    const n = new URLSearchParams(window.location.search); // live URL so a debounced update never clobbers newer params
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    router.replace(`${path}?${n.toString()}`, { scroll: false });
  }, [router, path]);

  const [search, setSearch] = useState(q);
  const pushed = useRef(q); // last q we wrote to the URL ourselves
  useEffect(() => { if (q !== pushed.current) { pushed.current = q; setSearch(q); } }, [q]); // back/forward or pasted URL
  useEffect(() => { const id = setTimeout(() => search !== q && (pushed.current = search, set({ q: search })), 300); return () => clearTimeout(id); }, [search, q, set]);

  const openId = sp.get("open");
  useEffect(() => {
    if (!openId || !ready) return;
    const t = tasks.find((x) => x.id === openId); if (t) openForm(t);
    set({ open: "" });
  }, [openId, ready, tasks, openForm, set]);

  const list = useMemo(() => {
    const today = startOfDay(new Date()); const tom = addDays(today, 1); const wk = endOfWeek(new Date());
    const needle = q.trim().toLowerCase();
    const match = (t: Task) => {
      if (status === "pending" && t.isCompleted) return false;
      if (status === "completed" && !t.isCompleted) return false;
      if (prio && t.priority !== prio) return false;
      if (cat === "none" ? t.categoryId : cat && t.categoryId !== cat) return false;
      if (needle && !`${t.title} ${t.description}`.toLowerCase().includes(needle)) return false;
      if (when) {
        if (!t.dueAt) return false;
        const d = new Date(t.dueAt);
        if (when === "today" && !(d >= today && d < tom)) return false;
        if (when === "week" && !(d >= today && d < wk)) return false;
        if (when === "overdue" && !(d < new Date() && !t.isCompleted)) return false;
      }
      return true;
    };
    const far = Number.MAX_SAFE_INTEGER;
    const cmp: Record<string, (a: Task, b: Task) => number> = {
      due: (a, b) => (a.dueAt ? +new Date(a.dueAt) : far) - (b.dueAt ? +new Date(b.dueAt) : far),
      priority: (a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority],
      created: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      title: (a, b) => a.title.localeCompare(b.title),
      completed: (a, b) => +new Date(b.completedAt ?? 0) - +new Date(a.completedAt ?? 0),
    };
    return tasks.filter(match).sort(cmp[sort] ?? cmp.due);
  }, [tasks, status, prio, cat, when, q, sort]);

  const counts = { pending: tasks.filter((t) => !t.isCompleted).length, completed: tasks.filter((t) => t.isCompleted).length };
  const filtered = !!(prio || cat || when || q);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
        <button className="btn-primary" onClick={() => openForm()}><Plus size={16} /> New task</button>
      </div>

      <div className="space-y-3">
        <div role="tablist" aria-label="Status" className="inline-flex gap-1 border-b border-line">
          {([["pending", `Pending · ${counts.pending}`], ["completed", `Completed · ${counts.completed}`], ["all", "All"]] as const).map(([k, l]) => (
            <button key={k} role="tab" aria-selected={status === k} onClick={() => set({ status: k, sort: "" })}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition ${status === k ? "border-accent text-accent" : "border-transparent text-muted hover:text-fg"}`}>{l}</button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <span className="sr-only">Search tasks</span>
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className="input !pl-10" placeholder="Search title or notes" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <select aria-label="Category" className="input md:w-44" value={cat} onChange={(e) => set({ category: e.target.value })}>
            <option value="">All categories</option><option value="none">Uncategorised</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select aria-label="Due" className="input md:w-40" value={when} onChange={(e) => set({ when: e.target.value })}>
            <option value="">Any due date</option><option value="today">Today</option><option value="week">This week</option><option value="overdue">Overdue</option>
          </select>
          <select aria-label="Sort by" className="input md:w-40" value={sort} onChange={(e) => set({ sort: e.target.value })}>
            {Object.entries(SORTS).map(([k, l]) => <option key={k} value={k}>Sort: {l}</option>)}
            {status !== "pending" && <option value="completed">Sort: Recently done</option>}
          </select>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Priority">
          {(["high", "medium", "low"] as Priority[]).map((p) => (
            <button key={p} className="chip" aria-pressed={prio === p} onClick={() => set({ priority: prio === p ? "" : p })}>{PRIORITY_LABEL[p]}</button>
          ))}
          {filtered && <button className="chip !border-transparent underline" onClick={() => { setSearch(""); router.replace(`${path}?status=${status}`); }}>Clear filters</button>}
        </div>
      </div>

      {!ready ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24" />)}</div>
      ) : list.length === 0 ? (
        <div className="grid place-items-center gap-3 px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/12 text-accent"><ListTodo size={26} /></span>
          <h2 className="font-semibold">{filtered ? "Nothing matches those filters" : status === "completed" ? "No completed tasks yet" : "You're all caught up"}</h2>
          <p className="max-w-xs text-sm text-muted">{filtered ? "Try loosening a filter or clearing your search." : "Add a task and it will show up here."}</p>
          {!filtered && status !== "completed" && <button className="btn-primary" onClick={() => openForm()}><Plus size={16} /> Add a task</button>}
        </div>
      ) : (
        <div>{list.map((t) => <TaskCard key={t.id} task={t} />)}</div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return <Suspense fallback={<div className="skeleton h-40" />}><TasksInner /></Suspense>;
}
