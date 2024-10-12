import * as colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        mainbg: colors.stone['100'],
      },
    },
  },
  plugins: [],
};
