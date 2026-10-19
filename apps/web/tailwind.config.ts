import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#2563EB",
          "blue-hover": "#1D4ED8",
          "blue-light": "#EFF6FF",
        },
        surface: {
          light: "#F7F8FA",
          "dark-bg": "#0B0D10",
          "dark-surface": "#12161C",
          "dark-elevated": "#1A2029",
        },
        content: {
          "primary-light": "#111827",
          "secondary-light": "#667085",
          "primary-dark": "#F9FAFB",
          "secondary-dark": "#A7B0BE",
        },
        border: {
          light: "#E5E7EB",
          dark: "#2B3441",
        },
        status: {
          success: "#15803D",
          warning: "#B45309",
          danger: "#B91C1C",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
