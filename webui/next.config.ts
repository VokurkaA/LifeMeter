import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://server-production-282f.up.railway.app/:path*'
      }
    ];
  },

};

export default nextConfig;
