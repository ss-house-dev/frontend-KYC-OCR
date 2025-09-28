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
        source: "/kyc/:path*",
        destination: "http://141.11.156.52:3205/kyc/:path*",
      },
      {
        source: "/ocr/:path*",
        destination: "http://141.11.156.52:3207/ocr/:path*",
      },
      {
        source: "/submit/:path*",
        destination: "http://141.11.156.52:3208/submit/:path*",
      },
            {
        source: "/storage/:path*",
        destination: "http://141.11.156.52:3208/storage/:path*",
      },
    ];
  },
};

export default nextConfig;
