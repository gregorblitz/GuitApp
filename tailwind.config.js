/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#242426",
        pillBg: "#38383a",
        stringColor: "#e0d2b4",
        sliderBlue: "#2ea8ff",
        rootActive: "#fff8e7",
      },
    },
  },
  plugins: [],
}
