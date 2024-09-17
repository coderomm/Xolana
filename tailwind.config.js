/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {},
      boxShadow: {
        'custom': 'var(0 0 #0000,0 0 #0000)',
      },      
    },
  },
  plugins: [],
}