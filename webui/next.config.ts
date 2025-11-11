import type { NextConfig } from "next";

const API_ORIGIN = process.env.NEXT_PUBLIC_SERVER_URL || "https://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return API_ORIGIN
      ? [{ source: "/api/:path*", destination: `${API_ORIGIN}/api/:path*` }]
      : [];
  },
};

export default nextConfig;
