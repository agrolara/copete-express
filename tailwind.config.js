/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#09090b",
        foreground: "#f4f4f5",
        card: {
          DEFAULT: "#121217",
          border: "#27272a",
        },
        brand: {
          purple: "#a855f7",
          "purple-glow": "#c084fc",
          orange: "#f97316",
          "orange-glow": "#fb923c",
          cyan: "#06b6d4",
          red: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
      },
      boxShadow: {
        "neon-purple": "0 0 20px -3px rgba(168, 85, 247, 0.4)",
        "neon-orange": "0 0 20px -3px rgba(249, 115, 22, 0.4)",
        "neon-red": "0 0 20px -3px rgba(239, 68, 68, 0.4)",
      },
      aspectRatio: {
        square: "1 / 1",
      },
    },
  },
  plugins: [],
};
