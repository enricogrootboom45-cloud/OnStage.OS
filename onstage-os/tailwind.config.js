/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blackout: '#16140F',
        riser: '#1E1B14',
        cuesheet: '#F6F2E7',
        amber: { DEFAULT: '#E8893A', dim: '#C77530', bright: '#FFA75C' },
        wash: { DEFAULT: '#5C7C93', dim: '#496579' },
        standby: { DEFAULT: '#C44536', dim: '#A6392C' },
        graphite: { DEFAULT: '#5A5544', line: '#332F25' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        desk: '0 1px 0 0 rgba(246,242,231,0.06) inset',
        // status needing attention — used sparingly (low stock, cancelled, overdue)
        alert: '0 0 0 1px rgba(196,69,54,0.35), 0 8px 20px -8px rgba(196,69,54,0.25)',
        // live / in-progress — same amber glow language as the customer-facing app
        glow: '0 0 0 1px rgba(255,167,92,0.25), 0 8px 20px -8px rgba(232,137,58,0.25)',
      },
    },
  },
  plugins: [],
}