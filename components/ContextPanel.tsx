"use client";
import Link from "next/link";
import { Flame, Timer } from "lucide-react";
import { Droplet, PixelBar } from "./Pixel";
import { useStore } from "@/lib/store";
import { cx, dueLabel, fmtClock, isOverdue, streak, xpInfo } from "@/lib/utils";

/** Right-hand contextual panel (desktop ≥1280px): focus, next deadlines, progress. */
export function ContextPanel() {
  const { tasks, sessions, timer, timerRemaining, openFocus } = useStore();
  const timerTask = timer ? tasks.find((t) => t.id === timer.taskId) : null;
  const next = tasks.filter((t) => !t.isCompleted && t.dueAt).sort((a, b) => +new Date(a.dueAt!) - +new Date(b.dueAt!)).slice(0, 4);
  const xp = xpInfo(tasks, sessions); const days = streak(tasks, sessions);

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col gap-8 overflow-y-auto border-l border-line bg-side px-5 py-6 xl:flex" aria-label="Context">
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-faint">Focus</h2>
        {timer && timerTask ? (
          <button onClick={() => openFocus(timer.taskId)} className="w-full text-left">
            <p className={cx("text-4xl font-bold tabular-nums tracking-tight", timer.status === "running" ? "text-accent" : "text-muted")}>{fmtClock(timerRemaining)}</p>
            <p className="mt-1 truncate text-sm text-muted">{timerTask.title}</p>
          </button>
        ) : (
          <p className="flex items-start gap-2 text-sm text-muted"><Timer size={15} className="mt-0.5 shrink-0" /> No timer running. Press play on a task to start one.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-faint">Next deadlines</h2>
        {next.length === 0 ? <p className="text-sm text-muted">Nothing due. Enjoy the calm.</p> : (
          <ul className="space-y-3">
            {next.map((t) => (
              <li key={t.id}><Link href={`/app/tasks?open=${t.id}`} className="block">
                <p className="truncate text-sm font-medium">{t.title}</p>
                <p className={cx("text-xs", isOverdue(t) ? "text-coral" : "text-muted")}>{dueLabel(t.dueAt)}</p>
              </Link></li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-auto">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 font-semibold"><Droplet /> Level {xp.level}</span>
          <span className="flex items-center gap-1 text-xs text-muted"><Flame size={13} className={days ? "text-coral" : ""} />{days}d streak</span>
        </div>
        <PixelBar pct={xp.pct} />
        <p className="mt-2 text-xs text-faint">{xp.toNext} XP to level {xp.level + 1}. Tasks +10, focus sessions +5.</p>
      </section>
    </aside>
  );
}
