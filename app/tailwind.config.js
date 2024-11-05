/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './common/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        mainbg: '#E8E4ED',
        // mainbg: '#EDF2F4',
        secondarybg: 'white',
        accentbg: '#2B2D42',
        'accentbg-text': '#EDF2F4',

        accent: '#818cf8',
        // primary: '#D90429',
        // primaryLigth: '#EF233C',

        grey: '#8D99AE',
        light: '#8D99AE',
      },
    },
  },
  plugins: [],
};
