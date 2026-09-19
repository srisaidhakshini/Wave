"use client";
import { useState } from "react";

export interface Bar { label: string; value: number; sub?: string }

export function BarChart({ data, color = "rgb(var(--accent))", unit = "" }: { data: Bar[]; color?: string; unit?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const nice = Math.max(1, Math.ceil(max / 4) * 4);
  const dense = data.length > 10;
  return (
    <div role="img" aria-label={data.map((d) => `${d.label}: ${d.value}${unit}`).join(", ")}>
      <div className="relative flex h-44 items-end gap-1.5 border-b border-line pl-7 sm:gap-2.5">
        {[1, 0.5].map((f) => (
          <div key={f} className="absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${f * 100}%` }}>
            <span className="absolute -top-2 left-0 text-[10px] text-muted">{Math.round(nice * f)}</span>
          </div>
        ))}
        {data.map((d, i) => (
          <div key={i} className="relative flex h-full flex-1 items-end" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            {hover === i && <span className="absolute -top-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-surface2 px-2 py-0.5 text-xs font-semibold shadow">{d.value}{unit}</span>}
            <div className="w-full rounded-t-sm transition-all duration-500" style={{ height: `${(d.value / nice) * 100}%`, minHeight: d.value ? 3 : 0, background: color, opacity: hover === null || hover === i ? 1 : 0.45 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 pl-7 pt-2 sm:gap-2.5">
        {data.map((d, i) => <span key={i} className={`flex-1 text-center text-[10px] text-muted ${dense && i % 2 ? "invisible" : ""}`}>{d.label}</span>)}
      </div>
    </div>
  );
}

export function Donut({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const R = 52, C = 2 * Math.PI * R; let off = 0;
  if (!total) return <p className="py-10 text-center text-sm text-muted">No focus time logged yet.</p>;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 128 128" className="h-36 w-36 -rotate-90" role="img" aria-label="Focus time by category">
        <circle cx="64" cy="64" r={R} fill="none" stroke="rgb(var(--surface2))" strokeWidth="16" />
        {slices.map((s) => { const len = (s.value / total) * C; const el = <circle key={s.label} cx="64" cy="64" r={R} fill="none" stroke={s.color} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} />; off += len; return el; })}
      </svg>
      <ul className="space-y-1.5 text-sm">
        {slices.map((s) => <li key={s.label} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />{s.label}<span className="text-muted">· {Math.round(s.value)}m</span></li>)}
      </ul>
    </div>
  );
}
