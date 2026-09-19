"use client";
import { useMemo, useState } from "react";
import { Flame } from "lucide-react";
import { BarChart, Donut } from "@/components/Charts";
import { Droplet, PixelBar } from "@/components/Pixel";
import { useStore } from "@/lib/store";
import { cx, dayKey, fmtMinutes, lastNDays, streak, xpInfo } from "@/lib/utils";

export default function Analytics() {
  const { tasks, sessions, categories } = useStore();
  const [range, setRange] = useState<7 | 30>(7);

  const d = useMemo(() => {
    const days = lastNDays(range);
    const doneBy = new Map<string, number>(); const focusBy = new Map<string, number>();
    tasks.forEach((t) => t.completedAt && doneBy.set(dayKey(t.completedAt), (doneBy.get(dayKey(t.completedAt)) ?? 0) + 1));
    sessions.forEach((s) => s.type === "focus" && focusBy.set(dayKey(s.startedAt), (focusBy.get(dayKey(s.startedAt)) ?? 0) + s.actualSeconds / 60));
    const lbl = (x: Date) => (range === 7 ? x.toLocaleDateString([], { weekday: "short" }) : String(x.getDate()));
    const byCat = new Map<string, number>();
    sessions.forEach((s) => { if (s.type !== "focus") return; const c = tasks.find((t) => t.id === s.taskId)?.categoryId ?? "none"; byCat.set(c, (byCat.get(c) ?? 0) + s.actualSeconds / 60); });
    return {
      doneBars: days.map((x) => ({ label: lbl(x), value: doneBy.get(dayKey(x)) ?? 0 })),
      focusBars: days.map((x) => ({ label: lbl(x), value: Math.round(focusBy.get(dayKey(x)) ?? 0) })),
      focusTotal: days.reduce((a, x) => a + (focusBy.get(dayKey(x)) ?? 0), 0),
      doneTotal: days.reduce((a, x) => a + (doneBy.get(dayKey(x)) ?? 0), 0),
      slices: [...byCat.entries()].map(([id, value]) => { const c = categories.find((x) => x.id === id); return { label: c?.name ?? "Uncategorised", value, color: c?.color ?? "#8a867d" }; }).sort((a, b) => b.value - a.value),
      streak: streak(tasks, sessions),
    };
  }, [tasks, sessions, categories, range]);
  const xp = xpInfo(tasks, sessions);

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <div className="inline-flex gap-1 border-b border-line">
          {([7, 30] as const).map((r) => <button key={r} onClick={() => setRange(r)} aria-pressed={range === r} className={cx("-mb-px border-b-2 px-3 py-1.5 text-sm font-medium", range === r ? "border-accent text-accent" : "border-transparent text-muted")}>{r} days</button>)}
        </div>
      </div>

      <section className="grid gap-8 sm:grid-cols-[1fr_1fr]">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold"><Droplet /> Level {xp.level}</p>
          <p className="mt-1 text-xs text-muted">{xp.xp} XP · {xp.toNext} to next level</p>
          <div className="mt-3"><PixelBar pct={xp.pct} segments={20} /></div>
        </div>
        <div className="flex items-center gap-3">
          <Flame size={28} className={d.streak ? "text-coral" : "text-faint"} />
          <div><p className="text-3xl font-bold tabular-nums">{d.streak}</p><p className="text-xs text-muted">day streak. Complete a task or a focus session daily.</p></div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Tasks completed</h2>
        <p className="mb-5 text-sm text-muted">{d.doneTotal} in the last {range} days</p>
        <BarChart data={d.doneBars} />
      </section>
      <section>
        <h2 className="text-lg font-semibold">Focus minutes</h2>
        <p className="mb-5 text-sm text-muted">{fmtMinutes(d.focusTotal)} in the last {range} days</p>
        <BarChart data={d.focusBars} color="rgb(var(--accent2))" unit="m" />
      </section>
      <section>
        <h2 className="mb-5 text-lg font-semibold">Focus by category</h2>
        <Donut slices={d.slices} />
      </section>
    </div>
  );
}
