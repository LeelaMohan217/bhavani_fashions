import { z } from "zod";
import { prisma } from "../lib/prisma.js";

/**
 * Store-wide % off (e.g. Black Friday). Product prices in the database are never changed:
 * the discount is applied when prices are read (product lists, product pages, cart, and so
 * checkout), and stops on its own at `endsAt`.
 */

export type ActivePromotion = { id: string; name: string; percentOff: number; endsAt: Date };

// Cached briefly so every product list and cart read doesn't hit the database
const CACHE_MS = 15_000;
let cached: { at: number; promo: ActivePromotion | null } | null = null;

export function clearPromotionCache() {
  cached = null;
}

/** The promotion running right now, or null. Ends exactly at `endsAt`, whatever the cache holds. */
export async function getActivePromotion(): Promise<ActivePromotion | null> {
  const now = new Date();
  if (cached && now.getTime() - cached.at < CACHE_MS) {
    return cached.promo && cached.promo.endsAt > now ? cached.promo : null;
  }
  const promo = await prisma.promotion.findFirst({
    where: { isActive: true, endsAt: { gt: now }, OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
    orderBy: { percentOff: "desc" },
    select: { id: true, name: true, percentOff: true, endsAt: true },
  });
  cached = { at: now.getTime(), promo };
  return promo;
}

/** Discounted price in paise, rounded to the nearest ₹10 (never below ₹1). */
export const promoPrice = (price: number, percentOff: number) =>
  Math.max(100, Math.round((price * (100 - percentOff)) / 100 / 1000) * 1000);

/**
 * Prices a product for shoppers. During a promotion the struck-through price is today's
 * price, so the shown "% off" always matches the advertised promotion.
 */
export function withPromotion<T extends { price: number; compareAtPrice: number | null }>(p: T, promo: ActivePromotion | null) {
  if (!promo) return { ...p, onPromotion: false };
  return { ...p, price: promoPrice(p.price, promo.percentOff), compareAtPrice: p.price, onPromotion: true };
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export const PromotionInput = z
  .object({
    name: z.string().trim().min(2, "Add a name, e.g. Black Friday").max(40),
    percentOff: z.number().int().min(1, "Enter 1 to 90").max(90, "Enter 1 to 90"),
    startsAt: z.iso.datetime({ offset: true }).nullish(),
    endsAt: z.iso.datetime({ offset: true, message: "Choose when the offer ends" }),
    isActive: z.boolean(),
  })
  .refine((v) => !v.startsAt || new Date(v.startsAt) < new Date(v.endsAt), { path: ["endsAt"], message: "The end must be after the start" });

/** The most recent promotion (running or not), for the admin page. */
export const getLatestPromotion = () => prisma.promotion.findFirst({ orderBy: { createdAt: "desc" } });

export async function savePromotion(input: z.infer<typeof PromotionInput>) {
  const data = {
    name: input.name,
    percentOff: input.percentOff,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: new Date(input.endsAt),
    isActive: input.isActive,
  };
  const latest = await getLatestPromotion();
  const saved = latest
    ? await prisma.promotion.update({ where: { id: latest.id }, data })
    : await prisma.promotion.create({ data });
  clearPromotionCache();
  return saved;
}
