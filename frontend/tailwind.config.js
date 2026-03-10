/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E293B",
        accent: "#3B82F6",
        background: "#F1F5F9"
      }
    },
  },
  plugins: [],
}