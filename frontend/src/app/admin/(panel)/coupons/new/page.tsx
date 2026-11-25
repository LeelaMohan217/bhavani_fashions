import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { CouponEditor } from "@/components/admin/coupon-editor";

export const metadata: Metadata = { title: "New code" };

export default function NewCouponPage() {
  return (
    <>
      <PageHeader back={{ href: "/admin/coupons", label: "Coupons" }} title="New code" description="Shoppers enter it at checkout to get the discount." />
      <CouponEditor />
    </>
  );
}