const sharedConfig = require('@shram-sangam/ui-kit/tailwind');
module.exports = {
  ...sharedConfig,
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui-kit/src/**/*.{ts,tsx}'],
};
