/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        brand: {
          50: '#eef6ff', 100: '#d9eaff', 200: '#bcdbff', 300: '#8ec4ff',
          400: '#59a3ff', 500: '#3380ff', 600: '#1b5ef5', 700: '#1449e1',
          800: '#173cb6', 900: '#19378f', 950: '#142357',
        },
      },
      boxShadow: { card: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)' },
    },
  },
  plugins: [],
};
