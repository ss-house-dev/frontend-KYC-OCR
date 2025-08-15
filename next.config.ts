import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  // output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,

  webpack(config) {
    config.module.rules.unshift(
      {
        test: /\.svg$/i,
        resourceQuery: /url/,
        type: "asset",
      },
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        resourceQuery: { not: [/url/] },
        use: ["@svgr/webpack"],
      }
    );

    return config;
  },
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
