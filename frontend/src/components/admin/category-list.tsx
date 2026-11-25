"use client";

import { Fragment, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CornerDownRight, FolderTree, Pencil, Plus, Trash2, TriangleAlert } from "lucide-react";
import { deleteCategory, reorderCategories, setCategoryActive } from "@/lib/admin/actions";
import type { AdminCategory } from "@/lib/admin/types";
import { useFeedback } from "@/components/ui/feedback";
import { Card, EmptyState, btn, rowAction, td, th } from "./ui";

/** Categories as a table: show/hide, order, edit and delete. Changes save straight away. */
export function CategoryList({ categories: initial }: { categories: AdminCategory[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { confirm, toast } = useFeedback();

  const parents = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  /** Run a change optimistically; put things back if the server says no */
  const save = (next: AdminCategory[], action: () => Promise<{ ok: boolean; error?: string }>, done?: string) => {
    const before = categories;
    setCategories(next);
    setError(null);
    start(async () => {
      const res = await action();
      if (!res.ok) {
        setCategories(before);
        setError(res.error ?? "Couldn't save. Please try again.");
      } else {
        if (done) toast(done);
        router.refresh();
      }
    });
  };

  const move = (siblings: AdminCategory[], from: number, to: number) => {
    const order = [...siblings];
    const [c] = order.splice(from, 1);
    order.splice(to, 0, c);
    const rank = new Map(order.map((x, i) => [x.id, i]));
    const sorted = categories
      .map((x) => (rank.has(x.id) ? { ...x, sortOrder: rank.get(x.id)! } : x))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    // Parents in order, each followed by its subcategories
    const next = sorted.filter((p) => !p.parentId).flatMap((p) => [p, ...sorted.filter((ch) => ch.parentId === p.id)]);
    save(next, () => reorderCategories(order.map((x) => x.id)));
  };

  const toggle = (c: AdminCategory) =>
    save(
      categories.map((x) => (x.id === c.id ? { ...x, isActive: !c.isActive } : x)),
      () => setCategoryActive(c.id, !c.isActive),
      c.isActive ? `${c.name} is hidden from the store` : `${c.name} is showing in the store`,
    );

  const remove = async (c: AdminCategory) => {
    const ok = await confirm({
      title: `Delete ${c.name}?`,
      body: "It will be removed for good. This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    save(
      categories.filter((x) => x.id !== c.id),
      () => deleteCategory(c.id),
      `${c.name} was deleted`,
    );
  };

  if (parents.length === 0) {
    return (
      <Card bodyClassName="">
        <EmptyState
          icon={FolderTree}
          title="No categories yet"
          description="Categories group your products, like Sarees or Lehengas. Add one to get started."
          action={
            <Link href="/admin/categories/new" className={`${btn.base} ${btn.primary}`}>
              <Plus className="size-4" /> Add category
            </Link>
          }
        />
      </Card>
    );
  }

  const row = (c: AdminCategory, siblings: AdminCategory[], i: number, parent?: AdminCategory) => {
    const hiddenByParent = Boolean(parent && !parent.isActive);
    const blocked =
      c.childCount > 0
        ? `Has ${c.childCount} subcategor${c.childCount === 1 ? "y" : "ies"}. Move or delete them first.`
        : c.productCount > 0
          ? `Has ${c.productCount} product${c.productCount === 1 ? "" : "s"}. Move them to another category first, or hide it instead.`
          : null;

    return (
      <tr key={c.id} className={`border-b border-neutral-100 last:border-b-0 ${parent ? "bg-neutral-50/60" : ""}`}>
        <td className={td}>
          <Link href={`/admin/categories/${c.id}`} className={`flex items-center gap-2 font-medium hover:underline ${parent ? "pl-5" : ""}`}>
            {parent && <CornerDownRight className="size-3.5 shrink-0 text-neutral-300" aria-hidden />}
            {c.name}
          </Link>
          <span className={`block text-xs text-neutral-400 ${parent ? "pl-10" : ""}`}>/shop/{c.slug}</span>
        </td>
        <td className={`${td} tabular-nums text-neutral-600`}>{c.productCount}</td>
        <td className={td}>
          <button
            type="button"
            role="switch"
            aria-checked={c.isActive}
            aria-label={c.isActive ? `Hide ${c.name} from the store` : `Show ${c.name} in the store`}
            disabled={pending}
            onClick={() => toggle(c)}
            className="inline-flex items-center gap-2"
          >
            <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${c.isActive ? "bg-neutral-900" : "bg-neutral-200"}`}>
              <span className={`inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${c.isActive ? "translate-x-[1.125rem]" : "translate-x-0.5"}`} />
            </span>
            <span className={`text-xs ${c.isActive && !hiddenByParent ? "text-neutral-700" : "text-neutral-400"}`}>
              {!c.isActive ? "Hidden" : hiddenByParent ? "Hidden with parent" : "Showing"}
            </span>
          </button>
        </td>
        <td className={td}>
          <div className="flex items-center gap-0.5">
            <button type="button" disabled={pending || i === 0} onClick={() => move(siblings, i, i - 1)} aria-label={`Move ${c.name} up`} className={`${rowAction} disabled:opacity-30`}>
              <ArrowUp className="size-4" />
            </button>
            <button
              type="button"
              disabled={pending || i === siblings.length - 1}
              onClick={() => move(siblings, i, i + 1)}
              aria-label={`Move ${c.name} down`}
              className={`${rowAction} disabled:opacity-30`}
            >
              <ArrowDown className="size-4" />
            </button>
          </div>
        </td>
        <td className={`${td} text-right`}>
          <span className="inline-flex items-center gap-0.5">
            <Link href={`/admin/categories/${c.id}`} aria-label={`Edit ${c.name}`} title="Edit" className={rowAction}>
              <Pencil className="size-4" />
            </Link>
            <button
              type="button"
              disabled={pending || Boolean(blocked)}
              onClick={() => remove(c)}
              aria-label={`Delete ${c.name}`}
              title={blocked ?? "Delete"}
              className={`${rowAction} hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30`}
            >
              <Trash2 className="size-4" />
            </button>
          </span>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {error}
        </div>
      )}

      <Card bodyClassName="">
        <div className={`relative overflow-x-auto overflow-y-hidden ${pending ? "opacity-70" : ""}`}>
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className={th}>Category</th>
                <th className={th}>Products</th>
                <th className={th}>Show / hide</th>
                <th className={th}>Order</th>
                <th className={`${th} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parents.map((p, i) => {
                const kids = childrenOf(p.id);
                return (
                  <Fragment key={p.id}>
                    {row(p, parents, i)}
                    {kids.map((k, j) => row(k, kids, j, p))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="px-1 text-xs text-neutral-500">
        The store lists categories in this order. Hiding a category hides it and its products from the store; nothing is deleted. A category can only be deleted once it has no products.
      </p>
    </div>
  );
}
