/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@shram-sangam/ui-kit", "@shram-sangam/shared-types"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  experimental: {
    typedRoutes: false,
  },
};

module.exports = nextConfig;
