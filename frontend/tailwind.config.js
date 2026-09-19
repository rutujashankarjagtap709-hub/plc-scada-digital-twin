/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        scada: {
          bg: '#0a0d14',
          panel: '#111723',
          card: '#161e2e',
          border: '#232e42',
          muted: '#64748b',
          accent: '#0284c7',
          green: '#10b981',
          greenGlow: 'rgba(16, 185, 129, 0.25)',
          amber: '#f59e0b',
          amberGlow: 'rgba(245, 158, 11, 0.25)',
          red: '#ef4444',
          redGlow: 'rgba(239, 68, 68, 0.35)',
          cyan: '#06b6d4'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'Fira Code', 'Courier New', 'monospace'],
        industrial: ['Inter', 'Roboto', 'system-ui', 'sans-serif']
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}
