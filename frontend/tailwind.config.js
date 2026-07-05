/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4f9',
          100: '#e1e9f2',
          200: '#c2d2e6',
          300: '#94b3d3',
          400: '#5e8ebe',
          500: '#3c71a3',
          600: '#2e5885',
          700: '#26476c',
          800: '#223d5a',
          900: '#20344d',
          950: '#152233',
        },
      },
      borderRadius: {
        'enterprise': '12px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
