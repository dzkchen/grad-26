import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: process.env.R2_PUBLIC_HOSTNAME! },
    ],
  },
};

export default nextConfig;
