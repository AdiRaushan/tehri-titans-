import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#000318",
          900: "#01072F", // Midnight Navy - primary background
          800: "#040E47", // Card surfaces
          700: "#07196D", // Card borders & hovers
          600: "#0B26A2",
        },
        ice: {
          500: "#0ACFFB", // Electric Cyan - accents & primary interactive
          400: "#3CE0FF",
          300: "#6DF1FF",
          200: "#F2FAFB", // Ice White
        },
        lime: {
          500: "#0ACFFB", // Redirect lime to Electric Cyan for branding uniformity
          400: "#3CE0FF",
        },
        frost: "#ffffff",
        brand: {
          navy: "#01072F",
          cyan: "#0ACFFB",
          white: "#ffffff",
          card: "#040E47",
          border: "#07196D",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        measure: "68ch",
      },
      letterSpacing: {
        tightest: "-0.02em",
      },
      boxShadow: {
        "glow-ice": "0 0 40px -8px rgba(10, 207, 251, 0.4)",
        "glow-lime": "0 0 40px -8px rgba(10, 207, 251, 0.45)",
        "glow-cyan": "0 0 30px -5px rgba(10, 207, 251, 0.35)",
        "glow-cyan-sm": "0 0 15px -3px rgba(10, 207, 251, 0.25)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
