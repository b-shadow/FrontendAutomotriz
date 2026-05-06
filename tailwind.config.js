/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626',   // Rojo principal
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#450a0a',
        },
        burgundy: {
          50: '#fdf2f4',
          100: '#fce7ea',
          200: '#f9d0d8',
          300: '#f4a8b8',
          400: '#ec7693',
          500: '#a4133c',   // Guindo / Burgundy principal
          600: '#800f2f',
          700: '#6b0d28',
          800: '#590b21',
          900: '#3d081a',
          950: '#2a0512',
        },
        carbon: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#2a2a2a',
          900: '#1a1a1a',
          950: '#0d0d0d',
        },
        secondary: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        sans: ['Rajdhani', 'system-ui', 'sans-serif'],
        heading: ['Rajdhani', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.15)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
        'card': '0 4px 6px -1px rgba(220, 38, 38, 0.08)',
        'red-glow': '0 0 20px rgba(220, 38, 38, 0.15)',
        'burgundy-glow': '0 0 20px rgba(164, 19, 60, 0.15)',
        'inner-red': 'inset 0 2px 4px 0 rgba(220, 38, 38, 0.06)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backgroundImage: {
        'carbon-texture': 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)',
        'mesh-gradient': 'radial-gradient(at 40% 20%, rgba(220, 38, 38, 0.08) 0%, transparent 50%), radial-gradient(at 80% 0%, rgba(164, 19, 60, 0.06) 0%, transparent 50%)',
      },
    },
  },
  plugins: [],
}
