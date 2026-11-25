import type { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { formatOrderNumber } from "../config/store.js";

/**
 * Activity log: one readable line for every change made in the admin panel.
 *
 * Recorded by a single middleware rather than inside each service, so new admin routes only need
 * a rule below. An entry is written only after the change succeeded (2xx response), and a failure
 * to write it never breaks the change itself. Passwords and other request bodies are never stored.
 */

export const AREAS = ["order", "product", "category", "banner", "navigation", "coupon", "offer", "account", "profile"] as const;
type Area = (typeof AREAS)[number];

type Ctx = {
  /** Name of the thing changed, looked up before the change (so deletes still have it) */
  before: string | null;
  /** JSON the route responded with */
  body: Record<string, unknown> | undefined;
  /** Parsed request body (only read for a few harmless fields such as isActive or status) */
  input: Record<string, unknown>;
  id: string | undefined;
};

type Rule = {
  method: string;
  path: RegExp;
  area: Area;
  /** Looks up a readable name for the :id in the path */
  lookup?: (id: string) => Promise<string | null>;
  summary: (c: Ctx) => string;
  href?: (c: Ctx) => string | null;
};

const str = (v: unknown) => (typeof v === "string" ? v : "");
const named = (c: Ctx, key = "name") => str(c.body?.[key]) || c.before || "";
const shown = (c: Ctx) => (c.input.isActive ? "Showed" : "Hid");
const STATUS_WORDS: Record<string, string> = { PACKED: "packed", SHIPPED: "shipped", DELIVERED: "delivered", CANCELLED: "cancelled" };

const lookups = {
  product: async (id: string) => (await prisma.product.findUnique({ where: { id }, select: { name: true } }))?.name ?? null,
  category: async (id: string) => (await prisma.category.findUnique({ where: { id }, select: { name: true } }))?.name ?? null,
  banner: async (id: string) => (await prisma.banner.findUnique({ where: { id }, select: { title: true } }))?.title ?? null,
  coupon: async (id: string) => (await prisma.coupon.findUnique({ where: { id }, select: { code: true } }))?.code ?? null,
  account: async (id: string) => (await prisma.adminUser.findUnique({ where: { id }, select: { name: true } }))?.name ?? null,
  order: async (id: string) => {
    const o = await prisma.order.findUnique({ where: { id }, select: { number: true } });
    return o ? formatOrderNumber(o.number) : null;
  },
};

const ID = "([^/]+)";
const RULES: Rule[] = [
  // Orders
  {
    method: "POST", path: new RegExp(`^/orders/${ID}/status$`), area: "order", lookup: lookups.order,
    summary: (c) => `Marked order ${c.before} ${STATUS_WORDS[str(c.input.status)] ?? str(c.input.status).toLowerCase()}`,
    href: (c) => `/admin/orders/${c.id}`,
  },
  {
    method: "POST", path: new RegExp(`^/orders/${ID}/refunded$`), area: "order", lookup: lookups.order,
    summary: (c) => `Recorded refund for order ${c.before}`, href: (c) => `/admin/orders/${c.id}`,
  },
  // Products
  { method: "POST", path: /^\/products$/, area: "product", summary: (c) => `Added product ${named(c)}`, href: (c) => `/admin/products/${str(c.body?.id)}` },
  { method: "PUT", path: new RegExp(`^/products/${ID}$`), area: "product", lookup: lookups.product, summary: (c) => `Edited product ${named(c)}`, href: (c) => `/admin/products/${c.id}` },
  { method: "PATCH", path: new RegExp(`^/products/${ID}/status$`), area: "product", lookup: lookups.product, summary: (c) => `${shown(c)} product ${c.before}`, href: (c) => `/admin/products/${c.id}` },
  // Categories
  { method: "POST", path: /^\/categories$/, area: "category", summary: (c) => `Added category ${named(c)}`, href: (c) => `/admin/categories/${str(c.body?.id)}` },
  { method: "PUT", path: /^\/categories\/order$/, area: "category", summary: () => "Reordered categories", href: () => "/admin/categories" },
  { method: "PUT", path: new RegExp(`^/categories/${ID}$`), area: "category", lookup: lookups.category, summary: (c) => `Edited category ${named(c)}`, href: (c) => `/admin/categories/${c.id}` },
  { method: "PATCH", path: new RegExp(`^/categories/${ID}/status$`), area: "category", lookup: lookups.category, summary: (c) => `${shown(c)} category ${c.before}`, href: (c) => `/admin/categories/${c.id}` },
  { method: "DELETE", path: new RegExp(`^/categories/${ID}$`), area: "category", lookup: lookups.category, summary: (c) => `Deleted category ${c.before}` },
  // Banners
  { method: "POST", path: /^\/banners$/, area: "banner", summary: (c) => `Added banner ${named(c, "title")}`, href: (c) => `/admin/banners/${str(c.body?.id)}` },
  { method: "PUT", path: /^\/banners\/order$/, area: "banner", summary: () => "Reordered banners", href: () => "/admin/banners" },
  { method: "PUT", path: new RegExp(`^/banners/${ID}$`), area: "banner", lookup: lookups.banner, summary: (c) => `Edited banner ${named(c, "title")}`, href: (c) => `/admin/banners/${c.id}` },
  { method: "PATCH", path: new RegExp(`^/banners/${ID}/status$`), area: "banner", lookup: lookups.banner, summary: (c) => `${shown(c)} banner ${c.before}`, href: (c) => `/admin/banners/${c.id}` },
  { method: "DELETE", path: new RegExp(`^/banners/${ID}$`), area: "banner", lookup: lookups.banner, summary: (c) => `Deleted banner ${c.before}` },
  // Header and footer menus
  {
    method: "PUT",
    path: /^\/navigation\/(header|footer)$/,
    area: "navigation",
    summary: (c) => `${Array.isArray(c.input?.items) && c.input.items.length === 0 ? "Reset" : "Edited"} the ${c.id} menu`,
    href: () => "/admin/navigation",
  },
  // Coupons
  { method: "POST", path: /^\/coupons$/, area: "coupon", summary: (c) => `Created coupon ${named(c, "code")}`, href: (c) => `/admin/coupons/${str(c.body?.id)}` },
  { method: "PUT", path: new RegExp(`^/coupons/${ID}$`), area: "coupon", lookup: lookups.coupon, summary: (c) => `Edited coupon ${named(c, "code")}`, href: (c) => `/admin/coupons/${c.id}` },
  { method: "PATCH", path: new RegExp(`^/coupons/${ID}/status$`), area: "coupon", lookup: lookups.coupon, summary: (c) => `Switched coupon ${c.before} ${c.input.isActive ? "on" : "off"}`, href: (c) => `/admin/coupons/${c.id}` },
  { method: "DELETE", path: new RegExp(`^/coupons/${ID}$`), area: "coupon", lookup: lookups.coupon, summary: (c) => `Deleted coupon ${c.before}` },
  // Store-wide offer
  { method: "PUT", path: /^\/promotion$/, area: "offer", summary: (c) => `Saved store offer ${named(c)}`, href: () => "/admin/banners" },
  // Admin accounts
  { method: "POST", path: /^\/accounts$/, area: "account", summary: (c) => `Added admin ${named(c)}`, href: () => "/admin/accounts" },
  { method: "PATCH", path: new RegExp(`^/accounts/${ID}/status$`), area: "account", lookup: lookups.account, summary: (c) => `${c.input.isActive ? "Turned on" : "Turned off"} admin ${c.before}`, href: () => "/admin/accounts" },
  { method: "POST", path: new RegExp(`^/accounts/${ID}/password$`), area: "account", lookup: lookups.account, summary: (c) => `Reset the password for ${c.before}`, href: () => "/admin/accounts" },
  { method: "DELETE", path: new RegExp(`^/accounts/${ID}$`), area: "account", lookup: lookups.account, summary: (c) => `Removed admin ${c.before}`, href: () => "/admin/accounts" },
  // Own profile
  { method: "PUT", path: /^\/profile$/, area: "profile", summary: () => "Updated their profile", href: () => "/admin/profile" },
  { method: "POST", path: /^\/profile\/password$/, area: "profile", summary: () => "Changed their password", href: () => "/admin/profile" },
];

/** Mount after requireAdmin on the admin router. */
export const recordActivity: RequestHandler = async (req, res, next) => {
  if (req.method === "GET") return next();
  const rule = RULES.find((r) => r.method === req.method && r.path.test(req.path));
  if (!rule) return next();

  const id = req.path.match(rule.path)?.[1];
  let before: string | null = null;
  try {
    if (rule.lookup && id) before = await rule.lookup(decodeURIComponent(id));
  } catch {
    // Name lookup is best-effort
  }

  // Keep a copy of what the route sends back (for names of newly created things)
  let body: Record<string, unknown> | undefined;
  const json = res.json.bind(res);
  res.json = (data: unknown) => {
    if (data && typeof data === "object") body = data as Record<string, unknown>;
    return json(data);
  };

  res.on("finish", () => {
    if (res.statusCode >= 300) return;
    const admin = res.locals.admin as { id: string; name: string } | undefined;
    if (!admin) return;
    const ctx: Ctx = { before, body, input: (req.body ?? {}) as Record<string, unknown>, id };
    prisma.activityLog
      .create({
        data: {
          adminId: admin.id,
          adminName: admin.name,
          area: rule.area,
          summary: rule.summary(ctx).replace(/\s+/g, " ").trim(),
          href: rule.href?.(ctx) ?? null,
        },
      })
      .catch((e) => console.error("Could not record admin activity", e));
  });

  next();
};

// ─── Reading the log ─────────────────────────────────────────────────────────

export const ActivityQuery = z.object({
  area: z.enum(AREAS).optional(),
  admin: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});

export async function listActivity(q: z.infer<typeof ActivityQuery>) {
  const where = { ...(q.area && { area: q.area }), ...(q.admin && { adminId: q.admin }) };
  const [total, items, admins] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
      select: { id: true, adminId: true, adminName: true, area: true, summary: true, href: true, createdAt: true },
    }),
    // Everyone who appears in the log, for the filter
    prisma.activityLog.groupBy({ by: ["adminId", "adminName"], where: { adminId: { not: null } } }),
  ]);
  return {
    items,
    total,
    page: q.page,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    admins: [...new Map(admins.map((a) => [a.adminId!, a.adminName])).entries()].map(([id, name]) => ({ id, name })),
  };
}
