import type { Config } from 'tailwindcss'

// EU-flag-derived brand palette. `eu-blue` is the European flag blue
// (#003399) extended into a usable scale; `eu-gold` is the star gold
// (#FFCC00). Use the named scales everywhere so the blue/yellow theme
// stays consistent across marketing + auth + app surfaces.
export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'eu-blue': {
          50:  '#eef2ff',
          100: '#dce4ff',
          200: '#b6c6ff',
          300: '#8aa1ff',
          400: '#5f7bf5',
          500: '#3a55db',
          600: '#1f3bb8',
          700: '#003399', // EU flag blue
          800: '#002b80',
          900: '#001f5c',
          950: '#001233',
        },
        'eu-gold': {
          50:  '#fffbeb',
          100: '#fff4c2',
          200: '#ffe788',
          300: '#ffd94d',
          400: '#ffcc00', // EU star gold
          500: '#e6b800',
          600: '#bf9500',
          700: '#996f00',
          800: '#7a5600',
          900: '#5c3f00',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
