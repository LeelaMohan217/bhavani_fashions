"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import type { BestSellerPeriod, BestSellers } from "@/lib/admin/types";
import { formatPrice } from "@/lib/format";
import { PERIODS } from "@/lib/admin/insights";
import { Card, EmptyState } from "./ui";


/** Dashboard: top 3 products by pieces sold, switchable between periods. */
export function BestSellersCard({ data, className = "" }: { data: Record<BestSellerPeriod, BestSellers>; className?: string }) {
  const [period, setPeriod] = useState<BestSellerPeriod>("this-month");
  const current = data[period];
  const top = current.items.slice(0, 3);

  return (
    <Card
      title="Best sellers"
      className={`min-w-0 ${className}`}
      bodyClassName=""
      action={
        <Link href={`/admin/insights?period=${period}`} className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900">
          View all <ArrowRight className="size-3.5" />
        </Link>
      }
    >
      <div role="tablist" aria-label="Period" className="mx-5 mt-1 inline-flex rounded-md bg-neutral-100 p-0.5 text-xs font-medium">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            role="tab"
            aria-selected={period === p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded px-2.5 py-1 transition-colors ${period === p.value ? "bg-white text-neutral-900 shadow-xs" : "text-neutral-500 hover:text-neutral-900"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {top.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No sales in this period" description="Products appear here as soon as orders are confirmed." />
      ) : (
          <ol className="mt-2 divide-y divide-neutral-100">
            {top.map((p, i) => (
              <li key={p.key} className="flex items-center gap-3 px-5 py-2.5">
                <span className="w-4 shrink-0 text-xs tabular-nums text-neutral-400">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  {p.productId ? (
                    <Link href={`/admin/products/${p.productId}`} className="block truncate text-sm font-medium hover:underline">
                      {p.name}
                    </Link>
                  ) : (
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                  )}
                  {p.category && <span className="block truncate text-xs text-neutral-500">{p.category}</span>}
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-medium tabular-nums">{p.units} sold</span>
                  <span className="block text-xs tabular-nums text-neutral-500">{formatPrice(p.revenue)}</span>
                </span>
              </li>
            ))}
          </ol>
      )}
    </Card>
  );
}
