/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'neura-fade': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'neura-scale': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'neura-slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'neura-bounce': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        'neura-spin': {
          to: { transform: 'rotate(360deg)' },
        },
        'neura-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'neura-fade': 'neura-fade 0.3s ease-out both',
        'neura-scale': 'neura-scale 0.35s cubic-bezier(0.4,0,0.2,1) both',
        'neura-slide-up': 'neura-slide-up 0.4s cubic-bezier(0.4,0,0.2,1) both',
        'neura-bounce': 'neura-bounce 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        'neura-spin': 'neura-spin 0.8s linear infinite',
        'neura-float': 'neura-float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
