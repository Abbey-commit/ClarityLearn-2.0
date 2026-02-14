/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Image optimization settings
  // Changed to false for Vercel (Vercel supports image optimization)
  images: {
    unoptimized: false, // Vercel can optimize images
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK,
    NEXT_PUBLIC_STACKS_API: process.env.NEXT_PUBLIC_STACKS_API,
  },
  
  // For deployment
  basePath: '',
  trailingSlash: true,

  // Turbopack configuration
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