"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Settings } from "@/lib/types";
import { cx, toCSV } from "@/lib/utils";

const LEADS = [{ m: 15, l: "15 min" }, { m: 60, l: "1 hour" }, { m: 1440, l: "1 day" }];

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <section className="border-t border-line py-8 first:border-t-0"><h2 className="font-semibold">{title}</h2>{hint && <p className="mt-1 text-sm text-muted">{hint}</p>}<div className="mt-5">{children}</div></section>;
}

export default function SettingsPage() {
  const { settings, updateSettings, categories, tasks, user, signOut, resetDemo, clearAll, mode, notifyPermission, requestNotify, toast } = useStore();
  const router = useRouter();

  const num = (k: keyof Settings, label: string, min: number, max: number) => (
    <div>
      <label className="label" htmlFor={k}>{label}</label>
      <input id={k} type="number" min={min} max={max} className="input" value={settings[k] as number}
        onChange={(e) => { const v = parseInt(e.target.value, 10); if (v >= min && v <= max) updateSettings({ [k]: v }); }} />
    </div>
  );
  const toggleLead = (m: number) => {
    const has = settings.reminderLeadMinutes.includes(m);
    updateSettings({ reminderLeadMinutes: has ? settings.reminderLeadMinutes.filter((x) => x !== m) : [...settings.reminderLeadMinutes, m] });
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">Settings</h1>

      <Section title="Appearance">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
          {(["light", "dark", "system"] as const).map((t) => (
            <button key={t} role="radio" aria-checked={settings.theme === t} onClick={() => updateSettings({ theme: t })}
              className={cx("rounded-xl border px-3 py-2.5 text-sm font-medium capitalize", settings.theme === t ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:text-fg")}>{t}</button>
          ))}
        </div>
      </Section>

      <Section title="Pomodoro" hint="Durations apply to sessions you start from now on.">
        <div className="grid gap-4 sm:grid-cols-2">
          {num("focusMinutes", "Focus (min)", 1, 180)}{num("shortBreakMinutes", "Short break (min)", 1, 60)}
          {num("longBreakMinutes", "Long break (min)", 1, 120)}{num("longBreakEvery", "Long break every N sessions", 2, 10)}
        </div>
        <label className="mt-5 flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--accent))]" checked={settings.sound} onChange={(e) => updateSettings({ sound: e.target.checked })} /> Play a sound when a session ends</label>
      </Section>

      <Section title="Deadline reminders" hint={notifyPermission === "granted" ? "Desktop notifications are on. Reminders fire while Wave is open in a tab." : notifyPermission === "denied" ? "Notifications are blocked in your browser — Wave will show in-app alerts instead." : notifyPermission === "unsupported" ? "This browser doesn't support notifications — in-app alerts will be used." : "Allow desktop notifications to get reminders while Wave is open in a tab."}>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[rgb(var(--accent))]" checked={settings.remindersEnabled} onChange={(e) => updateSettings({ remindersEnabled: e.target.checked })} /> Remind me before deadlines</label>
        <div className={cx("mt-4 flex flex-wrap gap-2", !settings.remindersEnabled && "pointer-events-none opacity-40")} role="group" aria-label="Lead times">
          {LEADS.map(({ m, l }) => <button key={m} className="chip" aria-pressed={settings.reminderLeadMinutes.includes(m)} onClick={() => toggleLead(m)}>{l} before</button>)}
        </div>
        {notifyPermission === "default" && <button className="btn-primary mt-5" onClick={requestNotify}>Allow notifications</button>}
      </Section>

      <Section title="Categories" hint="Create, rename, recolour and delete categories.">
        <Link href="/app/categories" className="btn-ghost">Manage categories</Link>
      </Section>

      <Section title="Account & data" hint={user ? (mode === "supabase" ? `Signed in as ${user.email || user.name}. Your data is stored in your Wave database.` : `Signed in as ${user.name}. Data is stored in this browser only.`) : undefined}>
        <div className="flex flex-wrap gap-3">
          <button className="btn-ghost" onClick={() => { const b = new Blob([toCSV(tasks, categories)], { type: "text/csv" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "wave-tasks.csv"; a.click(); URL.revokeObjectURL(a.href); toast("Exported tasks.csv", "ok"); }}><Download size={16} /> Export CSV</button>
          {mode === "demo" && <button className="btn-ghost" onClick={resetDemo}>Restore demo data</button>}
          <button className="btn-ghost !border-coral/50 !text-coral" onClick={() => window.confirm("Delete all tasks, categories and focus history? This can't be undone.") && clearAll()}>Delete my data</button>
          <button className="btn-primary" onClick={() => { signOut(); router.push("/"); }}>Sign out</button>
        </div>
      </Section>
    </div>
  );
}
