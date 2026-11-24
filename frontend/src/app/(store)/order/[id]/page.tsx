import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Check, CircleAlert, Clock } from "lucide-react";
import { getOrder } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { OrderDetail } from "@/lib/types";
import { OrderSkeleton } from "@/components/skeletons";
import { RememberOrder } from "@/components/remember-order";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default function OrderPage({ params }: PageProps<"/order/[id]">) {
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <Order params={params} />
    </Suspense>
  );
}

async function Order({ params }: Pick<PageProps<"/order/[id]">, "params">) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const firstName = order.fullName.split(" ")[0];
  const pieces = order.items.reduce((n, i) => n + i.quantity, 0);
  const placed = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date(order.createdAt));

  return (
    <div className="container-x pb-10 pt-12 md:pt-20">
      <RememberOrder id={order.id} number={order.number} />
      <Status order={order} firstName={firstName} />

      <div className="mt-16 grid gap-14 lg:grid-cols-12 lg:gap-16">
        <section className="lg:col-span-7" aria-labelledby="items-title">
          <h2 id="items-title" className="eyebrow border-b border-line pb-4">
            {pieces} {pieces === 1 ? "piece" : "pieces"}
          </h2>
          <ul className="divide-y divide-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-5 py-6">
                <Link href={`/products/${item.productSlug}`} className="relative aspect-[3/4] w-20 shrink-0 bg-sand md:w-24">
                  {item.imageUrl && (
                    <Image src={item.imageUrl} alt={item.productName} fill sizes="96px" className="object-cover" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg leading-snug">{item.productName}</p>
                  <p className="mt-1 text-xs text-stone">
                    {item.color}
                    {item.size && ` · Size ${item.size}`} · Qty {item.quantity}
                  </p>
                </div>
                <p className="text-sm tabular-nums">{formatPrice(item.lineTotal)}</p>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-8 lg:col-span-5">
          <div className="bg-sand p-6 md:p-8">
            <dl className="space-y-3 text-sm">
              <Row label="Order number" value={order.number} />
              <Row label="Placed on" value={placed} />
              <Row
                label="Payment"
                value={order.paymentMethod === "COD" ? "Cash on delivery" : "Paid online"}
              />
            </dl>
            <dl className="mt-6 space-y-3 border-t border-ink/10 pt-6 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              <Row label="Shipping" value={order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)} />
              {order.codFee > 0 && <Row label="Cash on delivery fee" value={formatPrice(order.codFee)} />}
              <div className="flex items-baseline justify-between border-t border-ink/10 pt-4">
                <dt className="font-medium">{order.paymentStatus === "COD_DUE" ? "To pay on delivery" : "Total"}</dt>
                <dd className="display text-3xl tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <h3 className="eyebrow text-stone">Delivering to</h3>
              <address className="mt-3 text-sm not-italic leading-relaxed text-ink-soft">
                <span className="text-ink">{order.fullName}</span>
                <br />
                {order.address.line1}
                {order.address.line2 && (
                  <>
                    <br />
                    {order.address.line2}
                  </>
                )}
                <br />
                {order.address.city}, {order.address.state} {order.address.pincode}
              </address>
            </div>
            <div>
              <h3 className="eyebrow text-stone">Contact</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                {order.email}
                <br />
                +91 {order.phone}
              </p>
            </div>
          </div>

          <Link
            href="/shop"
            className="eyebrow group inline-flex items-center gap-3 bg-ink px-7 py-4 text-canvas transition-colors hover:bg-clay-deep"
          >
            Continue shopping
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Status({ order, firstName }: { order: OrderDetail; firstName: string }) {
  if (order.status !== "PENDING_PAYMENT" && order.status !== "CANCELLED") {
    const lead =
      order.status === "DELIVERED"
        ? "Your order has been delivered. We hope you love wearing it."
        : order.status === "SHIPPED"
          ? "Your order is on its way and should reach you within a few days."
          : "Your pieces are being prepared with care and will be dispatched within 48 hours.";
    return (
      <header className="max-w-3xl animate-rise">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-ink text-canvas">
          <Check className="size-6" strokeWidth={1.5} />
        </span>
        <p className="eyebrow mt-8 text-clay">Order {order.number} confirmed</p>
        <h1 className="display mt-4 text-[3.25rem] md:text-[5.5rem]">
          Thank you, <em className="italic">{firstName}.</em>
        </h1>
        <p className="mt-6 max-w-lg leading-relaxed text-ink-soft">
          {lead}
          {order.paymentStatus === "COD_DUE" &&
            ` Please keep ${formatPrice(order.total)} ready to pay when your order arrives.`}{" "}
          Keep your order number handy for any questions.
        </p>
        {order.courierName && order.trackingNumber && (
          <dl className="mt-8 inline-flex gap-8 border border-line px-5 py-4 text-sm">
            <div>
              <dt className="eyebrow text-stone">Courier</dt>
              <dd className="mt-1">{order.courierName}</dd>
            </div>
            <div>
              <dt className="eyebrow text-stone">Tracking number</dt>
              <dd className="mt-1 tabular-nums">{order.trackingNumber}</dd>
            </div>
          </dl>
        )}
      </header>
    );
  }

  if (order.status === "PENDING_PAYMENT") {
    return (
      <header className="max-w-3xl">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-sand">
          <Clock className="size-6" strokeWidth={1.5} />
        </span>
        <p className="eyebrow mt-8 text-clay">Order {order.number}</p>
        <h1 className="display mt-4 text-5xl md:text-7xl">Awaiting payment</h1>
        <p className="mt-6 max-w-lg leading-relaxed text-ink-soft">
          We haven&rsquo;t received payment for this order yet. If money was deducted, it will be
          confirmed shortly or refunded automatically.
        </p>
      </header>
    );
  }

  return (
    <header className="max-w-3xl">
      <span className="inline-flex size-14 items-center justify-center rounded-full bg-clay text-canvas">
        <CircleAlert className="size-6" strokeWidth={1.5} />
      </span>
      <p className="eyebrow mt-8 text-clay">Order {order.number}</p>
      <h1 className="display mt-4 text-5xl md:text-7xl">Order cancelled</h1>
      <p className="mt-6 max-w-lg leading-relaxed text-ink-soft">
        {order.paymentStatus === "REFUND_DUE"
          ? "A piece sold out just before your payment completed. A full refund will reach your account within 5 to 7 working days."
          : "This order has been cancelled."}
      </p>
    </header>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right tabular-nums">{value}</dd>
    </div>
  );
}
