/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html", // Scans the root HTML file
    "./src/**/*.{js,jsx,ts,tsx}", // Scans all JS/JSX/TS/TSX files in the src folder and its subfolders
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}