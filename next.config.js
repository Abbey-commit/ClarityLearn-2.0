
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable static export for easy deployment
  output: 'export',
  
  // Image optimization settings
  images: {
    unoptimized: true, // Required for static export
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK,
    NEXT_PUBLIC_STACKS_API: process.env.NEXT_PUBLIC_STACKS_API,
  },
  
  // Production optimizations
  swcMinify: true,
  
  // For Stacks Ascent platform deployment
  basePath: '',
  trailingSlash: true,

  // Add this line to fix the warning:
  turbopack: {},
  
  // Webpack configuration
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;


