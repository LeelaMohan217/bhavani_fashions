import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { HttpError, notFound } from "../lib/http-error.js";
import { STORE } from "../config/store.js";
import { getActivePromotion, withPromotion, type ActivePromotion } from "./promotions.js";

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      variant: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              price: true,
              compareAtPrice: true,
              isActive: true,
              images: { orderBy: { position: "asc" }, take: 1, select: { url: true, alt: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartRow = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

/** Shapes a cart for the storefront, always using live prices and stock. */
export function toCartDto(cart: CartRow, promo: ActivePromotion | null) {
  const items = cart.items.map((item) => {
    const { variant } = item;
    const product = { ...variant.product, ...withPromotion(variant.product, promo) };
    const available = product.isActive ? variant.stock : 0;
    return {
      id: item.id,
      variantId: variant.id,
      quantity: item.quantity,
      productName: product.name,
      productSlug: product.slug,
      image: product.images[0] ?? null,
      color: variant.color,
      colorHex: variant.colorHex,
      size: variant.size,
      sku: variant.sku,
      unitPrice: product.price,
      compareAtPrice: product.compareAtPrice,
      lineTotal: product.price * item.quantity,
      maxQuantity: Math.min(available, STORE.maxQtyPerItem),
      /** True when stock dropped below the quantity in the bag */
      unavailable: available < item.quantity,
    };
  });

  return {
    id: cart.id,
    items,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((n, i) => n + i.lineTotal, 0),
    shippingFee: STORE.shippingFee,
    codFee: STORE.codFee,
  };
}

export type CartDto = ReturnType<typeof toCartDto>;

export async function createCart() {
  const cart = await prisma.cart.create({ data: {}, include: cartInclude });
  return toCartDto(cart, await getActivePromotion());
}

export async function getCart(cartId: string) {
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: cartInclude });
  if (!cart) throw notFound("Cart");
  return toCartDto(cart, await getActivePromotion());
}

async function assertCart(cartId: string) {
  const exists = await prisma.cart.findUnique({ where: { id: cartId }, select: { id: true } });
  if (!exists) throw notFound("Cart");
}

async function assertStock(variantId: string, wanted: number) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { stock: true, product: { select: { isActive: true } } },
  });
  if (!variant || !variant.product.isActive) throw notFound("Product");

  const limit = Math.min(variant.stock, STORE.maxQtyPerItem);
  if (limit === 0) throw new HttpError(409, "This piece has just sold out.");
  if (wanted > limit) {
    throw new HttpError(
      409,
      variant.stock < STORE.maxQtyPerItem
        ? `Only ${variant.stock} left in stock.`
        : `You can add up to ${STORE.maxQtyPerItem} of this piece.`,
    );
  }
}

export async function addItem(cartId: string, variantId: string, quantity: number) {
  await assertCart(cartId);
  const existing = await prisma.cartItem.findUnique({
    where: { cartId_variantId: { cartId, variantId } },
  });
  const newQty = (existing?.quantity ?? 0) + quantity;
  await assertStock(variantId, newQty);

  await prisma.cartItem.upsert({
    where: { cartId_variantId: { cartId, variantId } },
    create: { cartId, variantId, quantity },
    update: { quantity: newQty },
  });
  await prisma.cart.update({ where: { id: cartId }, data: { updatedAt: new Date() } });
  return getCart(cartId);
}

export async function updateItem(cartId: string, itemId: string, quantity: number) {
  const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId } });
  if (!item) throw notFound("Cart item");

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await assertStock(item.variantId, quantity);
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }
  return getCart(cartId);
}

export async function removeItem(cartId: string, itemId: string) {
  return updateItem(cartId, itemId, 0);
}
