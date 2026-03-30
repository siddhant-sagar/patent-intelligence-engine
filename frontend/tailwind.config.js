/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-purple': '#7C3AED',
        'brand-purple-light': '#9333EA',
        'brand-purple-dim': '#5B21B6',
        'brand-cyan': '#0891B2',
        'brand-green': '#059669',
        'dark-bg': '#0F1117',
        'dark-card': '#1A1D26',
        'dark-card-hover': '#1F2333',
        'dark-border': '#2D3748',
        'dark-border-light': '#374151',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-border': 'glowBorder 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'dot-bounce': 'dotBounce 1.4s ease-in-out infinite',
      },
      keyframes: {
        glowBorder: {
          '0%, 100%': { borderColor: '#7C3AED', boxShadow: '0 0 8px #7C3AED40' },
          '50%': { borderColor: '#9333EA', boxShadow: '0 0 16px #9333EA60' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        dotBounce: {
          '0%, 80%, 100%': { transform: 'scale(0.6)', opacity: '0.4' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
