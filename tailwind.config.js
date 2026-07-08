/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        rhythm: {
          void: 'rgb(var(--r-void) / <alpha-value>)',
          depth: 'rgb(var(--r-depth) / <alpha-value>)',
          surface: 'rgb(var(--r-surface) / <alpha-value>)',
          // Elevated surfaces for cards / panels
          card: 'rgb(var(--r-card) / <alpha-value>)',
          'card-hover': 'rgb(var(--r-card-hover) / <alpha-value>)',
          border: 'var(--r-border)',
          'border-strong': 'var(--r-border-strong)',
          mist: 'var(--r-mist)',
          wave: 'var(--r-wave)',
          accent: 'var(--r-accent)',
          // Cool accent for interactive elements
          glow: 'rgb(var(--r-glow) / <alpha-value>)',
          'glow-soft': 'var(--r-glow-soft)',
          // Text ramp
          'text-primary': 'var(--r-text-primary)',
          'text-secondary': 'var(--r-text-secondary)',
          'text-muted': 'var(--r-text-muted)',
          'text-faint': 'var(--r-text-faint)',
          // Semantic states
          success: 'var(--r-success)',
          'success-soft': 'var(--r-success-soft)',
          warn: 'var(--r-warn)',
          danger: 'var(--r-danger)',
          'danger-soft': 'var(--r-danger-soft)',
        },
      },
      fontFamily: {
        serifsc: ['"Noto Serif SC"', 'STSong', '"PingFang SC"', '"Microsoft YaHei"', 'serif'],
      },
      keyframes: {
        'wave-breathe': {
          '0%, 100%': {
            opacity: '0.55',
          },
          '50%': {
            opacity: '0.75',
          },
        },
        'wave-breathe-slow': {
          '0%, 100%': {
            opacity: '0.35',
          },
          '50%': {
            opacity: '0.55',
          },
        },
        'wave-breathe-wide': {
          '0%, 100%': {
            opacity: '0.25',
          },
          '50%': {
            opacity: '0.45',
          },
        },
      },
      animation: {
        'wave-breathe': 'wave-breathe 6s ease-in-out infinite',
        'wave-breathe-slow': 'wave-breathe-slow 7s ease-in-out infinite',
        'wave-breathe-wide': 'wave-breathe-wide 5.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
