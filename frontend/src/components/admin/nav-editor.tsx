"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, CornerDownRight, FolderTree, LoaderCircle, Plus, RotateCcw, Trash2, TriangleAlert } from "lucide-react";
import { saveNavigation } from "@/lib/admin/actions";
import type { AdminCategory, AdminNavItem, NavMenuKey } from "@/lib/admin/types";
import { OCCASIONS, PRICE_RANGES, priceHref } from "@/lib/content";
import { Select } from "@/components/ui/select";
import { useFeedback } from "@/components/ui/feedback";
import { Switch } from "./coupon-editor";
import { Card, btn, inputCls, rowAction } from "./ui";
import { useUnsavedGuard } from "./use-unsaved-guard";

/** An item with a local key so rows keep their identity while being moved */
type Row = Omit<AdminNavItem, "children"> & { key: string; children: Row[] };

let seq = 0;
const newKey = () => `n${++seq}`;
const withKeys = (items: AdminNavItem[]): Row[] => items.map((i) => ({ ...i, key: newKey(), children: withKeys(i.children) }));
const strip = (rows: Row[]): AdminNavItem[] =>
  rows.map((r) => ({
    label: r.label.trim(),
    kind: r.kind,
    categoryId: r.categoryId,
    href: r.href,
    badge: r.badge?.trim() || null,
    isActive: r.isActive,
    children: strip(r.children),
  }));
const snapshot = (rows: Row[]) => JSON.stringify(strip(rows));

const DEPTH: Record<NavMenuKey, number> = { header: 3, footer: 2 };
/** What each level is called, so it's clear where an item shows up */
const LEVEL_NAME: Record<NavMenuKey, string[]> = {
  header: ["Top link", "Dropdown column", "Link"],
  footer: ["Column", "Link"],
};

/** Pages of the store that can be linked to */
const PAGES = [
  { href: "/shop", label: "All products" },
  { href: "/shop?filter=new", label: "New In" },
  { href: "/shop?filter=sale", label: "Sale" },
  ...OCCASIONS.map((o) => ({ href: `/shop?occasion=${o}`, label: `Occasion: ${o}` })),
  ...PRICE_RANGES.map((r) => ({ href: priceHref(r), label: `Price: ${r.label}` })),
  { href: "/our-story", label: "Our story" },
  { href: "/track-order", label: "Track order" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/contact", label: "Contact us" },
  { href: "/shipping", label: "Shipping policy" },
  { href: "/returns", label: "Returns & exchanges" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];
const STORE_PATH = /^\/(?![/\\])[^\s\\]*$/;

/** "none", "cat:<id>", "page:<href>" or "custom": the value of the "Link to" dropdown */
const linkValue = (r: Row) =>
  r.kind === "NONE" ? "none" : r.kind === "CATEGORY" ? `cat:${r.categoryId}` : PAGES.some((p) => p.href === r.href) ? `page:${r.href}` : "custom";

/** Problems the admin must fix before saving, by row key */
function problems(rows: Row[], out: Record<string, string> = {}) {
  for (const r of rows) {
    if (!r.label.trim()) out[r.key] = "Add a label";
    else if (r.kind === "CATEGORY" && !r.categoryId) out[r.key] = "Choose a category";
    else if (r.kind === "LINK" && !STORE_PATH.test(r.href ?? "")) out[r.key] = "Use a link on this store that starts with /";
    else if (r.kind === "NONE" && r.children.length === 0) out[r.key] = "A heading needs links under it, or choose where it links to";
    problems(r.children, out);
  }
  return out;
}

export function NavEditor({
  menu,
  initial,
  custom: initialCustom,
  categories,
}: {
  menu: NavMenuKey;
  initial: AdminNavItem[];
  custom: boolean;
  categories: AdminCategory[];
}) {
  const router = useRouter();
  const { confirm, toast } = useFeedback();
  const [saved, setSaved] = useState(() => withKeys(initial));
  const [rows, setRows] = useState(saved);
  const [custom, setCustom] = useState(initialCustom);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const dirty = snapshot(rows) !== snapshot(saved);
  useUnsavedGuard(dirty && !pending);

  const parents = categories.filter((c) => !c.parentId);
  const categoryOptions = useMemo(
    () =>
      parents.flatMap((p) => [
        { value: `cat:${p.id}`, label: `Category: ${p.name}${p.isActive ? "" : " (hidden)"}` },
        ...categories
          .filter((c) => c.parentId === p.id)
          .map((c) => ({ value: `cat:${c.id}`, label: `Category: ${p.name} › ${c.name}${c.isActive ? "" : " (hidden)"}` })),
      ]),
    [categories, parents],
  );
  const linkOptions = [
    { value: "none", label: "No link (heading only)" },
    ...categoryOptions,
    ...PAGES.map((p) => ({ value: `page:${p.href}`, label: p.label })),
    { value: "custom", label: "Custom link…" },
  ];
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? "";

  // ─── Tree edits (by path of indexes) ─────────────────────────────────────
  const update = (path: number[], fn: (siblings: Row[], i: number) => Row[]) => {
    const go = (list: Row[], depth: number): Row[] =>
      depth === path.length - 1 ? fn(list, path[depth]) : list.map((r, i) => (i === path[depth] ? { ...r, children: go(r.children, depth + 1) } : r));
    setRows((cur) => go(cur, 0));
    setErrors({});
  };
  const patch = (path: number[], p: Partial<Row>) => update(path, (list, i) => list.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const move = (path: number[], to: number) =>
    update(path, (list, i) => {
      const next = [...list];
      const [r] = next.splice(i, 1);
      next.splice(to, 0, r);
      return next;
    });
  const blank = (): Row => ({ key: newKey(), label: "", kind: "LINK", categoryId: null, href: "/shop", badge: null, isActive: true, children: [] });
  const addChild = (path: number[]) => patch(path, { children: [...getAt(path).children, blank()] });
  const getAt = (path: number[]) => path.slice(1).reduce((r, i) => r.children[i], rows[path[0]]);
  const remove = async (path: number[]) => {
    const r = getAt(path);
    const count = (list: Row[]): number => list.reduce((n, c) => n + 1 + count(c.children), 0);
    if (r.children.length) {
      const ok = await confirm({
        title: `Remove ${r.label.trim() || "this item"}?`,
        body: `Its ${count(r.children)} link${count(r.children) === 1 ? "" : "s"} underneath will be removed too. Nothing changes in the store until you save.`,
        confirmLabel: "Remove",
        danger: true,
      });
      if (!ok) return;
    }
    update(path, (list, i) => list.filter((_, j) => j !== i));
  };

  const onLinkChange = (path: number[], r: Row, value: string) => {
    if (value === "none") return patch(path, { kind: "NONE", categoryId: null, href: null });
    if (value === "custom") return patch(path, { kind: "LINK", categoryId: null, href: r.kind === "LINK" ? r.href : "/" });
    if (value.startsWith("cat:")) {
      const id = value.slice(4);
      // Fill the label from the category if it's empty or still another category's name
      const label = !r.label.trim() || (r.kind === "CATEGORY" && r.label === categoryName(r.categoryId)) ? categoryName(id) : r.label;
      return patch(path, { kind: "CATEGORY", categoryId: id, href: null, label });
    }
    const href = value.slice(5);
    const page = PAGES.find((p) => p.href === href);
    const isPageLabel = PAGES.some((p) => p.label === r.label) || (r.kind === "CATEGORY" && r.label === categoryName(r.categoryId));
    patch(path, { kind: "LINK", categoryId: null, href, label: !r.label.trim() || isPageLabel ? (page?.label ?? r.label) : r.label });
  };

  // ─── Whole-menu actions ──────────────────────────────────────────────────
  const fromCategories = (): Row[] => {
    const cat = (c: AdminCategory, kids: Row[] = []): Row => ({
      key: newKey(),
      label: c.name,
      kind: "CATEGORY",
      categoryId: c.id,
      href: null,
      badge: null,
      isActive: c.isActive,
      children: kids,
    });
    if (menu === "header") return parents.map((p) => cat(p, categories.filter((c) => c.parentId === p.id).map((c) => cat(c))));
    return [{ key: newKey(), label: "Shop", kind: "NONE", categoryId: null, href: null, badge: null, isActive: true, children: parents.map((p) => cat(p)) }];
  };

  const onFill = async () => {
    if (parents.length === 0) return toast("Add a category first", { error: true });
    if (rows.length) {
      const ok = await confirm({
        title: menu === "header" ? "Replace the menu with your categories?" : "Add a Shop column with your categories?",
        body:
          menu === "header"
            ? "Every category becomes a top link, with its subcategories in the dropdown. Nothing changes in the store until you save."
            : "A Shop column listing your categories is added at the start. Nothing changes in the store until you save.",
        confirmLabel: menu === "header" ? "Replace" : "Add column",
      });
      if (!ok) return;
    }
    setRows(menu === "header" ? fromCategories() : [...fromCategories(), ...rows.filter((r) => r.label !== "Shop")]);
    setErrors({});
  };

  const onSave = () => {
    setFormError(null);
    const found = problems(rows);
    if (Object.keys(found).length) {
      setErrors(found);
      setFormError("Some items need fixing. See the highlighted rows.");
      return;
    }
    start(async () => {
      const res = await saveNavigation(menu, strip(rows));
      if (!res.ok) {
        setFormError(res.error);
        return;
      }
      const fresh = withKeys(res.menu.items);
      setSaved(fresh);
      setRows(fresh);
      setCustom(res.menu.custom);
      toast(`${menu === "header" ? "Header" : "Footer"} menu saved. The store is updated.`);
      router.refresh();
    });
  };

  const onReset = async () => {
    const ok = await confirm({
      title: "Go back to the automatic menu?",
      body:
        menu === "header"
          ? "Your custom header menu is removed, and the header shows your categories (with subcategories in the dropdown) again."
          : "Your custom footer is removed, and the footer shows Shop (your categories), Help and Kosha again.",
      confirmLabel: "Use automatic menu",
      danger: true,
    });
    if (!ok) return;
    start(async () => {
      const res = await saveNavigation(menu, []);
      if (!res.ok) return setFormError(res.error);
      const fresh = withKeys(res.menu.items);
      setSaved(fresh);
      setRows(fresh);
      setCustom(false);
      toast("Back to the automatic menu");
      router.refresh();
    });
  };

  // ─── Rows ────────────────────────────────────────────────────────────────
  const renderRows = (list: Row[], parentPath: number[]) =>
    list.map((r, i) => {
      const path = [...parentPath, i];
      const depth = path.length;
      const canNest = depth < DEPTH[menu];
      const error = errors[r.key];
      const value = linkValue(r);
      return (
        <li key={r.key} className={depth > 1 ? "border-l border-neutral-200 pl-3" : ""}>
          <div className={`rounded-md border bg-white p-2 ${error ? "border-red-300" : "border-neutral-200"} ${r.isActive ? "" : "opacity-60"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-full text-[0.65rem] font-medium uppercase tracking-wider text-neutral-400 sm:w-auto">
                {depth > 1 && <CornerDownRight className="mr-1 inline size-3" />}
                {LEVEL_NAME[menu][depth - 1]}
              </span>
              <input
                value={r.label}
                onChange={(e) => patch(path, { label: e.target.value })}
                placeholder="Label"
                aria-label="Label"
                aria-invalid={Boolean(error && !r.label.trim()) || undefined}
                maxLength={40}
                className={`${inputCls} !h-8 min-w-0 flex-1 basis-36`}
              />
              <Select
                tone="admin"
                ariaLabel="Link to"
                value={value}
                onChange={(v) => onLinkChange(path, r, v)}
                options={linkOptions}
                minListWidth={260}
                className={`${inputCls} !h-8 flex min-w-0 flex-1 basis-44 items-center gap-2 text-left`}
              />
              {value === "custom" && (
                <input
                  value={r.href ?? ""}
                  onChange={(e) => patch(path, { href: e.target.value })}
                  placeholder="/shop?occasion=Wedding"
                  aria-label="Custom link"
                  className={`${inputCls} !h-8 min-w-0 flex-1 basis-40`}
                />
              )}
              {menu === "header" && depth < 3 && (
                <input
                  value={r.badge ?? ""}
                  onChange={(e) => patch(path, { badge: e.target.value || null })}
                  placeholder="Tag"
                  title="Small tag next to the label, e.g. New"
                  aria-label="Tag, for example New"
                  maxLength={12}
                  className={`${inputCls} !h-8 w-20 shrink-0`}
                />
              )}
              <span className="ml-auto flex shrink-0 items-center gap-0.5">
                <Switch on={r.isActive} label={r.isActive ? "Showing" : "Hidden"} onClick={() => patch(path, { isActive: !r.isActive })} />
                <button type="button" disabled={i === 0} onClick={() => move(path, i - 1)} aria-label="Move up" className={`${rowAction} disabled:opacity-30`}>
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" disabled={i === list.length - 1} onClick={() => move(path, i + 1)} aria-label="Move down" className={`${rowAction} disabled:opacity-30`}>
                  <ArrowDown className="size-4" />
                </button>
                {canNest && (
                  <button type="button" onClick={() => addChild(path)} aria-label={`Add a link under ${r.label || "this item"}`} title="Add a link under this" className={rowAction}>
                    <Plus className="size-4" />
                  </button>
                )}
                <button type="button" onClick={() => remove(path)} aria-label={`Remove ${r.label || "this item"}`} title="Remove" className={`${rowAction} hover:text-red-600`}>
                  <Trash2 className="size-4" />
                </button>
              </span>
            </div>
            {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
          </div>
          {r.children.length > 0 && <ul className="mt-1.5 space-y-1.5 pl-3">{renderRows(r.children, path)}</ul>}
        </li>
      );
    });

  return (
    <div className="space-y-3 pb-24">
      {formError && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {formError}
        </div>
      )}

      <Card
        title={
          <span className="flex items-center gap-2">
            {menu === "header" ? "Header menu" : "Footer menu"}
            <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${custom ? "bg-violet-50 text-violet-700" : "bg-neutral-100 text-neutral-500"}`}>
              {custom ? "Custom" : "Automatic"}
            </span>
          </span>
        }
        action={
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={onFill} className={`${btn.base} ${btn.secondary} !h-8 !px-2.5 text-xs`}>
              <FolderTree className="size-3.5" /> {menu === "header" ? "Fill from categories" : "Add Shop column"}
            </button>
            {custom && (
              <button type="button" disabled={pending} onClick={onReset} className={`${btn.base} ${btn.ghost} !h-8 text-xs`}>
                <RotateCcw className="size-3.5" /> Use automatic
              </button>
            )}
          </div>
        }
        bodyClassName="p-3"
      >
        <p className="mb-3 text-xs text-neutral-500">
          {custom
            ? "This menu is used as saved here."
            : menu === "header"
              ? "Not customised yet: the header shows your categories, with subcategories in the dropdown. Edit below and save to customise it."
              : "Not customised yet: the footer shows Shop (your categories), Help and Kosha. Edit below and save to customise it."}{" "}
          {menu === "header"
            ? "Top links sit in the header; links under them open a wide dropdown, in columns."
            : "Each column is a heading with its links underneath."}
        </p>

        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500">
            Nothing in this menu yet.
          </p>
        ) : (
          <ul className="space-y-1.5">{renderRows(rows, [])}</ul>
        )}

        <button
          type="button"
          onClick={() => setRows((cur) => [...cur, blank()])}
          className={`${btn.base} ${btn.ghost} mt-2 !h-8 text-xs`}
        >
          <Plus className="size-3.5" /> Add {LEVEL_NAME[menu][0].toLowerCase()}
        </button>
      </Card>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-[var(--bottom-nav-h,0px)] z-20 border-t border-neutral-200 bg-white/90 backdrop-blur transition-[left] duration-200 md:left-20 lg:left-[var(--sidebar-w,15rem)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 md:px-8">
          <p className="text-sm text-neutral-500" aria-live="polite">
            {pending ? (
              "Saving…"
            ) : dirty ? (
              <span className="inline-flex items-center gap-2 text-amber-700">
                <span className="size-1.5 rounded-full bg-amber-500" /> Unsaved changes
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4" /> {custom ? "Saved" : "Automatic"}
              </span>
            )}
          </p>
          <div className="flex gap-2">
            {dirty && (
              <button type="button" disabled={pending} onClick={() => (setRows(saved), setErrors({}), setFormError(null))} className={`${btn.base} ${btn.ghost}`}>
                Discard
              </button>
            )}
            <button type="button" disabled={pending || !dirty} onClick={onSave} className={`${btn.base} ${btn.primary}`}>
              {pending && <LoaderCircle className="size-4 animate-spin" />}
              Save menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
