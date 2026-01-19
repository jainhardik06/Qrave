/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: '#f9fafb',
      },
      boxShadow: {
        soft: '0 10px 30px -15px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
};
