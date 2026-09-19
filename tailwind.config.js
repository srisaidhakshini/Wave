const c = (v) => `rgb(var(--${v}) / <alpha-value>)`;
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { bg: c("bg"), side: c("side"), surface: c("surface"), surface2: c("surface2"), line: "rgb(var(--line) / var(--line-a))", fg: c("fg"), muted: c("muted"), faint: c("faint"), accent2: c("accent2"),
        accent: c("accent"), "accent-fg": c("accent-fg"), coral: c("coral"), iris: c("iris"), danger: c("danger"), ok: c("ok") },
      fontFamily: { sans: ["var(--font-sans)", "Georgia", "serif"], display: ["var(--font-sans)", "Georgia", "serif"] },
      keyframes: { rise: { from: { opacity: 0, transform: "translateY(8px)" }, to: { opacity: 1, transform: "none" } },
        drift: { "0%,100%": { transform: "translateX(0)" }, "50%": { transform: "translateX(-40px)" } },
        pixelwave: { from: { transform: "translateX(0)" }, to: { transform: "translateX(-48px)" } }, bob: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-2px)" } } },
      animation: { rise: "rise .35s ease both", drift: "drift 14s ease-in-out infinite", pixelwave: "pixelwave 6s steps(12) infinite", bob: "bob 3s steps(4) infinite" },
    },
  },
  plugins: [],
};
