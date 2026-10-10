import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        brand: {
          50: '#eef4f8',
          100: '#d6e6ee',
          200: '#adccdd',
          300: '#7aabc4',
          400: '#4a86a5',
          500: '#2c6483',
          600: '#1f4d68',
          700: '#173c53',
          800: '#12395b',
          900: '#0b1220',
          950: '#070c15',
        },
        pulse: {
          400: '#3fe0c4',
          500: '#00c2a8',
          600: '#009c86',
        },
        status: {
          normal: '#1e9e6b',
          elevated: '#c98a12',
          incident: '#d1493f',
          unknown: '#6b7280',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'pulse-line': 'pulseLine 2.4s ease-in-out infinite',
      },
      keyframes: {
        pulseLine: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.4)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
