export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
          100: '#dde6ff',
          500: '#3b5bdb',
          600: '#2f4ac7',
          700: '#2239b0',
          900: '#131d5e',
        },
        surface: {
          DEFAULT: '#0d0f1a',
          card: '#141626',
          border: '#1e2235',
          hover: '#1a1d32',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    }
  },
  plugins: []
}
