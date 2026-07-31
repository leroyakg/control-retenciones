import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: false,
  experimental: {
    // Don't reuse cached route segments on client navigation — always refetch
    // dynamic pages (e.g. the edit form) so they never show stale DB data.
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
};

export default nextConfig;
