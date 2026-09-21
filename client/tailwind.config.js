/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        resolve: {
          950: '#0c0c0e',
          900: '#131316',
          850: '#18181d',
          800: '#202027',
          750: '#26262f',
          700: '#2e2e38',
          600: '#3f3f4c',
          500: '#5c5c6d',
          400: '#8b8b9e',
          orange: '#ff7700',
          'orange-hover': '#ff8c1a',
          cyan: '#00c3e3',
          red: '#ef4444',
          green: '#22c55e',
          purple: '#a855f7'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      }
    },
  },
  plugins: [],
}
