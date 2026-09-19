const COLS = [1, 2, 2, 3, 3, 2, 2, 1, 1, 0, 0, 0]; // one 12-column period → 48px at 4px cells

/** Subtle stepped pixel wave. Loops seamlessly by sliding one period. */
export function PixelWave({ className = "", opacity = 0.35, animate = true }: { className?: string; opacity?: number; animate?: boolean }) {
  const cell = 4, rows = 3, reps = 40;
  return (
    <div className={`overflow-hidden ${className}`} aria-hidden style={{ height: rows * cell, opacity }}>
      <svg className={`pixel ${animate ? "animate-pixelwave" : ""}`} width={COLS.length * cell * reps} height={rows * cell} style={{ maxWidth: "none" }}>
        {Array.from({ length: reps }, (_, r) => COLS.map((h, i) => h > 0 && (
          <rect key={`${r}-${i}`} x={(r * COLS.length + i) * cell} y={(rows - h) * cell} width={cell} height={h * cell} fill="rgb(var(--accent))" />
        )))}
      </svg>
    </div>
  );
}

/** Tiny pixel droplet used as a section bullet. */
export function Droplet({ className = "" }: { className?: string }) {
  return (
    <svg width="10" height="12" viewBox="0 0 5 6" className={`pixel inline-block animate-bob ${className}`} aria-hidden>
      <rect x="2" y="0" width="1" height="1" fill="rgb(var(--accent2))" /><rect x="1" y="1" width="3" height="1" fill="rgb(var(--accent2))" />
      <rect x="1" y="2" width="3" height="3" fill="rgb(var(--accent))" /><rect x="2" y="5" width="1" height="1" fill="rgb(var(--accent))" />
    </svg>
  );
}

/** Segmented pixel progress bar (XP / progress). */
export function PixelBar({ pct, segments = 12, color = "rgb(var(--accent))" }: { pct: number; segments?: number; color?: string }) {
  const on = Math.round(Math.max(0, Math.min(1, pct)) * segments);
  return (
    <div className="flex gap-[2px]" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
      {Array.from({ length: segments }, (_, i) => <span key={i} className="h-2 flex-1" style={{ background: i < on ? color : "rgb(var(--line) / .1)" }} />)}
    </div>
  );
}
