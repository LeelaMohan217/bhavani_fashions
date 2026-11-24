import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Receipt } from "lucide-react";
import { getOrders } from "@/lib/admin/api";
import { formatPrice } from "@/lib/format";
import {
  Avatar,
  Card,
  EmptyState,
  OrderStatusBadge,
  PAYMENT_METHOD,
  PageHeader,
  Pagination,
  PaymentBadge,
  formatStamp,
  rowAction,
  td,
  th,
} from "@/components/admin/ui";
import { TableToolbar } from "@/components/admin/table-toolbar";
import { TableCardSkeleton } from "@/components/admin/skeletons";

export const metadata: Metadata = { title: "Orders" };

const STATUSES = ["to-fulfil", "SHIPPED", "DELIVERED", "CANCELLED", "PENDING_PAYMENT"];
const PAYMENTS = ["COD", "RAZORPAY"];
const PAGE_SIZE = 10;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
/** Keeps only known values from a comma-separated multi-select param */
const pick = (v: string | string[] | undefined, allowed: string[]) =>
  (first(v) ?? "").split(",").filter((x) => allowed.includes(x)).join(",") || undefined;

export default function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <>
      <PageHeader title="Orders" description="Pack, ship and track every order." />
      <Suspense fallback={<TableCardSkeleton avatar />}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function OrdersContent({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  const sp = await searchParams;
  const status = pick(sp.status, STATUSES);
  const search = first(sp.search)?.trim() || undefined;
  const payment = pick(sp.payment, PAYMENTS);
  const page = Math.max(1, Number(first(sp.page)) || 1);

  const list = await getOrders({ status, search, payment, page, pageSize: PAGE_SIZE });
  const c = list.counts;
  const href = (p = 1) => {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (search) q.set("search", search);
    if (payment) q.set("payment", payment);
    if (p > 1) q.set("page", String(p));
    return `/admin/orders${q.size ? `?${q}` : ""}`;
  };

  return (
    <Card bodyClassName="">
        <TableToolbar
          searchPlaceholder="Search order no., name or phone"
          exportPath="/admin/orders/export"
          filters={[
            {
              param: "status",
              label: "Status",
              options: [
                { value: "to-fulfil", label: "To fulfil", count: (c.CONFIRMED ?? 0) + (c.PACKED ?? 0) },
                { value: "SHIPPED", label: "Shipped", count: c.SHIPPED },
                { value: "DELIVERED", label: "Delivered", count: c.DELIVERED },
                { value: "CANCELLED", label: "Cancelled", count: c.CANCELLED },
                { value: "PENDING_PAYMENT", label: "Awaiting payment", count: c.PENDING_PAYMENT },
              ],
            },
            {
              param: "payment",
              label: "Payment method",
              options: [
                { value: "COD", label: "Cash on delivery" },
                { value: "RAZORPAY", label: "Razorpay" },
              ],
            },
          ]}
        />

        {list.items.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={search || payment || status ? "No orders match these filters" : "No orders yet"}
            description={search ? "Try an order number like BF10002, a name or a phone number." : "Orders in this state will show up here."}
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden relative overflow-x-auto overflow-y-hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className={th}>Customer</th>
                    <th className={th}>Order</th>
                    <th className={th}>Payment</th>
                    <th className={th}>Status</th>
                    <th className={th}>Placed</th>
                    <th className={`${th} text-right`}>Total</th>
                    <th className={th}><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {list.items.map((o) => (
                    <tr key={o.id} className="group relative transition-colors hover:bg-neutral-50">
                      <td className={td}>
                        <div className="flex items-center gap-3">
                          <Avatar name={o.fullName} />
                          <div className="min-w-0">
                            <Link href={`/admin/orders/${o.id}`} className="block truncate font-medium after:absolute after:inset-0">
                              {o.fullName}
                            </Link>
                            <p className="truncate font-mono text-xs text-neutral-500">+91 {o.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className={td}>
                        <p className="font-mono text-xs text-neutral-700">{o.number}</p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {o.city} · {o.pieces} {o.pieces === 1 ? "piece" : "pieces"}
                        </p>
                      </td>
                      <td className={td}>
                        <div className="flex flex-col items-start gap-1">
                          <PaymentBadge status={o.paymentStatus} />
                          <span className="text-xs text-neutral-500">{PAYMENT_METHOD[o.paymentMethod]}</span>
                        </div>
                      </td>
                      <td className={td}>
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className={`${td} whitespace-nowrap font-mono text-xs text-neutral-500`}>{formatStamp(o.createdAt)}</td>
                      <td className={`${td} text-right font-medium tabular-nums`}>{formatPrice(o.total)}</td>
                      <td className={`${td} w-12 text-right`}>
                        {/* Sits above the row-wide link so it stays clickable */}
                        <Link href={`/admin/orders/${o.id}`} aria-label={`View order ${o.number}`} title="View order" className={`${rowAction} relative z-10`}>
                          <Eye className="size-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <ul className="divide-y divide-neutral-100 md:hidden">
              {list.items.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-start gap-3 px-4 py-3.5 active:bg-neutral-50">
                    <Avatar name={o.fullName} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium">{o.fullName}</span>
                        <span className="text-sm font-medium tabular-nums">{formatPrice(o.total)}</span>
                      </div>
                      <p className="mt-0.5 font-mono text-xs text-neutral-500">
                        {o.number} · {formatStamp(o.createdAt)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <OrderStatusBadge status={o.status} />
                        <PaymentBadge status={o.paymentStatus} />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <Pagination page={list.page} totalPages={list.totalPages} total={list.total} pageSize={PAGE_SIZE} href={href} />
    </Card>
  );
}
