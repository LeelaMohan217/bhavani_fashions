import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Crown, ImageOff, TrendingUp } from "lucide-react";
import { getBestSellers, getCategories } from "@/lib/admin/api";
import type { BestSellerPeriod, BestSellers } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";
import { Badge, Card, EmptyState, PageHeader, TableSkeleton, td, th } from "@/components/admin/ui";
import { FilterMenu } from "@/components/admin/filter-menu";
import { PERIODS } from "@/lib/admin/insights";

export const metadata: Metadata = { title: "Best sellers" };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function InsightsPage({ searchParams }: PageProps<"/admin/insights">) {
  return (
    <>
      <PageHeader title="Best sellers" description="Which pieces sell the most, from confirmed orders only." />
      <Suspense
        fallback={
          <Card bodyClassName="">
            <TableSkeleton rows={6} />
          </Card>
        }
      >
        <Report searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Report({ searchParams }: Pick<PageProps<"/admin/insights">, "searchParams">) {
  const sp = await searchParams;
  const period = (PERIODS.some((p) => p.value === first(sp.period)) ? first(sp.period) : "this-month") as BestSellerPeriod;
  const category = first(sp.category) || undefined;

  const [data, categories] = await Promise.all([getBestSellers({ period, sort: "units", category, limit: 100 }), getCategories()]);
  const topLevel = categories.filter((c) => !c.parentId);

  const href = (next: Partial<{ period: string; category: string | undefined }>) => {
    const q = new URLSearchParams();
    const v = { period, category, ...next };
    if (v.period !== "this-month") q.set("period", v.period);
    if (v.category) q.set("category", v.category);
    const s = q.toString();
    return `/admin/insights${s ? `?${s}` : ""}`;
  };

  const chip = (active: boolean) =>
    `rounded px-2.5 py-1 transition-colors ${active ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-900"}`;
  const periodLabel = PERIODS.find((p) => p.value === period)?.label.toLowerCase() ?? "";
  const top = data.items[0];

  return (
    <div className="space-y-3">
      {top && <TopSeller item={top} periodLabel={periodLabel} />}

      {/* Controls in one compact row; extra filters sit behind the Filter button */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        <nav aria-label="Period" className="inline-flex rounded-md bg-neutral-100 p-0.5">
          {PERIODS.map((p) => (
            <Link key={p.value} href={href({ period: p.value })} aria-current={period === p.value ? "page" : undefined} className={chip(period === p.value)}>
              {p.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto">
          <FilterMenu
            activeCount={category ? 1 : 0}
            clearHref={href({ category: undefined })}
            sections={[
              {
                label: "Category",
                options: [
                  { label: "All categories", href: href({ category: undefined }), active: !category },
                  ...topLevel.map((c) => ({ label: c.name, href: href({ category: c.slug }), active: category === c.slug })),
                ],
              },
            ]}
          />
        </div>
      </div>

      <Card bodyClassName="">
        {data.items.length === 0 ? (
          <EmptyState icon={TrendingUp} title="No sales in this period" description="Products appear here as soon as orders are confirmed." />
        ) : (
          <div className="relative overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className={`${th} w-10`}>#</th>
                  <th className={th}>Product</th>
                  <th className={`${th} text-right`}>Pieces sold</th>
                  <th className={`${th} text-right`}>Orders</th>
                  <th className={`${th} text-right`}>Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {data.items.map((p, i) => (
                  <tr key={p.key} className="hover:bg-neutral-50">
                    <td className={`${td} tabular-nums text-neutral-400`}>{i + 1}</td>
                    <td className={td}>
                      <span className="flex items-center gap-2">
                        {p.productId ? (
                          <Link href={`/admin/products/${p.productId}`} className="font-medium hover:underline">
                            {p.name}
                          </Link>
                        ) : (
                          <span className="font-medium">{p.name}</span>
                        )}
                        {!p.isActive && <Badge>{p.productId ? "Hidden" : "Deleted"}</Badge>}
                      </span>
                      {p.category && <span className="block text-xs text-neutral-500">{p.category}</span>}
                    </td>
                    <td className={`${td} text-right font-medium tabular-nums`}>{p.units}</td>
                    <td className={`${td} text-right tabular-nums text-neutral-600`}>{p.orders}</td>
                    <td className={`${td} text-right tabular-nums`}>{formatPrice(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="px-1 text-xs text-neutral-500">
        Months follow Indian time. Counts only orders that went through: confirmed, packed, shipped or delivered.
      </p>
    </div>
  );
}

/** The #1 product for the chosen period: photo plus its numbers, in one slim card. */
function TopSeller({ item, periodLabel }: { item: BestSellers["items"][number]; periodLabel: string }) {
  const name = item.productId ? (
    <Link href={`/admin/products/${item.productId}`} className="hover:underline">
      {item.name}
    </Link>
  ) : (
    item.name
  );
  return (
    <div className="flex items-center gap-3 rounded-lg border border-neutral-200 bg-white p-2.5">
      <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded bg-neutral-100">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <ImageOff className="absolute inset-0 m-auto size-4 text-neutral-300" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 text-[0.68rem] font-semibold uppercase tracking-wider text-amber-700">
          <Crown className="size-3" /> Top seller · {periodLabel}
        </p>
        <p className="truncate text-sm font-medium text-neutral-900">{name}</p>
        {item.category && <p className="text-xs text-neutral-500">{item.category}</p>}
      </div>
      <dl className="flex shrink-0 gap-5 text-right text-xs">
        <div>
          <dt className="text-neutral-500">Pieces</dt>
          <dd className="font-semibold tabular-nums text-neutral-900">{item.units}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Orders</dt>
          <dd className="font-semibold tabular-nums text-neutral-900">{item.orders}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Revenue</dt>
          <dd className="font-semibold tabular-nums text-neutral-900">{formatPrice(item.revenue)}</dd>
        </div>
      </dl>
    </div>
  );
}
