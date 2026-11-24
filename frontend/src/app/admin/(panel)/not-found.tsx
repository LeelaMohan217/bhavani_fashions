import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Card, btn } from "@/components/admin/ui";

// Admin-styled 404 — rendered inside the admin shell for missing orders/products and unknown admin URLs.
export default function AdminNotFound() {
  return (
    <Card>
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-neutral-100">
          <SearchX className="size-5 text-neutral-500" strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 text-base font-semibold">We couldn&rsquo;t find that page</h1>
        <p className="mt-1 max-w-sm text-sm text-neutral-500">
          The order or product may have been removed, or the link is incorrect.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/admin" className={`${btn.base} ${btn.secondary}`}>
            <ArrowLeft className="size-4" /> Back to dashboard
          </Link>
          <Link href="/admin/orders" className={`${btn.base} ${btn.ghost}`}>
            Orders
          </Link>
          <Link href="/admin/products" className={`${btn.base} ${btn.ghost}`}>
            Products
          </Link>
        </div>
      </div>
    </Card>
  );
}
