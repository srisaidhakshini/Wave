"use client";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { PRIORITY_CLASS, addDays, cx, dayKey, dueLabel, startOfDay } from "@/lib/utils";

export default function CalendarPage() {
  const { tasks, openForm, categories } = useStore();
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return startOfDay(d); });
  const [sel, setSel] = useState(dayKey(new Date()));

  const { cells, by } = useMemo(() => {
    const first = new Date(month); const offset = (first.getDay() + 6) % 7;
    const start = addDays(first, -offset);
    const by = new Map<string, typeof tasks>();
    tasks.forEach((t) => t.dueAt && by.set(dayKey(t.dueAt), [...(by.get(dayKey(t.dueAt)) ?? []), t]));
    return { cells: Array.from({ length: 42 }, (_, i) => addDays(start, i)), by };
  }, [month, tasks]);

  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const today = dayKey(new Date());
  const selTasks = by.get(sel) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{month.toLocaleDateString([], { month: "long", year: "numeric" })}</h1>
        <div className="flex gap-1">
          <button className="btn-icon border border-line" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <button className="btn-ghost !py-1.5" onClick={() => { const d = new Date(); d.setDate(1); setMonth(startOfDay(d)); setSel(today); }}>Today</button>
          <button className="btn-icon border border-line" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
        <div className="overflow-hidden rounded-lg border border-line">
          <div className="grid grid-cols-7 border-b border-line text-center text-[11px] font-semibold uppercase tracking-wider text-muted">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="py-2.5">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((c) => {
              const k = dayKey(c); const list = by.get(k) ?? []; const inMonth = c.getMonth() === month.getMonth();
              return (
                <button key={k} onClick={() => setSel(k)} aria-label={`${c.toDateString()}, ${list.length} tasks`} aria-pressed={sel === k}
                  className={cx("flex aspect-square min-h-14 flex-col items-center gap-1 border-b border-r border-line p-1.5 text-sm transition hover:bg-surface2 sm:aspect-auto sm:min-h-24 sm:items-start", !inMonth && "opacity-35", sel === k && "bg-accent/10")}>
                  <span className={cx("grid h-7 w-7 place-items-center rounded-full text-xs font-semibold", k === today && "bg-accent text-accent-fg")}>{c.getDate()}</span>
                  <span className="hidden w-full space-y-0.5 sm:block">
                    {list.slice(0, 2).map((t) => (
                      <span key={t.id} className={cx("block truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium", t.isCompleted ? "bg-surface2 text-muted line-through" : PRIORITY_CLASS[t.priority])}>{t.title}</span>
                    ))}
                    {list.length > 2 && <span className="block px-1 text-[11px] text-muted">+{list.length - 2} more</span>}
                  </span>
                  {list.length > 0 && <span className="flex gap-0.5 sm:hidden">{list.slice(0, 3).map((t) => <span key={t.id} className="h-1.5 w-1.5 rounded-full bg-accent" />)}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="h-fit border-l border-line pl-6">
          <h2 className="font-semibold">{new Date(sel + "T00:00").toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</h2>
          {selTasks.length === 0 ? <p className="mt-4 text-sm text-muted">No deadlines this day.</p> : (
            <ul className="mt-4 space-y-2">
              {selTasks.map((t) => (
                <li key={t.id}>
                  <button onClick={() => openForm(t)} className="row-hover w-full rounded-md border-b border-line px-2 py-3 text-left">
                    <p className={cx("text-sm font-medium", t.isCompleted && "text-muted line-through")}>{t.title}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted">
                      <span className="h-2 w-2 rounded-full" style={{ background: categories.find((c) => c.id === t.categoryId)?.color ?? "rgb(var(--muted))" }} />{dueLabel(t.dueAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button className="btn-ghost mt-4 w-full" onClick={() => openForm()}>Add a task</button>
        </aside>
      </div>
    </div>
  );
}
