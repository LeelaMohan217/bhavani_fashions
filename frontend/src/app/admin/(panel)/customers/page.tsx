import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { getCustomers } from "@/lib/admin/api";
import type { CustomerSort } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";
import { Avatar, Card, EmptyState, PageHeader, Pagination, formatDate, rowAction, td, th } from "@/components/admin/ui";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { TableCardSkeleton } from "@/components/admin/skeletons";

export const metadata: Metadata = { title: "Customers" };

const PAGE_SIZE = 20;
const SORTS: { value: CustomerSort; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "spent", label: "Top spenders" },
  { value: "orders", label: "Most orders" },
];
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function CustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  return (
    <>
      <PageHeader title="Customers" description="Everyone who has ordered, grouped by mobile number." />
      <Suspense fallback={<TableCardSkeleton avatar />}>
        <List searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function List({ searchParams }: Pick<PageProps<"/admin/customers">, "searchParams">) {
  const sp = await searchParams;
  const search = first(sp.search)?.trim() || undefined;
  const raw = first(sp.sort);
  const sort = (SORTS.some((s) => s.value === raw) ? raw : "recent") as CustomerSort;
  const page = Math.max(1, Number(first(sp.page)) || 1);
  const list = await getCustomers({ search, sort, page, pageSize: PAGE_SIZE });

  const href = (next: { sort?: CustomerSort; page?: number }) => {
    const q = new URLSearchParams();
    if (search) q.set("search", search);
    const s = next.sort ?? sort;
    if (s !== "recent") q.set("sort", s);
    if ((next.page ?? 1) > 1) q.set("page", String(next.page));
    return `/admin/customers${q.size ? `?${q}` : ""}`;
  };

  return (
    <Card bodyClassName="">
      <TableToolbar searchPlaceholder="Search name, phone or email" filters={[]}>
        <nav aria-label="Sort" className="inline-flex rounded-md bg-neutral-100 p-0.5 text-xs font-medium">
          {SORTS.map((s) => (
            <Link
              key={s.value}
              href={href({ sort: s.value })}
              aria-current={sort === s.value ? "page" : undefined}
              className={`rounded px-2.5 py-1 transition-colors ${sort === s.value ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-900"}`}
            >
              {s.label}
            </Link>
          ))}
        </nav>
      </TableToolbar>

      {list.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "No customers match" : "No customers yet"}
          description={search ? "Try a name, a mobile number or an email." : "Customers appear here after their first order."}
        />
      ) : (
        <div className="relative overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className={th}>Customer</th>
                <th className={th}>Email</th>
                <th className={th}>City</th>
                <th className={`${th} text-right`}>Orders</th>
                <th className={`${th} text-right`}>Spent</th>
                <th className={th}>Last order</th>
                <th className={`${th} w-10`}>
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {list.items.map((c) => (
                <tr key={c.phone} className="group relative hover:bg-neutral-50">
                  <td className={td}>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={c.name} size="sm" />
                      <div className="min-w-0">
                        <Link href={`/admin/customers/${c.phone}`} className="block truncate font-medium after:absolute after:inset-0">
                          {c.name}
                        </Link>
                        <span className="block text-xs tabular-nums text-neutral-500">+91 {c.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className={`${td} max-w-52 truncate text-neutral-600`}>{c.email}</td>
                  <td className={`${td} text-neutral-600`}>{c.city}</td>
                  <td className={`${td} text-right tabular-nums`}>{c.orders}</td>
                  <td className={`${td} text-right font-medium tabular-nums`}>{formatPrice(c.spent)}</td>
                  <td className={`${td} whitespace-nowrap text-xs text-neutral-500`}>{formatDate(c.lastOrderAt)}</td>
                  <td className={td}>
                    <span className={`${rowAction} pointer-events-none`}>
                      <ChevronRight className="size-4" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={list.page} totalPages={list.totalPages} total={list.total} pageSize={PAGE_SIZE} href={(p) => href({ page: p })} />
    </Card>
  );
}