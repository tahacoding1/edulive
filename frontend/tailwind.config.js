/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:          '#06091a',
        surface:     '#0c1228',
        elevated:    '#111d35',
        card:        '#162040',
        border:      '#1c2d4f',
        borderLight: '#243658',
        primary:     '#2979ff',
        primaryDim:  '#1a4a99',
        accent:      '#00d4ff',
        success:     '#00e676',
        danger:      '#ff3d71',
        warning:     '#ffb300',
        textBase:    '#dce8ff',
        textDim:     '#7a93c0',
        textMuted:   '#3d5478',
      },
      fontFamily: {
        sans:  ['Outfit', 'sans-serif'],
        mono:  ["'JetBrains Mono'", 'monospace'],
      },
      boxShadow: {
        glow:  '0 0 24px rgba(41,121,255,0.35)',
        card:  '0 20px 60px rgba(0,0,0,0.5)',
        panel: '0 8px 32px rgba(0,0,0,0.4)',
      },
      animation: {
        'pulse-dot': 'pulseDot 1.2s ease-in-out infinite',
        'fade-in':   'fadeIn 0.3s ease',
        'slide-up':  'slideUp 0.3s ease',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        pulseDot: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.2 } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:  { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
