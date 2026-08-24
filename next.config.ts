import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  assetPrefix: process.env.VERCEL ? "https://smileflow-marketing.vercel.app" : undefined,
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,
  turbopack: { root: process.cwd() },
};

export default nextConfig;
