import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ImageOff, Pencil, Plus, Shirt } from "lucide-react";
import { getCategories, getProducts } from "@/lib/admin/api";
import { formatPrice } from "@/lib/format";
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Pagination,
  btn,
  formatStamp,
  rowAction,
  td,
  th,
} from "@/components/admin/ui";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { TableCardSkeleton } from "@/components/admin/skeletons";
import { ProductVisibilityToggle } from "@/components/admin/product-visibility-toggle";

export const metadata: Metadata = { title: "Products" };

const STATUSES = ["active", "hidden"] as const;
const PAGE_SIZE = 10;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function ProductsPage({ searchParams }: PageProps<"/admin/products">) {
  return (
    <>
      <PageHeader
        title="Products"
        description="Everything in the catalogue, including hidden pieces."
        actions={
          <Link href="/admin/products/new" className={`${btn.base} ${btn.primary}`}>
            <Plus className="size-4" /> New product
          </Link>
        }
      />
      <Suspense fallback={<TableCardSkeleton />}>
        <ProductsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function ProductsContent({ searchParams }: Pick<PageProps<"/admin/products">, "searchParams">) {
  const sp = await searchParams;
  const status = (first(sp.status) ?? "").split(",").filter((s) => (STATUSES as readonly string[]).includes(s)).join(",") || undefined;
  const search = first(sp.search)?.trim() || undefined;
  const category = (first(sp.category) ?? "").split(",").filter((s) => /^[a-z0-9-]+$/.test(s)).join(",") || undefined;
  const page = Math.max(1, Number(first(sp.page)) || 1);

  const [list, categories] = await Promise.all([getProducts({ status, search, category, page, pageSize: PAGE_SIZE }), getCategories()]);
  const href = (p: number) => {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (search) q.set("search", search);
    if (category) q.set("category", category);
    if (p > 1) q.set("page", String(p));
    return `/admin/products${q.size ? `?${q}` : ""}`;
  };

  return (
    <Card bodyClassName="">
      <TableToolbar
        searchPlaceholder="Search name or SKU"
        exportPath="/admin/products/export"
        filters={[
          {
            param: "status",
            label: "Visibility",
            options: [
              { value: "active", label: "Live" },
              { value: "hidden", label: "Hidden" },
            ],
          },
          { param: "category", label: "Category", options: categories.map((c) => ({ value: c.slug, label: c.name })) },
        ]}
      />

      {list.items.length === 0 ? (
        <EmptyState
          icon={Shirt}
          title={search || status || category ? "No products match these filters" : "No products yet"}
          description={search ? "Try a product name or a SKU like BFS001." : "Add your first piece to start selling."}
          action={
            !search &&
            !status &&
            !category && (
              <Link href="/admin/products/new" className={`${btn.base} ${btn.primary}`}>
                <Plus className="size-4" /> New product
              </Link>
            )
          }
        />
      ) : (
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className={th}>Product</th>
                <th className={th}>Category</th>
                <th className={th}>Price</th>
                <th className={th}>Stock</th>
                <th className={th}>Status</th>
                <th className={`${th} hidden xl:table-cell`}>Updated</th>
                <th className={th}><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {list.items.map((p) => (
                // The whole row opens the product (the name link stretches over the row)
                <tr key={p.id} className="relative cursor-pointer transition-colors hover:bg-neutral-50">
                  <td className={td}>
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 after:absolute after:inset-0">
                      <span className="flex h-11 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-neutral-100">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt="" className="size-full object-cover" loading="lazy" />
                        ) : (
                          <ImageOff className="size-4 text-neutral-400" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{p.name}</span>
                        <span className="mt-0.5 block truncate font-mono text-xs text-neutral-500">
                          {p.variantCount} {p.variantCount === 1 ? "variant" : "variants"}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className={`${td} whitespace-nowrap text-neutral-600`}>{p.category}</td>
                  <td className={`${td} whitespace-nowrap tabular-nums`}>
                    {formatPrice(p.price)}
                    {p.compareAtPrice && <s className="ml-1.5 text-xs text-neutral-400">{formatPrice(p.compareAtPrice)}</s>}
                  </td>
                  <td className={td}>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className={`tabular-nums ${p.totalStock === 0 ? "font-medium text-red-600" : ""}`}>
                        {p.totalStock === 0 ? "Sold out" : p.totalStock}
                      </span>
                      {p.lowStock && p.totalStock > 0 && <Badge tone="amber">Low</Badge>}
                    </div>
                  </td>
                  <td className={td}>
                    <div className="flex flex-wrap gap-1.5">
                      {p.isActive ? <Badge tone="green" dot>Live</Badge> : <Badge dot>Hidden</Badge>}
                      {p.isFeatured && <Badge tone="violet">Featured</Badge>}
                    </div>
                  </td>
                  <td className={`${td} hidden whitespace-nowrap font-mono text-xs text-neutral-500 xl:table-cell`}>{formatStamp(p.updatedAt)}</td>
                  <td className={`${td} w-20`}>
                    {/* Raised above the row-wide link so these stay clickable */}
                    <div className="relative z-10 flex justify-end gap-0.5">
                      <Link href={`/admin/products/${p.id}`} aria-label={`Edit ${p.name}`} title="Edit" className={rowAction}>
                        <Pencil className="size-4" />
                      </Link>
                      <ProductVisibilityToggle id={p.id} isActive={p.isActive} name={p.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={list.page} totalPages={list.totalPages} total={list.total} pageSize={PAGE_SIZE} href={href} />
    </Card>
  );
}
