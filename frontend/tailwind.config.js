/** @type {import('tailwindcss').Config} */
export default {
  // Sötét mód: a <html> elemen lévő "dark" class kapcsolja
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand tokenek – ugyanazok mint a backendben használt hex-ek
        brand: {
          50:  '#E1F5EE',
          100: '#9FE1CB',
          400: '#1D9E75',
          600: '#0F6E56',
          900: '#04342C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
