/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./app.js",
    "./data.js",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#1e293b', // Custom colors if used
        }
      }
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
