import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    return [
      {
        source: '/ocr/:path*',
        destination: 'http://kyra-kyc.ddns.net:3207/ocr/:path*',
      },
    ];
  },
};

export default nextConfig;
