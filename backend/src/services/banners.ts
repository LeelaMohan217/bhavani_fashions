import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/http-error.js";

// Must match images.remotePatterns in frontend/next.config.ts
const IMAGE_HOSTS = ["images.unsplash.com", "res.cloudinary.com"];
/** A photo shipped with the storefront in public/banners (sized copies made by `npm run banner-images`) */
const STORE_PHOTO = /^\/banners\/[a-z0-9-]+\.(?:jpe?g|png)$/i;

function isHostedImage(u: string) {
  try {
    const url = new URL(u);
    return url.protocol === "https:" && IMAGE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => v || null);

export const BannerInput = z.object({
  eyebrow: optionalText(60),
  title: z.string().trim().min(2, "Add a headline").max(80),
  highlight: optionalText(60),
  subtitle: optionalText(160),
  ctaLabel: z.string().trim().min(2, "Add button text").max(30),
  ctaHref: z
    .string()
    .trim()
    // A page on this store, e.g. /shop/sarees or /shop?filter=sale. "//host" and "/\host" are
    // rejected because browsers treat them as links to another website.
    .regex(/^\/(?![/\\])[^\s\\]*$/, "Use a link on this store that starts with /, e.g. /shop/sarees"),
  imageUrl: z
    .string()
    .trim()
    .refine(
      (u) => STORE_PHOTO.test(u) || isHostedImage(u),
      `Use a store photo like /banners/navy-silk-saree.jpg, or a link from ${IMAGE_HOSTS.join(" or ")}`,
    ),
  imageAlt: z.string().trim().max(160).default(""),
  textSide: z.enum(["LEFT", "RIGHT"]).default("LEFT"),
  isActive: z.boolean().default(true),
});

const publicSelect = {
  id: true,
  eyebrow: true,
  title: true,
  highlight: true,
  subtitle: true,
  ctaLabel: true,
  ctaHref: true,
  imageUrl: true,
  imageAlt: true,
  textSide: true,
} as const;

/** Live banners for the storefront, in display order */
export const listLiveBanners = () =>
  prisma.banner.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: publicSelect });

export const listAllBanners = () => prisma.banner.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });

export async function getBanner(id: string) {
  const b = await prisma.banner.findUnique({ where: { id } });
  if (!b) throw notFound("Banner");
  return b;
}

export async function createBanner(input: z.infer<typeof BannerInput>) {
  // New banners go to the end of the slideshow
  const last = await prisma.banner.aggregate({ _max: { sortOrder: true } });
  return prisma.banner.create({ data: { ...input, sortOrder: (last._max.sortOrder ?? -1) + 1 } });
}

export async function updateBanner(id: string, input: z.infer<typeof BannerInput>) {
  await getBanner(id);
  return prisma.banner.update({ where: { id }, data: input });
}

export async function setBannerActive(id: string, isActive: boolean) {
  await getBanner(id);
  return prisma.banner.update({ where: { id }, data: { isActive } });
}

export async function deleteBanner(id: string) {
  await getBanner(id);
  await prisma.banner.delete({ where: { id } });
}

export const BannerOrder = z.object({ ids: z.array(z.string().min(1)).min(1).max(50) });

/** Saves the slideshow order: ids listed first-to-last */
export async function reorderBanners(ids: string[]) {
  await prisma.$transaction(ids.map((id, i) => prisma.banner.update({ where: { id }, data: { sortOrder: i } })));
  return listAllBanners();
}
