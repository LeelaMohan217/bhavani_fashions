import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  CircleCheck,
  ExternalLink,
  IndianRupee,
  PackageCheck,
  Plus,
  Receipt,
  Shirt,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
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
  const avgOrder = d.last30.orders ? Math.round(d.last30.revenue / d.last30.orders) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <TodayCard today={d.today} daily={d.daily} />
        <NeedsAttention toFulfil={d.toFulfil} lowStock={d.lowStockCount} />
      </div>

      <QuickActions />

      <section aria-labelledby="month-title">
        <h2 id="month-title" className="mb-3 text-sm font-semibold text-neutral-900">
          Last 30 days
        </h2>
        <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          <Tile icon={IndianRupee} label="Revenue" tint="emerald">
            <CountUp value={d.last30.revenue} format="inr" />
          </Tile>
          <Tile icon={ShoppingBag} label="Orders" tint="sky">
            <CountUp value={d.last30.orders} />
          </Tile>
          <Tile icon={Receipt} label="Avg. order" tint="violet">
            <CountUp value={avgOrder} format="inr" />
          </Tile>
          <Tile icon={Wallet} label="Payment mix" tint="amber">
            {splitTotal ? (
              <div>
                <div className="flex h-2 overflow-hidden rounded-full bg-neutral-100" role="img" aria-label={`${codPct}% cash on delivery, ${100 - codPct}% prepaid`}>
                  <span className="bg-amber-400" style={{ width: `${codPct}%` }} />
                  <span className="bg-neutral-900" style={{ width: `${100 - codPct}%` }} />
                </div>
                <p className="mt-2 flex justify-between text-xs font-normal text-neutral-500">
                  <span><span className="mr-1 inline-block size-1.5 rounded-full bg-amber-400 align-middle" />COD {codPct}%</span>
                  <span>Prepaid {100 - codPct}%</span>
                </p>
              </div>
            ) : (
              <span className="text-sm font-normal text-neutral-400">No orders yet</span>
            )}
          </Tile>
        </div>
      </section>

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
            <ul className="divide-y divide-neutral-100 overflow-hidden">
              {d.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 md:px-5">
                    <Avatar name={o.fullName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{o.fullName}</p>
                      <p className="mt-0.5 truncate text-xs text-neutral-500">
                        {o.number} · {formatDateTime(o.createdAt)}
                        <span className="hidden sm:inline"> · {PAYMENT_METHOD[o.paymentMethod]}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row-reverse sm:items-center sm:gap-4">
                      <span className="text-sm font-semibold tabular-nums sm:w-24 sm:text-right">{formatPrice(o.total)}</span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div id="low-stock" className="min-w-0 scroll-mt-20">
          <Card
            title={d.lowStockCount > d.lowStock.length ? `Low stock · ${d.lowStock.length} of ${d.lowStockCount}` : "Low stock"}
            bodyClassName=""
            action={
              d.lowStockCount > 0 ? (
                <Link href="/admin/products" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
                  Products <ArrowRight className="size-3.5" />
                </Link>
              ) : undefined
            }
          >
            {d.lowStock.length === 0 ? (
              <EmptyState icon={PackageCheck} title="Stock looks healthy" description="Variants with 3 or fewer pieces left will show up here." />
            ) : (
              <ul className="divide-y divide-neutral-100">
                {d.lowStock.map((v) => (
                  <li key={v.id}>
                    <Link href={`/admin/products/${v.product.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 md:px-5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{v.product.name}</p>
                        <p className="mt-0.5 truncate text-xs text-neutral-500">
                          {v.color}
                          {v.size && ` · ${v.size}`} · <span className="tabular-nums">{v.sku}</span>
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
                          v.stock === 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── Today: the headline card ────────────────────────────────────────────────

const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" });

function TodayCard({ today, daily }: { today: { orders: number; revenue: number }; daily?: { date: string; orders: number; revenue: number }[] }) {
  const yesterday = daily && daily.length >= 2 ? daily[daily.length - 2] : undefined;
  const change = yesterday && yesterday.revenue > 0 ? Math.round(((today.revenue - yesterday.revenue) / yesterday.revenue) * 100) : null;
  const max = Math.max(1, ...(daily ?? []).map((x) => x.revenue));
  const weekRevenue = (daily ?? []).reduce((n, x) => n + x.revenue, 0);
  const weekOrders = (daily ?? []).reduce((n, x) => n + x.orders, 0);

  return (
    <section
      data-rise
      aria-label="Today"
      className="relative overflow-hidden rounded-xl bg-neutral-900 p-5 text-white shadow-sm md:p-6 lg:col-span-2"
    >
      {/* Soft glow for depth */}
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-amber-400/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-rose-400/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-white/60">Revenue today</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            <CountUp value={today.revenue} format="inr" />
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/70">
            <span>
              <CountUp value={today.orders} /> {today.orders === 1 ? "order" : "orders"}
            </span>
            {change !== null && (
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                  change >= 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-rose-400/15 text-rose-300"
                }`}
              >
                {change >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {Math.abs(change)}% vs yesterday
              </span>
            )}
          </p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10">
          <IndianRupee className="size-5" />
        </span>
      </div>

      {daily && daily.length > 0 && (
        <div className="relative mt-6">
          <div className="flex items-baseline justify-between text-xs text-white/60">
            <span>Last 7 days</span>
            <span className="tabular-nums">
              {formatPrice(weekRevenue)} · {weekOrders} {weekOrders === 1 ? "order" : "orders"}
            </span>
          </div>
          <ol
            className="mt-3 grid h-24 grid-cols-7 items-end gap-2"
            aria-label={daily.map((x) => `${weekday.format(new Date(x.date))}: ${formatPrice(x.revenue)}`).join(", ")}
          >
            {daily.map((x, i) => {
              const isToday = i === daily.length - 1;
              const pct = x.revenue > 0 ? Math.max(8, (x.revenue / max) * 100) : 4;
              return (
                <li key={x.date} className="flex h-full flex-col justify-end" title={`${formatPrice(x.revenue)} · ${x.orders} orders`}>
                  <span
                    className={`block origin-bottom animate-bar-grow rounded-md ${isToday ? "bg-amber-300" : "bg-white/25"}`}
                    style={{ height: `${pct}%`, animationDelay: `${200 + i * 60}ms` }}
                  />
                </li>
              );
            })}
          </ol>
          <div className="mt-2 grid grid-cols-7 gap-2 text-center text-[0.65rem] text-white/50">
            {daily.map((x, i) => (
              <span key={x.date} className={i === daily.length - 1 ? "font-semibold text-white" : ""}>
                {i === daily.length - 1 ? "Today" : weekday.format(new Date(x.date))}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Needs attention: what to do next ────────────────────────────────────────

function NeedsAttention({ toFulfil, lowStock }: { toFulfil: number; lowStock: number }) {
  const items = [
    toFulfil > 0 && {
      href: "/admin/orders?status=to-fulfil",
      icon: PackageCheck,
      tint: "bg-amber-100 text-amber-700",
      title: `${toFulfil} ${toFulfil === 1 ? "order" : "orders"} to ship`,
      hint: "Pack and hand over to the courier",
    },
    lowStock > 0 && {
      href: "#low-stock",
      icon: AlertTriangle,
      tint: "bg-red-100 text-red-600",
      title: `${lowStock} ${lowStock === 1 ? "variant" : "variants"} low on stock`,
      hint: "Restock before they sell out",
    },
  ].filter(Boolean) as { href: string; icon: typeof PackageCheck; tint: string; title: string; hint: string }[];

  return (
    <section data-rise aria-labelledby="attention-title" className="flex flex-col rounded-xl border border-neutral-200 bg-white shadow-xs">
      <header className="flex items-center justify-between px-5 pb-2 pt-4">
        <h2 id="attention-title" className="text-sm font-semibold">Needs attention</h2>
        {items.length > 0 && (
          <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-semibold tabular-nums text-white">{items.length}</span>
        )}
      </header>
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 pb-6 pt-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-emerald-50">
            <CircleCheck className="size-5 text-emerald-600" />
          </span>
          <p className="mt-3 text-sm font-medium">You&rsquo;re all caught up</p>
          <p className="mt-1 text-xs text-neutral-500">Nothing to ship and stock looks healthy.</p>
        </div>
      ) : (
        <ul className="space-y-1 px-2 pb-2">
          {items.map((it) => (
            <li key={it.href}>
              <Link href={it.href} className="group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-neutral-50 active:bg-neutral-100">
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${it.tint}`}>
                  <it.icon className="size-[1.1rem]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{it.title}</span>
                  <span className="block truncate text-xs text-neutral-500">{it.hint}</span>
                </span>
                <ChevronRight className="size-4 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Quick actions ───────────────────────────────────────────────────────────

function QuickActions() {
  const actions = [
    { href: "/admin/products/new", label: "Add product", icon: Plus, primary: true },
    { href: "/admin/orders", label: "Orders", icon: Receipt },
    { href: "/admin/products", label: "Products", icon: Shirt },
    { href: "/", label: "View store", icon: ExternalLink, external: true },
  ];
  return (
    <nav aria-label="Quick actions" className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
      <ul className="flex gap-2">
        {actions.map((a) => (
          <li key={a.href} className="shrink-0">
            <Link
              href={a.href}
              target={a.external ? "_blank" : undefined}
              className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
                a.primary
                  ? "bg-neutral-900 text-white hover:bg-neutral-800"
                  : "border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:text-neutral-900"
              }`}
            >
              <a.icon className="size-4" />
              {a.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ─── Small pieces ────────────────────────────────────────────────────────────

const TINTS = {
  emerald: "bg-emerald-50 text-emerald-600",
  sky: "bg-sky-50 text-sky-600",
  violet: "bg-violet-50 text-violet-600",
  amber: "bg-amber-50 text-amber-700",
};

function Tile({
  icon: Icon,
  label,
  tint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tint: keyof typeof TINTS;
  children: React.ReactNode;
}) {
  return (
    <div data-rise className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs md:p-5">
      <div className="flex items-center gap-2">
        <span className={`flex size-7 items-center justify-center rounded-lg ${TINTS[tint]}`}>
          <Icon className="size-3.5" />
        </span>
        <span className="truncate text-xs text-neutral-500">{label}</span>
      </div>
      <div className="mt-3 text-lg font-semibold tracking-tight tabular-nums md:text-xl">{children}</div>
    </div>
  );
}

const AVATAR_TINTS = [
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
  "bg-orange-100 text-orange-700",
];

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0);
  return (
    <span aria-hidden className={`flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_TINTS[hash % AVATAR_TINTS.length]}`}>
      {initials || "?"}
    </span>
  );
}

// ─── Loading skeletons (same card + pulsing-bar style as Orders and Products) ──

const Bar = ({ className, style }: { className: string; style?: React.CSSProperties }) => (
  <div className={`animate-pulse rounded bg-neutral-100 ${className}`} style={style} />
);

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
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-xl bg-neutral-200/70 lg:col-span-2" />
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <Bar className="h-4 w-28" />
          {[0, 1].map((i) => (
            <div key={i} className="mt-5 flex items-center gap-3">
              <Bar className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Bar className="h-4 w-36" />
                <Bar className="h-3 w-44" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {[28, 20, 22, 24].map((w, i) => (
          <Bar key={i} className="h-10 rounded-full" style={{ width: `${w * 4}px` }} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs md:p-5">
            <div className="flex items-center gap-2">
              <Bar className="size-7 rounded-lg" />
              <Bar className="h-3 w-16" />
            </div>
            <Bar className="mt-4 h-6 w-24" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Recent orders" className="min-w-0 lg:col-span-2" bodyClassName="" action={<Bar className="h-4 w-14" />}>
          <ul className="divide-y divide-neutral-100">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                <Bar className="size-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Bar className="h-4 w-32" />
                  <Bar className="h-3 w-44" />
                </div>
                <Bar className="h-4 w-16" />
              </li>
            ))}
          </ul>
        </Card>
        <Card title="Low stock" bodyClassName="">
          <TableSkeleton rows={4} />
        </Card>
      </div>
    </div>
  );
}
