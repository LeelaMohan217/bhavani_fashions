import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { getCustomer } from "@/lib/admin/api";
import { formatPrice } from "@/lib/format";
import {
  Avatar,
  Card,
  OrderStatusBadge,
  PAYMENT_METHOD,
  PageHeader,
  PaymentBadge,
  TableSkeleton,
  formatDate,
  formatStamp,
  td,
  th,
} from "@/components/admin/ui";

export const metadata: Metadata = { title: "Customer" };

export default function CustomerPage({ params }: PageProps<"/admin/customers/[phone]">) {
  return (
    <Suspense
      fallback={
        <>
          <div className="mb-6 h-14" aria-hidden />
          <Card bodyClassName="">
            <TableSkeleton rows={4} />
          </Card>
        </>
      }
    >
      <Detail params={params} />
    </Suspense>
  );
}

async function Detail({ params }: Pick<PageProps<"/admin/customers/[phone]">, "params">) {
  const { phone } = await params;
  const c = await getCustomer(decodeURIComponent(phone));
  if (!c) notFound();

  const stats = [
    { label: "Orders", value: String(c.orders) },
    { label: "Spent", value: formatPrice(c.spent) },
    { label: "Pieces bought", value: String(c.pieces) },
    { label: "Customer since", value: formatDate(c.firstOrderAt) },
  ];

  return (
    <>
      <PageHeader
        back={{ href: "/admin/customers", label: "Customers" }}
        title={
          <span className="flex items-center gap-3">
            <Avatar name={c.name} />
            {c.name}
          </span>
        }
      />

      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Contact" bodyClassName="space-y-2 p-4 text-sm">
            <p className="flex items-center gap-2">
              <Phone className="size-4 text-neutral-400" />
              <a href={`tel:+91${c.phone}`} className="tabular-nums hover:underline">
                +91 {c.phone}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="size-4 text-neutral-400" />
              <a href={`mailto:${c.email}`} className="truncate hover:underline">
                {c.email}
              </a>
            </p>
            <p className="flex items-start gap-2 text-neutral-600">
              <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-400" />
              <span>
                {c.address.line1}
                {c.address.line2 && `, ${c.address.line2}`}
                <br />
                {c.address.city}, {c.address.state} {c.address.pincode}
              </span>
            </p>
            <p className="pt-1 text-xs text-neutral-400">From their latest order</p>
          </Card>

          <Card className="lg:col-span-2" bodyClassName="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-neutral-100 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="bg-white px-4 py-3">
                <p className="text-xs text-neutral-500">{s.label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{s.value}</p>
              </div>
            ))}
          </Card>
        </div>

        <Card title="Orders" bodyClassName="">
          <div className="relative overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className={th}>Order</th>
                  <th className={th}>Placed</th>
                  <th className={th}>Payment</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {c.history.map((o) => (
                  <tr key={o.id} className="relative hover:bg-neutral-50">
                    <td className={td}>
                      <Link href={`/admin/orders/${o.id}`} className="font-medium tabular-nums after:absolute after:inset-0 hover:underline">
                        {o.number}
                      </Link>
                      <span className="block text-xs text-neutral-500">
                        {o.pieces} {o.pieces === 1 ? "piece" : "pieces"}
                      </span>
                    </td>
                    <td className={`${td} whitespace-nowrap text-xs tabular-nums text-neutral-500`}>{formatStamp(o.createdAt)}</td>
                    <td className={td}>
                      <div className="flex flex-col items-start gap-1">
                        <PaymentBadge status={o.paymentStatus} />
                        <span className="text-xs text-neutral-500">{PAYMENT_METHOD[o.paymentMethod]}</span>
                      </div>
                    </td>
                    <td className={td}>
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td className={`${td} text-right font-medium tabular-nums`}>{formatPrice(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="px-1 text-xs text-neutral-500">Spent and pieces count only orders that went through: confirmed, packed, shipped or delivered.</p>
      </div>
    </>
  );
}