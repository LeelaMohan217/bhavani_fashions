import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
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
  // Load at request time (not during the build) so deploys never depend on the API being up.
  await connection();
  const config = await getCheckoutConfig();
  return <CheckoutForm config={config} />;
}
