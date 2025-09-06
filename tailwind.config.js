/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: { cute: "0 6px 20px rgba(0,0,0,0.08)" },
      borderRadius: { cute: "1.25rem" },
    },
  },
  plugins: [],
};