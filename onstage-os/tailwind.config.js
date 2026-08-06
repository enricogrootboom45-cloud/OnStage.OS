/**
 * Color semantics — the rule, not just the palette:
 *
 *   amber    → the ONE primary action per screen, live/active states, and prices.
 *              Never used for decorative tags, genres, or informational metadata.
 *   wash     → links, secondary/informational tags (genre, category), non-urgent metadata.
 *   standby  → destructive or urgent-only (cancelled, sold out, errors). Never decorative.
 *   graphite → borders, dividers, disabled states. Never text meant to be read as content.
 *
 * Text opacity — pick from this scale, don't invent new fractions per screen:
 *   text-cuesheet        → primary content (default, no opacity suffix)
 *   text-cuesheet/70     → secondary content (descriptions, body copy that isn't the headline)
 *   text-cuesheet/40     → metadata/labels (timestamps, counts, mono uppercase labels)
 *   text-cuesheet/25     → placeholder-tier, barely-there (empty-state subtext only)
 *
 * If a screen needs a fifth shade, that's a sign the hierarchy needs rethinking,
 * not a new opacity value.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blackout: '#16140F', riser: '#1E1B14', cuesheet: '#F6F2E7',
        amber: { DEFAULT: '#E8893A', dim: '#C77530', bright: '#FFA75C' },
        wash: { DEFAULT: '#5C7C93', dim: '#496579' },
        standby: { DEFAULT: '#C44536', dim: '#A6392C' },
        graphite: { DEFAULT: '#5A5544', line: '#332F25' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body:    ['"Inter"', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        // ordinary card — subtle bevel highlight, no color
        riser: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        // live / featured content — amber glow instead of a flat border
        glow: '0 0 0 1px rgba(255,167,92,0.25), 0 12px 28px -10px rgba(232,137,58,0.28)',
        // raised FAB
        fab: '0 0 0 5px #16140F, 0 0 24px 4px rgba(232,137,58,0.45), 0 8px 18px -4px rgba(0,0,0,0.6)',
      },
      fontSize: {
        // Named scale — see IDENTITY.md. Use these instead of text-2xl /
        // text-[11px] bracket values, so type scale stops being a
        // per-screen judgment call.
        'display-hero': ['3.5rem',    { lineHeight: '1',    fontWeight: '700', letterSpacing: '-0.02em' }], // 56px
        'display-1':    ['2rem',      { lineHeight: '1.15', fontWeight: '700', letterSpacing: '-0.01em' }], // 32px
        'stat':         ['2.75rem',   { lineHeight: '1.05', fontWeight: '600' }],                            // 44px
        'label':        ['0.6875rem',{ lineHeight: '1.3',  letterSpacing: '0.08em' }],                      // 11px
        'micro':        ['0.625rem', { lineHeight: '1.3',  letterSpacing: '0.06em' }],                      // 10px
      },
      screens: { xs: '375px' },
    },
  },
  plugins: [],
}