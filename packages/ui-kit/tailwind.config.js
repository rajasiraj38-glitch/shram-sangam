// packages/ui-kit/tailwind.config.js
// Shared Tailwind config — extend this in each app

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],  // Each app adds its own content paths
  theme: {
    extend: {
      colors: {
        // Brand palette — earthy, cooperative feel
        brand: {
          50:  '#fdf6ec',
          100: '#faebd2',
          200: '#f4d3a5',
          300: '#ebb66e',
          400: '#e09240',
          500: '#d4721f',  // primary orange
          600: '#bc5918',
          700: '#9c4317',
          800: '#7e361a',
          900: '#672e18',
        },
        coop: {
          green:  '#16a34a',  // success / worker available
          yellow: '#ca8a04',  // pending / in-progress
          red:    '#dc2626',  // urgent / disputed
          blue:   '#2563eb',  // info / governance
          purple: '#7c3aed',  // mutual aid / dividend
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        hindi: ['"Noto Sans Devanagari"', 'sans-serif'],
      },
      borderRadius: {
        card: '0.75rem',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
