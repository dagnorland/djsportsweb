import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Stage palette (stage_colors.dart) — CSS variables, so it follows
        // the dark (default) / light theme. See app/globals.css.
        stage: {
          bg: "hsl(var(--stage-bg) / <alpha-value>)",
          surface: "hsl(var(--stage-surface) / <alpha-value>)",
          panel: "hsl(var(--stage-panel) / <alpha-value>)",
          high: "hsl(var(--stage-high) / <alpha-value>)",
          divider: "hsl(var(--stage-divider) / <alpha-value>)",
          text: "hsl(var(--stage-text) / <alpha-value>)",
          muted: "hsl(var(--stage-muted) / <alpha-value>)",
        },
        // Playlist type colours (Flutter TypeColor extension)
        djtype: {
          hotspot: "#F44336",   // Colors.red
          match: "#4CAF50",     // Colors.green
          funStuff: "#2196F3",  // Colors.blue
          preMatch: "hsl(var(--type-prematch) / <alpha-value>)", // black, grey-400 on dark
          archived: "#69F0AE",  // Colors.greenAccent
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        filter: {
          "blur-20": "blur(20px)",
          "blur-25": "blur(25px)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
