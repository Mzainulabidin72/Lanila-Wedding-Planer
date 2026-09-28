import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Lanila brand chrome (from brand guide) — used for nav/logo/focus states
        brand: {
          DEFAULT: "#6366F1",
          light: "#8B5CF6",
          dark: "#0F172A",
        },
        // Wedding-domain accent — the "warmth" layer specific to this app
        blush: {
          50: "#FBF3F1",
          100: "#F6E4E0",
          200: "#EBC5BC",
          300: "#DEA093",
          400: "#CC7A6A",
          500: "#B85C4C", // primary blush accent
          600: "#9A473A",
          700: "#7A382E",
        },
        surface: {
          DEFAULT: "#FAF8F6",
          card: "#FFFFFF",
          muted: "#F1EDE9",
          border: "#E7E1DA",
        },
        ink: {
          DEFAULT: "#241E1C",
          soft: "#5B534E",
          faint: "#9A928C",
        },
        success: { DEFAULT: "#4C8863", bg: "#EAF3EC" },
        warning: { DEFAULT: "#B8863C", bg: "#FBF2E3" },
        danger: { DEFAULT: "#B8493F", bg: "#FBEAE8" },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(36,30,28,0.04), 0 8px 24px -12px rgba(36,30,28,0.10)",
      },
    },
  },
  plugins: [],
};
export default config;
