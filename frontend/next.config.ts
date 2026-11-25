import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  images: {
    // Unsplash and Cloudinary resize on their own CDNs (faster, and no Vercel image quota)
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    remotePatterns: [
      // Placeholder photography until the client's own images are on Cloudinary
      // Keep in sync with IMAGE_HOSTS in backend/src/services/admin-products.ts
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
