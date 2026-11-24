"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, LoaderCircle, Package, Truck, X } from "lucide-react";
import { markRefunded, updateOrderStatus } from "@/lib/admin/actions";
import type { AdminOrder } from "@/lib/admin/types";
import type { OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { btn, inputCls } from "./ui";

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
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [courier, setCourier] = useState(COURIERS[0]);
  const [tracking, setTracking] = useState("");

  const can = (s: OrderStatus) => order.allowedTransitions.includes(s);
  const step = NEXT_STEP[order.status];

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      setShipping(false);
      setConfirmCancel(false);
      router.refresh();
    });

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
          <button type="button" disabled={pending} onClick={() => run(() => markRefunded(order.id))} className={`${btn.base} ${btn.secondary}`}>
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
                run(() => updateOrderStatus(order.id, { status: "SHIPPED", courierName: courier, trackingNumber: tracking.trim() }));
              }}
              className="mt-4 grid gap-3 rounded-md bg-neutral-50 p-4 sm:grid-cols-[10rem_1fr_auto] sm:items-end"
            >
              <div>
                <label htmlFor="courier" className="mb-1.5 block text-xs font-medium text-neutral-600">Courier</label>
                <select id="courier" value={courier} onChange={(e) => setCourier(e.target.value)} className={inputCls}>
                  {COURIERS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
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
          ) : confirmCancel ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">
                Cancel this order?{" "}
                {order.status !== "PENDING_PAYMENT" && "The pieces will go back into stock. "}
                {order.paymentStatus === "PAID" && "The customer will need a refund."}
              </p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setConfirmCancel(false)} className={`${btn.base} ${btn.ghost}`}>
                  Keep order
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => updateOrderStatus(order.id, { status: "CANCELLED" }))}
                  className={`${btn.base} h-9 bg-red-600 px-3.5 text-white hover:bg-red-700`}
                >
                  {pending && <LoaderCircle className="size-4 animate-spin" />}
                  Yes, cancel order
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {can("PACKED") && (
                <button type="button" disabled={pending} onClick={() => run(() => updateOrderStatus(order.id, { status: "PACKED" }))} className={`${btn.base} ${btn.secondary}`}>
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
                <button type="button" disabled={pending} onClick={() => run(() => updateOrderStatus(order.id, { status: "DELIVERED" }))} className={`${btn.base} ${btn.primary}`}>
                  {pending ? <LoaderCircle className="size-4 animate-spin" /> : <CircleCheck className="size-4" />}
                  Mark delivered
                  {order.paymentStatus === "COD_DUE" && " · cash collected"}
                </button>
              )}
              {can("CANCELLED") && (
                <button type="button" disabled={pending} onClick={() => setConfirmCancel(true)} className={`${btn.base} ${btn.ghost} text-red-600 hover:bg-red-50 hover:text-red-700 sm:ml-auto`}>
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
