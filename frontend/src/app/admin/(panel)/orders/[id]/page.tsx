import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { getOrder } from "@/lib/admin/api";
import { formatPrice } from "@/lib/format";
import {
  Card,
  OrderStatusBadge,
  PAYMENT_METHOD,
  PageHeader,
  PaymentBadge,
  formatDateTime,
} from "@/components/admin/ui";
import { OrderActions } from "@/components/admin/order-actions";
import { OrderDetailSkeleton } from "@/components/admin/skeletons";

export const metadata: Metadata = { title: "Order" };

export default function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  const { id } = await params;
  const o = await getOrder(id);
  if (!o) notFound();

  const pieces = o.items.reduce((n, i) => n + i.quantity, 0);

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {o.number}
            <OrderStatusBadge status={o.status} />
            <PaymentBadge status={o.paymentStatus} />
          </span>
        }
        description={`Placed ${formatDateTime(o.createdAt)} · ${pieces} ${pieces === 1 ? "piece" : "pieces"} · ${formatPrice(o.total)}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <OrderActions order={o} />

          <Card title="Items" bodyClassName="">
            <ul className="divide-y divide-neutral-100">
              {o.items.map((item) => (
                <li key={item.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-neutral-100">
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${item.productSlug}`} target="_blank" className="text-sm font-medium hover:underline">
                      {item.productName}
                    </Link>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {item.color}
                      {item.size && ` · Size ${item.size}`} · <span className="tabular-nums">{item.sku}</span>
                    </p>
                  </div>
                  <span className="text-sm tabular-nums text-neutral-500">
                    {formatPrice(item.unitPrice)} × {item.quantity}
                  </span>
                  <span className="w-24 text-right text-sm font-medium tabular-nums">{formatPrice(item.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-neutral-100 px-5 py-4 text-sm">
              <Row label="Subtotal" value={formatPrice(o.subtotal)} />
              {o.discount > 0 && <Row label={`Coupon ${o.couponCode ?? ""}`} value={`−${formatPrice(o.discount)}`} />}
              <Row label="Shipping" value={o.shippingFee ? formatPrice(o.shippingFee) : "Free"} />
              {o.codFee > 0 && <Row label="COD fee" value={formatPrice(o.codFee)} />}
              <div className="flex justify-between border-t border-neutral-100 pt-2 font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatPrice(o.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Timeline">
            <ol className="relative space-y-5 border-l border-neutral-200 pl-5">
              {o.events.map((e) => (
                <TimelineItem key={e.id} title={e.message} at={e.createdAt} by={e.by} />
              ))}
              {o.confirmedAt && <TimelineItem title="Order confirmed" at={o.confirmedAt} />}
              <TimelineItem title={`Order placed · ${PAYMENT_METHOD[o.paymentMethod]}`} at={o.createdAt} />
            </ol>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Customer">
            <p className="text-sm font-medium">{o.fullName}</p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-neutral-400" />
                <a href={`mailto:${o.email}`} className="truncate hover:underline">{o.email}</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-neutral-400" />
                <a href={`tel:+91${o.phone}`} className="hover:underline">+91 {o.phone}</a>
              </li>
            </ul>
          </Card>

          <Card title="Shipping address">
            <address className="flex gap-2 text-sm not-italic leading-relaxed text-neutral-600">
              <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-400" />
              <span>
                {o.fullName}
                <br />
                {o.addressLine1}
                {o.addressLine2 && (
                  <>
                    <br />
                    {o.addressLine2}
                  </>
                )}
                <br />
                {o.city}, {o.state} {o.pincode}
              </span>
            </address>
            {o.trackingNumber && (
              <div className="mt-4 rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-800">
                {o.courierName} · <span className="tabular-nums">{o.trackingNumber}</span>
              </div>
            )}
          </Card>

          <Card title="Payment">
            <dl className="space-y-2 text-sm">
              <Row label="Method" value={PAYMENT_METHOD[o.paymentMethod]} />
              <div className="flex items-center justify-between">
                <dt className="text-neutral-500">Status</dt>
                <dd><PaymentBadge status={o.paymentStatus} /></dd>
              </div>
              {o.razorpayPaymentId && <Row label="Payment ID" value={o.razorpayPaymentId} mono />}
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-neutral-500">{label}</dt>
      <dd className={`text-right tabular-nums ${mono ? "tabular-nums text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function TimelineItem({ title, at, by }: { title: string; at: string; by?: string | null }) {
  return (
    <li className="relative">
      <span className="absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full border-2 border-white bg-neutral-400 ring-1 ring-neutral-200" />
      <p className="text-sm">{title}</p>
      <p className="mt-0.5 text-xs text-neutral-500">
        {formatDateTime(at)}
        {by && ` · ${by}`}
      </p>
    </li>
  );
}
