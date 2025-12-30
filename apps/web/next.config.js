/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker
  output: 'standalone',
  // Enable experimental instrumentation
  experimental: {
    instrumentationHook: true,
  },
};

module.exports = nextConfig;

