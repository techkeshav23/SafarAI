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
      { protocol: "https", hostname: "**.booking.com" },
      { protocol: "https", hostname: "cf.bstatic.com" },
    ],
  },
};

export default nextConfig;
