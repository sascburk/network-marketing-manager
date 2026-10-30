import type { Config } from "tailwindcss";

const config: Config = {
  // "class": manuelle Umschaltung moeglich; ein Script setzt die Klasse initial
  // automatisch anhand von prefers-color-scheme (Auto-Dark-Mode).
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d9e8ff",
          200: "#bcd7ff",
          300: "#8ebdff",
          400: "#5998ff",
          500: "#3270f6",
          600: "#1f53eb",
          700: "#1840d8",
          800: "#1a36af",
          900: "#1b338a",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
