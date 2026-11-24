import { Suspense } from "react";
import type { Metadata } from "next";
import { getCheckoutConfig } from "@/lib/api";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container-x h-[70vh] animate-pulse pt-16" aria-busy />}>
      <Checkout />
    </Suspense>
  );
}

async function Checkout() {
  const config = await getCheckoutConfig();
  return <CheckoutForm config={config} />;
}
