/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          dark: '#0B132B',
          navy: '#1C2541',
          slate: '#3A506B',
          light: '#F8FAFC',
          border: '#E2E8F0',
          accent: '#F59E0B', // Saffron/Amber civic accent
          accentHover: '#D97706',
          teal: '#0D9488',
          tealHover: '#0F766E',
          red: '#DC2626',
          emerald: '#10B981'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
