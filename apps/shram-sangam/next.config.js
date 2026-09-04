/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  trailingSlash: true,
  basePath: process.env.GITHUB_PAGES === 'true' ? '/shram-sangam' : '',
  assetPrefix: process.env.GITHUB_PAGES === 'true' ? '/shram-sangam/' : undefined,
};

module.exports = nextConfig;
