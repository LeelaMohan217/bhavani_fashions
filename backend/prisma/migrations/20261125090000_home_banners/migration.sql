-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "highlight" TEXT,
    "subtitle" TEXT,
    "ctaLabel" TEXT NOT NULL,
    "ctaHref" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Banner_isActive_sortOrder_idx" ON "Banner"("isActive", "sortOrder");


-- Starter banners so the home page has offers on first deploy; edit them in Admin → Banners
INSERT INTO "Banner" ("id", "eyebrow", "title", "highlight", "subtitle", "ctaLabel", "ctaHref", "imageUrl", "imageAlt", "sortOrder", "isActive", "updatedAt") VALUES
  ('banner_festive_sarees', 'The Festive Edit', 'Silk sarees,', 'woven for celebrations', 'Kanjivaram, Banarasi and Patola silks, handpicked from India''s weaving clusters.', 'Shop sarees', '/shop/sarees', 'https://images.unsplash.com/photo-1610047614301-13c63f00c032?auto=format&fit=crop&w=2000&q=80', 'Woman in a red and gold Kanjivaram silk saree', 0, true, CURRENT_TIMESTAMP),
  ('banner_lehengas', 'New in · Lehengas', 'Made for the', 'sangeet', 'Hand-embroidered lehengas for every wedding function.', 'Shop lehengas', '/shop/lehengas', 'https://images.unsplash.com/photo-1759906760638-eeffcb471e53?auto=format&fit=crop&w=2000&q=80', 'Bride in a red embroidered lehenga', 1, true, CURRENT_TIMESTAMP),
  ('banner_kurta_sets', 'Everyday ease', 'Kurta sets for', 'every day', 'Breathable cotton and chikankari you will reach for again and again.', 'Shop kurta sets', '/shop/kurta-sets', 'https://images.unsplash.com/photo-1745313452052-0e4e341f326c?auto=format&fit=crop&w=2000&q=80', 'Woman in a white chikankari kurta set', 2, true, CURRENT_TIMESTAMP);
