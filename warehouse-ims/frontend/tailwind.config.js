/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--color-bg) / <alpha-value>)",
        sidebar: "rgb(var(--color-sidebar) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          hover: "rgb(var(--color-primary-hover) / <alpha-value>)",
        },
        text: {
          DEFAULT: "rgb(var(--color-text) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
        },
        overlay: "rgb(var(--color-overlay) / <alpha-value>)",
        subtle: "rgb(var(--color-border-subtle) / <alpha-value>)",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      borderColor: {
        DEFAULT: "rgb(var(--color-border-subtle) / <alpha-value>)",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "sans-serif"],
        display: ["'Sora'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(0, 0, 0, 0.35)",
        glow: "0 0 0 1px rgba(184, 115, 51, 0.25), 0 8px 24px rgba(184, 115, 51, 0.15)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
