import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/ocr/:path*',
        destination: 'https://kyra-kyc.ddns.net/ocr/:path*',
      },
    ];
  },
};

export default nextConfig;
