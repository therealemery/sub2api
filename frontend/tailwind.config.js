/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'rgb(254 247 243 / <alpha-value>)',
          100: 'rgb(243 222 213 / <alpha-value>)',
          200: 'rgb(232 213 204 / <alpha-value>)',
          300: 'rgb(217 169 151 / <alpha-value>)',
          400: 'rgb(207 118 82 / <alpha-value>)',
          500: 'rgb(196 71 26 / <alpha-value>)',
          600: 'rgb(167 60 22 / <alpha-value>)',
          700: 'rgb(132 49 20 / <alpha-value>)',
          800: 'rgb(95 40 24 / <alpha-value>)',
          900: 'rgb(74 42 31 / <alpha-value>)',
          950: 'rgb(42 31 26 / <alpha-value>)'
        },
        accent: {
          50: 'rgb(250 250 247 / <alpha-value>)',
          100: 'rgb(245 243 236 / <alpha-value>)',
          200: 'rgb(239 237 230 / <alpha-value>)',
          300: 'rgb(229 227 220 / <alpha-value>)',
          400: 'rgb(214 210 200 / <alpha-value>)',
          500: 'rgb(113 109 100 / <alpha-value>)',
          600: 'rgb(63 60 54 / <alpha-value>)',
          700: 'rgb(31 29 25 / <alpha-value>)',
          800: 'rgb(37 36 32 / <alpha-value>)',
          900: 'rgb(28 27 23 / <alpha-value>)',
          950: 'rgb(21 20 16 / <alpha-value>)'
        },
        dark: {
          50: 'rgb(250 250 247 / <alpha-value>)',
          100: 'rgb(232 230 223 / <alpha-value>)',
          200: 'rgb(200 197 190 / <alpha-value>)',
          300: 'rgb(154 151 143 / <alpha-value>)',
          400: 'rgb(118 116 109 / <alpha-value>)',
          500: 'rgb(95 91 82 / <alpha-value>)',
          600: 'rgb(74 72 66 / <alpha-value>)',
          700: 'rgb(58 56 51 / <alpha-value>)',
          800: 'rgb(47 45 40 / <alpha-value>)',
          900: 'rgb(37 36 32 / <alpha-value>)',
          950: 'rgb(28 27 23 / <alpha-value>)'
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        serif: ['var(--font-serif)'],
        mono: ['var(--font-mono)']
      },
      boxShadow: {
        glass: 'none',
        'glass-sm': 'none',
        glow: 'none',
        'glow-lg': 'none',
        card: 'none',
        'card-hover': 'none',
        'inner-glow': 'none',
        overlay: 'var(--shadow-overlay)'
      },
      backgroundImage: {
        'gradient-radial': 'none',
        'gradient-primary': 'none',
        'gradient-dark': 'none',
        'gradient-glass': 'none',
        'mesh-gradient': 'none'
      },
      animation: {
        'fade-in': 'fadeIn var(--duration-normal) var(--ease-standard)',
        'slide-up': 'slideUp var(--duration-normal) var(--ease-standard)',
        'slide-down': 'slideDown var(--duration-normal) var(--ease-standard)',
        'slide-in-right': 'slideInRight var(--duration-normal) var(--ease-standard)',
        'scale-in': 'scaleIn var(--duration-fast) var(--ease-standard)',
        'pulse-slow': 'none',
        shimmer: 'none',
        glow: 'none'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      backdropBlur: {
        xs: '0'
      },
      borderRadius: {
        none: '0',
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-lg)',
        '3xl': 'var(--radius-lg)',
        '4xl': 'var(--radius-lg)',
        full: '999px'
      }
    }
  },
  plugins: []
}
