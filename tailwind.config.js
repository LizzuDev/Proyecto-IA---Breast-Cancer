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
        surface: {
          bg: '#FAFAFB',
          card: '#FFFFFF',
          border: '#EAECEF',
          subtle: '#F4F5F7',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '12px',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
