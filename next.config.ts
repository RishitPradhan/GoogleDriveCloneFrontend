import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  async rewrites() {
    // Proxy API to backend for same-origin cookies only in development
    if (!isDev) return [];
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:5050/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
