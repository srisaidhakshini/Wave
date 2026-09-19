"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { BarChart } from "@/components/Charts";
import { Droplet, PixelWave } from "@/components/Pixel";
import { useStore } from "@/lib/store";
import { PRIORITY_CLASS, PRIORITY_LABEL, addDays, cx, dayKey, dueLabel, endOfWeek, isOverdue, lastNDays, startOfDay } from "@/lib/utils";

export default function Dashboard() {
  const { user, tasks, addTask, openForm, toggleTask, notifyPermission, requestNotify } = useStore();
  const [quick, setQuick] = useState("");

  const d = useMemo(() => {
    const tom = addDays(startOfDay(new Date()), 1);
    const pending = tasks.filter((t) => !t.isCompleted);
    const overdue = pending.filter(isOverdue);
    const dueToday = pending.filter((t) => t.dueAt && new Date(t.dueAt) >= new Date() && new Date(t.dueAt) < tom).length;
    const weekStart = addDays(endOfWeek(new Date()), -7);
    const doneBy = new Map<string, number>();
    tasks.forEach((t) => t.completedAt && doneBy.set(dayKey(t.completedAt), (doneBy.get(dayKey(t.completedAt)) ?? 0) + 1));
    return {
      pending: pending.length, overdue, dueToday,
      doneWeek: tasks.filter((t) => t.completedAt && new Date(t.completedAt) >= weekStart).length,
      bars: lastNDays(7).map((x) => ({ label: x.toLocaleDateString([], { weekday: "short" }), value: doneBy.get(dayKey(x)) ?? 0 })),
      upcoming: pending.filter((t) => t.dueAt).sort((a, b) => +new Date(a.dueAt!) - +new Date(b.dueAt!)).slice(0, 6),
    };
  }, [tasks]);

  const hour = new Date().getHours();
  const stats = [
    { l: "Pending", v: d.pending, c: "" }, { l: "Due today", v: d.dueToday, c: d.dueToday ? "text-accent" : "" },
    { l: "Overdue", v: d.overdue.length, c: d.overdue.length ? "text-coral" : "" }, { l: "Done this week", v: d.doneWeek, c: "text-accent" },
  ];

  return (
    <div className="space-y-10">
      <header>
        <p className="flex items-center gap-2 text-sm text-muted"><Droplet /> {hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{user?.name}</h1>
        <PixelWave className="mt-4 max-w-xs" opacity={0.5} />
      </header>

      {d.overdue.length > 0 && (
        <div className="flex items-center gap-3 border-l-2 border-coral bg-coral/[0.07] px-4 py-3 text-sm" role="alert">
          <AlertTriangle size={16} className="shrink-0 text-coral" />
          <span className="flex-1"><strong>{d.overdue.length} overdue:</strong> {d.overdue.slice(0, 2).map((t) => t.title).join(", ")}{d.overdue.length > 2 && ` +${d.overdue.length - 2} more`}</span>
          <Link href="/app/tasks?when=overdue" className="font-semibold text-coral">Review</Link>
        </div>
      )}
      {notifyPermission === "default" && (
        <div className="flex items-center gap-3 border-l-2 border-accent bg-accent/[0.06] px-4 py-3 text-sm">
          <span className="flex-1">Get a desktop nudge before your deadlines?</span>
          <button className="font-semibold text-accent" onClick={requestNotify}>Enable reminders</button>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-y-6 sm:grid-cols-4 sm:divide-x sm:divide-line">
        {stats.map((s) => (
          <div key={s.l} className="sm:px-6 sm:first:pl-0">
            <dt className="text-xs font-medium uppercase tracking-wider text-faint">{s.l}</dt>
            <dd className={cx("mt-1 text-4xl font-bold tabular-nums tracking-tight", s.c)}>{s.v}</dd>
          </div>
        ))}
      </dl>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Up next</h2>
          <Link href="/app/tasks" className="text-sm font-medium text-accent">All tasks</Link>
        </div>
        {d.upcoming.length === 0 ? <p className="border-t border-line py-10 text-center text-sm text-muted">Nothing scheduled. Enjoy the calm.</p> : (
          <ul>
            {d.upcoming.map((t) => (
              <li key={t.id} className="row-hover flex items-center gap-3 border-t border-line px-2 py-3 last:border-b">
                <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--accent))]" onChange={() => toggleTask(t.id)} aria-label={`Complete ${t.title}`} />
                <button onClick={() => openForm(t)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                </button>
                <span className={cx("text-xs", isOverdue(t) ? "font-semibold text-coral" : "text-muted")}>{dueLabel(t.dueAt)}</span>
                <span className={cx("hidden rounded px-2 py-0.5 text-[11px] font-semibold sm:block", PRIORITY_CLASS[t.priority])}>{PRIORITY_LABEL[t.priority]}</span>
              </li>
            ))}
          </ul>
        )}
        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (quick.trim()) { addTask({ title: quick.trim().slice(0, 120) }); setQuick(""); } }}>
          <input className="input" placeholder="Quick add a task and press Enter" aria-label="Quick add" value={quick} maxLength={120} onChange={(e) => setQuick(e.target.value)} />
          <button className="btn-primary !px-3.5" aria-label="Add"><Plus size={18} /></button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">This week</h2>
          <Link href="/app/analytics" className="text-sm font-medium text-accent">Full analytics</Link>
        </div>
        <BarChart data={d.bars} />
      </section>
    </div>
  );
}
