"use client";

// next/image loader: ask the image host's own CDN for the exact width and the best format
// (WebP/AVIF), instead of Next.js downloading the full photo and re-encoding it.
// Hosts here must match images.remotePatterns in next.config.ts.

type LoaderProps = { src: string; width: number; quality?: number };

// Store photos in public/banners have WebP copies at these widths (npm run banner-images)
const BANNER_WIDTHS = [640, 960, 1280, 1600, 2000];

export default function imageLoader({ src, width, quality }: LoaderProps) {
  const banner = src.match(/^\/banners\/([a-z0-9-]+)\.(?:jpe?g|png)$/i);
  if (banner) {
    const size = BANNER_WIDTHS.find((w) => w >= width) ?? BANNER_WIDTHS[BANNER_WIDTHS.length - 1];
    return `/banners/${banner[1]}-${size}.webp`;
  }

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src; // other local file: served as-is
  }

  if (url.hostname === "images.unsplash.com") {
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    url.searchParams.set("auto", "format");
    url.searchParams.delete("h"); // keep the photo's own proportions; the frame crops it
    return url.toString();
  }

  if (url.hostname === "res.cloudinary.com") {
    // .../image/upload/<transforms>/v123/id.jpg → insert size + auto format/quality after /upload/
    const transforms = `f_auto,c_limit,w_${width},q_${quality ?? "auto"}`;
    return src.replace("/upload/", `/upload/${transforms}/`);
  }

  return src;
}
