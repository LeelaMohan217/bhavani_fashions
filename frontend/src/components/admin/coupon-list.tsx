"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, TicketPercent, TriangleAlert } from "lucide-react";
import { setCouponActive } from "@/lib/admin/actions";
import type { AdminCoupon, CouponState } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";
import { Badge, Card, EmptyState, formatDate, rowAction, td, th } from "./ui";
import { Switch } from "./coupon-editor";

const STATE: Record<CouponState, { label: string; tone: "green" | "blue" | "neutral" | "amber" }> = {
  active: { label: "Active", tone: "green" },
  scheduled: { label: "Scheduled", tone: "blue" },
  expired: { label: "Expired", tone: "neutral" },
  "used-up": { label: "Used up", tone: "amber" },
  off: { label: "Off", tone: "neutral" },
};

function validity(c: AdminCoupon) {
  if (c.startsAt && c.endsAt) return `${formatDate(c.startsAt)} to ${formatDate(c.endsAt)}`;
  if (c.endsAt) return `Until ${formatDate(c.endsAt)}`;
  if (c.startsAt) return `From ${formatDate(c.startsAt)}`;
  return "No end date";
}

/** Coupon codes as a table; the switch turns a code on or off straight away. */
export function CouponList({ coupons: initial, emptyTitle }: { coupons: AdminCoupon[]; emptyTitle: string }) {
  const router = useRouter();
  const [coupons, setCoupons] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const toggle = (c: AdminCoupon) => {
    const before = coupons;
    setCoupons(coupons.map((x) => (x.id === c.id ? { ...x, isActive: !c.isActive } : x)));
    setError(null);
    start(async () => {
      const res = await setCouponActive(c.id, !c.isActive);
      if (!res.ok) {
        setCoupons(before);
        setError(res.error);
        return;
      }
      setCoupons((list) => list.map((x) => (x.id === c.id ? res.coupon : x)));
      router.refresh();
    });
  };

  if (coupons.length === 0) {
    return (
      <Card bodyClassName="">
        <EmptyState icon={TicketPercent} title={emptyTitle} description="Codes like FESTIVE10 give shoppers a discount at checkout." />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" /> {error}
        </div>
      )}
      <Card bodyClassName="">
        <div className={`relative overflow-x-auto overflow-y-hidden ${pending ? "opacity-70" : ""}`}>
          <table className="w-full min-w-[44rem] text-sm">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className={th}>Code</th>
                <th className={th}>Discount</th>
                <th className={th}>Valid</th>
                <th className={`${th} text-right`}>Used</th>
                <th className={th}>Status</th>
                <th className={th}>On / off</th>
                <th className={`${th} w-10`}>
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className={td}>
                    <Link href={`/admin/coupons/${c.id}`} className="font-medium tracking-wide hover:underline">
                      {c.code}
                    </Link>
                    {c.description && <span className="block max-w-56 truncate text-xs text-neutral-500">{c.description}</span>}
                  </td>
                  <td className={td}>
                    <span className="block">{c.label}</span>
                    <span className="block text-xs text-neutral-500">{c.minOrder ? `On ${formatPrice(c.minOrder)}+` : "Any bag"}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap text-xs text-neutral-600`}>{validity(c)}</td>
                  <td className={`${td} text-right tabular-nums`}>
                    {c.usedCount}
                    <span className="text-neutral-400">{c.usageLimit ? ` / ${c.usageLimit}` : ""}</span>
                  </td>
                  <td className={td}>
                    <Badge tone={STATE[c.state].tone} dot>
                      {STATE[c.state].label}
                    </Badge>
                  </td>
                  <td className={td}>
                    <Switch on={c.isActive} disabled={pending} label={c.isActive ? `Switch ${c.code} off` : `Switch ${c.code} on`} onClick={() => toggle(c)} />
                  </td>
                  <td className={td}>
                    <Link href={`/admin/coupons/${c.id}`} aria-label={`Edit ${c.code}`} title="Edit" className={rowAction}>
                      <Pencil className="size-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
