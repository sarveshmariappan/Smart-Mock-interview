/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Allow unoptimized images during development
    unoptimized: process.env.NODE_ENV === 'development' ? false : true,
  },
};

export default nextConfig;
