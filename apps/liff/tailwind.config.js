/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Sarabun', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#FBF0EB',
          100: '#F5D9CC',
          200: '#EAAF95',
          300: '#D8845F',
          400: '#C15F3C',
          500: '#A34E30',
          600: '#8A4028',
          700: '#6E3320',
          800: '#522618',
          900: '#37190F',
        },
        cream: {
          50:  '#FFFFFF',
          100: '#F4F3EE',
          200: '#EAE8E1',
          300: '#D8D5CC',
          400: '#C8C4BA',
          500: '#B1ADA1',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          warm:    '#F4F3EE',
        },
      },
    },
  },
  plugins: [],
};
