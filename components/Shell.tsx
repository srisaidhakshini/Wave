"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CalendarDays, Columns3, FolderOpen, Home, ListChecks, Plus, Settings, Timer, X, Zap } from "lucide-react";
import { Logo } from "./Logo";
import { ContextPanel } from "./ContextPanel";
import { PixelBar, PixelWave } from "./Pixel";
import { TaskForm } from "./TaskForm";
import { FocusDialog } from "./FocusDialog";
import { useStore } from "@/lib/store";
import { cx, fmtClock, xpInfo } from "@/lib/utils";

const NAV = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/tasks", label: "My Tasks", icon: ListChecks },
  { href: "/app/board", label: "Board", icon: Columns3 },
  { href: "/app/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/app/focus", label: "Focus", icon: Timer },
  { href: "/app/categories", label: "Categories", icon: FolderOpen },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const { ready, user, signOut, openForm, timer, timerRemaining, openFocus, tasks, sessions, toasts, dismissToast } = useStore();
  const path = usePathname();
  const router = useRouter();

  useEffect(() => { if (ready && !user) router.replace("/login"); }, [ready, user, router]); // FR-A2

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(el.tagName) || el.isContentEditable || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.toLowerCase() === "n") { e.preventDefault(); openForm(); }
    };
    const onOpen = (e: Event) => router.push(`/app/tasks?open=${(e as CustomEvent).detail}`);
    window.addEventListener("keydown", onKey); window.addEventListener("wave:open-task", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("wave:open-task", onOpen); };
  }, [openForm, router]);

  if (!ready || !user) return <div className="grid min-h-screen place-items-center"><div className="skeleton h-10 w-10 !rounded-full" /></div>;

  const active = (h: string) => (h === "/app" ? path === "/app" : path.startsWith(h));
  const timerTask = timer ? tasks.find((t) => t.id === timer.taskId) : null;
  const xp = xpInfo(tasks, sessions);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line bg-side px-3 py-4 md:flex">
        <Link href="/app" className="px-2.5 pb-1 pt-1"><Logo /></Link>
        <PixelWave className="mx-2.5 mt-3" opacity={0.45} />
        <nav className="mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto" aria-label="Main">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
              className={cx("relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors", active(href) ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface2/60 hover:text-fg")}>
              {active(href) && <span className="absolute -left-3 top-1.5 h-6 w-1 rounded-r bg-accent" />}
              <Icon size={17} /> {label}
            </Link>
          ))}
        </nav>
        <button onClick={() => openForm()} className="btn-primary mb-3 !py-2"><Plus size={15} /> New task <kbd className="ml-auto rounded bg-black/15 px-1.5 text-[10px]">N</kbd></button>
        <div className="border-t border-line pt-3">
          <div className="flex items-center gap-2.5 px-1">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-accent/15 text-sm font-bold text-accent">{user.name[0]?.toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold leading-tight">{user.name}</p>
              <p className="flex items-center gap-1 text-[11px] text-muted"><Zap size={10} className="text-accent" /> Lv {xp.level} · {xp.xp} XP</p>
            </div>
            <Link href="/app/settings" className="btn-icon !h-7 !w-7" aria-label="Settings"><Settings size={14} /></Link>
          </div>
          <div className="mt-2.5 px-1"><PixelBar pct={xp.pct} segments={16} /></div>
          <button onClick={() => { signOut(); router.push("/"); }} className="mt-2 px-1 text-xs text-faint hover:text-fg">Sign out</button>
        </div>
      </aside>

      <div className="min-w-0 flex-1 pb-24 md:pb-0">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-line bg-bg/85 px-4 backdrop-blur md:px-8">
          <Link href="/app" className="md:hidden"><Logo size={24} /></Link>
          <span className="hidden text-sm text-muted md:block">{new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</span>
          {timer && timerTask && (
            <button onClick={() => openFocus(timer.taskId)} aria-label={`Open timer for ${timerTask.title}`}
              className={cx("flex items-center gap-2 rounded-md border px-3 py-1 text-sm font-semibold tabular-nums xl:hidden", timer.status === "running" ? "border-accent/60 bg-accent/10 text-accent" : "border-line text-muted")}>
              <Timer size={14} /> {fmtClock(timerRemaining)}
              <span className="hidden max-w-[10rem] truncate font-medium sm:block">{timerTask.title}</span>
            </button>
          )}
        </header>
        <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-10 md:py-10">{children}</main>
      </div>
      <ContextPanel />

      <nav className="fixed inset-x-0 bottom-0 z-30 flex overflow-x-auto border-t border-line bg-side/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden" aria-label="Main">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={active(href) ? "page" : undefined} className={cx("flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium", active(href) ? "text-accent" : "text-muted")}>
            <Icon size={19} /> {label.replace("My ", "")}
          </Link>
        ))}
      </nav>
      <button onClick={() => openForm()} aria-label="New task" className="fixed bottom-20 right-4 z-30 grid h-12 w-12 place-items-center rounded-lg bg-accent text-accent-fg shadow-lg shadow-black/40 transition active:scale-95 md:hidden"><Plus size={22} /></button>

      <TaskForm />
      <FocusDialog />
      <div className="fixed inset-x-0 bottom-36 z-50 mx-auto flex w-full max-w-sm flex-col gap-2 px-4 md:bottom-6 md:left-auto md:right-6 md:mx-0 xl:right-[19rem]" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={cx("flex animate-rise items-center gap-3 rounded-lg border bg-surface2 px-4 py-3 text-sm shadow-xl", t.tone === "error" ? "border-coral/50" : t.tone === "ok" ? "border-accent/40" : "border-line")}>
            <span className="flex-1">{t.message}</span>
            {t.action && <button className="font-semibold text-accent" onClick={() => { t.action!.run(); dismissToast(t.id); }}>{t.action.label}</button>}
            <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="text-muted hover:text-fg"><X size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
