import type { Metadata } from "next";
import Link from "next/link";
import { TrackOrderForm } from "@/components/track-order-form";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your Bhavani Fashion order with your order number and mobile number.",
};

export default function TrackOrderPage() {
  return (
    <div className="container-x pb-24 pt-10 md:pb-32 md:pt-16">
      <nav aria-label="Breadcrumb" className="eyebrow flex items-center gap-2 text-stone">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span aria-hidden>/</span>
        <span className="text-ink">Track order</span>
      </nav>
      <div className="mt-8 max-w-3xl">
        <p className="eyebrow text-clay">Help</p>
        <h1 className="display mt-3 text-[3rem] md:text-[4.5rem]">Track your order</h1>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft">
          Enter your order number and the mobile number you used at checkout to see where your
          pieces are.
        </p>
      </div>
      <TrackOrderForm />
    </div>
  );
}
