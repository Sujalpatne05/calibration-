/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Poppins', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand blue used for primary buttons / active states
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8fb6ff',
          400: '#5b8dfa',
          500: '#3568e5',
          600: '#2451cc',
          700: '#1e40af',
          800: '#1d3a93',
          900: '#1d3577',
        },
        // Soft page background
        canvas: '#f5f6fb',
        ink: {
          DEFAULT: '#1f2a44',
          soft: '#5b6478',
          faint: '#9aa1b1',
        },
        gold: {
          DEFAULT: '#e0b020',
          light: '#f3d98a',
        },
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(31, 42, 68, 0.04), 0 8px 24px rgba(31, 42, 68, 0.06)',
        soft: '0 1px 3px rgba(31, 42, 68, 0.05), 0 12px 32px rgba(31, 42, 68, 0.08)',
        ring: '0 10px 40px rgba(53, 104, 229, 0.18)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
        'fade-up': 'fade-up 0.4s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
      },
    },
  },
  plugins: [],
}
