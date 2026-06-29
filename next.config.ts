import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.cdninstagram.com" },
      { protocol: "https", hostname: "*.fbcdn.net" },
      { protocol: "https", hostname: "scontent.*.fna.fbcdn.net" },
    ],
  },
  // Prevent worker modules from being bundled into Next.js
  serverExternalPackages: ["bullmq", "ioredis", "winston"],
};

export default nextConfig;
