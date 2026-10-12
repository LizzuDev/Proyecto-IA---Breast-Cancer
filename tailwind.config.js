/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        roseclinical: {
          50: '#FFF5F7',
          100: '#FFE8EC',
          200: '#FFD1DA',
          300: '#FCA4B5',
          400: '#F4718D',
          500: '#E8456D',
          600: '#D62754',
          700: '#B41940',
          800: '#951737',
          900: '#7E1832',
        },
        // Superficies con un matiz rosa sutil (antes eran grises neutros,
        // por eso el rosa nunca llegaba a verse en el fondo).
        surface: {
          bg: '#FDF7F8',
          card: '#FFFFFF',
          border: '#F1E4E8',
          subtle: '#FBF0F3',
        }
      },
      fontFamily: {
        sans: ['"Manrope"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm: '2px',
        DEFAULT: '2px',
        md: '3px',
        lg: '4px',
        xl: '6px',
        '2xl': '8px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
