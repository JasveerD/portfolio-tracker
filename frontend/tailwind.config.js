/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        t: {
          bg: "#0b0e11",
          panel: "#151921",
          input: "#1c2333",
          border: "#2a3142",
          text: "#e6edf3",
          muted: "#7d8590",
          accent: "#f0a030",
          green: "#3fb950",
          red: "#f85149",
          "green-bg": "rgba(63,185,80,0.12)",
          "red-bg": "rgba(248,81,73,0.12)",
          "accent-bg": "rgba(240,160,48,0.10)",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
