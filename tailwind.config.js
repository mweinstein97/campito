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
        bg:     '#F5F3FF',
        card:   '#FFFFFF',
        border: '#DDD6FE',
        text1:  '#1E1B4B',
        text2:  '#4C4581',
        text3:  '#9D95CC',
        orange: { DEFAULT: '#4F46E5', light: '#EEF2FF' },
        yellow: { DEFAULT: '#E879A0', light: '#FDF2F8' },
        green:  { DEFAULT: '#16A34A', light: '#DCFCE7' },
        purple: { DEFAULT: '#9333EA', light: '#F3E8FF' },
        pink:   { DEFAULT: '#EC4899', light: '#FCE7F3' },
      },
      borderRadius: {
        card:  '18px',
        modal: '24px',
      },
    },
  },
  plugins: [],
}
