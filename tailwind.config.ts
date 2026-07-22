import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        morga: {
          bg: "#f5f0e8",
          surface: "#fcf8f2",
          surfaceAlt: "#f0e6d9",
          text: "#201913",
          muted: "#6e6257",
          line: "#d9cabc",
          accent: "#8b5e3c",
          accentSoft: "#dbc3ae",
          dark: "#171311"
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
