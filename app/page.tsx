"use client";
import Link from "next/link";
import { ArrowRight, BarChart3, BellRing, CheckCircle2, ListChecks, Timer } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useStore } from "@/lib/store";

const features = [
  { icon: ListChecks, title: "Plan without the clutter", body: "Tasks with priorities, categories and deadlines. Search, filter and sort to see what matters right now." },
  { icon: Timer, title: "Focus on the task itself", body: "A Pomodoro timer bound to each task keeps a log of sessions and minutes, so effort is visible." },
  { icon: BellRing, title: "Reminders before it's late", body: "Choose how early you're nudged. If notifications are off, Wave falls back to in-app alerts." },
  { icon: BarChart3, title: "See your momentum", body: "Weekly completions, focus minutes and a streak that rewards showing up." },
];

function Waves({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden>
      <path fill="#8a867d" fillOpacity=".35" d="M0 200c120-60 240-60 360 0s240 60 360 0 240-60 360 0 240 60 360 0v120H0z" className="animate-drift" />
      <path fill="#b5b0a5" fillOpacity=".45" d="M0 230c150-50 270-50 400 0s250 50 400 0 250-50 400 0 160 30 240 0v90H0z" />
      <path fill="#0a0a0a" fillOpacity=".85" d="M0 275c130-30 250-30 380 0s260 30 400 0 250-30 380 0 190 20 280 0v45H0z" />
    </svg>
  );
}

export default function Landing() {
  const { user } = useStore();
  const cta = user ? "/app" : "/login";
  return (
    <div className="light wave-bg min-h-screen text-fg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" aria-label="Wave home"><Logo /></Link>
        <nav className="hidden gap-8 text-sm font-medium text-muted md:flex" aria-label="Sections">
          <a href="#features" className="hover:text-fg">Features</a>
          <a href="#how" className="hover:text-fg">How it works</a>
        </nav>
        <Link href={cta} className="btn-ghost !rounded-full">{user ? "Open app" : "Sign in"}</Link>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-4xl px-5 pb-56 pt-14 text-center sm:pt-20">
            <span className="inline-flex animate-rise items-center gap-2 rounded-full bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Tasks + Pomodoro + reminders, in one flow
            </span>
            <h1 className="mt-6 animate-rise text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
              Ride every deadline,<br /><span className="text-accent">don&rsquo;t chase it.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl animate-rise text-lg text-muted">
              Wave helps students plan the work, focus on it one session at a time, and get nudged before anything slips.
            </p>
            <div className="mt-9 flex animate-rise flex-wrap items-center justify-center gap-3">
              <Link href={cta} className="btn-primary !rounded-full !px-6 !py-3">Get started free <ArrowRight size={16} /></Link>
              <a href="#features" className="btn-ghost !rounded-full !px-6 !py-3">See what&rsquo;s inside</a>
            </div>
          </div>
          <Waves className="pointer-events-none absolute inset-x-0 bottom-0 h-56 w-full" />
        </section>

        <section id="how" className="mx-auto -mt-28 max-w-5xl px-5">
          <div className="card relative text-fg overflow-hidden p-5 shadow-2xl shadow-black/30 sm:p-7">
            <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="label">Today</p>
                {[["Physics lab report", "High", "text-coral bg-coral/15", "11:00 PM", false], ["Calculus problem set 6", "Medium", "text-iris bg-iris/15", "Tomorrow", false], ["Lab 4: linked lists", "Low", "text-ok bg-ok/15", "Done", true]].map(([t, p, c, d, done]) => (
                  <div key={t as string} className="mb-2.5 flex items-center gap-3 rounded-xl border border-line bg-surface2/50 p-3">
                    <CheckCircle2 size={20} className={done ? "text-accent" : "text-muted/50"} />
                    <span className={`flex-1 text-sm font-medium ${done ? "text-muted line-through" : ""}`}>{t as string}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${c}`}>{p as string}</span>
                    <span className="hidden text-xs text-muted sm:block">{d as string}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-line bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 text-center">
                <p className="label">Focus · Physics lab report</p>
                <p className="my-3 text-6xl font-semibold tabular-nums">24:13</p>
                <div className="mx-auto h-1.5 w-40 overflow-hidden rounded-full bg-surface2"><div className="h-full w-2/3 rounded-full bg-accent" /></div>
                <p className="mt-3 text-xs text-muted">Session 2 of 4 · 5 min break next</p>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-24">
          <h2 className="mx-auto max-w-2xl text-center text-4xl font-semibold tracking-tight">Everything a semester throws at you, in one calm place.</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="border-t-2 border-accent/30 pt-5">
                <Icon size={22} className="mb-3 text-accent" />
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-line bg-surface2 text-fg">
          <div className="mx-auto max-w-3xl px-5 py-20 text-center">
            <h2 className="text-4xl font-semibold">Your next deadline is already on its way.</h2>
            <p className="mt-3 text-muted">Set up in under a minute. No password to remember.</p>
            <Link href={cta} className="mt-8 inline-flex items-center gap-2 rounded-full bg-fg px-7 py-3 text-sm font-semibold text-bg transition hover:scale-105">Start with Wave <ArrowRight size={16} /></Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-line py-6 text-center text-xs text-muted">© {new Date().getFullYear()} Wave · Built for students</footer>
    </div>
  );
}
