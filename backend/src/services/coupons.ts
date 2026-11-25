import { z } from "zod";
import type { Coupon, Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { HttpError, notFound } from "../lib/http-error.js";

/**
 * Discount codes typed at checkout. The discount comes off the bag subtotal (after any
 * store-wide offer). A use is counted when the order is confirmed: straight away for cash on
 * delivery, and once the payment lands for online orders. Cancelling an order gives the use back.
 */

type Tx = Prisma.TransactionClient;

const rupees = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

/** e.g. "10% off", "10% off up to ₹500", "₹200 off" */
export function couponLabel(c: Pick<Coupon, "type" | "value" | "maxDiscount">) {
  if (c.type === "FLAT") return `${rupees(c.value)} off`;
  return c.maxDiscount ? `${c.value}% off up to ${rupees(c.maxDiscount)}` : `${c.value}% off`;
}

/** Discount in paise for a bag subtotal, rounded down to whole rupees. */
export function couponDiscount(c: Pick<Coupon, "type" | "value" | "maxDiscount">, subtotal: number) {
  let off = c.type === "FLAT" ? c.value : Math.floor((subtotal * c.value) / 100);
  if (c.type === "PERCENT" && c.maxDiscount) off = Math.min(off, c.maxDiscount);
  off = Math.min(off, subtotal);
  return Math.floor(off / 100) * 100;
}

export type CouponState = "active" | "scheduled" | "expired" | "used-up" | "off";

export function couponState(c: Coupon, now = new Date()): CouponState {
  if (!c.isActive) return "off";
  if (c.endsAt && c.endsAt <= now) return "expired";
  if (c.usageLimit !== null && c.usedCount >= c.usageLimit) return "used-up";
  if (c.startsAt && c.startsAt > now) return "scheduled";
  return "active";
}

const normalise = (code: string) => code.trim().toUpperCase();

/**
 * Checks a code against a bag subtotal. Throws a shopper-friendly 400 when it can't be used.
 * Every "not usable" case that would reveal a code exists gets the same message as a wrong code.
 */
export async function evaluateCoupon(rawCode: string, subtotal: number) {
  const code = normalise(rawCode);
  const coupon = code ? await prisma.coupon.findUnique({ where: { code } }) : null;
  const state = coupon ? couponState(coupon) : "off";
  if (!coupon || state === "off" || state === "scheduled") throw new HttpError(400, "That code isn't valid.");
  if (state === "expired") throw new HttpError(400, "That code has expired.");
  if (state === "used-up") throw new HttpError(400, "That code has been fully used.");
  if (subtotal < coupon.minOrder) {
    throw new HttpError(400, `Add ${rupees(coupon.minOrder - subtotal)} more to use ${coupon.code}. It works on bags of ${rupees(coupon.minOrder)} or more.`);
  }
  const discount = couponDiscount(coupon, subtotal);
  if (discount <= 0) throw new HttpError(400, "That code doesn't take anything off this bag.");
  return { coupon, discount, label: couponLabel(coupon) };
}

/**
 * Counts one use. With `respectLimit` the update only happens while uses remain, so two shoppers
 * can't both take the last one; online orders that are already paid skip the limit.
 */
export async function countCouponUse(tx: Tx, code: string, respectLimit: boolean) {
  const updated = respectLimit
    ? await tx.$executeRaw`UPDATE "Coupon" SET "usedCount" = "usedCount" + 1, "updatedAt" = NOW()
        WHERE code = ${code} AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")`
    : await tx.$executeRaw`UPDATE "Coupon" SET "usedCount" = "usedCount" + 1, "updatedAt" = NOW() WHERE code = ${code}`;
  return updated > 0;
}

/** Gives a use back, e.g. when an order that used the code is cancelled. */
export async function releaseCouponUse(tx: Tx, code: string) {
  await tx.$executeRaw`UPDATE "Coupon" SET "usedCount" = GREATEST("usedCount" - 1, 0), "updatedAt" = NOW() WHERE code = ${code}`;
}

// ─── Public ──────────────────────────────────────────────────────────────────

export const ApplyCouponSchema = z.object({
  cartId: z.string().min(1),
  code: z.string().trim().min(1, "Enter a code").max(30),
});

// ─── Admin ───────────────────────────────────────────────────────────────────

const optionalDate = z.iso.datetime({ offset: true }).nullish();

export const CouponInput = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Use 3 to 20 letters or numbers")
      .max(20, "Use 3 to 20 letters or numbers")
      .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only")
      .transform(normalise),
    description: z
      .string()
      .trim()
      .max(120)
      .nullish()
      .transform((v) => v || null),
    type: z.enum(["PERCENT", "FLAT"]),
    /** Percent (1 to 90) or paise */
    value: z.number().int().min(1, "Enter an amount"),
    minOrder: z.number().int().min(0).default(0),
    maxDiscount: z.number().int().min(100).nullish(),
    startsAt: optionalDate,
    endsAt: optionalDate,
    usageLimit: z.number().int().min(1, "At least 1").nullish(),
    isActive: z.boolean(),
  })
  .refine((v) => v.type !== "PERCENT" || v.value <= 90, { path: ["value"], message: "Enter 1 to 90" })
  .refine((v) => !v.startsAt || !v.endsAt || new Date(v.startsAt) < new Date(v.endsAt), {
    path: ["endsAt"],
    message: "The end must be after the start",
  });

export const CouponListQuery = z.object({
  show: z.enum(["all", "active", "scheduled", "ended"]).default("all"),
});

const adminView = (c: Coupon) => ({ ...c, state: couponState(c), label: couponLabel(c) });

export async function listCoupons(q: z.infer<typeof CouponListQuery>) {
  const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  const all = rows.map(adminView);
  const ended = (s: CouponState) => s === "expired" || s === "used-up" || s === "off";
  const counts = {
    all: all.length,
    active: all.filter((c) => c.state === "active").length,
    scheduled: all.filter((c) => c.state === "scheduled").length,
    ended: all.filter((c) => ended(c.state)).length,
  };
  const items = all.filter((c) => (q.show === "all" ? true : q.show === "ended" ? ended(c.state) : c.state === q.show));
  return { counts, items };
}

export async function getCoupon(id: string) {
  const c = await prisma.coupon.findUnique({ where: { id } });
  if (!c) throw notFound("Coupon");
  return adminView(c);
}

function toData(input: z.infer<typeof CouponInput>) {
  return {
    code: input.code,
    description: input.description,
    type: input.type,
    value: input.value,
    minOrder: input.minOrder,
    maxDiscount: input.type === "PERCENT" ? (input.maxDiscount ?? null) : null,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    usageLimit: input.usageLimit ?? null,
    isActive: input.isActive,
  };
}

async function assertCodeFree(code: string, exceptId?: string) {
  const taken = await prisma.coupon.findUnique({ where: { code }, select: { id: true } });
  if (taken && taken.id !== exceptId) throw new HttpError(409, `The code ${code} is already in use.`);
}

export async function createCoupon(input: z.infer<typeof CouponInput>) {
  await assertCodeFree(input.code);
  return adminView(await prisma.coupon.create({ data: toData(input) }));
}

export async function updateCoupon(id: string, input: z.infer<typeof CouponInput>) {
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw notFound("Coupon");
  await assertCodeFree(input.code, id);
  if (existing.code !== input.code && existing.usedCount > 0) {
    throw new HttpError(409, "This code has already been used, so it can't be renamed. Create a new code instead.");
  }
  return adminView(await prisma.coupon.update({ where: { id }, data: toData(input) }));
}

export async function setCouponActive(id: string, isActive: boolean) {
  const existing = await prisma.coupon.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw notFound("Coupon");
  return adminView(await prisma.coupon.update({ where: { id }, data: { isActive } }));
}

export async function deleteCoupon(id: string) {
  const existing = await prisma.coupon.findUnique({ where: { id }, select: { usedCount: true } });
  if (!existing) throw notFound("Coupon");
  if (existing.usedCount > 0) throw new HttpError(409, "This code has been used on orders. Switch it off instead of deleting it.");
  await prisma.coupon.delete({ where: { id } });
}
