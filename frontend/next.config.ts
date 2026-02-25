import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.unsplash.com" },
      { protocol: "https", hostname: "**.pexels.com" },
      { protocol: "https", hostname: "**.pixabay.com" },
      { protocol: "https", hostname: "api.tbotechnology.in" },
      { protocol: "https", hostname: "**.tbotechnology.in" },
      { protocol: "http", hostname: "**.tbotechnology.in" },
      { protocol: "http", hostname: "**.tboholidays.com" },
      { protocol: "https", hostname: "**.tboholidays.com" },
      { protocol: "https", hostname: "**.ikibook.com" },
      { protocol: "http", hostname: "**.ikibook.com" },
      { protocol: "https", hostname: "**.booking.com" },
      { protocol: "https", hostname: "cf.bstatic.com" },
    ],
    // Aggressive caching — hotel images rarely change
    minimumCacheTTL: 86400,
    // Smaller device sizes for hotel cards (no need for giant images)
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [128, 256, 384],
  },
};

export default nextConfig;
