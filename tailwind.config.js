/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
    },
    extend: {
      colors: {
        cream: {
          50: "#FDFAF3",
          100: "#FBF7F0",
          200: "#F5EFE3",
          300: "#EFE7D4",
        },
        coral: {
          50: "#FDF3EF",
          100: "#FBE3D9",
          400: "#E8623A",
          500: "#D4522D",
          600: "#B23F20",
        },
        ink: {
          900: "#2B2A28",
          700: "#4A4844",
          500: "#7A766F",
        },
        sage: {
          400: "#B5CBB6",
          500: "#9DBBA3",
          600: "#7E9B85",
        },
        amber: {
          gold: "#C99A3F",
          soft: "#E8C77A",
        },
        warm: {
          100: "#E8E2D6",
          200: "#D8D0BE",
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        soft: "0 4px 16px -2px rgba(43, 42, 40, 0.08)",
        card: "0 8px 24px -4px rgba(43, 42, 40, 0.12)",
        lift: "0 16px 40px -8px rgba(43, 42, 40, 0.20)",
      },
      borderRadius: {
        '4xl': '2rem',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'zoom-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out both',
        'fade-in': 'fade-in 0.6s ease-out both',
        'zoom-in': 'zoom-in 0.7s ease-out both',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
};
