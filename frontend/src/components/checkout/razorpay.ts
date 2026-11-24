// Loads Razorpay Checkout (https://checkout.razorpay.com/v1/checkout.js) on demand.
import type { RazorpayPayment } from "@/lib/types";

type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = { open: () => void; on: (event: string, cb: (res: unknown) => void) => void };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let loading: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("Could not load the payment window. Please check your connection."));
    };
    document.body.appendChild(script);
  });
  return loading;
}

/**
 * Opens the Razorpay payment window. Resolves with the signed payment on success,
 * or null if the shopper closed the window.
 */
export async function openRazorpay(payment: RazorpayPayment): Promise<RazorpaySuccess | null> {
  await loadScript();
  const Razorpay = window.Razorpay!;

  return new Promise((resolve) => {
    const rzp = new Razorpay({
      key: payment.keyId,
      order_id: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      name: payment.name,
      description: payment.description,
      prefill: payment.prefill,
      theme: { color: "#111111" },
      handler: (res: RazorpaySuccess) => resolve(res),
      modal: { ondismiss: () => resolve(null), confirm_close: true },
    });
    rzp.open();
  });
}
