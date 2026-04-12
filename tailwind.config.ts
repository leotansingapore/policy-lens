import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "hsl(222.2 84% 4.9%)",
        panel: "hsl(222.2 84% 7%)",
        border: "hsl(217.2 32.6% 25%)",
        muted: "hsl(215 20.2% 75%)",
        text: "hsl(210 40% 98%)",
        accent: "hsl(338 89% 47%)",
        "accent-light": "hsl(338 89% 60%)",
        "accent-soft": "hsl(338 89% 47% / 0.12)",
        warn: "hsl(45 93% 47%)",
        danger: "hsl(0 84% 60%)",
        ok: "hsl(142 76% 36%)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        heading: ["Playfair Display", "Inter", "system-ui", "serif"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
    },
  },
  plugins: [],
} satisfies Config;
