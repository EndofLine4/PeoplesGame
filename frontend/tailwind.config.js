/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
          dark: '#5B21B6'
        },
        accent: {
          pink: '#EC4899',
          yellow: '#FBBF24',
          green: '#10B981',
          blue: '#3B82F6'
        }
      },
      fontFamily: {
        display: ['system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: []
};
