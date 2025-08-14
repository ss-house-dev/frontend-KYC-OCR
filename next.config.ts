import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
};

export default nextConfig;
