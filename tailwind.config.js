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
          void: '#0B1019',
          depth: '#111823',
          surface: '#161D2B',
          // Elevated surfaces for cards / panels
          card: '#141B27',
          'card-hover': '#1A2231',
          border: 'rgba(150, 175, 205, 0.10)',
          'border-strong': 'rgba(150, 175, 205, 0.18)',
          mist: 'rgba(170, 190, 210, 0.12)',
          wave: 'rgba(140, 170, 200, 0.18)',
          accent: 'rgba(160, 195, 220, 0.28)',
          // Cool accent for interactive elements
          glow: '#8FB4DC',
          'glow-soft': 'rgba(143, 180, 220, 0.15)',
          // Text ramp on dark
          'text-primary': 'rgba(222, 228, 236, 0.92)',
          'text-secondary': 'rgba(210, 218, 228, 0.55)',
          'text-muted': 'rgba(200, 210, 222, 0.32)',
          'text-faint': 'rgba(200, 210, 222, 0.18)',
          // Semantic states (muted for dark theme)
          success: 'rgba(120, 190, 160, 0.9)',
          'success-soft': 'rgba(120, 190, 160, 0.12)',
          warn: 'rgba(220, 180, 130, 0.9)',
          danger: 'rgba(220, 140, 140, 0.9)',
          'danger-soft': 'rgba(220, 140, 140, 0.12)',
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
