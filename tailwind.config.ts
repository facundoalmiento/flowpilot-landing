import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        morga: {
          bg: "rgb(var(--morga-bg) / <alpha-value>)",
          surface: "rgb(var(--morga-surface) / <alpha-value>)",
          surfaceAlt: "rgb(var(--morga-surface-alt) / <alpha-value>)",
          text: "rgb(var(--morga-text) / <alpha-value>)",
          muted: "rgb(var(--morga-muted) / <alpha-value>)",
          line: "rgb(var(--morga-line) / <alpha-value>)",
          accent: "rgb(var(--morga-accent) / <alpha-value>)",
          accentSoft: "rgb(var(--morga-accent-soft) / <alpha-value>)",
          dark: "rgb(var(--morga-dark) / <alpha-value>)"
        }
      },
      fontFamily: {
        body: ["Manrope", "sans-serif"],
        display: ["Cormorant Garamond", "serif"]
      },
      boxShadow: {
        panel: "0 18px 45px rgba(47, 31, 18, 0.08)",
        soft: "0 12px 26px rgba(47, 31, 18, 0.06)"
      },
      borderRadius: {
        panel: "24px"
      }
    }
  },
  plugins: []
} satisfies Config;
