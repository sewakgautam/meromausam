/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        nepali: ['Noto Sans Devanagari', 'sans-serif'],
      },
      colors: {
        sky: { 950: '#0a1628' },
      },
    },
  },
  plugins: [],
};
