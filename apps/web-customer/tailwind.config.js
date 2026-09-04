/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui-kit/src/**/*.{ts,tsx}",
  ],
  presets: [require("@shram-sangam/ui-kit/tailwind.config")],
  theme: { extend: {} },
  plugins: [],
};
