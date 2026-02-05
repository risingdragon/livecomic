/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        game: {
          bg: "#2D3748",
          accent: "#3182CE",
          terminal: "#0f0", // Green text
          terminalBg: "#000000",
        }
      },
      fontFamily: {
        mono: ['"Fira Code"', 'monospace'],
      },
      keyframes: {
        scan: {
          '0%, 100%': { top: '0%' },
          '50%': { top: '100%' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        }
      },
      animation: {
        scan: 'scan 3s ease-in-out infinite',
        progress: 'progress 2s ease-in-out infinite',
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};