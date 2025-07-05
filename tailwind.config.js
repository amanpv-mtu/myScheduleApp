/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Crucial: tells Tailwind where to find your classes
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'], // Add this if you want to use the 'Inter' font
      },
    },
  },
  plugins: [],
}