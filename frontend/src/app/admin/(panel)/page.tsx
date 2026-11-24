import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, ChevronRight, ExternalLink, IndianRupee, PackageCheck, Plus, Receipt, Shirt, ShoppingBag } from "lucide-react";
import { Delta, RevenueGrowth } from "@/components/admin/revenue-growth";
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
  const lw = d.sameDayLastWeek;
  const vsLastWeek = (cur: number, prev?: number) => (prev ? Math.round(((cur - prev) / prev) * 100) : null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat icon={ShoppingBag} tint="sky" label="Orders today" value={d.today.orders} delta={vsLastWeek(d.today.orders, lw?.orders)} />
        <Stat icon={IndianRupee} tint="emerald" label="Revenue today" value={d.today.revenue} format="inr" delta={vsLastWeek(d.today.revenue, lw?.revenue)} />
        <Stat icon={PackageCheck} tint="amber" label="Waiting to ship" value={d.toFulfil} href="/admin/orders?status=to-fulfil" />
        <Stat icon={AlertTriangle} tint="red" label="Low-stock variants" value={d.lowStockCount} href="#low-stock" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {d.monthly && d.monthly.length > 0 && <RevenueGrowth monthly={d.monthly} className="lg:col-span-2" />}
        <QuickActions toFulfil={d.toFulfil} />
      </div>

      <div id="low-stock" className="scroll-mt-20">
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
                      <td className="px-5 py-3 tabular-nums text-xs text-neutral-500">{v.sku}</td>
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

      <Card
        title="Recent orders"
        className="min-w-0"
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
                <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {o.number} <span className="font-normal text-neutral-500">· {o.fullName}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-neutral-500">
                      {formatDateTime(o.createdAt)}
                      <span className="hidden sm:inline"> · {PAYMENT_METHOD[o.paymentMethod]}</span>
                    </p>
                  </div>
                  {/* Phone: amount over status. Wider: status then amount, in a row */}
                  <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row-reverse sm:items-center sm:gap-4">
                    <span className="text-sm font-medium tabular-nums sm:w-24 sm:text-right">{formatPrice(o.total)}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

const TINTS = {
  sky: "bg-sky-50 text-sky-600 ring-sky-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  red: "bg-red-50 text-red-600 ring-red-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  dark: "bg-neutral-900 text-white ring-neutral-900",
};

function Stat({
  icon: Icon,
  label,
  value,
  format = "int",
  tint,
  delta,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  format?: "int" | "inr";
  tint: keyof typeof TINTS;
  /** % change vs the same time last week; null/undefined hides the tag */
  delta?: number | null;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 text-xs leading-snug text-neutral-500 sm:text-sm">{label}</span>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${TINTS[tint]}`}>
          <Icon className="size-[1.1rem]" />
        </span>
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
        <CountUp value={value} format={format} />
      </p>
      <div className="mt-1.5 h-4" title={delta != null ? "Compared with the same time last week" : undefined}>
        <Delta value={delta ?? null} />
        {delta != null && <span className="sr-only"> compared with the same time last week</span>}
      </div>
    </>
  );
  const cls = "block rounded-lg border border-neutral-200 bg-white p-4 shadow-xs sm:p-5";
  return href ? (
    <Link data-rise href={href} className={`${cls} transition-colors hover:border-neutral-300`}>
      {body}
    </Link>
  ) : (
    <div data-rise className={cls}>{body}</div>
  );
}

function QuickActions({ toFulfil }: { toFulfil: number }) {
  const items = [
    { href: "/admin/products/new", label: "Add product", hint: "List a new piece", icon: Plus, tint: "dark" as const },
    {
      href: toFulfil > 0 ? "/admin/orders?status=to-fulfil" : "/admin/orders",
      label: "Orders",
      hint: toFulfil > 0 ? `${toFulfil} waiting to ship` : "All orders shipped",
      icon: Receipt,
      tint: "amber" as const,
    },
    { href: "/admin/products", label: "Products", hint: "Edit stock & prices", icon: Shirt, tint: "violet" as const },
    { href: "/", label: "View store", hint: "Open the storefront", icon: ExternalLink, tint: "sky" as const, external: true },
  ];
  return (
    <Card title="Quick actions" className="min-w-0" bodyClassName="p-2">
      <ul className="space-y-1">
        {items.map((a) => (
          <li key={a.label}>
            <Link
              href={a.href}
              target={a.external ? "_blank" : undefined}
              className="group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
            >
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${TINTS[a.tint]}`}>
                <a.icon className="size-[1.1rem]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{a.label}</span>
                <span className="block truncate text-xs text-neutral-500">{a.hint}</span>
              </span>
              <ChevronRight className="size-4 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ─── Loading skeletons (same card + pulsing-bar style as Orders and Products) ──

const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded bg-neutral-100 ${className}`} />;

function GreetingSkeleton() {
  return (
    <div className="mb-6 flex items-center justify-between gap-3 sm:items-end sm:gap-4" aria-hidden>
      <div className="min-w-0 space-y-2.5">
        <Bar className="h-7 w-56 max-w-full bg-neutral-200/70" />
        <Bar className="h-4 w-44 sm:w-72" />
      </div>
      <Bar className="size-10 shrink-0 rounded-full border border-neutral-200 bg-white sm:h-9 sm:w-28 sm:rounded-md" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading dashboard">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-neutral-200 bg-white p-4 shadow-xs sm:p-5">
            <div className="flex items-center justify-between">
              <Bar className="h-4 w-20" />
              <Bar className="size-9 rounded-lg" />
            </div>
            <Bar className="mt-4 h-7 w-20" />
            <Bar className="mt-2 h-3 w-12" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue growth */}
        <Card title="Revenue growth" className="min-w-0 lg:col-span-2" action={<Bar className="h-6 w-20 rounded-md" />}>
          <div className="space-y-2">
            <Bar className="h-3 w-24" />
            <Bar className="h-8 w-40" />
            <Bar className="h-3 w-28" />
          </div>
          <Bar className="mt-6 h-44 w-full rounded-md sm:h-52" />
        </Card>

        {/* Quick actions */}
        <Card title="Quick actions" className="min-w-0" bodyClassName="p-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3">
              <Bar className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Bar className="h-4 w-24" />
                <Bar className="h-3 w-32" />
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Low stock */}
      <Card title="Low stock" bodyClassName="">
        <TableSkeleton rows={4} />
      </Card>

      {/* Recent orders */}
      <Card title="Recent orders" bodyClassName="" action={<Bar className="h-4 w-14" />}>
        <ul className="divide-y divide-neutral-100">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex-1 space-y-2">
                <Bar className="h-4 w-44" />
                <Bar className="h-3 w-32" />
              </div>
              <Bar className="h-4 w-16" />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
