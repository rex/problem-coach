import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07070a",
          900: "#0b0c12",
          800: "#121424",
          700: "#191c33"
        },
        neon: {
          400: "#41f2d0",
          500: "#3adbc1",
          600: "#2bb6a2"
        },
        ember: {
          400: "#f1b38a",
          500: "#ea8b4c"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(65, 242, 208, 0.18), 0 8px 24px rgba(65, 242, 208, 0.15)",
        soft: "0 16px 40px rgba(0, 0, 0, 0.45)"
      },
      keyframes: {
        floatUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(65, 242, 208, 0.0)" },
          "50%": { boxShadow: "0 0 24px 4px rgba(65, 242, 208, 0.16)" }
        }
      },
      animation: {
        "float-up": "floatUp 0.6s ease-out forwards",
        "pulse-glow": "pulseGlow 2.2s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
