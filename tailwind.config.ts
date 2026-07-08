import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1a1a2e',
          light: '#16213e',
          card: 'rgba(22, 33, 62, 0.85)',
        },
      },
      backdropBlur: {
        toolbar: '12px',
      },
    },
  },
  plugins: [],
} satisfies Config
