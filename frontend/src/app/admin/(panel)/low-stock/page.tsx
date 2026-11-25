import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, PackageCheck } from "lucide-react";
import { getLowStock } from "@/lib/admin/api";
import { Card, EmptyState, PageHeader, TableSkeleton, rowAction, td, th } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Low stock" };

type Show = "all" | "sold-out" | "low";
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function LowStockPage({ searchParams }: PageProps<"/admin/low-stock">) {
  return (
    <>
      <PageHeader title="Low stock" description="Variants of live products that are sold out or nearly gone." />
      <Suspense
        fallback={
          <Card bodyClassName="">
            <TableSkeleton rows={6} />
          </Card>
        }
      >
        <List searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function List({ searchParams }: Pick<PageProps<"/admin/low-stock">, "searchParams">) {
  const raw = first((await searchParams).show);
  const show: Show = raw === "sold-out" || raw === "low" ? raw : "all";
  const data = await getLowStock(show);

  const tabs: { value: Show; label: string; count: number }[] = [
    { value: "all", label: "All", count: data.counts.total },
    { value: "sold-out", label: "Sold out", count: data.counts.soldOut },
    { value: "low", label: `${data.threshold} or fewer left`, count: data.counts.low },
  ];

  return (
    <div className="space-y-3">
      <nav aria-label="Show" className="inline-flex rounded-md bg-neutral-100 p-0.5 text-xs font-medium">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={t.value === "all" ? "/admin/low-stock" : `/admin/low-stock?show=${t.value}`}
            aria-current={show === t.value ? "page" : undefined}
            className={`rounded px-2.5 py-1 transition-colors ${show === t.value ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-900"}`}
          >
            {t.label} <span className="tabular-nums text-neutral-400">{t.count}</span>
          </Link>
        ))}
      </nav>

      <Card bodyClassName="">
        {data.items.length === 0 ? (
          <EmptyState icon={PackageCheck} title="Stock looks healthy" description={`Variants with ${data.threshold} or fewer pieces left show up here.`} />
        ) : (
          <div className="relative overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className={th}>Product</th>
                  <th className={th}>Variant</th>
                  <th className={th}>SKU</th>
                  <th className={`${th} text-right`}>In stock</th>
                  <th className={`${th} w-10`}>
                    <span className="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.items.map((v) => (
                  <tr key={v.id} className="hover:bg-neutral-50">
                    <td className={td}>
                      <Link href={`/admin/products/${v.product.id}`} className="font-medium hover:underline">
                        {v.product.name}
                      </Link>
                      <span className="block text-xs text-neutral-500">{v.product.category.name}</span>
                    </td>
                    <td className={`${td} text-neutral-600`}>
                      {v.color}
                      {v.size && ` · ${v.size}`}
                    </td>
                    <td className={`${td} text-xs tabular-nums text-neutral-500`}>{v.sku}</td>
                    <td className={`${td} text-right`}>
                      <span className={`font-semibold tabular-nums ${v.stock === 0 ? "text-red-600" : "text-amber-700"}`}>
                        {v.stock === 0 ? "Sold out" : v.stock}
                      </span>
                    </td>
                    <td className={td}>
                      <Link href={`/admin/products/${v.product.id}`} aria-label={`Restock ${v.product.name}`} title="Edit stock" className={rowAction}>
                        <ChevronRight className="size-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="px-1 text-xs text-neutral-500">Open a product to update its stock. Hidden products aren&rsquo;t listed.</p>
    </div>
  );
}
