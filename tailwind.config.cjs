/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    './src/**/*.{js, ts, jsx, tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-white': '#F2F2F2',
        'accent': '#FFC451',
      }
    },
  },
  plugins: [],
}
