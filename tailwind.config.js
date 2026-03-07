/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body:    ['Nunito', 'sans-serif'],
      },
      colors: {
        amber: {
          50:  '#FFFBF0', 100: '#FFF3CC', 200: '#FFE380',
          300: '#FFD040', 400: '#FFC107', 500: '#F59E0B',
          600: '#D97706', 700: '#B45309', 800: '#92400E', 900: '#78350F',
        },
        navy: {
          50:  '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE',
          300: '#93C5FD', 400: '#60A5FA', 500: '#3B82F6',
          600: '#1D4ED8', 700: '#1E3A8A', 800: '#172554',
          900: '#0F1E3C', 950: '#080E22',
        },
        surface: {
          50:  '#F8F9FC', 100: '#F1F3F9',
          200: '#E4E7F0', 300: '#CBD0E0',
        },
      },
      boxShadow: {
        'card':      '0 2px 16px rgba(0,0,0,0.06)',
        'card-hover':'0 8px 40px rgba(0,0,0,0.12)',
        'amber':     '0 0 30px rgba(245,158,11,0.25)',
        'input':     '0 1px 3px rgba(0,0,0,0.05)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out both',
        'fade-in': 'fadeIn 0.4s ease-out both',
        'shimmer': 'shimmer 1.8s linear infinite',
      },
      keyframes: {
        fadeUp:  { '0%': { opacity:0, transform:'translateY(14px)' }, '100%': { opacity:1, transform:'none' } },
        fadeIn:  { '0%': { opacity:0 }, '100%': { opacity:1 } },
        shimmer: { '0%': { backgroundPosition:'-200% 0' }, '100%': { backgroundPosition:'200% 0' } },
      },
    },
  },
  plugins: [],
};
