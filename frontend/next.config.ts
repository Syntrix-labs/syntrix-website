/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          "https://symmetrical-tribble-qvqrq56pw577f697w-5000.app.github.dev/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;