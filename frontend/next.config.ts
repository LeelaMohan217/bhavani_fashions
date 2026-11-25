import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    // Store data (catalogue, menus, banners, offer). Admin saves refresh it straight away by tag.
    // Otherwise it refreshes in the background every 10 minutes, and visitors keep getting the last copy
    // for up to 30 days, so nobody waits for the API (which may be waking up) to load a page.
    store: {
      stale: 300, // 5 minutes in the browser
      revalidate: 600, // background refresh after 10 minutes
      expire: 60 * 60 * 24 * 30, // only after 30 days with no visitors does a request wait for fresh data
    },
  },
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
