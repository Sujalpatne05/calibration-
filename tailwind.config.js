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
        // Modern vibrant brand colors
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9ddfe',
          300: '#7cc0fd',
          400: '#36a0fa',
          500: '#0d87eb',
          600: '#0069c9',
          700: '#0154a3',
          800: '#054886',
          900: '#0a3c6f',
        },
        // Enhanced secondary colors
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        // Soft page background with gradient support
        canvas: '#f8fafc',
        'canvas-dark': '#f1f5f9',
        ink: {
          DEFAULT: '#0f172a',
          soft: '#475569',
          faint: '#94a3b8',
        },
        gold: {
          DEFAULT: '#f59e0b',
          light: '#fde68a',
          dark: '#d97706',
        },
        success: {
          DEFAULT: '#10b981',
          light: '#d1fae5',
          dark: '#047857',
        },
        danger: {
          DEFAULT: '#ef4444',
          light: '#fee2e2',
          dark: '#dc2626',
        },
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 6px 16px rgba(15, 23, 42, 0.08)',
        'card-hover': '0 4px 6px rgba(15, 23, 42, 0.08), 0 12px 24px rgba(15, 23, 42, 0.12)',
        soft: '0 2px 4px rgba(15, 23, 42, 0.05), 0 12px 28px rgba(15, 23, 42, 0.1)',
        ring: '0 0 0 3px rgba(13, 135, 235, 0.15)',
        glow: '0 0 40px rgba(13, 135, 235, 0.3)',
        'glow-purple': '0 0 40px rgba(168, 85, 247, 0.3)',
        xl: '0 10px 40px rgba(15, 23, 42, 0.15)',
        '2xl': '0 20px 60px rgba(15, 23, 42, 0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-brand': 'linear-gradient(135deg, #0d87eb 0%, #0069c9 100%)',
        'gradient-purple': 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
        'gradient-sunset': 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
        'gradient-ocean': 'linear-gradient(135deg, #0d87eb 0%, #a855f7 100%)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-down': {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.94)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(13, 135, 235, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(13, 135, 235, 0.6)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-down': 'fade-down 0.4s ease-out both',
        'slide-in-right': 'slide-in-right 0.3s ease-out both',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
