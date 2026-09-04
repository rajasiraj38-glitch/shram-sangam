const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#17231f',
        moss: '#2f6b4f',
        leaf: '#dcebdc',
        saffron: '#d97732',
        cream: '#f7f5ee',
        slate: colors.slate,
      },
      boxShadow: {
        soft: '0 18px 50px rgba(35, 55, 45, 0.09)',
      },
    },
  },
  plugins: [],
};
