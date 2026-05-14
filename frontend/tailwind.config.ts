import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        line: "#D8DEE8",
        pass: "#15803D",
        fail: "#DC2626",
        warn: "#B45309",
        run: "#2563EB",
      },
    },
  },
  plugins: [],
};

export default config;
