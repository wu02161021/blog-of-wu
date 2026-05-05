/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        space: {
          950: '#020617',
          900: '#0b1124',
          800: '#121a33',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(125,211,252,.16), 0 20px 50px rgba(2,6,23,.55)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
