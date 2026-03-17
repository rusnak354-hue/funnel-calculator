/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // ВАЖЛИВО: Цей рядок каже шукати стилі в усіх файлах папки src
  ],
  // ... інші налаштування
}
  theme: {
    extend: {},
  },
  plugins: [],
}
