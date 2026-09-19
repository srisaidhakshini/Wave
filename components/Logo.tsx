/** Pixel-art wave mark: two sine rows drawn on a 16×16 grid. */
export function LogoMark({ size = 28 }: { size?: number }) {
  const px = (yOff: number, op: number) =>
    Array.from({ length: 12 }, (_, i) => <rect key={`${yOff}-${i}`} x={2 + i} y={yOff + Math.round(1.6 * Math.sin((i * Math.PI) / 3))} width="1" height="2" fill="rgb(var(--accent-fg))" opacity={op} />);
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className="pixel" aria-hidden>
      <rect width="16" height="16" rx="3" fill="rgb(var(--accent))" />
      {px(5, 1)}{px(10, 0.55)}
    </svg>
  );
}
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="text-lg font-bold tracking-tight">Wave</span>
    </span>
  );
}
