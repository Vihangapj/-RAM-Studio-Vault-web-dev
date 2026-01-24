/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        black: "#000000",
        white: "#FFFFFF",
        vaultGray: {
          700: "#3f3f46", // Hover states
          800: "#18181b", // Cards and Sidebar
          900: "#09090b", // Background secondary
        }
      },
      aspectRatio: {
        'video': '16 / 9',
      },
    },
  },
  plugins: [],
};
