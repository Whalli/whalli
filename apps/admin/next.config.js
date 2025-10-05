/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@whalli/ui", "@whalli/types"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;