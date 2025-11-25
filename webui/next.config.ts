import type { NextConfig } from "next";

// Proxy all /api requests to the hosted Server backend
const nextConfig: NextConfig = {
  reactCompiler: true,
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/:path*",
  //       destination:
  //         "https://server-production-282f.up.railway.app/api/:path*",
  //     },
  //   ];
  // },
};

export default nextConfig;
