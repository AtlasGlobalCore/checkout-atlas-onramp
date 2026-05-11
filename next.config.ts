import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: true,
  images: {
    // Allow Atlas logo from /public
    unoptimized: false,
  },
};

export default nextConfig;
