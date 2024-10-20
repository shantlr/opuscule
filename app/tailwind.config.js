/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        mainbg: '#EDF2F4',
        secondarybg: 'white',
        accentbg: '#2B2D42',
        'accentbg-text': '#EDF2F4',
        primary: '#D90429',
        primarylight: '#EF233C',
        grey: '#8D99AE',
        light: '#8D99AE',
      },
    },
  },
  plugins: [],
};
