import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#09090b",
        panel: "#0f0f12",
        border: "#1f1f24",
        muted: "#71717a",
        text: "#fafafa",
        accent: "#7c5cff",
        "accent-soft": "#1a1530",
        warn: "#f5a524",
        danger: "#ef4444",
        ok: "#22c55e",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Inter", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
