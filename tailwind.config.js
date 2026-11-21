/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: { navy: "#0b1f4b", gap: "#d4145a", ok: "#0f766e", warn: "#a15c07", locked: "#667085" },
      fontFamily: { display: ['"Red Hat Display"', "sans-serif"], sans: ['"Red Hat Text"', "sans-serif"] },
    },
  },
  plugins: [],
};
