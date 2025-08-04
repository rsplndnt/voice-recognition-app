/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#096FCA",
        "primary-light": "#76B7ED",
        accent: "#FF7669",
        "accent-light": "#FFAAB3",
        gray: {
          dark: "#3A3E40",
          light: "#96A0A6",
          lighter: "#F8F9FA",
        }
      },
      fontFamily: {
        sans: ["Noto Sans JP", "sans-serif"],
      }
    },
  },
  plugins: [],
}
