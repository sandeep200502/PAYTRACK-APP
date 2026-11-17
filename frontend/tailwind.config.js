/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef4ff', 100: '#dbe6fe', 200: '#bfd3fe', 300: '#93b4fd', 400: '#6090fa',
          500: '#3b6ef5', 600: '#2554ea', 700: '#1d42d7', 800: '#1e37ae', 900: '#1e3389',
        },
        ink: { 900: '#0f172a', 700: '#334155', 500: '#64748b', 300: '#cbd5e1' },
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)',
        pop: '0 10px 30px -10px rgba(15,23,42,0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        'slide-in': { from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in .15s ease-out',
        'slide-up': 'slide-up .2s ease-out',
        'slide-in': 'slide-in .2s ease-out',
      },
    },
  },
  plugins: [],
};
