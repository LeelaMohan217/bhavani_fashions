import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, IndianRupee, PackageCheck, Receipt, ShoppingBag } from "lucide-react";
import { getDashboard, getMe } from "@/lib/admin/api";
import { Greeting } from "@/components/admin/greeting";
import { CountUp } from "@/components/admin/count-up";
import { SyncButton } from "@/components/admin/sync-button";
import { formatPrice } from "@/lib/format";
import { Card, EmptyState, OrderStatusBadge, PAYMENT_METHOD, TableSkeleton, formatDateTime } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<GreetingSkeleton />}>
        <AdminGreeting />
      </Suspense>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

async function AdminGreeting() {
  const me = await getMe();
  return <Greeting name={me.name} actions={<SyncButton />} />;
}

async function DashboardContent() {
  const d = await getDashboard();
  const { cod, prepaid } = d.paymentSplit;
  const splitTotal = cod.orders + prepaid.orders;
  const codPct = splitTotal ? Math.round((cod.orders / splitTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={ShoppingBag} label="Orders today" value={d.today.orders} />
        <Stat icon={IndianRupee} label="Revenue today" value={d.today.revenue} format="inr" />
        <Stat
          icon={PackageCheck}
          label="Waiting to ship"
          value={d.toFulfil}
          tone={d.toFulfil > 0 ? "amber" : undefined}
          href="/admin/orders?status=to-fulfil"
        />
        <Stat
          icon={AlertTriangle}
          label="Low-stock variants"
          value={d.lowStockCount}
          tone={d.lowStockCount > 0 ? "red" : undefined}
          href="#low-stock"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card
          title="Recent orders"
          className="min-w-0 lg:col-span-2"
          bodyClassName=""
          action={
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
              View all <ArrowRight className="size-3.5" />
            </Link>
          }
        >
          {d.recentOrders.length === 0 ? (
            <EmptyState icon={Receipt} title="No orders yet" description="New orders will appear here as soon as they're placed." />
          ) : (
            // Rows rise in one after another (admin motion styles); new orders animate in after a sync.
            <ul className="divide-y divide-neutral-100 overflow-hidden">
              {d.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {o.number} <span className="font-normal text-neutral-500">· {o.fullName}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {formatDateTime(o.createdAt)} · {PAYMENT_METHOD[o.paymentMethod]}
                      </p>
                    </div>
                    <OrderStatusBadge status={o.status} />
                    <span className="w-24 text-right text-sm font-medium tabular-nums">{formatPrice(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Last 30 days" className="min-w-0">
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs text-neutral-500">Revenue</dt>
              <dd className="mt-1 text-xl font-semibold">
                <CountUp value={d.last30.revenue} format="inr" />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-neutral-500">Orders</dt>
              <dd className="mt-1 text-xl font-semibold">
                <CountUp value={d.last30.orders} />
              </dd>
            </div>
          </dl>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>Payment mix</span>
              <span className="tabular-nums">{splitTotal} orders</span>
            </div>
            <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-neutral-100" role="img" aria-label={`${codPct}% cash on delivery`}>
              {splitTotal > 0 && (
                <>
                  <span className="bg-amber-400" style={{ width: `${codPct}%` }} />
                  <span className="bg-neutral-900" style={{ width: `${100 - codPct}%` }} />
                </>
              )}
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                { label: "COD", dot: "bg-amber-400", ...cod },
                { label: "Prepaid", dot: "bg-neutral-900", ...prepaid },
              ].map((m) => (
                <li key={m.label} className="flex items-center gap-2">
                  <span className={`size-2 shrink-0 rounded-full ${m.dot}`} />
                  <span className="min-w-0 flex-1 truncate">
                    {m.label} <span className="tabular-nums text-neutral-500">· {m.orders}</span>
                  </span>
                  <span className="tabular-nums">{formatPrice(m.revenue)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <div id="low-stock">
        <Card
          title={d.lowStockCount > d.lowStock.length ? `Low stock · lowest ${d.lowStock.length} of ${d.lowStockCount}` : "Low stock"}
          bodyClassName=""
        >
          {d.lowStock.length === 0 ? (
            <EmptyState icon={PackageCheck} title="Stock looks healthy" description="Variants with 3 or fewer pieces left will show up here." />
          ) : (
            <div className="relative overflow-x-auto overflow-y-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left text-xs text-neutral-500">
                    <th className="px-5 py-2.5 font-medium">Product</th>
                    <th className="px-5 py-2.5 font-medium">Variant</th>
                    <th className="px-5 py-2.5 font-medium">SKU</th>
                    <th className="px-5 py-2.5 text-right font-medium">In stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {d.lowStock.map((v) => (
                    <tr key={v.id} className="hover:bg-neutral-50">
                      <td className="px-5 py-3">
                        <Link href={`/admin/products/${v.product.id}`} className="font-medium hover:underline">
                          {v.product.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-neutral-600">
                        {v.color}
                        {v.size && ` · ${v.size}`}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-neutral-500">{v.sku}</td>
                      <td className="px-5 py-3 text-right">
                        <span className={`font-semibold tabular-nums ${v.stock === 0 ? "text-red-600" : "text-amber-700"}`}>
                          {v.stock === 0 ? "Sold out" : v.stock}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  format = "int",
  tone,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  format?: "int" | "inr";
  tone?: "amber" | "red";
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">{label}</span>
        <span
          className={`flex size-8 items-center justify-center rounded-md ${
            tone === "amber" ? "bg-amber-50 text-amber-700" : tone === "red" ? "bg-red-50 text-red-600" : "bg-neutral-100 text-neutral-600"
          }`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">
        <CountUp value={value} format={format} />
      </p>
    </>
  );
  const cls = "block rounded-lg border border-neutral-200 bg-white p-5 shadow-xs";
  return href ? (
    <Link data-rise href={href} className={`${cls} transition-colors hover:border-neutral-300`}>
      {body}
    </Link>
  ) : (
    <div data-rise className={cls}>{body}</div>
  );
}

// ─── Loading skeletons (same card + pulsing-bar style as Orders and Products) ──

const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />;

function GreetingSkeleton() {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4" aria-hidden>
      <div className="space-y-2.5">
        <Bar className="h-7 w-56 bg-neutral-200/70" />
        <Bar className="h-4 w-72" />
      </div>
      <Bar className="h-9 w-28 rounded-md border border-neutral-200 bg-white" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading dashboard">
      {/* KPI tiles */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-neutral-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <Bar className="h-4 w-24" />
              <Bar className="size-8 rounded-md" />
            </div>
            <Bar className="mt-4 h-7 w-20" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <Card title="Recent orders" className="min-w-0 lg:col-span-2" bodyClassName="" action={<Bar className="h-4 w-14" />}>
          <ul className="divide-y divide-neutral-100">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 space-y-2">
                  <Bar className="h-4 w-44" />
                  <Bar className="h-3 w-56" />
                </div>
                <Bar className="h-5 w-16 rounded-full" />
                <Bar className="h-4 w-16" />
              </li>
            ))}
          </ul>
        </Card>

        {/* Last 30 days */}
        <Card title="Last 30 days" className="min-w-0">
          <div className="grid grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-2">
                <Bar className="h-3 w-14" />
                <Bar className="h-6 w-24" />
              </div>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            <div className="flex justify-between">
              <Bar className="h-3 w-20" />
              <Bar className="h-3 w-12" />
            </div>
            <Bar className="h-2 w-full rounded-full" />
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-4/5" />
          </div>
        </Card>
      </div>

      {/* Low stock */}
      <Card title="Low stock" bodyClassName="">
        <TableSkeleton rows={4} />
      </Card>
    </div>
  );
}
