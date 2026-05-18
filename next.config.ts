import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "img.clerk.com"
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*"
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*"
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*"
      }
    ];
  },
  skipTrailingSlashRedirect: true
};

export default nextConfig;
