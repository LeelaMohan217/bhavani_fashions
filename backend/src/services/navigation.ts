// Header and footer menus (Admin → Navigation).
// Until a menu is saved it follows the categories automatically, so a new store still has a working header.
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/http-error.js";
import { visibleCategory } from "../lib/catalogue.js";

export const MENUS = ["header", "footer"] as const;
export type MenuKey = (typeof MENUS)[number];
const toEnum = (m: MenuKey): "HEADER" | "FOOTER" => (m === "header" ? "HEADER" : "FOOTER");

/** Header: top link → dropdown column → links. Footer: column → links. */
const MAX_DEPTH: Record<MenuKey, number> = { header: 3, footer: 2 };
const MAX_ITEMS = 300;
const badRequest = (message: string) => new HttpError(400, message);

/** What the store draws */
export type NavNode = { id: string; label: string; href: string | null; badge: string | null; children: NavNode[] };

// ─── Store ────────────────────────────────────────────────────────────────────

type Row = {
  id: string;
  parentId: string | null;
  label: string;
  kind: "CATEGORY" | "LINK" | "NONE";
  href: string | null;
  badge: string | null;
  isActive: boolean;
  sortOrder: number;
  category: { slug: string; isActive: boolean; parent: { isActive: boolean } | null } | null;
};

function buildPublicTree(rows: Row[], parentId: string | null = null): NavNode[] {
  return rows
    .filter((r) => r.parentId === parentId && r.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((r) => {
      const children = buildPublicTree(rows, r.id);
      let href: string | null = null;
      if (r.kind === "LINK") href = r.href;
      if (r.kind === "CATEGORY") {
        const c = r.category;
        const visible = c && c.isActive && (!c.parent || c.parent.isActive);
        if (visible) href = `/shop/${c.slug}`;
        // A link to a hidden or deleted category: keep it only as a heading for its own links
        else if (children.length === 0) return [];
      }
      // A heading with nothing under it leads nowhere
      if (!href && children.length === 0) return [];
      return [{ id: r.id, label: r.label, href, badge: r.badge, children }];
    });
}

/** Visible categories as a menu: top-level ones, each with its visible subcategories */
async function categoryTree(): Promise<NavNode[]> {
  const top = await prisma.category.findMany({
    where: { parentId: null, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      children: { where: visibleCategory, orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true } },
    },
  });
  return top.map((c) => ({
    id: c.id,
    label: c.name,
    href: `/shop/${c.slug}`,
    badge: null,
    children: c.children.map((s) => ({ id: s.id, label: s.name, href: `/shop/${s.slug}`, badge: null, children: [] })),
  }));
}

const link = (label: string, href: string): NavNode => ({ id: href, label, href, badge: null, children: [] });

/** The footer before one is saved: Shop (the categories), Help and Kosha */
async function defaultFooter(): Promise<NavNode[]> {
  const shop = (await categoryTree()).map((c) => ({ ...c, children: [] }));
  return [
    ...(shop.length ? [{ id: "shop", label: "Shop", href: null, badge: null, children: shop }] : []),
    {
      id: "help",
      label: "Help",
      href: null,
      badge: null,
      children: [
        link("Track order", "/track-order"),
        link("Shipping policy", "/shipping"),
        link("Returns & exchanges", "/returns"),
        link("Contact us", "/contact"),
      ],
    },
    { id: "kosha", label: "Kosha", href: null, badge: null, children: [link("Our story", "/our-story"), link("Wishlist", "/wishlist")] },
  ];
}

const rowSelect = {
  id: true,
  parentId: true,
  label: true,
  kind: true,
  href: true,
  badge: true,
  isActive: true,
  sortOrder: true,
  categoryId: true,
  category: { select: { slug: true, isActive: true, parent: { select: { isActive: true } } } },
} as const;

/** GET /api/navigation/:menu: the menu as the store draws it */
export async function getMenu(menu: MenuKey): Promise<{ items: NavNode[]; custom: boolean }> {
  const rows = await prisma.navItem.findMany({ where: { menu: toEnum(menu) }, select: rowSelect });
  if (rows.length === 0) {
    return { items: menu === "header" ? await categoryTree() : await defaultFooter(), custom: false };
  }
  return { items: buildPublicTree(rows), custom: true };
}

// ─── Admin ────────────────────────────────────────────────────────────────────

/** One item as the admin edits it */
export type AdminNavItem = {
  label: string;
  kind: "CATEGORY" | "LINK" | "NONE";
  categoryId: string | null;
  href: string | null;
  badge: string | null;
  isActive: boolean;
  children: AdminNavItem[];
};

function buildAdminTree(rows: (Omit<Row, "category"> & { categoryId: string | null })[], parentId: string | null = null): AdminNavItem[] {
  return rows
    .filter((r) => r.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r) => ({
      label: r.label,
      kind: r.kind,
      categoryId: r.categoryId,
      href: r.href,
      badge: r.badge,
      isActive: r.isActive,
      children: buildAdminTree(rows, r.id),
    }));
}

/** GET /api/admin/navigation/:menu: the saved menu, or the automatic one to start editing from */
export async function getAdminMenu(menu: MenuKey): Promise<{ items: AdminNavItem[]; custom: boolean }> {
  const rows = await prisma.navItem.findMany({ where: { menu: toEnum(menu) }, select: rowSelect });
  if (rows.length) return { items: buildAdminTree(rows), custom: true };

  // Not saved yet: show what the store currently uses, so editing starts from there
  const auto = menu === "header" ? await categoryTree() : await defaultFooter();
  const toAdmin = (n: NavNode, isCategory: boolean): AdminNavItem => ({
    label: n.label,
    kind: n.href ? (isCategory && n.href.startsWith("/shop/") ? "CATEGORY" : "LINK") : "NONE",
    categoryId: isCategory && n.href?.startsWith("/shop/") ? n.id : null,
    href: n.href && !(isCategory && n.href.startsWith("/shop/")) ? n.href : null,
    badge: null,
    isActive: true,
    children: n.children.map((c) => toAdmin(c, isCategory)),
  });
  // Header items are categories; in the footer only the Shop column's links are
  const items = auto.map((n) => toAdmin(n, menu === "header" || n.id === "shop"));
  return { items, custom: false };
}

/** A page on this store. "//host" and "/\host" are refused because browsers treat them as other websites. */
const storePath = z
  .string()
  .trim()
  .regex(/^\/(?![/\\])[^\s\\]*$/, "Use a link on this store that starts with /, e.g. /shop?filter=sale");

const ItemInput: z.ZodType<AdminNavItem> = z.lazy(() =>
  z
    .object({
      label: z.string().trim().min(1, "Add a label").max(40, "Keep the label under 40 characters"),
      kind: z.enum(["CATEGORY", "LINK", "NONE"]),
      categoryId: z.string().nullish().transform((v) => v || null),
      href: z.string().nullish().transform((v) => v?.trim() || null),
      badge: z
        .string()
        .trim()
        .max(12, "Keep the tag under 12 characters")
        .nullish()
        .transform((v) => v || null),
      isActive: z.boolean().default(true),
      children: z.array(ItemInput).default([]),
    })
    .superRefine((v, ctx) => {
      if (v.kind === "CATEGORY" && !v.categoryId) ctx.addIssue({ code: "custom", path: ["categoryId"], message: "Choose a category" });
      if (v.kind === "LINK") {
        const ok = storePath.safeParse(v.href ?? "");
        if (!ok.success) ctx.addIssue({ code: "custom", path: ["href"], message: ok.error.issues[0].message });
      }
    }),
);

export const MenuInput = z.object({ items: z.array(ItemInput) });

/** PUT /api/admin/navigation/:menu: replaces the whole menu. An empty list goes back to automatic. */
export async function saveMenu(menu: MenuKey, items: AdminNavItem[]) {
  let count = 0;
  const check = (list: AdminNavItem[], depth: number) => {
    for (const i of list) {
      count++;
      if (depth > MAX_DEPTH[menu]) {
        throw badRequest(
          menu === "header" ? "The header menu goes three levels deep at most." : "Footer columns can't have sub-links under their links.",
        );
      }
      check(i.children, depth + 1);
    }
  };
  check(items, 1);
  if (count > MAX_ITEMS) throw badRequest(`A menu can have up to ${MAX_ITEMS} links.`);

  // Every chosen category must exist
  const ids = new Set<string>();
  const collect = (list: AdminNavItem[]) => list.forEach((i) => (i.kind === "CATEGORY" && i.categoryId && ids.add(i.categoryId), collect(i.children)));
  collect(items);
  if (ids.size) {
    const found = await prisma.category.count({ where: { id: { in: [...ids] } } });
    if (found !== ids.size) throw badRequest("One of the chosen categories no longer exists. Please choose it again.");
  }

  const key = toEnum(menu);
  await prisma.$transaction(async (tx) => {
    await tx.navItem.deleteMany({ where: { menu: key } });
    const create = async (list: AdminNavItem[], parentId: string | null) => {
      for (const [sortOrder, i] of list.entries()) {
        const row = await tx.navItem.create({
          data: {
            menu: key,
            parentId,
            sortOrder,
            label: i.label,
            kind: i.kind,
            categoryId: i.kind === "CATEGORY" ? i.categoryId : null,
            href: i.kind === "LINK" ? i.href : null,
            badge: menu === "header" ? i.badge : null,
            isActive: i.isActive,
          },
          select: { id: true },
        });
        await create(i.children, row.id);
      }
    };
    await create(items, null);
  });

  return getAdminMenu(menu);
}
