/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito Sans"', 'sans-serif'],
        display: ['Nunito', 'sans-serif'],
      },
      colors: {
        bg: '#FFF8F0',
        card: '#FFFFFF',
        border: '#F0E4D4',
        text1: '#2D2013',
        text2: '#6B5744',
        text3: '#A89080',
        orange: { DEFAULT: '#FF7B35', light: '#FFE8D6' },
        yellow: { DEFAULT: '#FFD166', light: '#FFF5D6' },
        green: { DEFAULT: '#06D6A0', light: '#D6F7EF' },
        purple: { DEFAULT: '#845EC2', light: '#EAD9FF' },
        pink: { DEFAULT: '#FF6B9D', light: '#FFE0EE' },
      },
      borderRadius: {
        card: '18px',
        modal: '24px',
      },
    },
  },
  plugins: [],
}
