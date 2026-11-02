/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        t: {
          bg: "#000000",
          panel: "#0a0a0a",
          input: "#111111",
          border: "#222222",
          text: "#e0e0e0",
          muted: "#666666",
          accent: "#ff8800",
          green: "#00d26a",
          red: "#ff3333",
          "green-bg": "rgba(0,210,106,0.10)",
          "red-bg": "rgba(255,51,51,0.10)",
          "accent-bg": "rgba(255,136,0,0.08)",
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        DEFAULT: "0",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        "3xl": "0",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
