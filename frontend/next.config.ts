import type { NextConfig } from "next";
import path from "node:path";

const apiUrl = process.env.BACKEND_URL || "http://localhost:5000";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
