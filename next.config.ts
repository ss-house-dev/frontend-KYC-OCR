// next.config.ts (โค้ดนี้ถูกต้องแล้ว)

import type { NextConfig } from "next";
import { RuleSetRule } from "webpack";

const nextConfig: NextConfig = {
  webpack(config) {
    const fileLoaderRule = config.module.rules.find(
      (rule: RuleSetRule): rule is RuleSetRule =>
        typeof rule === 'object' && rule !== null && 'test' in rule && rule.test instanceof RegExp && rule.test.test(".svg")
    );

    config.module.rules.push(
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        use: ["@svgr/webpack"],
      }
    );

    if (fileLoaderRule) {
        fileLoaderRule.exclude = /\.svg$/i;
    }

    return config;
  },
};

export default nextConfig;