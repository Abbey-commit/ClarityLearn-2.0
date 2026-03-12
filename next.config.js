/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
  },
  env: {
    NEXT_PUBLIC_NETWORK: process.env.NEXT_PUBLIC_NETWORK,
    NEXT_PUBLIC_STACKS_API: process.env.NEXT_PUBLIC_STACKS_API,
  },
  basePath: '',
  trailingSlash: true,
};

module.exports = nextConfig;