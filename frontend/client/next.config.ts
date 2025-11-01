import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Skip static page generation for problematic pages during build
  // This prevents SSR errors during static generation
  onDemandEntries: {
    // Keep pages in memory for 25 seconds
    maxInactiveAge: 25 * 1000,
    // Number of pages to keep simultaneously
    pagesBufferLength: 2,
  },
};

export default nextConfig;
