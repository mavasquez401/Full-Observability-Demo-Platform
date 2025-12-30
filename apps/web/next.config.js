/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker
  output: 'standalone',
  // Enable experimental instrumentation
  experimental: {
    instrumentationHook: true,
  },
  // Suppress webpack warnings for OpenTelemetry
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Suppress warnings about optional dependencies in OpenTelemetry packages
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;

