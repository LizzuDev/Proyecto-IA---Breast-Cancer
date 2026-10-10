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
        // Breast Cancer Awareness & Clinical Diagnostics Palette
        rosepink: {
          50: '#FFF1F4',
          100: '#FFE4E9',
          200: '#FECDD8',
          300: '#FDA4B9',
          400: '#FB7195',
          500: '#F43F6E',
          600: '#E11D58',
          700: '#BE1246',
          800: '#9F123C',
          900: '#881337',
        },
        slateclinical: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#070C18',
        },
        tealclinical: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
