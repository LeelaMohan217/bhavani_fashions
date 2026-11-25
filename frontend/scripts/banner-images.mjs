// Makes the sized WebP copies the storefront serves for photos in public/banners.
// Add a photo (e.g. public/banners/diwali-edit.jpg), run `npm run banner-images`, then use
// "/banners/diwali-edit.jpg" as the banner's photo link in Admin → Banners.
// Widths must match BANNER_WIDTHS in src/lib/image-loader.ts.
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const WIDTHS = [640, 960, 1280, 1600, 2000];
const dir = path.join(import.meta.dirname, "..", "public", "banners");

const photos = (await readdir(dir)).filter((f) => /\.(jpe?g|png)$/i.test(f));
for (const file of photos) {
  const base = file.replace(/\.[^.]+$/, "");
  for (const width of WIDTHS) {
    const out = path.join(dir, `${base}-${width}.webp`);
    await sharp(path.join(dir, file)).resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
  }
  console.log(`✓ ${file}`);
}
