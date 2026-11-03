/** @type {import('tailwindcss').Config} */

// Every colour comes from a CSS variable in src/index.css (Deep Ocean theme).
// Light and dark only swap the variables, so all slate/gray/white utilities follow automatically.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const neutral = {
  50: v("n-50"), 100: v("n-100"), 200: v("n-200"), 300: v("n-300"), 400: v("n-400"), 500: v("n-500"),
  600: v("n-600"), 700: v("n-700"), 800: v("n-800"), 900: v("n-900"), 950: v("n-950"),
};

export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: neutral,
        gray: neutral,
        white: v("surface"),         // cards / panels (not pure white); text-white = contrast text on brand
        ground: v("n-50"),           // page background
        brand: { DEFAULT: v("brand"), dark: v("brand-dark"), soft: v("brand-soft") },
        aqua: v("aqua"),             // the one highlight colour (key button on the band, busiest hour)
        ocean: { DEFAULT: v("ocean"), deep: v("ocean-deep") },
      },
      fontFamily: {
        sans: ['var(--font-latin)', 'var(--font-rtl)', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
      // corners follow the user's design (sharp / soft / round)
      borderRadius: { md: 'var(--r-md)', lg: 'var(--r-lg)', xl: 'var(--r-xl)', '2xl': 'var(--r-2xl)', '3xl': 'var(--r-3xl)' },
      boxShadow: {
        card: 'var(--shadow-card)', // soft / flat / raised from the user's design
        pop: '0 18px 40px -16px rgb(var(--shadow) / 0.55)',
      },
    },
  },
  plugins: [],
};
