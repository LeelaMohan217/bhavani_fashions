"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle, Package, Truck, X } from "lucide-react";
import { markRefunded, updateOrderStatus } from "@/lib/admin/actions";
import type { AdminOrder } from "@/lib/admin/types";
import type { OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useFeedback } from "@/components/ui/feedback";
import { btn, inputCls } from "./ui";
import { Select } from "@/components/ui/select";

const COURIERS = ["Shiprocket", "Delhivery", "Blue Dart", "DTDC", "India Post", "Ekart", "Xpressbees"];

const NEXT_STEP: Partial<Record<OrderStatus, { title: string; body: string }>> = {
  CONFIRMED: { title: "Ready to pack", body: "Check each piece, pack it, then mark it packed or ship it straight away." },
  PACKED: { title: "Ready to ship", body: "Book the courier and enter the tracking number to mark it shipped." },
  SHIPPED: { title: "In transit", body: "Mark delivered once the courier confirms delivery." },
};

export function OrderActions({ order }: { order: AdminOrder }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [shipping, setShipping] = useState(false);
  const [courier, setCourier] = useState(COURIERS[0]);
  const [tracking, setTracking] = useState("");
  const { confirm, toast } = useFeedback();

  const can = (s: OrderStatus) => order.allowedTransitions.includes(s);
  const step = NEXT_STEP[order.status];

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      setShipping(false);
      toast(done);
      router.refresh();
    });

  const onDelivered = async () => {
    const cod = order.paymentStatus === "COD_DUE";
    const ok = await confirm({
      title: "Mark this order delivered?",
      body: cod
        ? `Only do this once the courier confirms delivery and the ${formatPrice(order.total)} cash has been collected. It can't be changed back.`
        : "Only do this once the courier confirms delivery. It can't be changed back.",
      confirmLabel: "Mark delivered",
    });
    if (ok) run(() => updateOrderStatus(order.id, { status: "DELIVERED" }), "Order marked delivered");
  };

  const onRefunded = async () => {
    const ok = await confirm({
      title: `Record a ${formatPrice(order.total)} refund?`,
      body: "Only do this after the refund has been issued in the Razorpay dashboard. This only records it; no money is sent from here.",
      confirmLabel: "Mark refunded",
    });
    if (ok) run(() => markRefunded(order.id), "Refund recorded");
  };

  const onCancel = async () => {
    const ok = await confirm({
      title: "Cancel this order?",
      body: (
        <>
          {order.status !== "PENDING_PAYMENT" && "The pieces will go back into stock. "}
          {order.paymentStatus === "PAID" && "The customer will need a refund. "}
          This can&rsquo;t be undone.
        </>
      ),
      confirmLabel: "Cancel order",
      cancelLabel: "Keep order",
      danger: true,
    });
    if (ok) run(() => updateOrderStatus(order.id, { status: "CANCELLED" }), "Order cancelled");
  };

  const refundDue = order.paymentStatus === "REFUND_DUE";
  if (!step && !refundDue && !can("CANCELLED")) return null;

  return (
    <section data-rise className="rounded-lg border border-neutral-200 bg-white shadow-xs">
      {refundDue && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-red-100 bg-red-50 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-red-800">Refund {formatPrice(order.total)} to the customer</p>
            <p className="mt-0.5 text-xs text-red-700">
              Issue it from the Razorpay dashboard{order.razorpayPaymentId && ` (payment ${order.razorpayPaymentId})`}, then record it here.
            </p>
          </div>
          <button type="button" disabled={pending} onClick={onRefunded} className={`${btn.base} ${btn.secondary}`}>
            Mark refunded
          </button>
        </div>
      )}

      {(step || can("CANCELLED")) && (
        <div className="px-5 py-4">
          {step && (
            <>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="mt-0.5 text-sm text-neutral-500">{step.body}</p>
            </>
          )}

          {shipping ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run(() => updateOrderStatus(order.id, { status: "SHIPPED", courierName: courier, trackingNumber: tracking.trim() }), "Order marked shipped");
              }}
              className="mt-4 grid gap-3 rounded-md bg-neutral-50 p-4 sm:grid-cols-[10rem_1fr_auto] sm:items-end"
            >
              <div>
                <label htmlFor="courier" className="mb-1.5 block text-xs font-medium text-neutral-600">Courier</label>
                <Select
                  id="courier"
                  tone="admin"
                  value={courier}
                  onChange={setCourier}
                  options={COURIERS.map((c) => ({ value: c, label: c }))}
                  className={`${inputCls} flex items-center gap-2 text-left`}
                />
              </div>
              <div>
                <label htmlFor="tracking" className="mb-1.5 block text-xs font-medium text-neutral-600">Tracking number</label>
                <input
                  id="tracking"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. 1234567890"
                  className={`${inputCls} tabular-nums`}
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShipping(false)} className={`${btn.base} ${btn.ghost}`}>
                  Cancel
                </button>
                <button type="submit" disabled={pending || !tracking.trim()} className={`${btn.base} ${btn.primary}`}>
                  {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Truck className="size-4" />}
                  Mark shipped
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {can("PACKED") && (
                <button type="button" disabled={pending} onClick={() => run(() => updateOrderStatus(order.id, { status: "PACKED" }), "Order marked packed")} className={`${btn.base} ${btn.secondary}`}>
                  {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Package className="size-4" />}
                  Mark packed
                </button>
              )}
              {can("SHIPPED") && (
                <button type="button" disabled={pending} onClick={() => setShipping(true)} className={`${btn.base} ${btn.primary}`}>
                  <Truck className="size-4" />
                  Ship order
                </button>
              )}
              {can("DELIVERED") && (
                <button type="button" disabled={pending} onClick={onDelivered} className={`${btn.base} ${btn.primary}`}>
                  {pending ? <LoaderCircle className="size-4 animate-spin" /> : <CircleCheck className="size-4" />}
                  Mark delivered
                  {order.paymentStatus === "COD_DUE" && " · cash collected"}
                </button>
              )}
              {can("CANCELLED") && (
                <button type="button" disabled={pending} onClick={onCancel} className={`${btn.base} ${btn.ghost} text-red-600 hover:bg-red-50 hover:text-red-700 sm:ml-auto`}>
                  <X className="size-4" />
                  Cancel order
                </button>
              )}
            </div>
          )}

          {error && (
            <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
