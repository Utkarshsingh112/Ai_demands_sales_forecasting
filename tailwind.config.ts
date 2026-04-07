import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Syne", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      colors: {
        signal: colors.amber,
        insight: colors.teal,
      },
      boxShadow: {
        'signal-glow': '0 0 20px rgba(245,158,11,0.2)',
        'insight-glow': '0 0 20px rgba(13,148,136,0.2)'
      }
    },
  },
  plugins: [],
}
