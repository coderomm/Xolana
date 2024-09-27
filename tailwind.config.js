/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'custom-gradient': 'var(--Bg-background, linear-gradient(95deg, #181818 7.27%, #151515 99.21%))',
      },
      colors: {},
      boxShadow: {
        'custom': 'var(0 0 #0000,0 0 #0000)',
      },
    },
  },
  plugins: [],
}