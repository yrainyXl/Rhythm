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
          mist: 'rgba(170, 190, 210, 0.12)',
          wave: 'rgba(140, 170, 200, 0.18)',
          accent: 'rgba(160, 195, 220, 0.28)',
        },
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
