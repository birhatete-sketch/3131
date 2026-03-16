/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary-color, #0f172a)",
        secondary: "var(--secondary-color, #1e293b)",
        accent: {
          DEFAULT: "var(--accent-color, #c2956b)",
          light: "#d4a97a",
          dark: "#a67c52",
        },
        surface: "var(--surface-color, #ffffff)",
        "surface-alt": "var(--surface-alt-color, #f8fafc)",
        "surface-dark": "var(--surface-dark-color, #f1f5f9)",
        border: "var(--border-color, #e2e8f0)",
        muted: "var(--muted-color, #94a3b8)",
        success: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Playfair Display', 'serif'],
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        slideUp: 'slideUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
