import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCoupons } from "@/lib/admin/api";
import type { CouponShow } from "@/lib/admin/types";
import { Card, PageHeader, TableSkeleton, btn } from "@/components/admin/ui";
import { CouponList } from "@/components/admin/coupon-list";

export const metadata: Metadata = { title: "Coupons" };

const SHOWS: { value: CouponShow; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "ended", label: "Ended or off" },
];
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default function CouponsPage({ searchParams }: PageProps<"/admin/coupons">) {
  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes shoppers type at checkout."
        actions={
          <Link href="/admin/coupons/new" className={`${btn.base} ${btn.primary}`}>
            <Plus className="size-4" /> New code
          </Link>
        }
      />
      <Suspense
        fallback={
          <Card bodyClassName="">
            <TableSkeleton rows={4} />
          </Card>
        }
      >
        <List searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function List({ searchParams }: Pick<PageProps<"/admin/coupons">, "searchParams">) {
  const raw = first((await searchParams).show);
  const show = (SHOWS.some((s) => s.value === raw) ? raw : "all") as CouponShow;
  const data = await getCoupons(show);
  const version = data.items.map((c) => `${c.id}:${c.isActive}:${c.usedCount}:${c.state}:${c.code}:${c.value}`).join("|");

  return (
    <div className="space-y-3">
      <nav aria-label="Show" className="inline-flex rounded-md bg-neutral-100 p-0.5 text-xs font-medium">
        {SHOWS.map((s) => (
          <Link
            key={s.value}
            href={s.value === "all" ? "/admin/coupons" : `/admin/coupons?show=${s.value}`}
            aria-current={show === s.value ? "page" : undefined}
            className={`rounded px-2.5 py-1 transition-colors ${show === s.value ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-900"}`}
          >
            {s.label} <span className="tabular-nums text-neutral-400">{data.counts[s.value]}</span>
          </Link>
        ))}
      </nav>
      <CouponList key={version} coupons={data.items} emptyTitle={show === "all" ? "No codes yet" : "Nothing here"} />
      <p className="px-1 text-xs text-neutral-500">The discount comes off the bag subtotal, after any store-wide offer. One code per order.</p>
    </div>
  );
}