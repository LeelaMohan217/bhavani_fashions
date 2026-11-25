-- CreateEnum
CREATE TYPE "BannerTextSide" AS ENUM ('LEFT', 'RIGHT');

-- AlterTable
ALTER TABLE "Banner" ADD COLUMN "textSide" "BannerTextSide" NOT NULL DEFAULT 'LEFT';

-- Starter banners move to the store's own photos (public/banners in the storefront).
-- Each update only applies while the banner still has its original starter photo, so
-- anything already edited in Admin → Banners is left alone.
UPDATE "Banner" SET
  "imageUrl" = '/banners/navy-silk-saree.jpg',
  "imageAlt" = 'Woman in a navy silk saree with a gold zari border and pink edge',
  "textSide" = 'RIGHT',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'banner_festive_sarees'
  AND "imageUrl" = 'https://images.unsplash.com/photo-1610047614301-13c63f00c032?auto=format&fit=crop&w=2000&q=80';

UPDATE "Banner" SET
  "imageUrl" = '/banners/pink-half-saree.jpg',
  "imageAlt" = 'Woman in a pink and purple half saree with gold jewellery',
  "textSide" = 'LEFT',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'banner_lehengas'
  AND "imageUrl" = 'https://images.unsplash.com/photo-1759906760638-eeffcb471e53?auto=format&fit=crop&w=2000&q=80';

UPDATE "Banner" SET
  "eyebrow" = 'The Festive Edit',
  "title" = 'Bright silks for',
  "highlight" = 'festive days',
  "subtitle" = 'Kanjivaram and Banarasi sarees to wear with the people you love.',
  "ctaLabel" = 'Shop festive sarees',
  "ctaHref" = '/shop?occasion=Festive',
  "imageUrl" = '/banners/festive-silk-sarees.jpg',
  "imageAlt" = 'Three women in orange, gold and pink silk sarees under a flowering tree',
  "textSide" = 'LEFT',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" = 'banner_kurta_sets'
  AND "imageUrl" = 'https://images.unsplash.com/photo-1745313452052-0e4e341f326c?auto=format&fit=crop&w=2000&q=80';